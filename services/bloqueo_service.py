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
        """Crear un nuevo bloqueo"""
        try:
            # Validar datos requeridos
            required_fields = ['titulo', 'tipo', 'fecha_inicio', 'fecha_fin', 'usuario_id']
            for field in required_fields:
                if field not in data or not data[field]:
                    return None, {"error": f"El campo {field} es requerido"}
            
            # Validar fechas
            fecha_inicio = data['fecha_inicio']
            fecha_fin = data['fecha_fin']
            
            print(f"🔍 Fecha inicio recibida: {fecha_inicio}")
            print(f"🔍 Fecha fin recibida: {fecha_fin}")
            
            if isinstance(fecha_inicio, str):
                fecha_inicio = datetime.fromisoformat(fecha_inicio.replace('Z', ''))
            if isinstance(fecha_fin, str):
                fecha_fin = datetime.fromisoformat(fecha_fin.replace('Z', ''))
            
            if fecha_inicio >= fecha_fin:
                return None, {"error": "La fecha de inicio debe ser anterior a la fecha de fin"}
            
            # Comparar fechas (ambas son naive datetime ahora)
            now_utc = datetime.utcnow()
            print(f"🔍 Fecha inicio procesada: {fecha_inicio}")
            print(f"🔍 Fecha actual UTC: {now_utc}")
            print(f"🔍 ¿Fecha inicio < ahora?: {fecha_inicio < now_utc}")
            
            if fecha_inicio < now_utc:
                return None, {"error": "No se pueden crear bloqueos en fechas pasadas"}
            
            # Verificar que al menos uno de los IDs de ubicación esté presente
            if not any([data.get('mesa_id'), data.get('zona_id'), data.get('piso_id')]):
                return None, {"error": "Debe especificar al menos una ubicación (mesa, zona o piso)"}
            
            # Verificar conflictos con reservas existentes
            if data.get('mesa_id') or data.get('zona_id'):
                conflictos = BloqueoService.check_conflictos_reservas(
                    data.get('mesa_id'), 
                    data.get('zona_id'), 
                    fecha_inicio, 
                    fecha_fin
                )
                if conflictos:
                    return None, {"error": f"Conflicto con reservas existentes: {conflictos}"}
            
            # Separar fecha y hora para el modelo
            fecha_inicio_date = fecha_inicio.date()
            hora_inicio_time = fecha_inicio.time()
            fecha_fin_date = fecha_fin.date()
            hora_fin_time = fecha_fin.time()
            
            # Crear el bloqueo
            bloqueo = Bloqueo(
                titulo=data['titulo'],
                descripcion=data.get('descripcion'),
                tipo=data['tipo'],
                estado='programado',  # ✅ Por defecto 'programado'
                fecha_inicio=fecha_inicio_date,
                hora_inicio=hora_inicio_time,
                fecha_fin=fecha_fin_date,
                hora_fin=hora_fin_time,
                mesa_id=data.get('mesa_id'),
                zona_id=data.get('zona_id'),
                piso_id=data.get('piso_id'),
                usuario_id=data['usuario_id']
            )

            db.session.add(bloqueo)

            # ✅ ACTUALIZAR ESTADO DE MESAS/ZONAS/PISOS INMEDIATAMENTE
            # Las mesas se marcan como 'fuera_servicio' cuando se crea el bloqueo
            # independientemente del estado del bloqueo (programado/activo)
            if bloqueo.mesa_id:
                mesa = Mesa.query.get(bloqueo.mesa_id)
                if mesa:
                    mesa.estado = 'fuera_servicio'  # Mesa bloqueada
                    db.session.add(mesa)
            elif bloqueo.zona_id:
                # Si es una zona entera, marcar todas las mesas como fuera de servicio
                mesas_zona = Mesa.query.filter_by(zona_id=bloqueo.zona_id).all()
                for mesa in mesas_zona:
                    mesa.estado = 'fuera_servicio'
                    db.session.add(mesa)
            elif bloqueo.piso_id:
                # Si es un piso entero, marcar todas las mesas como fuera de servicio
                zonas_piso = Zona.query.filter_by(piso_id=bloqueo.piso_id).all()
                for zona in zonas_piso:
                    mesas_zona = Mesa.query.filter_by(zona_id=zona.id).all()
                    for mesa in mesas_zona:
                        mesa.estado = 'fuera_servicio'
                        db.session.add(mesa)

            db.session.commit()
            
            # Registrar en auditoría
            AuditService.log_event(
                usuario_id=data['usuario_id'],
                entidad='bloqueo',
                accion='create',
                id_entidad=bloqueo.id,
                valores_anteriores={'titulo': bloqueo.titulo, 'tipo': bloqueo.tipo}
            )
            
            return bloqueo, None
            
        except Exception as e:
            db.session.rollback()
            return ErrorHandler.handle_service_error(e, "crear bloqueo", "bloqueo")
    
    @staticmethod
    def get_bloqueos(fecha_inicio: Optional[datetime] = None, 
                    fecha_fin: Optional[datetime] = None,
                    estado: Optional[str] = None,
                    tipo: Optional[str] = None,
                    mesa_id: Optional[int] = None,
                    zona_id: Optional[int] = None,
                    piso_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Obtener bloqueos con filtros"""
        query = Bloqueo.query
        
        if fecha_inicio:
            query = query.filter(Bloqueo.fecha_inicio >= fecha_inicio)
        if fecha_fin:
            query = query.filter(Bloqueo.fecha_fin <= fecha_fin)
        if estado:
            query = query.filter(Bloqueo.estado == estado)
        if tipo:
            query = query.filter(Bloqueo.tipo == tipo)
        if mesa_id:
            query = query.filter(Bloqueo.mesa_id == mesa_id)
        if zona_id:
            query = query.filter(Bloqueo.zona_id == zona_id)
        if piso_id:
            query = query.filter(Bloqueo.piso_id == piso_id)
        
        bloqueos = query.order_by(Bloqueo.fecha_inicio).all()
        
        # Serializar los datos con información adicional
        bloqueos_data = []
        for bloqueo in bloqueos:
            bloqueo_dict = bloqueo.to_dict()
            
            # Agregar información adicional
            if bloqueo.mesa:
                bloqueo_dict['mesa_numero'] = str(bloqueo.mesa.numero)
                bloqueo_dict['mesa_capacidad'] = bloqueo.mesa.capacidad
            if bloqueo.zona:
                bloqueo_dict['zona_nombre'] = bloqueo.zona.nombre
                bloqueo_dict['zona_tipo'] = bloqueo.zona.tipo
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
            
            # Calcular duración en horas
            if bloqueo.fecha_inicio and bloqueo.fecha_fin and bloqueo.hora_inicio and bloqueo.hora_fin:
                inicio = datetime.combine(bloqueo.fecha_inicio, bloqueo.hora_inicio)
                fin = datetime.combine(bloqueo.fecha_fin, bloqueo.hora_fin)
                duracion = fin - inicio
                bloqueo_dict['duracion_horas'] = round(duracion.total_seconds() / 3600, 1)
            else:
                bloqueo_dict['duracion_horas'] = 0
            
            bloqueos_data.append(bloqueo_dict)
        
        return bloqueos_data
    
    @staticmethod
    def get_bloqueo_by_id(bloqueo_id: int) -> Optional[Bloqueo]:
        """Obtener bloqueo por ID"""
        return Bloqueo.query.filter(Bloqueo.id == bloqueo_id).first()
    
    @staticmethod
    def update_bloqueo(bloqueo_id: int, data: Dict[str, Any]) -> Tuple[Optional[Bloqueo], Optional[Dict[str, str]]]:
        """Actualizar un bloqueo"""
        try:
            bloqueo = Bloqueo.query.get(bloqueo_id)
            if not bloqueo:
                return None, {"error": "Bloqueo no encontrado"}
            
            # Actualizar campos
            if 'titulo' in data:
                bloqueo.titulo = data['titulo']
            if 'descripcion' in data:
                bloqueo.descripcion = data['descripcion']
            if 'tipo' in data:
                bloqueo.tipo = data['tipo']
            if 'estado' in data:
                bloqueo.estado = data['estado']
            if 'fecha_inicio' in data:
                fecha_inicio = data['fecha_inicio']
                if isinstance(fecha_inicio, str):
                    fecha_inicio = datetime.fromisoformat(fecha_inicio.replace('Z', ''))
                bloqueo.fecha_inicio = fecha_inicio
            if 'fecha_fin' in data:
                fecha_fin = data['fecha_fin']
                if isinstance(fecha_fin, str):
                    fecha_fin = datetime.fromisoformat(fecha_fin.replace('Z', ''))
                bloqueo.fecha_fin = fecha_fin
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

            # Actualizar estado de mesas/zonas/pisos después de cambiar ubicación
            BloqueoService._actualizar_estado_ubicaciones(bloqueo)
            if 'notas' in data:
                bloqueo.notas = data['notas']
            if 'motivo' in data:
                bloqueo.motivo = data['motivo']
            
            bloqueo.actualizado_en = datetime.utcnow()
            db.session.commit()
            
            # Registrar en auditoría
            AuditService.log_event(
                usuario_id=data.get('usuario_id'),
                accion='update',
                entidad='bloqueo',
                id_entidad=bloqueo.id,
                valores_anteriores={'titulo': bloqueo.titulo}
            )
            
            return bloqueo, None
            
        except Exception as e:
            db.session.rollback()
            return ErrorHandler.handle_service_error(e, "actualizar bloqueo", "bloqueo")
    
    @staticmethod
    def delete_bloqueo(bloqueo_id: int, usuario_id: Optional[int] = None) -> Tuple[bool, Optional[Dict[str, str]]]:
        """Eliminar un bloqueo (permanent delete)"""
        try:
            bloqueo = Bloqueo.query.get(bloqueo_id)
            if not bloqueo:
                return False, {"error": "Bloqueo no encontrado"}
            
            # Liberar ubicaciones antes de eliminar
            if bloqueo.mesa_id:
                BloqueoService._liberar_mesa(bloqueo.mesa_id)
            elif bloqueo.zona_id:
                BloqueoService._liberar_zona(bloqueo.zona_id)
            elif bloqueo.piso_id:
                BloqueoService._liberar_piso(bloqueo.piso_id)

            # Eliminar permanentemente
            db.session.delete(bloqueo)
            db.session.commit()
            
            # Registrar en auditoría
            AuditService.log_event(
                usuario_id=usuario_id,
                accion='delete',
                entidad='bloqueo',
                id_entidad=bloqueo.id,
                valores_anteriores={'titulo': bloqueo.titulo}
            )
            
            return True, None
            
        except Exception as e:
            db.session.rollback()
            return ErrorHandler.handle_service_error(e, "eliminar bloqueo", "bloqueo")
    
    @staticmethod
    def activar_bloqueo(bloqueo_id: int, usuario_id: Optional[int] = None) -> Tuple[bool, Optional[Dict[str, str]]]:
        """Activar un bloqueo"""
        try:
            bloqueo = Bloqueo.query.get(bloqueo_id)
            if not bloqueo:
                return False, {"error": "Bloqueo no encontrado"}
            
            bloqueo.estado = 'activo'
            bloqueo.actualizado_en = datetime.utcnow()

            # ✅ Las mesas ya están marcadas como 'fuera_servicio' desde la creación
            # No necesitamos hacer nada adicional al activar

            db.session.commit()
            
            # Registrar en auditoría
            AuditService.log_event(
                usuario_id=usuario_id,
                accion='update',
                entidad='bloqueo',
                id_entidad=bloqueo.id,
                valores_anteriores={'accion': 'activar', 'titulo': bloqueo.titulo}
            )
            
            return True, None
            
        except Exception as e:
            db.session.rollback()
            return False, {"error": f"Error activando bloqueo: {str(e)}"}
    
    @staticmethod
    def completar_bloqueo(bloqueo_id: int, usuario_id: Optional[int] = None) -> Tuple[bool, Optional[Dict[str, str]]]:
        """Completar un bloqueo"""
        try:
            bloqueo = Bloqueo.query.get(bloqueo_id)
            if not bloqueo:
                return False, {"error": "Bloqueo no encontrado"}
            
            bloqueo.estado = 'completado'
            bloqueo.actualizado_en = datetime.utcnow()

            # ✅ Liberar ubicaciones cuando se completa el bloqueo
            # Solo si el bloqueo estaba activo (afectando las mesas)
            if bloqueo.mesa_id:
                BloqueoService._liberar_mesa(bloqueo.mesa_id)
            elif bloqueo.zona_id:
                BloqueoService._liberar_zona(bloqueo.zona_id)
            elif bloqueo.piso_id:
                BloqueoService._liberar_piso(bloqueo.piso_id)

            db.session.commit()
            
            # Registrar en auditoría
            AuditService.log_event(
                usuario_id=usuario_id,
                accion='update',
                entidad='bloqueo',
                id_entidad=bloqueo.id,
                valores_anteriores={'accion': 'completar', 'titulo': bloqueo.titulo}
            )
            
            return True, None
            
        except Exception as e:
            db.session.rollback()
            return False, {"error": f"Error completando bloqueo: {str(e)}"}

    @staticmethod
    def cancelar_bloqueo(bloqueo_id: int, usuario_id: Optional[int] = None) -> Tuple[bool, Optional[Dict[str, str]]]:
        """Cancelar un bloqueo (libera las mesas)"""
        try:
            bloqueo = Bloqueo.query.get(bloqueo_id)
            if not bloqueo:
                return False, {"error": "Bloqueo no encontrado"}

            # ✅ Liberar ubicaciones cuando se cancela el bloqueo
            if bloqueo.mesa_id:
                BloqueoService._liberar_mesa(bloqueo.mesa_id)
            elif bloqueo.zona_id:
                BloqueoService._liberar_zona(bloqueo.zona_id)
            elif bloqueo.piso_id:
                BloqueoService._liberar_piso(bloqueo.piso_id)

            bloqueo.estado = 'cancelado'
            bloqueo.actualizado_en = datetime.utcnow()
            db.session.commit()

            # Registrar en auditoría
            AuditService.log_event(
                usuario_id=usuario_id,
                accion='cancel',
                entidad='bloqueo',
                id_entidad=bloqueo.id,
                valores_anteriores={'titulo': bloqueo.titulo, 'estado_anterior': 'cancelado'}
            )

            return True, None

        except Exception as e:
            db.session.rollback()
            return False, {"error": f"Error cancelando bloqueo: {str(e)}"}

    @staticmethod
    def _actualizar_estado_ubicaciones(bloqueo: Bloqueo):
        """Actualizar el estado de mesas/zonas/pisos según el bloqueo"""
        try:
            # ✅ ACTUALIZAR ESTADOS INMEDIATAMENTE cuando se crea/actualiza bloqueo
            # Las mesas se marcan como 'fuera_servicio' inmediatamente, no solo cuando está 'activo'

            if bloqueo.mesa_id:
                BloqueoService._bloquear_mesa(bloqueo.mesa_id)
            elif bloqueo.zona_id:
                BloqueoService._bloquear_zona(bloqueo.zona_id)
            elif bloqueo.piso_id:
                BloqueoService._bloquear_piso(bloqueo.piso_id)

        except Exception as e:
            print(f"Error actualizando estados de ubicaciones: {str(e)}")

    @staticmethod
    def _liberar_mesa(mesa_id: int):
        """Liberar una mesa específica"""
        mesa = Mesa.query.get(mesa_id)
        if mesa:
            mesa.estado = 'disponible'
            db.session.add(mesa)

    @staticmethod
    def _liberar_zona(zona_id: int):
        """Liberar todas las mesas de una zona"""
        mesas = Mesa.query.filter_by(zona_id=zona_id).all()
        for mesa in mesas:
            mesa.estado = 'disponible'
            db.session.add(mesa)

    @staticmethod
    def _liberar_piso(piso_id: int):
        """Liberar todas las mesas de un piso"""
        zonas = Zona.query.filter_by(piso_id=piso_id).all()
        for zona in zonas:
            BloqueoService._liberar_zona(zona.id)

    @staticmethod
    def _bloquear_mesa(mesa_id: int):
        """Bloquear una mesa específica"""
        mesa = Mesa.query.get(mesa_id)
        if mesa:
            mesa.estado = 'fuera_servicio'
            db.session.add(mesa)

    @staticmethod
    def _bloquear_zona(zona_id: int):
        """Bloquear todas las mesas de una zona"""
        mesas = Mesa.query.filter_by(zona_id=zona_id).all()
        for mesa in mesas:
            mesa.estado = 'fuera_servicio'
            db.session.add(mesa)

    @staticmethod
    def _bloquear_piso(piso_id: int):
        """Bloquear todas las mesas de un piso"""
        zonas = Zona.query.filter_by(piso_id=piso_id).all()
        for zona in zonas:
            BloqueoService._bloquear_zona(zona.id)

    @staticmethod
    def check_conflictos_reservas(mesa_id: Optional[int], zona_id: Optional[int],
                                fecha_inicio: datetime, fecha_fin: datetime) -> Optional[str]:
        """Verificar conflictos con reservas existentes"""
        try:
            from models.reserva import Reserva
            
            # Buscar reservas que se solapen con el bloqueo
            # Convertir fechas del bloqueo a date para comparar con fecha_reserva
            fecha_bloqueo_inicio = fecha_inicio.date()
            fecha_bloqueo_fin = fecha_fin.date()
            
            query = Reserva.query.filter(
                and_(
                    Reserva.estado.in_(['confirmada', 'pendiente']),
                    Reserva.fecha_reserva.between(fecha_bloqueo_inicio, fecha_bloqueo_fin)
                )
            )
            
            if mesa_id:
                query = query.filter(Reserva.mesa_id == mesa_id)
            elif zona_id:
                query = query.filter(Reserva.zona_id == zona_id)
            
            reservas_conflictivas = query.all()
            
            if reservas_conflictivas:
                nombres_clientes = [r.cliente_nombre for r in reservas_conflictivas]
                return f"Reservas de: {', '.join(nombres_clientes)}"
            
            return None
            
        except Exception as e:
            return f"Error verificando conflictos: {str(e)}"
    
    @staticmethod
    def get_bloqueos_activos_ahora() -> List[Bloqueo]:
        """Obtener bloqueos activos en este momento"""
        ahora = datetime.utcnow()
        return Bloqueo.query.filter(
            and_(
                Bloqueo.estado == 'activo',
                Bloqueo.fecha_inicio <= ahora,
                Bloqueo.fecha_fin >= ahora
            )
        ).all()
    
    @staticmethod
    def get_bloqueos_por_vencer(horas: int = 24) -> List[Bloqueo]:
        """Obtener bloqueos que van a vencer en las próximas horas"""
        ahora = datetime.utcnow()
        limite = ahora + timedelta(hours=horas)
        
        return Bloqueo.query.filter(
            and_(
                Bloqueo.estado == 'activo',
                Bloqueo.fecha_fin >= ahora,
                Bloqueo.fecha_fin <= limite
            )
        ).all()

