from models import db
from models.order import ItemOrden, Orden
from models.local import Mesa
from collections import defaultdict
from sqlalchemy import asc, and_
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

class CocinaService:
    """Servicio para la lógica de negocio de la interfaz de cocina."""

    @staticmethod
    def get_active_items_by_station(estacion: str):
        """
        Devuelve los ítems de órdenes activas para una estación específica,
        agrupados por su estado para un tablero Kanban.
        """
        estados_activos = ['en_cola', 'preparando', 'listo']

        items = ItemOrden.query.filter(
            ItemOrden.estacion == estacion,
            ItemOrden.estado.in_(estados_activos)
        ).order_by(asc(ItemOrden.creado_en)).all()

        kanban_data = defaultdict(list)
        for item in items:
            item_data = {
                "id": item.id,
                "orden_id": item.orden_id,
                "producto_nombre": item.producto.nombre,
                "cantidad": item.cantidad,
                "estado": item.estado,
                "creado_en": item.creado_en.isoformat() if item.creado_en else None,
                "mesa_numero": item.orden.mesa.numero if item.orden.mesa else 'Llevar'
            }
            kanban_data[item.estado].append(item_data)
        
        for estado in estados_activos:
            if estado not in kanban_data:
                kanban_data[estado] = []

        return kanban_data

    @staticmethod
    def get_mesas_with_items_by_station(estacion: str) -> List[Dict[str, Any]]:
        """
        Devuelve las mesas que tienen ítems activos para una estación específica,
        agrupadas con sus ítems y información de prioridad.
        """
        try:
            # Obtener ítems activos de la estación
            items = ItemOrden.query.filter(
                and_(
                    ItemOrden.estacion == estacion,
                    ItemOrden.estado.in_(['en_cola', 'preparando', 'listo'])
                )
            ).order_by(asc(ItemOrden.creado_en)).all()

            # Agrupar por mesa
            mesas_dict = {}
            for item in items:
                mesa_id = item.orden.mesa_id if item.orden.mesa else 0
                mesa_numero = item.orden.mesa.numero if item.orden.mesa else 'Llevar'
                
                if mesa_id not in mesas_dict:
                    mesa = item.orden.mesa if item.orden.mesa else None
                    mesas_dict[mesa_id] = {
                        "id": mesa_id,
                        "numero": mesa_numero,
                        "estado": mesa.estado if mesa else 'llevar',
                        "zona_nombre": mesa.zona.nombre if mesa and mesa.zona else 'Llevar',
                        "piso_nombre": mesa.zona.piso.nombre if mesa and mesa.zona and mesa.zona.piso else 'Llevar',
                        "items": [],
                        "tiempo_total_espera": 0,
                        "prioridad_maxima": 'baja'
                    }
                
                # Calcular tiempo de espera del item
                tiempo_espera = CocinaService._calcular_tiempo_espera_item(item)
                mesas_dict[mesa_id]["tiempo_total_espera"] += tiempo_espera
                
                # Determinar prioridad del item
                prioridad_item = CocinaService._determinar_prioridad_item(item, tiempo_espera)
                if CocinaService._es_prioridad_mayor(prioridad_item, mesas_dict[mesa_id]["prioridad_maxima"]):
                    mesas_dict[mesa_id]["prioridad_maxima"] = prioridad_item
                
                # Agregar item a la mesa
                item_data = {
                    "id": item.id,
                    "orden_id": item.orden_id,
                    "producto_nombre": item.producto.nombre,
                    "cantidad": item.cantidad,
                    "estado": item.estado,
                    "tiempo_espera": tiempo_espera,
                    "prioridad": prioridad_item,
                    "creado_en": item.creado_en.isoformat() if item.creado_en else None,
                    "cliente_nombre": item.orden.cliente_nombre if item.orden else None,
                    "notas": item.notas
                }
                mesas_dict[mesa_id]["items"].append(item_data)
            
            # Convertir a lista y ordenar por prioridad
            mesas = list(mesas_dict.values())
            mesas.sort(key=lambda x: CocinaService._get_prioridad_orden(x["prioridad_maxima"]))
            
            return mesas
        except Exception as e:
            return []

    @staticmethod
    def _calcular_tiempo_espera_item(item: ItemOrden) -> int:
        """
        Calcula el tiempo de espera en minutos para un ítem.
        """
        if not item.creado_en:
            return 0
        
        tiempo_transcurrido = datetime.utcnow() - item.creado_en
        return int(tiempo_transcurrido.total_seconds() / 60)

    @staticmethod
    def _determinar_prioridad_item(item: ItemOrden, tiempo_espera: int) -> str:
        """
        Determina la prioridad de un ítem basado en tiempo de espera y otros factores.
        """
        # Prioridad basada en tiempo de espera
        if tiempo_espera >= 30:  # 30+ minutos
            return 'urgente'
        elif tiempo_espera >= 20:  # 20+ minutos
            return 'alta'
        elif tiempo_espera >= 10:  # 10+ minutos
            return 'media'
        else:
            return 'baja'

    @staticmethod
    def _es_prioridad_mayor(prioridad1: str, prioridad2: str) -> bool:
        """
        Compara si una prioridad es mayor que otra.
        """
        orden_prioridades = {'baja': 1, 'media': 2, 'alta': 3, 'urgente': 4}
        return orden_prioridades.get(prioridad1, 0) > orden_prioridades.get(prioridad2, 0)

    @staticmethod
    def _get_prioridad_orden(prioridad: str) -> int:
        """
        Obtiene el orden numérico de una prioridad para ordenamiento.
        """
        orden_prioridades = {'baja': 1, 'media': 2, 'alta': 3, 'urgente': 4}
        return orden_prioridades.get(prioridad, 0)

    @staticmethod
    def update_item_status(item_id: int, nuevo_estado: str):
        """Actualiza el estado de un ítem de orden."""
        try:
            item = ItemOrden.query.get(item_id)
            if not item:
                return None, {"error": "Ítem no encontrado."}
            
            # Validar que el nuevo estado sea uno de los permitidos
            estados_validos = ['en_cola', 'preparando', 'listo', 'servido', 'cancelado']
            if nuevo_estado not in estados_validos:
                return None, {"error": "Estado no válido."}

            item.estado = nuevo_estado
            item.actualizado_en = datetime.utcnow()
            db.session.commit()
            
            # Verificar si todos los ítems de la orden están listos
            if nuevo_estado == 'listo':
                CocinaService._verificar_orden_completa(item.orden_id)
            
            return item, None
        except Exception as e:
            db.session.rollback()
            return None, {"error": f"Error actualizando ítem: {str(e)}"}

    @staticmethod
    def _verificar_orden_completa(orden_id: int):
        """
        Verifica si todos los ítems de una orden están listos y actualiza el estado de la orden.
        """
        try:
            orden = Orden.query.get(orden_id)
            if not orden:
                return

            # Contar ítems por estado
            items_activos = ItemOrden.query.filter(
                and_(
                    ItemOrden.orden_id == orden_id,
                    ItemOrden.estado.in_(['en_cola', 'preparando', 'listo'])
                )
            ).all()

            items_listos = [item for item in items_activos if item.estado == 'listo']
            
            # Si todos los ítems están listos, marcar orden como lista para servir
            if len(items_listos) == len(items_activos) and len(items_activos) > 0:
                orden.estado = 'listo_para_servir'
                orden.actualizado_en = datetime.utcnow()
                db.session.commit()
        except Exception as e:
            db.session.rollback()

    @staticmethod
    def get_estadisticas_estacion(estacion: str) -> Dict[str, Any]:
        """
        Obtiene estadísticas de una estación de cocina.
        """
        try:
            # Items por estado
            items_por_estado = db.session.query(
                ItemOrden.estado,
                db.func.count(ItemOrden.id).label('count')
            ).filter(
                ItemOrden.estacion == estacion
            ).group_by(ItemOrden.estado).all()

            # Tiempo promedio de preparación
            items_completados = ItemOrden.query.filter(
                and_(
                    ItemOrden.estacion == estacion,
                    ItemOrden.estado == 'servido',
                    ItemOrden.creado_en >= datetime.utcnow() - timedelta(hours=24)
                )
            ).all()

            tiempo_promedio = 0
            if items_completados:
                tiempos = []
                for item in items_completados:
                    if item.creado_en and item.actualizado_en:
                        tiempo = (item.actualizado_en - item.creado_en).total_seconds() / 60
                        tiempos.append(tiempo)
                
                if tiempos:
                    tiempo_promedio = sum(tiempos) / len(tiempos)

            return {
                "estacion": estacion,
                "items_por_estado": {estado: count for estado, count in items_por_estado},
                "tiempo_promedio_preparacion": round(tiempo_promedio, 2),
                "items_completados_hoy": len(items_completados),
                "mesas_activas": len(set(item.orden.mesa_id for item in items_completados if item.orden.mesa_id))
            }
        except Exception as e:
            return {
                "estacion": estacion,
                "items_por_estado": {},
                "tiempo_promedio_preparacion": 0,
                "items_completados_hoy": 0,
                "mesas_activas": 0
            }

    @staticmethod
    def get_items_urgentes(estacion: str) -> List[Dict[str, Any]]:
        """
        Obtiene ítems urgentes (tiempo de espera > 20 minutos) de una estación.
        """
        try:
            items = ItemOrden.query.filter(
                and_(
                    ItemOrden.estacion == estacion,
                    ItemOrden.estado.in_(['en_cola', 'preparando']),
                    ItemOrden.creado_en <= datetime.utcnow() - timedelta(minutes=20)
                )
            ).order_by(asc(ItemOrden.creado_en)).all()

            return [
                {
                    "id": item.id,
                    "producto_nombre": item.producto.nombre,
                    "cantidad": item.cantidad,
                    "mesa_numero": item.orden.mesa.numero if item.orden.mesa else 'Llevar',
                    "tiempo_espera": CocinaService._calcular_tiempo_espera_item(item),
                    "cliente_nombre": item.orden.cliente_nombre if item.orden else None,
                    "creado_en": item.creado_en.isoformat() if item.creado_en else None
                } for item in items
            ]
        except Exception as e:
            return []
