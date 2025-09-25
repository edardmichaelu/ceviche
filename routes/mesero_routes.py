from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from models.user import Usuario
from services.mesero_service import MeseroService
from services.error_handler import ErrorHandler

mesero_bp = Blueprint('mesero_bp', __name__)

# --- Decorador para verificar rol de Mesero o Admin ---
def mesero_or_admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = Usuario.query.get(current_user_id)
        if user and (user.rol in ['mozo', 'admin']):
            return fn(*args, **kwargs)
        else:
            return jsonify({"error": "Acceso denegado. Se requiere rol de Mesero o Administrador."}), 403
    return wrapper

# --- Endpoints para la Interfaz de Mesero ---

@mesero_bp.route('/layout', methods=['GET'])
@mesero_or_admin_required
def get_restaurant_layout():
    """Obtiene la estructura completa del restaurante (pisos, zonas, mesas)."""
    try:
        layout = MeseroService.get_layout()
        return jsonify(ErrorHandler.create_success_response(
            data=layout,
            message='Layout del restaurante obtenido exitosamente'
        )), 200
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener layout de', 'restaurante')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@mesero_bp.route('/layout/realtime', methods=['GET'])
@mesero_or_admin_required
def get_restaurant_layout_realtime():
    """Obtiene la estructura del restaurante con datos en tiempo real."""
    try:
        layout = MeseroService.get_layout_with_realtime_data()
        return jsonify(ErrorHandler.create_success_response(
            data=layout,
            message='Layout en tiempo real obtenido exitosamente'
        )), 200
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener layout en tiempo real de', 'restaurante')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

# --- Rutas Públicas para Desarrollo (SIN autenticación) ---

@mesero_bp.route('/public/layout', methods=['GET'])
def get_restaurant_layout_public():
    """Obtiene la estructura completa del restaurante (ruta pública para desarrollo)."""
    try:
        # Crear layout público sin datos sensibles
        layout = MeseroService.get_layout_public()
        return jsonify({
            'data': layout,
            'success': True,
            'message': 'Layout del restaurante obtenido exitosamente'
        }), 200
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener layout de', 'restaurante')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@mesero_bp.route('/public/layout/realtime', methods=['GET'])
def get_restaurant_layout_realtime_public():
    """Obtiene la estructura del restaurante con datos en tiempo real (ruta pública para desarrollo)."""
    try:
        # Crear layout público con datos en tiempo real
        layout = MeseroService.get_layout_realtime_public()
        return jsonify({
            'data': layout,
            'success': True,
            'message': 'Layout en tiempo real obtenido exitosamente'
        }), 200
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener layout de', 'restaurante')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@mesero_bp.route('/mesas/<int:mesa_id>/estado', methods=['PUT'])
@mesero_or_admin_required
def update_mesa_status(mesa_id):
    """Actualiza el estado de una mesa."""
    try:
        data = request.get_json()
        nuevo_estado = data.get('estado')
        
        if not nuevo_estado:
            return jsonify(ErrorHandler.create_error_response(
                error='Estado requerido',
                code='VALIDATION_ERROR',
                details='El campo estado es obligatorio'
            )), 400

        success, error = MeseroService.update_mesa_status(mesa_id, nuevo_estado)
        
        if error:
            return jsonify(ErrorHandler.create_error_response(
                error=error.get('error', 'Error actualizando mesa'),
                code='UPDATE_ERROR',
                details=error.get('error')
            )), 400

        return jsonify(ErrorHandler.create_success_response(
            message=f'Mesa {mesa_id} actualizada a {nuevo_estado} exitosamente'
        )), 200
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'actualizar estado de', 'mesa')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@mesero_bp.route('/mesas/<int:mesa_id>/details', methods=['GET'])
@mesero_or_admin_required
def get_mesa_details(mesa_id):
    """Obtiene detalles completos de una mesa."""
    try:
        from models.local import Mesa

        # Verificar que la mesa existe
        mesa = Mesa.query.get(mesa_id)
        if not mesa:
            error_data = {
                "error": "Mesa no encontrada",
                "code": "NOT_FOUND",
                "details": f"No se encontró la mesa con ID {mesa_id}"
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 404)
            return jsonify(error_resp), status_code

        # Obtener detalles usando el servicio
        details = MeseroService.get_mesa_details(mesa_id)

        if not details:
            error_data = {
                "error": "Error al obtener detalles de mesa",
                "code": "SERVICE_ERROR",
                "details": f"No se pudieron obtener los detalles de la mesa {mesa_id}"
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 500)
            return jsonify(error_resp), status_code

        return jsonify(ErrorHandler.create_success_response(
            data=details,
            message='Detalles de mesa obtenidos exitosamente'
        )), 200
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener detalles de', 'mesa')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@mesero_bp.route('/estadisticas/estados', methods=['GET'])
@mesero_or_admin_required
def get_estados_resumen():
    """Obtiene resumen de estados de todas las mesas."""
    try:
        resumen = MeseroService.get_mesas_estado_resumen()
        return jsonify(ErrorHandler.create_success_response(
            data=resumen,
            message='Resumen de estados obtenido exitosamente'
        )), 200
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener resumen de estados de', 'mesas')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@mesero_bp.route('/public/estadisticas/estados', methods=['GET'])
def get_estados_resumen_public():
    """Obtiene resumen de estados de todas las mesas (ruta pública para desarrollo)."""
    try:
        resumen = MeseroService.get_mesas_estado_resumen()
        return jsonify({
            'data': resumen,
            'success': True,
            'message': 'Resumen de estados obtenido exitosamente'
        }), 200
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener resumen de estados de', 'mesas')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@mesero_bp.route('/estadisticas/estados', methods=['GET'])
@mesero_or_admin_required
def get_zonas_resumen():
    """Obtiene mesas agrupadas por zona con estadísticas."""
    try:
        resumen = MeseroService.get_mesas_por_zona()
        return jsonify(ErrorHandler.create_success_response(
            data=resumen,
            message='Resumen por zonas obtenido exitosamente'
        )), 200
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener resumen por zonas de', 'mesas')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code
