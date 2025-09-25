"""
Servicio mejorado de bloqueos con manejo robusto de errores
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy import and_, or_
from models import db
from models.bloqueo import Bloqueo
from models.local import Mesa, Zona, Piso
from services.audit_service import AuditService
from services.error_handler import ErrorHandler, ValidationError, BusinessLogicError

class BloqueoService:
    
    @staticmethod
    def create_bloqueo(data: Dict[str, Any]) -> Tuple[Optional[Bloqueo], Optional[Dict[str, str]]]:
        """Crear un nuevo bloqueo con validación robusta"""
        try:
            # Validar datos de entrada
            validation_error = BloqueoService._validate_bloqueo_data(data)
            if validation_error:
                return None, validation_error
            
            # Procesar fechas
            fecha_inicio, fecha_fin = BloqueoService._process_dates(data)
            
            # Verificar conflictos
            conflictos = BloqueoService._check_conflicts(data, fecha_inicio, fecha_fin)
            if conflictos:
                return None, ErrorHandler.handle_business_logic_error(
                    "Conflicto con reservas existentes", 
                    conflictos
                )[1]
            
            # Crear el bloqueo
            bloqueo = BloqueoService._create_bloqueo_object(data, fecha_inicio, fecha_fin)
            db.session.add(bloqueo)
            db.session.commit()
            
            # Registrar auditoría
            AuditService.log_event(
                usuario_id=data.get('usuario_id'),
                accion='create',
                entidad='bloqueo',
                id_entidad=bloqueo.id,
                valores_anteriores={},
                valores_nuevos=bloqueo.to_dict()
            )
            
            return bloqueo, None
            
        except Exception as e:
            db.session.rollback()
            return ErrorHandler.handle_service_error(e, "crear bloqueo", "bloqueo")
    
    @staticmethod
    def _validate_bloqueo_data(data: Dict[str, Any]) -> Optional[Dict[str, str]]:
        """Validar datos del bloqueo"""
        try:
            # Validar campos requeridos
            required_fields = ['titulo', 'tipo', 'fecha_inicio', 'fecha_fin', 'usuario_id']
            for field in required_fields:
                if field not in data or not data[field]:
                    raise ValidationError(field, f"El campo {field} es requerido")
            
            # Validar tipo
            valid_types = ['mantenimiento', 'evento', 'reserva_privada', 'otro']
            if data['tipo'] not in valid_types:
                raise ValidationError('tipo', f"Tipo inválido. Tipos válidos: {', '.join(valid_types)}")
            
            # Validar ubicación
            if not any(data.get(field) for field in ['mesa_id', 'zona_id', 'piso_id']):
                raise ValidationError('ubicacion', "Debe especificar al menos una ubicación (mesa, zona o piso)")
            
            return None
            
        except ValidationError as e:
            return ErrorHandler.handle_validation_error(e.field, e.message, e.value)[1]
        except Exception as e:
            return ErrorHandler.handle_service_error(e, "validar datos de bloqueo")[1]
    
    @staticmethod
    def _process_dates(data: Dict[str, Any]) -> Tuple[datetime, datetime]:
        """Procesar y validar fechas"""
        try:
            fecha_inicio = data['fecha_inicio']
            fecha_fin = data['fecha_fin']
            
            if isinstance(fecha_inicio, str):
                fecha_inicio = datetime.fromisoformat(fecha_inicio.replace('Z', ''))
            if isinstance(fecha_fin, str):
                fecha_fin = datetime.fromisoformat(fecha_fin.replace('Z', ''))
            
            # Validar lógica de fechas
            if fecha_inicio >= fecha_fin:
                raise BusinessLogicError("La fecha de inicio debe ser anterior a la fecha de fin")
            
            if fecha_inicio < datetime.utcnow():
                raise BusinessLogicError("No se pueden crear bloqueos en fechas pasadas")
            
            return fecha_inicio, fecha_fin
            
        except BusinessLogicError:
            raise
        except Exception as e:
            raise ValidationError('fechas', f"Formato de fecha inválido: {str(e)}")
    
    @staticmethod
    def _check_conflicts(data: Dict[str, Any], fecha_inicio: datetime, fecha_fin: datetime) -> Optional[str]:
        """Verificar conflictos con reservas existentes"""
        try:
            # Implementar lógica de verificación de conflictos
            # Por ahora retornar None (sin conflictos)
            return None
        except Exception as e:
            raise BusinessLogicError(f"Error verificando conflictos: {str(e)}")
    
    @staticmethod
    def _create_bloqueo_object(data: Dict[str, Any], fecha_inicio: datetime, fecha_fin: datetime) -> Bloqueo:
        """Crear objeto Bloqueo con datos validados"""
        bloqueo_data = {
            'titulo': data['titulo'],
            'descripcion': data.get('descripcion', ''),
            'tipo': data['tipo'],
            'fecha_inicio': fecha_inicio.date(),
            'hora_inicio': fecha_inicio.time(),
            'fecha_fin': fecha_fin.date(),
            'hora_fin': fecha_fin.time(),
            'usuario_id': data['usuario_id'],
            'notas': data.get('notas', ''),
            'motivo': data.get('motivo', ''),
            'estado': 'programado'
        }
        
        # Asignar ubicación
        if data.get('mesa_id'):
            bloqueo_data['mesa_id'] = data['mesa_id']
        elif data.get('zona_id'):
            bloqueo_data['zona_id'] = data['zona_id']
        elif data.get('piso_id'):
            bloqueo_data['piso_id'] = data['piso_id']
        
        return Bloqueo(**bloqueo_data)
    
    @staticmethod
    def get_bloqueos() -> List[Dict[str, Any]]:
        """Obtener todos los bloqueos con información adicional"""
        try:
            bloqueos = Bloqueo.query.filter(Bloqueo.activo == True).all()
            
            bloqueos_data = []
            for bloqueo in bloqueos:
                bloqueo_dict = bloqueo.to_dict()
                
                # Agregar información adicional
                if bloqueo.mesa:
                    bloqueo_dict['mesa_numero'] = bloqueo.mesa.numero
                if bloqueo.zona:
                    bloqueo_dict['zona_nombre'] = bloqueo.zona.nombre
                if bloqueo.piso:
                    bloqueo_dict['piso_nombre'] = bloqueo.piso.nombre
                if bloqueo.usuario:
                    bloqueo_dict['usuario_nombre'] = bloqueo.usuario.usuario
                
                # Combinar fecha y hora para el frontend
                if bloqueo.fecha_inicio and bloqueo.hora_inicio:
                    inicio = datetime.combine(bloqueo.fecha_inicio, bloqueo.hora_inicio)
                    bloqueo_dict['fecha_inicio'] = inicio.isoformat()
                if bloqueo.fecha_fin and bloqueo.hora_fin:
                    fin = datetime.combine(bloqueo.fecha_fin, bloqueo.hora_fin)
                    bloqueo_dict['fecha_fin'] = fin.isoformat()
                
                # Calcular duración
                if bloqueo.fecha_inicio and bloqueo.hora_inicio and bloqueo.fecha_fin and bloqueo.hora_fin:
                    inicio = datetime.combine(bloqueo.fecha_inicio, bloqueo.hora_inicio)
                    fin = datetime.combine(bloqueo.fecha_fin, bloqueo.hora_fin)
                    duracion = fin - inicio
                    bloqueo_dict['duracion_horas'] = round(duracion.total_seconds() / 3600, 2)
                
                bloqueos_data.append(bloqueo_dict)
            
            return bloqueos_data
            
        except Exception as e:
            raise BusinessLogicError(f"Error obteniendo bloqueos: {str(e)}")
    
    @staticmethod
    def update_bloqueo(bloqueo_id: int, data: Dict[str, Any]) -> Tuple[Optional[Bloqueo], Optional[Dict[str, str]]]:
        """Actualizar un bloqueo con validación robusta"""
        try:
            bloqueo = Bloqueo.query.get(bloqueo_id)
            if not bloqueo:
                return ErrorHandler.handle_not_found_error("bloqueo", bloqueo_id)
            
            # Validar datos si se proporcionan
            if any(key in data for key in ['titulo', 'tipo', 'fecha_inicio', 'fecha_fin']):
                validation_error = BloqueoService._validate_bloqueo_data(data)
                if validation_error:
                    return None, validation_error
            
            # Actualizar campos
            BloqueoService._update_bloqueo_fields(bloqueo, data)
            
            bloqueo.actualizado_en = datetime.utcnow()
            db.session.commit()
            
            # Registrar auditoría
            AuditService.log_event(
                usuario_id=data.get('usuario_id'),
                accion='update',
                entidad='bloqueo',
                id_entidad=bloqueo.id,
                valores_anteriores={},
                valores_nuevos=bloqueo.to_dict()
            )
            
            return bloqueo, None
            
        except Exception as e:
            db.session.rollback()
            return ErrorHandler.handle_service_error(e, "actualizar bloqueo", "bloqueo")
    
    @staticmethod
    def _update_bloqueo_fields(bloqueo: Bloqueo, data: Dict[str, Any]) -> None:
        """Actualizar campos del bloqueo"""
        # Actualizar campos básicos
        if 'titulo' in data:
            bloqueo.titulo = data['titulo']
        if 'descripcion' in data:
            bloqueo.descripcion = data['descripcion']
        if 'tipo' in data:
            bloqueo.tipo = data['tipo']
        if 'estado' in data:
            bloqueo.estado = data['estado']
        
        # Actualizar fechas
        if 'fecha_inicio' in data or 'fecha_fin' in data:
            fecha_inicio, fecha_fin = BloqueoService._process_dates(data)
            bloqueo.fecha_inicio = fecha_inicio.date()
            bloqueo.hora_inicio = fecha_inicio.time()
            bloqueo.fecha_fin = fecha_fin.date()
            bloqueo.hora_fin = fecha_fin.time()
        
        # Limpiar TODOS los campos de ubicación primero
        bloqueo.mesa_id = None
        bloqueo.zona_id = None
        bloqueo.piso_id = None
        
        # Luego asignar solo el campo que tiene valor
        if 'mesa_id' in data and data['mesa_id'] is not None:
            bloqueo.mesa_id = data['mesa_id']
        if 'zona_id' in data and data['zona_id'] is not None:
            bloqueo.zona_id = data['zona_id']
        if 'piso_id' in data and data['piso_id'] is not None:
            bloqueo.piso_id = data['piso_id']
        
        # Actualizar campos adicionales
        if 'notas' in data:
            bloqueo.notas = data['notas']
        if 'motivo' in data:
            bloqueo.motivo = data['motivo']
    
    @staticmethod
    def delete_bloqueo(bloqueo_id: int, usuario_id: Optional[int] = None) -> Tuple[bool, Optional[Dict[str, str]]]:
        """Eliminar un bloqueo permanentemente"""
        try:
            bloqueo = Bloqueo.query.get(bloqueo_id)
            if not bloqueo:
                return ErrorHandler.handle_not_found_error("bloqueo", bloqueo_id)
            
            # Eliminar permanentemente
            db.session.delete(bloqueo)
            db.session.commit()
            
            # Registrar auditoría
            AuditService.log_event(
                usuario_id=usuario_id,
                accion='delete',
                entidad='bloqueo',
                id_entidad=bloqueo_id,
                valores_anteriores=bloqueo.to_dict(),
                valores_nuevos={}
            )
            
            return True, None
            
        except Exception as e:
            db.session.rollback()
            return ErrorHandler.handle_service_error(e, "eliminar bloqueo", "bloqueo")
