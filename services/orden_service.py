from models.order import Orden, ItemOrden, Pago
from models import db
from datetime import datetime
import random
import string
from services.error_handler import ErrorHandler

class OrdenService:
    """Servicio para gestión de órdenes/pedidos"""

    @staticmethod
    def generar_numero_orden():
        """Genera un número único para la orden"""
        while True:
            numero = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            if not Orden.query.filter_by(numero=numero).first():
                return numero

    @staticmethod
    def crear_orden(mesa_id, mozo_id, tipo='local', cliente_nombre=None, num_comensales=1):
        """Crea una nueva orden"""
        try:
            # Validar que la mesa existe y está disponible
            from models.local import Mesa
            mesa = Mesa.query.get(mesa_id)
            if not mesa:
                raise ValueError("Mesa no encontrada")
            if mesa.estado != 'disponible':
                raise ValueError("Mesa no disponible")

            # Validar que num_comensales no exceda la capacidad de la mesa
            if num_comensales > mesa.capacidad:
                raise ValueError(f"Número de comensales ({num_comensales}) excede la capacidad de la mesa ({mesa.capacidad})")

            # Crear número único
            numero = OrdenService.generar_numero_orden()

            # Crear orden
            orden = Orden(
                numero=numero,
                mesa_id=mesa_id,
                mozo_id=mozo_id,
                tipo=tipo,
                estado='pendiente',
                monto_total=0.0,
                num_comensales=num_comensales,
                cliente_nombre=cliente_nombre
            )

            db.session.add(orden)
            db.session.commit()

            # Marcar mesa como ocupada
            mesa.estado = 'ocupada'
            db.session.commit()

            return orden

        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def obtener_ordenes_activas():
        """Obtiene todas las órdenes activas (incluyendo canceladas para mostrar en kanban)"""
        try:
            return Orden.query.filter(
                Orden.estado.in_(['pendiente', 'confirmada', 'preparando', 'lista', 'servida', 'cancelada'])
            ).order_by(Orden.creado_en.desc()).all()
        except Exception as e:
            raise e

    @staticmethod
    def obtener_orden_por_id(orden_id):
        """Obtiene una orden por ID"""
        try:
            orden = Orden.query.get(orden_id)
            if not orden:
                raise ValueError("Orden no encontrada")
            return orden
        except Exception as e:
            raise e

    @staticmethod
    def obtener_ordenes_por_mozo(mozo_id):
        """Obtiene órdenes de un mozo específico"""
        try:
            return Orden.query.filter_by(mozo_id=mozo_id).all()
        except Exception as e:
            raise e

    @staticmethod
    def obtener_ordenes_por_mesa(mesa_id):
        """Obtiene órdenes de una mesa específica"""
        try:
            return Orden.query.filter_by(mesa_id=mesa_id).all()
        except Exception as e:
            raise e

    @staticmethod
    def agregar_producto_a_orden(orden_id, producto_id, cantidad, precio_unitario, estacion=None, notas=None):
        """Agrega un producto a una orden existente"""
        try:
            orden = OrdenService.obtener_orden_por_id(orden_id)

            # Verificar que la orden no esté en estado final
            if orden.estado in ['pagada', 'cancelada']:
                raise ValueError("No se puede modificar una orden pagada o cancelada")

            # Verificar que el producto existe y está disponible
            from models.menu import Producto
            producto = Producto.query.get(producto_id)
            if not producto:
                raise ValueError("Producto no encontrado")
            if not producto.disponible:
                raise ValueError("Producto no disponible")

            # Crear item de orden
            item = ItemOrden(
                orden_id=orden_id,
                producto_id=producto_id,
                cantidad=cantidad,
                precio_unitario=precio_unitario,
                estado='en_cola',  # Estado inicial en Kanban
                estacion=estacion or producto.tipo_estacion,
                notas=notas,
                fecha_inicio=datetime.utcnow()
            )

            db.session.add(item)

            # Actualizar total de la orden considerando comensales
            # Si la orden tiene más de 1 comensal, multiplicar por el número de comensales
            precio_total_item = cantidad * precio_unitario
            if orden.num_comensales > 1:
                precio_total_item *= orden.num_comensales

            orden.monto_total += precio_total_item
            orden.estado = 'confirmada'  # Cambiar estado al agregar productos

            db.session.commit()

            return item

        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def actualizar_estado_item(item_id, estado):
        """Actualiza el estado de un item de orden"""
        try:
            item = ItemOrden.query.get(item_id)
            if not item:
                raise ValueError("Item no encontrado")

            item.estado = estado

            # Actualizar timestamps según el estado
            if estado == 'preparando':
                item.fecha_inicio = datetime.utcnow()
            elif estado == 'listo':
                item.fecha_listo = datetime.utcnow()
            elif estado == 'servido':
                item.fecha_servido = datetime.utcnow()

            # Si todos los items están servidos, marcar orden como servida
            if estado == 'servido':
                items_pendientes = ItemOrden.query.filter_by(
                    orden_id=item.orden_id,
                    estado='pendiente'
                ).count()

                if items_pendientes == 0:
                    orden = Orden.query.get(item.orden_id)
                    orden.estado = 'servida'

            db.session.commit()
            return item

        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def actualizar_estado_orden(orden_id, estado):
        """Actualiza el estado de una orden completa"""
        try:
            orden = OrdenService.obtener_orden_por_id(orden_id)

            # Validar transiciones de estado
            estados_validos = {
                'pendiente': ['confirmada'],
                'confirmada': ['preparando', 'cancelada'],
                'preparando': ['lista', 'cancelada'],
                'lista': ['servida', 'cancelada'],
                'servida': ['pagada'],
                'pagada': [],
                'cancelada': []
            }

            if estado not in estados_validos.get(orden.estado, []):
                raise ValueError(f"No se puede cambiar de {orden.estado} a {estado}")

            orden.estado = estado
            db.session.commit()

            return orden

        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def cancelar_orden(orden_id):
        """Cancela una orden y libera la mesa"""
        try:
            orden = OrdenService.obtener_orden_por_id(orden_id)

            if orden.estado == 'pagada':
                raise ValueError("No se puede cancelar una orden pagada")

            # Marcar orden como cancelada
            orden.estado = 'cancelada'

            # Liberar mesa
            if orden.mesa:
                orden.mesa.estado = 'disponible'

            db.session.commit()

            return orden

        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def obtener_estadisticas_pedidos():
        """Obtiene estadísticas de pedidos para dashboard"""
        try:
            from sqlalchemy import func

            # Estadísticas generales
            total_ordenes = Orden.query.count()
            ordenes_activas = Orden.query.filter(
                Orden.estado.in_(['pendiente', 'confirmada', 'preparando', 'lista', 'servida'])
            ).count()
            ordenes_pagadas = Orden.query.filter_by(estado='pagada').count()
            ordenes_canceladas = Orden.query.filter_by(estado='cancelada').count()

            # Ingresos del día
            ingresos_hoy = db.session.query(func.sum(Orden.monto_total)).filter(
                Orden.estado == 'pagada',
                func.DATE(Orden.creado_en) == func.DATE(datetime.utcnow())
            ).scalar() or 0.0

            return {
                'total_ordenes': total_ordenes,
                'ordenes_activas': ordenes_activas,
                'ordenes_pagadas': ordenes_pagadas,
                'ordenes_canceladas': ordenes_canceladas,
                'ingresos_hoy': float(ingresos_hoy)
            }

        except Exception as e:
            raise e

    @staticmethod
    def procesar_pago(orden_id, metodo, monto=None):
        """Procesa el pago de una orden"""
        try:
            orden = OrdenService.obtener_orden_por_id(orden_id)

            if orden.estado != 'servida':
                raise ValueError("Solo se pueden pagar órdenes servidas")

            # Usar monto de la orden si no se especifica
            monto_pago = monto or orden.monto_total

            # Crear registro de pago
            pago = Pago(
                orden_id=orden_id,
                monto=monto_pago,
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
    def editar_orden(orden_id, data):
        """Edita una orden existente"""
        try:
            orden = OrdenService.obtener_orden_por_id(orden_id)

            # Verificar que la orden no esté en estado final
            if orden.estado in ['pagada', 'cancelada']:
                raise ValueError("No se puede editar una orden pagada o cancelada")

            # Actualizar campos permitidos
            campos_editables = ['cliente_nombre', 'num_comensales']
            for campo in campos_editables:
                if campo in data:
                    if campo == 'num_comensales':
                        # Validar que num_comensales no exceda la capacidad de la mesa
                        if orden.mesa and data[campo] > orden.mesa.capacidad:
                            raise ValueError(f"Número de comensales ({data[campo]}) excede la capacidad de la mesa ({orden.mesa.capacidad})")
                        # Validar que num_comensales sea al menos 1
                        if data[campo] < 1:
                            raise ValueError("El número de comensales debe ser al menos 1")
                    setattr(orden, campo, data[campo])

            db.session.commit()
            return orden

        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def eliminar_orden(orden_id):
        """Elimina una orden (solo si está pendiente o cancelada)"""
        try:
            orden = OrdenService.obtener_orden_por_id(orden_id)

            # Solo permitir eliminar órdenes pendientes o canceladas
            if orden.estado not in ['pendiente', 'cancelada']:
                raise ValueError("Solo se pueden eliminar órdenes pendientes o canceladas")

            # Liberar mesa si está ocupada
            if orden.mesa and orden.mesa.estado == 'ocupada':
                orden.mesa.estado = 'disponible'

            db.session.delete(orden)
            db.session.commit()

            return True

        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def obtener_items_por_orden(orden_id):
        """Obtiene todos los items de una orden específica"""
        try:
            orden = OrdenService.obtener_orden_por_id(orden_id)
            return orden.items
        except Exception as e:
            raise e

    @staticmethod
    def editar_item_orden(item_id, data):
        """Edita un item de orden específico"""
        try:
            item = ItemOrden.query.get(item_id)
            if not item:
                raise ValueError("Item no encontrado")

            orden = Orden.query.get(item.orden_id)
            if orden.estado in ['pagada', 'cancelada']:
                raise ValueError("No se puede editar items de una orden pagada o cancelada")

            # Actualizar campos permitidos
            campos_editables = ['cantidad', 'notas', 'estacion']
            for campo in campos_editables:
                if campo in data:
                    setattr(item, campo, data[campo])

            # Recalcular total si se cambió la cantidad
            if 'cantidad' in data:
                item.precio_unitario = item.precio_unitario  # Mantener precio actual
                # Actualizar total de la orden considerando comensales
                if orden.num_comensales > 1:
                    orden.monto_total = sum(
                        item.cantidad * item.precio_unitario * orden.num_comensales for item in orden.items
                    )
                else:
                    orden.monto_total = sum(
                        item.cantidad * item.precio_unitario for item in orden.items
                    )

            db.session.commit()
            return item

        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def eliminar_item_orden(item_id):
        """Elimina un item de orden"""
        try:
            item = ItemOrden.query.get(item_id)
            if not item:
                raise ValueError("Item no encontrado")

            orden = Orden.query.get(item.orden_id)
            if orden.estado in ['pagada', 'cancelada']:
                raise ValueError("No se puede eliminar items de una orden pagada o cancelada")

            # Guardar precio para ajustar total considerando comensales
            precio_item = item.cantidad * item.precio_unitario
            if orden.num_comensales > 1:
                precio_item *= orden.num_comensales

            # Eliminar item
            db.session.delete(item)

            # Actualizar total de la orden
            orden.monto_total -= precio_item

            # Si no quedan items, cambiar estado a pendiente
            if len(orden.items) == 0:
                orden.estado = 'pendiente'

            db.session.commit()

            return True

        except Exception as e:
            db.session.rollback()
            raise e
