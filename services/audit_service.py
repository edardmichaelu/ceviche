from models import db
from models.core import Auditoria
from models.user import Usuario
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from flask import request
import json

class AuditService:
    """Servicio para manejar la auditoría y logs del sistema"""
    
    @staticmethod
    def log_event(
        usuario_id: Optional[int],
        entidad: str,
        accion: str,
        id_entidad: Optional[int] = None,
        valores_anteriores: Optional[Dict[str, Any]] = None,
        valores_nuevos: Optional[Dict[str, Any]] = None,
        ip: Optional[str] = None
    ) -> Auditoria:
        """
        Registra un evento de auditoría en el sistema
        
        Args:
            usuario_id: ID del usuario que realizó la acción
            entidad: Nombre de la entidad afectada (usuario, mesa, producto, etc.)
            accion: Acción realizada (create, update, delete, login, logout, etc.)
            id_entidad: ID de la entidad específica afectada
            valores_anteriores: Valores antes del cambio (para updates)
            valores_nuevos: Valores después del cambio (para updates)
            ip: Dirección IP del usuario
        
        Returns:
            Objeto Auditoria creado
        """
        try:
            if ip is None:
                ip = request.remote_addr if request else None
                
            audit_entry = Auditoria(
                usuario_id=usuario_id,
                entidad=entidad,
                accion=accion,
                id_entidad=id_entidad,
                valores_anteriores=valores_anteriores,
                valores_nuevos=valores_nuevos,
                ip=ip,
                fecha=datetime.utcnow()
            )
            
            db.session.add(audit_entry)
            db.session.commit()
            
            return audit_entry
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error registrando evento de auditoría: {str(e)}")
    
    @staticmethod
    def get_audit_logs(
        page: int = 1,
        per_page: int = 50,
        usuario_id: Optional[int] = None,
        entidad: Optional[str] = None,
        accion: Optional[str] = None,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Obtiene los logs de auditoría con filtros opcionales
        
        Args:
            page: Número de página
            per_page: Elementos por página
            usuario_id: Filtrar por usuario específico
            entidad: Filtrar por entidad específica
            accion: Filtrar por acción específica
            fecha_desde: Filtrar desde fecha
            fecha_hasta: Filtrar hasta fecha
        
        Returns:
            Diccionario con logs y metadatos de paginación
        """
        try:
            query = Auditoria.query
            
            # Aplicar filtros
            if usuario_id:
                query = query.filter(Auditoria.usuario_id == usuario_id)
            if entidad:
                query = query.filter(Auditoria.entidad == entidad)
            if accion:
                query = query.filter(Auditoria.accion == accion)
            if fecha_desde:
                query = query.filter(Auditoria.fecha >= fecha_desde)
            if fecha_hasta:
                query = query.filter(Auditoria.fecha <= fecha_hasta)
            
            # Ordenar por fecha descendente (más recientes primero)
            query = query.order_by(Auditoria.fecha.desc())
            
            # Paginación
            pagination = query.paginate(
                page=page,
                per_page=per_page,
                error_out=False
            )
            
            # Formatear resultados
            logs = []
            for audit in pagination.items:
                # Obtener información del usuario
                usuario_info = None
                if audit.usuario_id:
                    usuario = Usuario.query.get(audit.usuario_id)
                    if usuario:
                        usuario_info = {
                            'id': usuario.id,
                            'usuario': usuario.usuario,
                            'correo': usuario.correo,
                            'rol': usuario.rol
                        }
                
                log_entry = {
                    'id': audit.id,
                    'usuario': usuario_info,
                    'entidad': audit.entidad,
                    'accion': audit.accion,
                    'id_entidad': audit.id_entidad,
                    'valores_anteriores': audit.valores_anteriores,
                    'valores_nuevos': audit.valores_nuevos,
                    'ip': audit.ip,
                    'fecha': audit.fecha.isoformat() if audit.fecha else None
                }
                logs.append(log_entry)
            
            return {
                'logs': logs,
                'total_pages': pagination.pages,
                'current_page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        except Exception as e:
            raise Exception(f"Error obteniendo logs de auditoría: {str(e)}")
    
    @staticmethod
    def get_audit_statistics() -> Dict[str, Any]:
        """
        Obtiene estadísticas de auditoría
        
        Returns:
            Diccionario con estadísticas
        """
        try:
            # Total de eventos
            total_events = Auditoria.query.count()
            
            # Eventos por entidad
            entity_stats = db.session.query(
                Auditoria.entidad,
                db.func.count(Auditoria.id).label('count')
            ).group_by(Auditoria.entidad).all()
            
            # Eventos por acción
            action_stats = db.session.query(
                Auditoria.accion,
                db.func.count(Auditoria.id).label('count')
            ).group_by(Auditoria.accion).all()
            
            # Eventos por usuario (top 10)
            user_stats = db.session.query(
                Auditoria.usuario_id,
                Usuario.usuario,
                db.func.count(Auditoria.id).label('count')
            ).join(Usuario, Auditoria.usuario_id == Usuario.id)\
             .group_by(Auditoria.usuario_id, Usuario.usuario)\
             .order_by(db.func.count(Auditoria.id).desc())\
             .limit(10).all()
            
            # Eventos de las últimas 24 horas
            last_24h = datetime.utcnow() - timedelta(hours=24)
            recent_events = Auditoria.query.filter(
                Auditoria.fecha >= last_24h
            ).count()
            
            # Eventos de la última semana
            last_week = datetime.utcnow() - timedelta(days=7)
            week_events = Auditoria.query.filter(
                Auditoria.fecha >= last_week
            ).count()
            
            return {
                'total_events': total_events,
                'recent_events_24h': recent_events,
                'week_events': week_events,
                'entity_stats': [
                    {'entidad': stat.entidad, 'count': stat.count}
                    for stat in entity_stats
                ],
                'action_stats': [
                    {'accion': stat.accion, 'count': stat.count}
                    for stat in action_stats
                ],
                'top_users': [
                    {'usuario_id': stat.usuario_id, 'usuario': stat.usuario, 'count': stat.count}
                    for stat in user_stats
                ]
            }
        except Exception as e:
            raise Exception(f"Error obteniendo estadísticas de auditoría: {str(e)}")
    
    @staticmethod
    def get_available_entities() -> List[str]:
        """Obtiene lista de entidades disponibles en los logs"""
        try:
            entities = db.session.query(Auditoria.entidad).distinct().all()
            return [entity[0] for entity in entities if entity[0]]
        except Exception as e:
            raise Exception(f"Error obteniendo entidades: {str(e)}")
    
    @staticmethod
    def get_available_actions() -> List[str]:
        """Obtiene lista de acciones disponibles en los logs"""
        try:
            actions = db.session.query(Auditoria.accion).distinct().all()
            return [action[0] for action in actions if action[0]]
        except Exception as e:
            raise Exception(f"Error obteniendo acciones: {str(e)}")
    
    @staticmethod
    def get_audit_summary_by_date_range(
        fecha_desde: datetime,
        fecha_hasta: datetime
    ) -> Dict[str, Any]:
        """
        Obtiene un resumen de auditoría por rango de fechas
        
        Args:
            fecha_desde: Fecha de inicio
            fecha_hasta: Fecha de fin
        
        Returns:
            Diccionario con resumen de eventos por día
        """
        try:
            # Eventos por día en el rango
            daily_stats = db.session.query(
                db.func.date(Auditoria.fecha).label('fecha'),
                db.func.count(Auditoria.id).label('count')
            ).filter(
                Auditoria.fecha >= fecha_desde,
                Auditoria.fecha <= fecha_hasta
            ).group_by(
                db.func.date(Auditoria.fecha)
            ).order_by(
                db.func.date(Auditoria.fecha)
            ).all()
            
            return {
                'daily_stats': [
                    {'fecha': stat.fecha.isoformat(), 'count': stat.count}
                    for stat in daily_stats
                ]
            }
        except Exception as e:
            raise Exception(f"Error obteniendo resumen por fechas: {str(e)}")

