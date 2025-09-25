from models import db
from models.core import PermisoTemporal, Auditoria
from models.user import Usuario
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
from typing import List, Dict, Optional

class PermissionService:
    """Servicio para gestión de permisos temporales"""
    
    @staticmethod
    def get_available_permissions() -> List[Dict]:
        """
        Obtiene la lista de permisos disponibles en el sistema
        """
        return [
            {
                'id': 'gestionar_usuarios',
                'nombre': 'Gestionar Usuarios',
                'descripcion': 'Crear, editar y eliminar usuarios del sistema',
                'modulo': 'admin',
                'categoria': 'Administración'
            },
            {
                'id': 'ver_reportes',
                'nombre': 'Ver Reportes',
                'descripcion': 'Acceso a reportes y estadísticas del sistema',
                'modulo': 'admin',
                'categoria': 'Administración'
            },
            {
                'id': 'gestionar_menu',
                'nombre': 'Gestionar Menú',
                'descripcion': 'Modificar productos, categorías y precios',
                'modulo': 'menu',
                'categoria': 'Menú'
            },
            {
                'id': 'configurar_local',
                'nombre': 'Configurar Local',
                'descripcion': 'Modificar mesas, zonas y configuración del local',
                'modulo': 'local',
                'categoria': 'Local'
            },
            {
                'id': 'gestionar_ordenes',
                'nombre': 'Gestionar Órdenes',
                'descripcion': 'Ver y modificar órdenes del sistema',
                'modulo': 'ordenes',
                'categoria': 'Órdenes'
            },
            {
                'id': 'acceso_caja',
                'nombre': 'Acceso a Caja',
                'descripcion': 'Acceso temporal al sistema de caja',
                'modulo': 'caja',
                'categoria': 'Caja'
            },
            {
                'id': 'acceso_cocina',
                'nombre': 'Acceso a Cocina',
                'descripcion': 'Acceso temporal al sistema de cocina',
                'modulo': 'cocina',
                'categoria': 'Cocina'
            }
        ]
    
    @staticmethod
    def get_user_permissions(user_id: int) -> List[Dict]:
        """
        Obtiene todos los permisos de un usuario (activos y expirados)
        """
        try:
            permissions = db.session.query(PermisoTemporal).filter(
                PermisoTemporal.usuario_id == user_id
            ).order_by(PermisoTemporal.creado_en.desc()).all()
            
            available_permissions = PermissionService.get_available_permissions()
            permission_map = {p['id']: p for p in available_permissions}
            
            result = []
            for perm in permissions:
                perm_info = permission_map.get(perm.permiso, {
                    'nombre': perm.permiso,
                    'descripcion': 'Permiso personalizado',
                    'modulo': perm.area or 'general',
                    'categoria': 'Personalizado'
                })
                
                result.append({
                    'id': perm.permiso,  # Usar el permiso como ID principal
                    'permiso_id': perm.permiso,
                    'nombre': perm_info['nombre'],
                    'descripcion': perm_info['descripcion'],
                    'modulo': perm_info['modulo'],
                    'categoria': perm_info['categoria'],
                    'area': perm.area,
                    'activo': perm.activo,
                    'creado_en': perm.creado_en.isoformat() if perm.creado_en else None,
                    'expira_en': perm.expira_en.isoformat() if perm.expira_en else None,
                    'concedido_por': perm.concedido_por,
                    'concedido_por_nombre': perm.concedido_por_usuario.usuario if perm.concedido_por_usuario else 'Desconocido',
                    'permiso_temporal_id': perm.id  # ID del registro en la BD
                })
            
            return result
            
        except Exception as e:
            print(f"Error getting user permissions: {e}")
            return []
    
    @staticmethod
    def grant_permissions(user_id: int, permission_ids: List[str], granted_by: int, 
                         expiration_date: Optional[datetime] = None, area: Optional[str] = None) -> Dict:
        """
        Concede permisos temporales a un usuario
        """
        try:
            # Verificar que el usuario existe
            user = Usuario.query.get(user_id)
            if not user:
                return {'success': False, 'message': 'Usuario no encontrado'}
            
            # Verificar que el usuario que concede existe
            granter = Usuario.query.get(granted_by)
            if not granter:
                return {'success': False, 'message': 'Usuario que concede permisos no encontrado'}
            
            granted_permissions = []
            
            for perm_id in permission_ids:
                # Verificar si ya existe un permiso activo
                existing = PermisoTemporal.query.filter(
                    and_(
                        PermisoTemporal.usuario_id == user_id,
                        PermisoTemporal.permiso == perm_id,
                        PermisoTemporal.activo == True
                    )
                ).first()
                
                if existing:
                    # Actualizar permiso existente
                    existing.expira_en = expiration_date
                    existing.area = area
                    granted_permissions.append(existing)
                else:
                    # Crear nuevo permiso
                    new_permission = PermisoTemporal(
                        usuario_id=user_id,
                        concedido_por=granted_by,
                        permiso=perm_id,
                        area=area,
                        activo=True,
                        expira_en=expiration_date
                    )
                    db.session.add(new_permission)
                    granted_permissions.append(new_permission)
            
            # Registrar en auditoría
            audit = Auditoria(
                usuario_id=granted_by,
                entidad='permiso_temporal',
                accion='conceder',
                id_entidad=user_id,
                valores_nuevos={
                    'permisos': permission_ids,
                    'expira_en': expiration_date.isoformat() if expiration_date else None,
                    'area': area
                }
            )
            db.session.add(audit)
            
            db.session.commit()
            
            return {
                'success': True,
                'message': f'Se concedieron {len(permission_ids)} permisos exitosamente',
                'permissions_granted': len(granted_permissions)
            }
            
        except Exception as e:
            db.session.rollback()
            print(f"Error granting permissions: {e}")
            return {'success': False, 'message': f'Error al conceder permisos: {str(e)}'}
    
    @staticmethod
    def revoke_permissions(user_id: int, permission_ids: List[int], revoked_by: int) -> Dict:
        """
        Revoca permisos temporales de un usuario
        """
        try:
            # Verificar que el usuario que revoca existe
            revoker = Usuario.query.get(revoked_by)
            if not revoker:
                return {'success': False, 'message': 'Usuario que revoca permisos no encontrado'}
            
            revoked_count = 0
            
            for perm_id in permission_ids:
                permission = PermisoTemporal.query.filter(
                    and_(
                        PermisoTemporal.id == perm_id,
                        PermisoTemporal.usuario_id == user_id,
                        PermisoTemporal.activo == True
                    )
                ).first()
                
                if permission:
                    permission.activo = False
                    revoked_count += 1
            
            # Registrar en auditoría
            if revoked_count > 0:
                audit = Auditoria(
                    usuario_id=revoked_by,
                    entidad='permiso_temporal',
                    accion='revocar',
                    id_entidad=user_id,
                    valores_anteriores={'permisos_revocados': permission_ids}
                )
                db.session.add(audit)
            
            db.session.commit()
            
            return {
                'success': True,
                'message': f'Se revocaron {revoked_count} permisos exitosamente',
                'permissions_revoked': revoked_count
            }
            
        except Exception as e:
            db.session.rollback()
            print(f"Error revoking permissions: {e}")
            return {'success': False, 'message': f'Error al revocar permisos: {str(e)}'}
    
    @staticmethod
    def check_user_permission(user_id: int, permission: str) -> bool:
        """
        Verifica si un usuario tiene un permiso específico activo
        """
        try:
            now = datetime.utcnow()
            permission_obj = PermisoTemporal.query.filter(
                and_(
                    PermisoTemporal.usuario_id == user_id,
                    PermisoTemporal.permiso == permission,
                    PermisoTemporal.activo == True,
                    or_(
                        PermisoTemporal.expira_en.is_(None),
                        PermisoTemporal.expira_en > now
                    )
                )
            ).first()
            
            return permission_obj is not None
            
        except Exception as e:
            print(f"Error checking permission: {e}")
            return False
    
    @staticmethod
    def cleanup_expired_permissions() -> int:
        """
        Limpia permisos expirados automáticamente
        """
        try:
            now = datetime.utcnow()
            expired_permissions = PermisoTemporal.query.filter(
                and_(
                    PermisoTemporal.activo == True,
                    PermisoTemporal.expira_en.isnot(None),
                    PermisoTemporal.expira_en <= now
                )
            ).all()
            
            count = 0
            for perm in expired_permissions:
                perm.activo = False
                count += 1
            
            if count > 0:
                # Registrar en auditoría
                audit = Auditoria(
                    entidad='permiso_temporal',
                    accion='expiracion_automatica',
                    valores_anteriores={'permisos_expirados': count}
                )
                db.session.add(audit)
            
            db.session.commit()
            return count
            
        except Exception as e:
            db.session.rollback()
            print(f"Error cleaning up expired permissions: {e}")
            return 0
    
    @staticmethod
    def get_permissions_summary() -> Dict:
        """
        Obtiene un resumen de todos los permisos en el sistema
        """
        try:
            total_permissions = PermisoTemporal.query.count()
            active_permissions = PermisoTemporal.query.filter(PermisoTemporal.activo == True).count()
            expired_permissions = total_permissions - active_permissions
            
            # Permisos por módulo
            module_stats = db.session.query(
                PermisoTemporal.area,
                db.func.count(PermisoTemporal.id).label('count')
            ).filter(PermisoTemporal.activo == True).group_by(PermisoTemporal.area).all()
            
            return {
                'total_permissions': total_permissions,
                'active_permissions': active_permissions,
                'expired_permissions': expired_permissions,
                'module_stats': {stat.area or 'general': stat.count for stat in module_stats}
            }
            
        except Exception as e:
            print(f"Error getting permissions summary: {e}")
            return {
                'total_permissions': 0,
                'active_permissions': 0,
                'expired_permissions': 0,
                'module_stats': {}
            }

