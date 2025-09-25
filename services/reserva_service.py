from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy import and_, or_
from models import db
from models.reserva import Reserva
from models.local import Mesa, Zona
from services.audit_service import AuditService
from services.error_handler import ErrorHandler, ValidationError, BusinessLogicError

class ReservaService:
    
    @staticmethod
    def create_reserva(data: Dict[str, Any]) -> Tuple[Optional[Reserva], Optional[Dict[str, str]]]:
        """Crear una nueva reserva"""
        try:
            # Validar datos requeridos
            required_fields = ['cliente_nombre', 'cliente_telefono', 'fecha_reserva', 'hora_reserva', 'numero_personas']
            for field in required_fields:
                if field not in data or not data[field]:
                    return None, {"error": f"El campo {field} es requerido"}

            # Validar que al menos una ubicación esté seleccionada (zona_id o mesa_id)
            # Nota: zona_id y mesa_id pueden ser None/undefined si no se seleccionan
            zona_id = data.get('zona_id')
            mesa_id = data.get('mesa_id')

            if (zona_id is None or zona_id == '') and (mesa_id is None or mesa_id == ''):
                return None, {"error": "Debe seleccionar una zona o una mesa específica"}
            
            # Validar fecha y hora
            fecha_reserva = data['fecha_reserva']
            if isinstance(fecha_reserva, str):
                try:
                    # Intentar parsear como fecha (YYYY-MM-DD)
                    fecha_reserva = datetime.strptime(fecha_reserva, '%Y-%m-%d').date()
                except ValueError:
                    try:
                        # Intentar parsear como datetime ISO
                        fecha_reserva = datetime.fromisoformat(fecha_reserva.replace('Z', '+00:00')).date()
                    except ValueError:
                        return None, {"error": "Formato de fecha inválido. Use YYYY-MM-DD"}
            
            # Verificar que la fecha no sea en el pasado
            if fecha_reserva < datetime.now().date():
                return None, {"error": "No se pueden hacer reservas en fechas pasadas"}
            
            # Validar número de personas
            try:
                numero_personas = int(data['numero_personas'])
                if numero_personas <= 0:
                    return None, {"error": "El número de personas debe ser mayor a 0"}
            except (ValueError, TypeError):
                return None, {"error": "Número de personas inválido"}
            
            # Asegurar que duracion_estimada sea un entero
            try:
                duracion_estimada = int(data.get('duracion_estimada', 120))
                if duracion_estimada <= 0:
                    return None, {"error": "La duración debe ser mayor a 0 minutos"}
            except (ValueError, TypeError):
                return None, {"error": "Duración estimada inválida"}
            
            # Validar que la zona existe
            zona = Zona.query.get(data['zona_id'])
            if not zona:
                return None, {"error": "La zona especificada no existe"}
            
            # Validar mesa si se especifica
            if data.get('mesa_id'):
                mesa = Mesa.query.get(data['mesa_id'])
                if not mesa:
                    return None, {"error": "La mesa especificada no existe"}
                if mesa.zona_id != data['zona_id']:
                    return None, {"error": "La mesa no pertenece a la zona especificada"}
            
            # Verificar disponibilidad
            disponibilidad = ReservaService.check_disponibilidad(
                data['zona_id'], 
                fecha_reserva, 
                data['hora_reserva'],
                duracion_estimada,
                data.get('mesa_id')
            )
            
            if not disponibilidad['disponible']:
                return None, {"error": f"No hay disponibilidad: {disponibilidad['motivo']}"}
            
            # Crear la reserva
            reserva = Reserva(
                cliente_nombre=data['cliente_nombre'],
                cliente_telefono=data['cliente_telefono'],
                cliente_email=data.get('cliente_email'),
                fecha_reserva=fecha_reserva,
                hora_reserva=data['hora_reserva'],
                duracion_estimada=duracion_estimada,
                numero_personas=numero_personas,
                estado='pendiente',
                tipo_reserva=data.get('tipo_reserva', 'normal'),
                mesa_id=data.get('mesa_id'),
                zona_id=data['zona_id'],
                usuario_id=data.get('usuario_id'),
                notas=data.get('notas'),
                requerimientos_especiales=data.get('requerimientos_especiales')
            )
            
            db.session.add(reserva)
            db.session.commit()
            
            # Registrar en auditoría
            AuditService.log_event(
                usuario_id=data.get('usuario_id'),
                entidad='reserva',
                accion='create',
                id_entidad=reserva.id,
                valores_nuevos={'cliente': reserva.cliente_nombre, 'fecha': reserva.fecha_reserva.isoformat()}
            )
            
            return reserva, None
            
        except Exception as e:
            db.session.rollback()
            return ErrorHandler.handle_service_error(e, "crear reserva", "reserva")
    
    @staticmethod
    def get_reservas(fecha_inicio: Optional[datetime] = None, 
                    fecha_fin: Optional[datetime] = None,
                    estado: Optional[str] = None,
                    zona_id: Optional[int] = None,
                    mesa_id: Optional[int] = None) -> List[Reserva]:
        """Obtener reservas con filtros"""
        query = Reserva.query
        
        if fecha_inicio:
            query = query.filter(Reserva.fecha_reserva >= fecha_inicio)
        if fecha_fin:
            query = query.filter(Reserva.fecha_reserva <= fecha_fin)
        if estado:
            query = query.filter(Reserva.estado == estado)
        if zona_id:
            query = query.filter(Reserva.zona_id == zona_id)
        if mesa_id:
            query = query.filter(Reserva.mesa_id == mesa_id)
        
        return query.order_by(Reserva.fecha_reserva, Reserva.hora_reserva).all()
    
    @staticmethod
    def get_reserva_by_id(reserva_id: int) -> Optional[Reserva]:
        """Obtener reserva por ID"""
        return Reserva.query.filter(Reserva.id == reserva_id).first()
    
    @staticmethod
    def update_reserva(reserva_id: int, data: Dict[str, Any]) -> Tuple[Optional[Reserva], Optional[Dict[str, str]]]:
        """Actualizar una reserva"""
        try:
            reserva = Reserva.query.get(reserva_id)
            if not reserva:
                return None, {"error": "Reserva no encontrada"}
            
            # Actualizar campos
            if 'cliente_nombre' in data:
                reserva.cliente_nombre = data['cliente_nombre']
            if 'cliente_telefono' in data:
                reserva.cliente_telefono = data['cliente_telefono']
            if 'cliente_email' in data:
                reserva.cliente_email = data['cliente_email']
            if 'fecha_reserva' in data:
                fecha_reserva = data['fecha_reserva']
                if isinstance(fecha_reserva, str):
                    fecha_reserva = datetime.fromisoformat(fecha_reserva.replace('Z', '+00:00'))
                reserva.fecha_reserva = fecha_reserva
            if 'hora_reserva' in data:
                reserva.hora_reserva = data['hora_reserva']
            if 'numero_personas' in data:
                reserva.numero_personas = data['numero_personas']
            if 'estado' in data:
                reserva.estado = data['estado']
            if 'zona_id' in data:
                print(f"🔍 Actualizando zona_id: {reserva.zona_id} -> {data['zona_id']}")
                reserva.zona_id = data['zona_id']
            if 'mesa_id' in data:
                print(f"🔍 Actualizando mesa_id: {reserva.mesa_id} -> {data['mesa_id']}")
                reserva.mesa_id = data['mesa_id']
            if 'notas' in data:
                reserva.notas = data['notas']
            if 'requerimientos_especiales' in data:
                reserva.requerimientos_especiales = data['requerimientos_especiales']
            
            reserva.actualizado_en = datetime.utcnow()
            db.session.commit()
            
            print(f"✅ Reserva actualizada exitosamente:")
            print(f"   - ID: {reserva.id}")
            print(f"   - Zona ID: {reserva.zona_id}")
            print(f"   - Mesa ID: {reserva.mesa_id}")
            print(f"   - Cliente: {reserva.cliente_nombre}")
            
            # Registrar en auditoría
            AuditService.log_event(
                usuario_id=data.get('usuario_id'),
                entidad='reserva',
                accion='update',
                id_entidad=reserva.id,
                valores_nuevos={'cliente': reserva.cliente_nombre}
            )
            
            return reserva, None
            
        except Exception as e:
            db.session.rollback()
            return ErrorHandler.handle_service_error(e, "actualizar reserva", "reserva")
    
    @staticmethod
    def delete_reserva(reserva_id: int, usuario_id: Optional[int] = None) -> Tuple[bool, Optional[Dict[str, str]]]:
        """Eliminar una reserva permanentemente"""
        try:
            reserva = Reserva.query.get(reserva_id)
            if not reserva:
                return False, {"error": "Reserva no encontrada"}
            
            # Eliminar permanentemente de la base de datos
            db.session.delete(reserva)
            db.session.commit()
            
            # Registrar en auditoría
            AuditService.log_event(
                usuario_id=usuario_id,
                entidad='reserva',
                accion='delete',
                id_entidad=reserva.id,
                valores_anteriores={'cliente': reserva.cliente_nombre, 'eliminado_permanentemente': True}
            )
            
            return True, None
            
        except Exception as e:
            db.session.rollback()
            return ErrorHandler.handle_service_error(e, "eliminar reserva", "reserva")
    
    @staticmethod
    def check_disponibilidad(zona_id: int, fecha: datetime, hora: str, 
                           duracion: int = 120, mesa_id: Optional[int] = None) -> Dict[str, Any]:
        """Verificar disponibilidad para una reserva"""
        try:
            # Asegurar que duracion sea un entero
            duracion = int(duracion) if duracion is not None else 120
            
            # Convertir fecha y hora a datetime
            if isinstance(fecha, str):
                try:
                    fecha = datetime.strptime(fecha, '%Y-%m-%d').date()
                except ValueError:
                    return {"disponible": False, "motivo": "Formato de fecha inválido"}
            
            hora_parts = hora.split(':')
            hora_datetime = datetime.combine(fecha, datetime.min.time().replace(hour=int(hora_parts[0]), minute=int(hora_parts[1])))
            fin_reserva = hora_datetime + timedelta(minutes=duracion)
            
            # Verificar bloqueos en la zona
            from models.bloqueo import Bloqueo
            bloqueos_activos = Bloqueo.query.filter(
                and_(
                    Bloqueo.zona_id == zona_id,
                    Bloqueo.estado.in_(['activo', 'programado']),
                    or_(
                        and_(Bloqueo.fecha_inicio <= hora_datetime, Bloqueo.fecha_fin >= hora_datetime),
                        and_(Bloqueo.fecha_inicio <= fin_reserva, Bloqueo.fecha_fin >= fin_reserva),
                        and_(Bloqueo.fecha_inicio >= hora_datetime, Bloqueo.fecha_fin <= fin_reserva)
                    )
                )
            ).first()
            
            if bloqueos_activos:
                return {
                    'disponible': False,
                    'motivo': f'La zona está bloqueada: {bloqueos_activos.titulo}'
                }
            
            # Verificar reservas existentes en la misma fecha
            reservas_misma_fecha = Reserva.query.filter(
                and_(
                    Reserva.fecha_reserva == fecha,
                    Reserva.estado.in_(['confirmada', 'pendiente'])
                )
            ).all()
            
            # Si se especifica mesa, verificar conflictos en esa mesa específica
            if mesa_id:
                for reserva in reservas_misma_fecha:
                    if reserva.mesa_id == mesa_id:
                        # Verificar conflicto de horarios en la misma mesa
                        hora_reserva_existente = datetime.combine(fecha, reserva.hora_reserva)
                        fin_reserva_existente = hora_reserva_existente + timedelta(minutes=reserva.duracion_estimada)
                        
                        # Verificar si hay solapamiento de horarios
                        if (hora_datetime < fin_reserva_existente and fin_reserva > hora_reserva_existente):
                            return {
                                'disponible': False,
                                'motivo': f'La mesa {mesa_id} ya tiene una reserva de {reserva.hora_reserva} a {fin_reserva_existente.strftime("%H:%M")}. Intenta con otra mesa, hora o fecha.'
                            }
            else:
                # Si no se especifica mesa, verificar si hay disponibilidad general en la zona
                mesas_ocupadas = set()
                for reserva in reservas_misma_fecha:
                    hora_reserva_existente = datetime.combine(fecha, reserva.hora_reserva)
                    fin_reserva_existente = hora_reserva_existente + timedelta(minutes=reserva.duracion_estimada)
                    
                    # Verificar si hay solapamiento de horarios
                    if (hora_datetime < fin_reserva_existente and fin_reserva > hora_reserva_existente):
                        if reserva.mesa_id:
                            mesas_ocupadas.add(reserva.mesa_id)
                
                if mesas_ocupadas:
                    return {
                        'disponible': False,
                        'motivo': f'Las mesas {list(mesas_ocupadas)} están ocupadas en ese horario. Intenta con otra hora o fecha.'
                    }
            
            # Si se especifica una mesa, verificar que esté disponible
            if mesa_id:
                mesa = Mesa.query.get(mesa_id)
                if not mesa or mesa.zona_id != zona_id:
                    return {
                        'disponible': False,
                        'motivo': 'La mesa especificada no existe o no pertenece a la zona'
                    }
                
                if mesa.estado != 'disponible':
                    return {
                        'disponible': False,
                        'motivo': f'La mesa {mesa.numero} no está disponible'
                    }
            
            return {
                'disponible': True,
                'motivo': 'Disponible'
            }
            
        except Exception as e:
            return {
                'disponible': False,
                'motivo': f'Error verificando disponibilidad: {str(e)}'
            }
    
    @staticmethod
    def confirmar_reserva(reserva_id: int, usuario_id: Optional[int] = None) -> Tuple[bool, Optional[Dict[str, str]]]:
        """Confirmar una reserva"""
        try:
            reserva = Reserva.query.get(reserva_id)
            if not reserva:
                return False, {"error": "Reserva no encontrada"}
            
            reserva.estado = 'confirmada'
            reserva.actualizado_en = datetime.utcnow()
            db.session.commit()
            
            # Registrar en auditoría
            AuditService.log_event(
                usuario_id=usuario_id,
                entidad='reserva',
                accion='confirm',
                id_entidad=reserva.id,
                valores_nuevos={'estado': 'confirmada', 'cliente': reserva.cliente_nombre}
            )
            
            return True, None
            
        except Exception as e:
            db.session.rollback()
            return False, {"error": f"Error confirmando reserva: {str(e)}"}
    
    @staticmethod
    def cancelar_reserva(reserva_id: int, motivo: Optional[str] = None, usuario_id: Optional[int] = None) -> Tuple[bool, Optional[Dict[str, str]]]:
        """Cancelar una reserva"""
        try:
            reserva = Reserva.query.get(reserva_id)
            if not reserva:
                return False, {"error": "Reserva no encontrada"}
            
            reserva.estado = 'cancelada'
            if motivo:
                reserva.notas = f"{reserva.notas or ''}\nCancelada: {motivo}".strip()
            reserva.actualizado_en = datetime.utcnow()
            db.session.commit()
            
            # Registrar en auditoría
            AuditService.log_event(
                usuario_id=usuario_id,
                entidad='reserva',
                accion='cancel',
                id_entidad=reserva.id,
                valores_nuevos={'estado': 'cancelada', 'cliente': reserva.cliente_nombre, 'motivo': motivo}
            )
            
            return True, None
            
        except Exception as e:
            db.session.rollback()
            return False, {"error": f"Error cancelando reserva: {str(e)}"}

