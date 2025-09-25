from models import db
from models.local import Piso, Zona, Mesa
from models.order import Orden, ItemOrden
from models.reserva import Reserva
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

class MeseroService:
    """Servicio para la lógica de negocio de la interfaz de mesero."""

    @staticmethod
    def get_layout():
        """
        Devuelve una estructura anidada de todo el layout del restaurante.
        """
        pisos = Piso.query.order_by(Piso.id).all()
        layout = []

        for piso in pisos:
            piso_data = {
                "id": piso.id,
                "nombre": piso.nombre,
                "zonas": []
            }
            zonas = Zona.query.filter_by(piso_id=piso.id).order_by(Zona.id).all()
            for zona in zonas:
                zona_data = {
                    "id": zona.id,
                    "nombre": zona.nombre,
                    "mesas": []
                }
                mesas = Mesa.query.filter_by(zona_id=zona.id).order_by(Mesa.numero).all()
                for mesa in mesas:
                    zona_data["mesas"].append({
                        "id": mesa.id,
                        "numero": mesa.numero,
                        "estado": mesa.estado,
                        "capacidad": mesa.capacidad
                    })
                piso_data["zonas"].append(zona_data)
            layout.append(piso_data)
        
        return layout

    @staticmethod
    def get_layout_public():
        """
        Devuelve una estructura anidada de todo el layout del restaurante para uso público.
        Similar a get_layout() pero sin requerir autenticación.
        """
        return MeseroService.get_layout()

    @staticmethod
    def get_layout_realtime_public():
        """
        Devuelve una estructura anidada del restaurante con datos en tiempo real para uso público.
        Similar a get_layout_with_realtime_data() pero sin requerir autenticación.
        """
        return MeseroService.get_layout_with_realtime_data()

    @staticmethod
    def get_layout_with_realtime_data():
        """
        Devuelve una estructura anidada del restaurante con datos en tiempo real.
        Incluye información de órdenes activas, reservas y tiempos de espera.
        """
        pisos = Piso.query.order_by(Piso.id).all()
        layout = []

        for piso in pisos:
            piso_data = {
                "id": piso.id,
                "nombre": piso.nombre,
                "zonas": []
            }
            zonas = Zona.query.filter_by(piso_id=piso.id).order_by(Zona.id).all()
            for zona in zonas:
                zona_data = {
                    "id": zona.id,
                    "nombre": zona.nombre,
                    "mesas": []
                }
                mesas = Mesa.query.filter_by(zona_id=zona.id).order_by(Mesa.numero).all()
                for mesa in mesas:
                    # Obtener orden activa de la mesa
                    orden_activa = Orden.query.filter(
                        and_(
                            Orden.mesa_id == mesa.id,
                            Orden.estado.in_(['pendiente', 'confirmada', 'preparando'])
                        )
                    ).first()

                    # Obtener reserva activa de la mesa
                    reserva_activa = Reserva.query.filter(
                        and_(
                            Reserva.mesa_id == mesa.id,
                            Reserva.estado == 'confirmada',
                            Reserva.fecha_reserva == datetime.now().date()
                        )
                    ).first()

                    # Calcular tiempo de espera si hay orden activa
                    tiempo_espera = 0
                    total_items = 0
                    cliente_nombre = None

                    if orden_activa:
                        tiempo_espera = MeseroService._calcular_tiempo_espera(orden_activa)
                        total_items = len(orden_activa.items)
                        cliente_nombre = orden_activa.cliente_nombre

                    mesa_data = {
                        "id": mesa.id,
                        "numero": mesa.numero,
                        "estado": mesa.estado,
                        "capacidad": mesa.capacidad,
                        "zona_id": zona.id,
                        "zona_nombre": zona.nombre,
                        "piso_nombre": piso.nombre,
                        "orden_activa": {
                            "id": orden_activa.id if orden_activa else None,
                            "total_items": total_items,
                            "tiempo_espera": tiempo_espera,
                            "estado": orden_activa.estado if orden_activa else None,
                            "cliente_nombre": orden_activa.cliente_nombre if orden_activa else None
                        } if orden_activa else None,
                        "reserva_activa": {
                            "id": reserva_activa.id if reserva_activa else None,
                            "cliente_nombre": reserva_activa.cliente_nombre if reserva_activa else None,
                            "hora_reserva": reserva_activa.hora_reserva.isoformat() if reserva_activa and reserva_activa.hora_reserva else None
                        } if reserva_activa else None,
                        "ultima_actividad": orden_activa.actualizado_en.isoformat() if orden_activa and orden_activa.actualizado_en else None
                    }
                    zona_data["mesas"].append(mesa_data)
                piso_data["zonas"].append(zona_data)
            layout.append(piso_data)
        
        return layout

    @staticmethod
    def _calcular_tiempo_espera(orden: Orden) -> int:
        """
        Calcula el tiempo de espera en minutos para una orden.
        """
        if not orden.creado_en:
            return 0
        
        tiempo_transcurrido = datetime.utcnow() - orden.creado_en
        return int(tiempo_transcurrido.total_seconds() / 60)

    @staticmethod
    def update_mesa_status(mesa_id: int, nuevo_estado: str) -> tuple[bool, Optional[Dict[str, str]]]:
        """
        Actualiza el estado de una mesa.
        """
        try:
            mesa = Mesa.query.get(mesa_id)
            if not mesa:
                return False, {"error": "Mesa no encontrada"}

            # Validar estado
            estados_validos = ['disponible', 'ocupada', 'reservada', 'limpieza', 'fuera_servicio']
            if nuevo_estado not in estados_validos:
                return False, {"error": "Estado no válido"}

            mesa.estado = nuevo_estado
            mesa.actualizado_en = datetime.utcnow()
            db.session.commit()
            
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, {"error": f"Error actualizando mesa: {str(e)}"}

    @staticmethod
    def get_mesa_details(mesa_id: int) -> Optional[Dict[str, Any]]:
        """
        Obtiene detalles completos de una mesa incluyendo órdenes y reservas.
        """
        try:
            mesa = Mesa.query.get(mesa_id)
            if not mesa:
                return None

            # Obtener orden activa
            orden_activa = Orden.query.filter(
                and_(
                    Orden.mesa_id == mesa_id,
                    Orden.estado.in_(['pendiente', 'confirmada', 'preparando'])
                )
            ).first()

            # Obtener reservas del día
            reservas_hoy = Reserva.query.filter(
                and_(
                    Reserva.mesa_id == mesa_id,
                    Reserva.fecha_reserva == datetime.now().date()
                )
            ).all()

            # Obtener historial de órdenes recientes
            ordenes_recientes = Orden.query.filter(
                Orden.mesa_id == mesa_id
            ).order_by(Orden.creado_en.desc()).limit(5).all()

            return {
                "mesa": {
                    "id": mesa.id,
                    "numero": mesa.numero,
                    "estado": mesa.estado,
                    "capacidad": mesa.capacidad,
                    "zona_nombre": mesa.zona.nombre if mesa.zona else None,
                    "piso_nombre": mesa.zona.piso.nombre if mesa.zona and mesa.zona.piso else None
                },
                "orden_activa": {
                    "id": orden_activa.id,
                    "estado": orden_activa.estado,
                    "total": float(orden_activa.monto_total),
                    "cliente_nombre": orden_activa.cliente_nombre,
                    "creado_en": orden_activa.creado_en.isoformat(),
                    "items": [
                        {
                            "id": item.id,
                            "producto_nombre": item.producto.nombre,
                            "cantidad": item.cantidad,
                            "precio": float(item.precio_unitario),
                            "estado": item.estado
                        } for item in orden_activa.items
                    ]
                } if orden_activa else None,
                "reservas_hoy": [
                    {
                        "id": reserva.id,
                        "cliente_nombre": reserva.cliente_nombre,
                        "hora_reserva": reserva.hora_reserva.isoformat(),
                        "numero_personas": reserva.numero_personas,
                        "estado": reserva.estado
                    } for reserva in reservas_hoy
                ],
                "ordenes_recientes": [
                    {
                        "id": orden.id,
                        "estado": orden.estado,
                        "total": float(orden.monto_total),
                        "creado_en": orden.creado_en.isoformat()
                    } for orden in ordenes_recientes
                ]
            }
        except Exception as e:
            return None

    @staticmethod
    def get_mesas_estado_resumen() -> Dict[str, int]:
        """
        Obtiene un resumen de estados de todas las mesas.
        """
        try:
            estados = db.session.query(
                Mesa.estado,
                func.count(Mesa.id).label('count')
            ).group_by(Mesa.estado).all()
            
            return {estado: count for estado, count in estados}
        except Exception as e:
            return {}

    @staticmethod
    def get_mesas_por_zona() -> List[Dict[str, Any]]:
        """
        Obtiene mesas agrupadas por zona con estadísticas.
        """
        try:
            zonas = Zona.query.all()
            resultado = []
            
            for zona in zonas:
                mesas = Mesa.query.filter_by(zona_id=zona.id).all()
                estados_count = {}
                
                for mesa in mesas:
                    estado = mesa.estado
                    estados_count[estado] = estados_count.get(estado, 0) + 1
                
                resultado.append({
                    "zona_id": zona.id,
                    "zona_nombre": zona.nombre,
                    "piso_nombre": zona.piso.nombre if zona.piso else None,
                    "total_mesas": len(mesas),
                    "estados": estados_count,
                    "mesas": [
                        {
                            "id": mesa.id,
                            "numero": mesa.numero,
                            "estado": mesa.estado,
                            "capacidad": mesa.capacidad
                        } for mesa in mesas
                    ]
                })
            
            return resultado
        except Exception as e:
            return []
