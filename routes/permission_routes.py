from flask import Blueprint, request, jsonify
from functools import wraps
from services.permission_service import PermissionService
from datetime import datetime

permission_bp = Blueprint('permission', __name__)

def admin_required(fn):
    """Decorator para verificar que el usuario tenga rol de admin"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        from flask import current_app
        import jwt
        
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Token de autorización requerido"}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            secret = current_app.config['JWT_SECRET_KEY']
            decoded = jwt.decode(token, secret, algorithms=["HS256"])
            current_user_id = decoded.get('sub')
            
            if not current_user_id:
                return jsonify({"error": "Token inválido: sin identidad"}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado"}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({"error": f"Token inválido: {str(e)}"}), 401
        except Exception as e:
            return jsonify({"error": f"Error de autenticación: {str(e)}"}), 401

        try:
            from models.user import Usuario
            user = Usuario.query.get(int(current_user_id))
            if user and user.rol == 'admin':
                return fn(*args, **kwargs)
            else:
                return jsonify({"error": "Acceso denegado. Se requiere rol de administrador."}), 403
        except (ValueError, TypeError) as e:
            return jsonify({"error": f"Error de autenticación: ID de usuario inválido"}), 401
    return wrapper

@permission_bp.route('/available', methods=['GET'])
@admin_required
def get_available_permissions():
    """Obtiene la lista de permisos disponibles en el sistema"""
    try:
        permissions = PermissionService.get_available_permissions()
        return jsonify({
            'success': True,
            'data': permissions
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener permisos disponibles: {str(e)}'
        }), 500

@permission_bp.route('/user/<int:user_id>', methods=['GET'])
@admin_required
def get_user_permissions(user_id):
    """Obtiene todos los permisos de un usuario específico"""
    try:
        permissions = PermissionService.get_user_permissions(user_id)
        return jsonify({
            'success': True,
            'data': permissions
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener permisos del usuario: {str(e)}'
        }), 500

@permission_bp.route('/grant', methods=['POST'])
@admin_required
def grant_permissions():
    """Concede permisos temporales a un usuario"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['user_id', 'permission_ids', 'granted_by']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Campo requerido faltante: {field}'
                }), 400
        
        user_id = data['user_id']
        permission_ids = data['permission_ids']
        granted_by = data['granted_by']
        expiration_date = None
        area = data.get('area')
        
        # Procesar fecha de expiración
        if data.get('expiration_date'):
            try:
                expiration_date = datetime.fromisoformat(data['expiration_date'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Formato de fecha de expiración inválido'
                }), 400
        
        # Validar que permission_ids sea una lista
        if not isinstance(permission_ids, list):
            return jsonify({
                'success': False,
                'error': 'permission_ids debe ser una lista'
            }), 400
        
        # Conceder permisos
        result = PermissionService.grant_permissions(
            user_id=user_id,
            permission_ids=permission_ids,
            granted_by=granted_by,
            expiration_date=expiration_date,
            area=area
        )
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al conceder permisos: {str(e)}'
        }), 500

@permission_bp.route('/revoke', methods=['POST'])
@admin_required
def revoke_permissions():
    """Revoca permisos temporales de un usuario"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['user_id', 'permission_ids', 'revoked_by']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Campo requerido faltante: {field}'
                }), 400
        
        user_id = data['user_id']
        permission_ids = data['permission_ids']
        revoked_by = data['revoked_by']
        
        # Validar que permission_ids sea una lista
        if not isinstance(permission_ids, list):
            return jsonify({
                'success': False,
                'error': 'permission_ids debe ser una lista'
            }), 400
        
        # Revocar permisos
        result = PermissionService.revoke_permissions(
            user_id=user_id,
            permission_ids=permission_ids,
            revoked_by=revoked_by
        )
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al revocar permisos: {str(e)}'
        }), 500

@permission_bp.route('/check/<int:user_id>/<permission>', methods=['GET'])
@admin_required
def check_user_permission(user_id, permission):
    """Verifica si un usuario tiene un permiso específico"""
    try:
        has_permission = PermissionService.check_user_permission(user_id, permission)
        return jsonify({
            'success': True,
            'has_permission': has_permission
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al verificar permiso: {str(e)}'
        }), 500

@permission_bp.route('/cleanup', methods=['POST'])
@admin_required
def cleanup_expired_permissions():
    """Limpia permisos expirados automáticamente"""
    try:
        cleaned_count = PermissionService.cleanup_expired_permissions()
        return jsonify({
            'success': True,
            'message': f'Se limpiaron {cleaned_count} permisos expirados',
            'cleaned_count': cleaned_count
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al limpiar permisos expirados: {str(e)}'
        }), 500

@permission_bp.route('/summary', methods=['GET'])
@admin_required
def get_permissions_summary():
    """Obtiene un resumen de todos los permisos en el sistema"""
    try:
        summary = PermissionService.get_permissions_summary()
        return jsonify({
            'success': True,
            'data': summary
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener resumen de permisos: {str(e)}'
        }), 500
