from models import db
from models.local import Piso, Zona, Mesa
from typing import Optional, Dict, Any, List
from sqlalchemy import and_, or_
import uuid
from services.error_handler import ErrorHandler, BusinessLogicError

class LocalService:
    """Servicio para gestión de pisos, zonas y mesas"""
    
    # --- GESTIÓN DE PISOS ---
    
    @staticmethod
    def create_piso(data: Dict[str, Any]) -> tuple[Piso, Optional[Dict[str, str]]]:
        """Crear un nuevo piso"""
        try:
            piso = Piso(
                nombre=data['nombre'],
                descripcion=data.get('descripcion', ''),
                orden=data.get('orden', 0),
                activo=data.get('activo', True)
            )
            
            db.session.add(piso)
            db.session.commit()
            
            return piso, None
        except Exception as e:
            db.session.rollback()
            return None, {"error": f"Error creando piso: {str(e)}"}
    
    @staticmethod
    def get_pisos(activos_only: bool = True) -> List[Piso]:
        """Obtener todos los pisos"""
        query = Piso.query
        if activos_only:
            query = query.filter(Piso.activo == True)
        return query.order_by(Piso.orden, Piso.nombre).all()
    
    @staticmethod
    def get_piso_by_id(piso_id: int) -> Optional[Piso]:
        """Obtener piso por ID"""
        return Piso.query.get(piso_id)
    
    @staticmethod
    def update_piso(piso_id: int, data: Dict[str, Any]) -> tuple[Piso, Optional[Dict[str, str]]]:
        """Actualizar un piso"""
        try:
            piso = Piso.query.get(piso_id)
            if not piso:
                return None, {"error": "Piso no encontrado"}
            
            piso.nombre = data.get('nombre', piso.nombre)
            piso.descripcion = data.get('descripcion', piso.descripcion)
            piso.orden = data.get('orden', piso.orden)
            piso.activo = data.get('activo', piso.activo)
            
            db.session.commit()
            return piso, None
        except Exception as e:
            db.session.rollback()
            return None, {"error": f"Error actualizando piso: {str(e)}"}
    
    @staticmethod
    def delete_piso(piso_id: int) -> tuple[bool, Optional[Dict[str, str]]]:
        """Eliminar un piso (soft delete)"""
        try:
            piso = Piso.query.get(piso_id)
            if not piso:
                raise BusinessLogicError("Piso no encontrado")
            
            # Verificar si tiene zonas activas
            zonas_activas = Zona.query.filter(and_(Zona.piso_id == piso_id, Zona.activo == True)).count()
            if zonas_activas > 0:
                raise BusinessLogicError(
                    f"No se puede eliminar el piso '{piso.nombre}' porque tiene {zonas_activas} zona(s) activa(s). "
                    f"Primero debe eliminar o desactivar todas las zonas del piso."
                )
            
            piso.activo = False
            db.session.commit()
            return True, None
        except BusinessLogicError as e:
            db.session.rollback()
            return ErrorHandler.handle_business_logic_error(str(e))
        except Exception as e:
            db.session.rollback()
            return ErrorHandler.handle_service_error(e, "eliminar piso", "piso")
    
    # --- GESTIÓN DE ZONAS ---
    
    @staticmethod
    def create_zona(data: Dict[str, Any]) -> tuple[Zona, Optional[Dict[str, str]]]:
        """Crear una nueva zona"""
        try:
            zona = Zona(
                nombre=data['nombre'],
                descripcion=data.get('descripcion', ''),
                tipo=data['tipo'],
                capacidad_maxima=data.get('capacidad_maxima', 0),
                piso_id=data['piso_id'],
                orden=data.get('orden', 0),
                activo=data.get('activo', True),
                color=data.get('color', '#3B82F6'),
                icono=data.get('icono', '🏢')
            )
            
            db.session.add(zona)
            db.session.commit()
            
            return zona, None
        except Exception as e:
            db.session.rollback()
            return None, {"error": f"Error creando zona: {str(e)}"}
    
    @staticmethod
    def get_zonas(piso_id: Optional[int] = None, activos_only: bool = True) -> List[Zona]:
        """Obtener todas las zonas"""
        query = Zona.query
        if piso_id:
            query = query.filter(Zona.piso_id == piso_id)
        if activos_only:
            query = query.filter(Zona.activo == True)
        return query.order_by(Zona.orden, Zona.nombre).all()
    
    @staticmethod
    def get_zona_by_id(zona_id: int) -> Optional[Zona]:
        """Obtener zona por ID"""
        return Zona.query.get(zona_id)
    
    @staticmethod
    def update_zona(zona_id: int, data: Dict[str, Any]) -> tuple[Zona, Optional[Dict[str, str]]]:
        """Actualizar una zona"""
        try:
            zona = Zona.query.get(zona_id)
            if not zona:
                return None, {"error": "Zona no encontrada"}
            
            zona.nombre = data.get('nombre', zona.nombre)
            zona.descripcion = data.get('descripcion', zona.descripcion)
            zona.tipo = data.get('tipo', zona.tipo)
            zona.capacidad_maxima = data.get('capacidad_maxima', zona.capacidad_maxima)
            zona.piso_id = data.get('piso_id', zona.piso_id)
            zona.orden = data.get('orden', zona.orden)
            zona.activo = data.get('activo', zona.activo)
            zona.color = data.get('color', zona.color)
            zona.icono = data.get('icono', zona.icono)
            
            db.session.commit()
            return zona, None
        except Exception as e:
            db.session.rollback()
            return None, {"error": f"Error actualizando zona: {str(e)}"}
    
    @staticmethod
    def delete_zona(zona_id: int) -> tuple[bool, Optional[Dict[str, str]]]:
        """Eliminar una zona (soft delete)"""
        try:
            zona = Zona.query.get(zona_id)
            if not zona:
                raise BusinessLogicError("Zona no encontrada")
            
            # Verificar si tiene mesas activas
            mesas_activas = Mesa.query.filter(and_(Mesa.zona_id == zona_id, Mesa.activo == True)).count()
            if mesas_activas > 0:
                raise BusinessLogicError(
                    f"No se puede eliminar la zona '{zona.nombre}' porque tiene {mesas_activas} mesa(s) activa(s). "
                    f"Primero debe eliminar o desactivar todas las mesas de la zona."
                )
            
            zona.activo = False
            db.session.commit()
            return True, None
        except BusinessLogicError as e:
            db.session.rollback()
            return ErrorHandler.handle_business_logic_error(str(e))
        except Exception as e:
            db.session.rollback()
            return ErrorHandler.handle_service_error(e, "eliminar zona", "zona")
    
    # --- GESTIÓN DE MESAS ---
    
    @staticmethod
    def create_mesa(data: Dict[str, Any]) -> tuple[Mesa, Optional[Dict[str, str]]]:
        """Crear una nueva mesa"""
        try:
            mesa = Mesa(
                numero=data['numero'],
                capacidad=data.get('capacidad', 4),
                zona_id=data['zona_id'],
                estado=data.get('estado', 'disponible'),
                posicion_x=data.get('posicion_x', 0.0),
                posicion_y=data.get('posicion_y', 0.0),
                activo=data.get('activo', True),
                notas=data.get('notas', '')
            )
            
            # Generar QR code único
            mesa.generar_qr_code()
            
            db.session.add(mesa)
            db.session.commit()
            
            return mesa, None
        except Exception as e:
            db.session.rollback()
            return None, {"error": f"Error creando mesa: {str(e)}"}
    
    @staticmethod
    def get_mesas(zona_id: Optional[int] = None, estado: Optional[str] = None, activos_only: bool = True) -> List[Mesa]:
        """Obtener todas las mesas"""
        query = Mesa.query
        if zona_id:
            query = query.filter(Mesa.zona_id == zona_id)
        if estado:
            query = query.filter(Mesa.estado == estado)
        if activos_only:
            query = query.filter(Mesa.activo == True)
        return query.order_by(Mesa.numero).all()
    
    @staticmethod
    def get_mesa_by_id(mesa_id: int) -> Optional[Mesa]:
        """Obtener mesa por ID"""
        return Mesa.query.get(mesa_id)
    
    @staticmethod
    def get_mesa_by_qr(qr_code: str) -> Optional[Mesa]:
        """Obtener mesa por código QR"""
        return Mesa.query.filter(Mesa.qr_code == qr_code).first()
    
    @staticmethod
    def update_mesa(mesa_id: int, data: Dict[str, Any]) -> tuple[Mesa, Optional[Dict[str, str]]]:
        """Actualizar una mesa"""
        try:
            mesa = Mesa.query.get(mesa_id)
            if not mesa:
                return None, {"error": "Mesa no encontrada"}
            
            mesa.numero = data.get('numero', mesa.numero)
            mesa.capacidad = data.get('capacidad', mesa.capacidad)
            mesa.zona_id = data.get('zona_id', mesa.zona_id)
            mesa.estado = data.get('estado', mesa.estado)
            mesa.posicion_x = data.get('posicion_x', mesa.posicion_x)
            mesa.posicion_y = data.get('posicion_y', mesa.posicion_y)
            mesa.activo = data.get('activo', mesa.activo)
            mesa.notas = data.get('notas', mesa.notas)
            
            db.session.commit()
            return mesa, None
        except Exception as e:
            db.session.rollback()
            return None, {"error": f"Error actualizando mesa: {str(e)}"}
    
    @staticmethod
    def delete_mesa(mesa_id: int) -> tuple[bool, Optional[Dict[str, str]]]:
        """Eliminar una mesa (soft delete)"""
        try:
            mesa = Mesa.query.get(mesa_id)
            if not mesa:
                raise BusinessLogicError("Mesa no encontrada")
            
            # Verificar si tiene órdenes activas
            ordenes_activas = len([o for o in mesa.ordenes if o.estado in ['pendiente', 'en_proceso']])
            if ordenes_activas > 0:
                raise BusinessLogicError(
                    f"No se puede eliminar la mesa '{mesa.numero}' porque tiene {ordenes_activas} orden(es) activa(s). "
                    f"Primero debe completar o cancelar todas las órdenes de la mesa."
                )
            
            mesa.activo = False
            db.session.commit()
            return True, None
        except BusinessLogicError as e:
            db.session.rollback()
            return ErrorHandler.handle_business_logic_error(str(e))
        except Exception as e:
            db.session.rollback()
            return ErrorHandler.handle_service_error(e, "eliminar mesa", "mesa")
    
    @staticmethod
    def cambiar_estado_mesa(mesa_id: int, nuevo_estado: str) -> tuple[bool, Optional[Dict[str, str]]]:
        """Cambiar el estado de una mesa"""
        try:
            mesa = Mesa.query.get(mesa_id)
            if not mesa:
                return False, {"error": "Mesa no encontrada"}
            
            estados_validos = ['disponible', 'ocupada', 'limpieza', 'reservada', 'fuera_servicio']
            if nuevo_estado not in estados_validos:
                return False, {"error": f"Estado inválido. Estados válidos: {', '.join(estados_validos)}"}
            
            mesa.estado = nuevo_estado
            db.session.commit()
            
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, {"error": f"Error cambiando estado de mesa: {str(e)}"}
    
    # --- MÉTODOS DE CONSULTA AVANZADA ---
    
    @staticmethod
    def get_estadisticas_zonas() -> Dict[str, Any]:
        """Obtener estadísticas de las zonas"""
        try:
            zonas = Zona.query.filter(Zona.activo == True).all()
            estadisticas = {
                'total_zonas': len(zonas),
                'zonas_por_tipo': {},
                'total_mesas': 0,
                'mesas_ocupadas': 0,
                'mesas_libres': 0,
                'capacidad_total': 0,
                'capacidad_ocupada': 0
            }
            
            for zona in zonas:
                # Contar por tipo
                if zona.tipo not in estadisticas['zonas_por_tipo']:
                    estadisticas['zonas_por_tipo'][zona.tipo] = 0
                estadisticas['zonas_por_tipo'][zona.tipo] += 1
                
                # Contar mesas
                mesas_zona = [m for m in zona.mesas if m.activo]
                estadisticas['total_mesas'] += len(mesas_zona)
                
                for mesa in mesas_zona:
                    estadisticas['capacidad_total'] += mesa.capacidad
                    if mesa.estado == 'ocupada':
                        estadisticas['mesas_ocupadas'] += 1
                        estadisticas['capacidad_ocupada'] += mesa.capacidad
                    elif mesa.estado == 'libre':
                        estadisticas['mesas_libres'] += 1
            
            return estadisticas
        except Exception as e:
            return {"error": f"Error obteniendo estadísticas: {str(e)}"}
    
    @staticmethod
    def get_mapa_restaurante() -> Dict[str, Any]:
        """Obtener datos para el mapa del restaurante"""
        try:
            pisos = Piso.query.filter(Piso.activo == True).order_by(Piso.orden).all()
            mapa = {
                'pisos': [],
                'total_mesas': 0,
                'mesas_ocupadas': 0
            }
            
            for piso in pisos:
                piso_data = piso.to_dict()
                piso_data['zonas'] = []
                
                for zona in piso.zonas:
                    if zona.activo:
                        zona_data = zona.to_dict()
                        zona_data['mesas'] = []
                        
                        for mesa in zona.mesas:
                            if mesa.activo:
                                mesa_data = mesa.to_dict()
                                zona_data['mesas'].append(mesa_data)
                                mapa['total_mesas'] += 1
                                if mesa.estado == 'ocupada':
                                    mapa['mesas_ocupadas'] += 1
                        
                        piso_data['zonas'].append(zona_data)
                
                mapa['pisos'].append(piso_data)
            
            return mapa
        except Exception as e:
            return {"error": f"Error obteniendo mapa: {str(e)}"}
