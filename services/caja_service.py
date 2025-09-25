from models import db
from models.order import Orden, ItemOrden, Pago
from models.user import Usuario
from models.local import Mesa
from datetime import datetime
from decimal import Decimal

class CajaService:
    """Servicio para la lógica de negocio de la interfaz de caja."""

    @staticmethod
    def get_open_accounts():
        """
        Devuelve una lista de todas las órdenes que han sido servidas y están listas para pagar.
        """
        # Buscamos órdenes con estado 'servida'
        ordenes_servidas = db.session.query(Orden).filter(Orden.estado == 'servida').all()

        cuentas = []
        for orden in ordenes_servidas:
            items_de_orden = []
            for item in orden.items:
                items_de_orden.append({
                    "nombre": item.producto.nombre,
                    "cantidad": item.cantidad,
                    "precio_unitario": float(item.precio_unitario),
                    "total_item": float(item.cantidad * item.precio_unitario)
                })
            
            cuentas.append({
                "id_orden": orden.id,
                "numero_mesa": orden.mesa.numero if orden.mesa else 'Para Llevar',
                "mozo": orden.mozo.usuario,
                "total_orden": float(orden.monto_total),
                "items": items_de_orden
            })
        
        return cuentas

    @staticmethod
    def procesar_pago(orden_id, metodo, monto=None):
        """Procesa el pago de una orden"""
        try:
            orden = Orden.query.get(orden_id)
            if not orden:
                raise ValueError("Orden no encontrada")

            if orden.estado != 'servida':
                raise ValueError("Solo se pueden pagar órdenes servidas")

            # Usar monto de la orden si no se especifica
            monto_pago = monto or orden.monto_total

            # Crear registro de pago
            pago = Pago(
                orden_id=orden_id,
                monto=Decimal(str(monto_pago)),
                metodo=metodo,
                estado='pagado'
            )

            db.session.add(pago)

            # Marcar orden como pagada
            orden.estado = 'pagada'

            # Liberar mesa
            if orden.mesa:
                orden.mesa.estado = 'disponible'

            db.session.commit()

            return pago

        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def obtener_pagos_activos():
        """Obtiene todos los pagos activos"""
        try:
            return Pago.query.filter(
                Pago.estado.in_(['pendiente', 'pagado'])
            ).order_by(Pago.fecha.desc()).all()
        except Exception as e:
            raise e

    @staticmethod
    def obtener_pagos_por_fecha(fecha_inicio, fecha_fin):
        """Obtiene pagos en un rango de fechas"""
        try:
            return Pago.query.filter(
                Pago.fecha.between(fecha_inicio, fecha_fin),
                Pago.estado == 'pagado'
            ).order_by(Pago.fecha.desc()).all()
        except Exception as e:
            raise e

    @staticmethod
    def obtener_pago_por_id(pago_id):
        """Obtiene un pago por ID"""
        try:
            pago = Pago.query.get(pago_id)
            if not pago:
                raise ValueError("Pago no encontrado")
            return pago
        except Exception as e:
            raise e

    @staticmethod
    def anular_pago(pago_id):
        """Anula un pago con validaciones completas"""
        try:
            pago = Pago.query.get(pago_id)
            if not pago:
                raise ValueError("Pago no encontrado")

            # Validar que el pago esté en estado pagado
            if pago.estado != 'pagado':
                raise ValueError("Solo se pueden anular pagos que estén en estado 'pagado'")

            # Validar que la orden existe
            orden = Orden.query.get(pago.orden_id)
            if not orden:
                raise ValueError("La orden asociada al pago no existe")

            # Validar que no haya nuevos pedidos/items después del pago
            # (Esto previene fraudes por modificación de pedidos después del pago)
            if orden.actualizado_en > pago.fecha:
                raise ValueError("No se puede anular: la orden fue modificada después del pago")

            # Validar que la orden esté en estado pagada
            if orden.estado != 'pagada':
                raise ValueError("No se puede anular: la orden ya no está en estado pagada")

            # Validar que no haya reembolsos o transacciones relacionadas
            # (En una implementación real, aquí se verificarían transacciones bancarias)

            # Marcar pago como anulado
            pago.estado = 'anulado'

            # Revertir estado de la orden a servida
            orden.estado = 'servida'

            # Marcar mesa como ocupada nuevamente
            if orden.mesa:
                orden.mesa.estado = 'ocupada'

            db.session.commit()

            return pago

        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def obtener_estadisticas_pagos():
        """Obtiene estadísticas de pagos para dashboard"""
        try:
            from sqlalchemy import func

            # Estadísticas generales
            total_pagos = Pago.query.count()
            pagos_activos = Pago.query.filter_by(estado='pagado').count()
            pagos_anulados = Pago.query.filter_by(estado='anulado').count()

            # Ingresos del día
            hoy = datetime.now().date()
            ingresos_hoy = db.session.query(func.sum(Pago.monto)).filter(
                Pago.estado == 'pagado',
                func.DATE(Pago.fecha) == hoy
            ).scalar() or Decimal('0')

            # Ingresos del mes
            mes_actual = datetime.now().month
            anio_actual = datetime.now().year
            ingresos_mes = db.session.query(func.sum(Pago.monto)).filter(
                Pago.estado == 'pagado',
                func.extract('month', Pago.fecha) == mes_actual,
                func.extract('year', Pago.fecha) == anio_actual
            ).scalar() or Decimal('0')

            # Ingresos por método de pago
            ingresos_por_metodo = {}
            metodos = ['efectivo', 'tarjeta', 'yape', 'plin', 'transferencia']
            for metodo in metodos:
                total_metodo = db.session.query(func.sum(Pago.monto)).filter(
                    Pago.estado == 'pagado',
                    Pago.metodo == metodo
                ).scalar() or Decimal('0')
                ingresos_por_metodo[metodo] = float(total_metodo)

            return {
                'total_pagos': total_pagos,
                'pagos_activos': pagos_activos,
                'pagos_anulados': pagos_anulados,
                'ingresos_hoy': float(ingresos_hoy),
                'ingresos_mes': float(ingresos_mes),
                'ingresos_por_metodo': ingresos_por_metodo
            }

        except Exception as e:
            raise e
