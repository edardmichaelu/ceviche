from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from models.user import Usuario
from services.categoria_service import CategoriaService
from services.error_handler import ErrorHandler

categoria_bp = Blueprint('categoria_bp', __name__)

# --- Decorador para verificar rol de Admin ---
def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = Usuario.query.get(current_user_id)
        if user and user.rol == 'admin':
            return fn(*args, **kwargs)
        else:
            return jsonify({"error": "Acceso denegado. Se requiere rol de Administrador."}), 403
    return wrapper

# --- Decorador para verificar rol de Admin o Mesero ---
def admin_or_mesero_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = Usuario.query.get(current_user_id)
        if user and (user.rol in ['admin', 'mesero', 'mozo']):
            return fn(*args, **kwargs)
        else:
            return jsonify({"error": "Acceso denegado. Se requiere rol de Administrador."}), 403
    return wrapper

# --- Rutas Públicas (para desarrollo) ---

@categoria_bp.route('/public', methods=['GET'])
def get_categorias_public():
    """Obtener todas las categorías (ruta pública)"""
    try:
        categorias = CategoriaService.get_categorias()
        return jsonify({
            'categorias': categorias,
            'success': True,
            'total': len(categorias)
        }), 200
    except Exception as e:
        return jsonify({
            'error': f'Error interno: {str(e)}',
            'success': False
        }), 500

@categoria_bp.route('/public/<int:categoria_id>', methods=['GET'])
def get_categoria_public(categoria_id):
    """Obtener una categoría por ID (ruta pública)"""
    try:
        categoria = CategoriaService.get_categoria_by_id(categoria_id)
        if not categoria:
            return jsonify({
                'error': 'Categoría no encontrada',
                'success': False
            }), 404
        
        return jsonify({
            'categoria': categoria,
            'success': True
        }), 200
    except Exception as e:
        return jsonify({
            'error': f'Error interno: {str(e)}',
            'success': False
        }), 500

# --- Rutas Protegidas ---

@categoria_bp.route('/', methods=['GET'])
@admin_or_mesero_required
def get_categorias():
    """Obtener todas las categorías"""
    try:
        categorias = CategoriaService.get_categorias()
        return jsonify(ErrorHandler.create_success_response(
            data=categorias,
            message='Categorías obtenidas exitosamente'
        )), 200
    except Exception as e:
        # Asegurar respuesta JSON consistente en errores
        _, error_dict = ErrorHandler.handle_service_error(e, 'obtener categorías', 'categoría')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@categoria_bp.route('/<int:categoria_id>', methods=['GET'])
@admin_or_mesero_required
def get_categoria(categoria_id):
    """Obtener una categoría por ID"""
    try:
        categoria = CategoriaService.get_categoria_by_id(categoria_id)
        if not categoria:
            return jsonify(ErrorHandler.create_error_response(
                error='Categoría no encontrada',
                code='NOT_FOUND',
                details=f'No se encontró la categoría con ID {categoria_id}'
            )), 404
        
        return jsonify(ErrorHandler.create_success_response(
            data=categoria,
            message='Categoría obtenida exitosamente'
        )), 200
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'obtener categoría', 'categoría')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@categoria_bp.route('/', methods=['POST'])
@admin_required
def create_categoria():
    """Crear una nueva categoría"""
    try:
        data = request.get_json()
        if not data:
            return jsonify(ErrorHandler.create_error_response(
                error='Datos requeridos',
                code='VALIDATION_ERROR',
                details='Se requieren datos JSON para crear la categoría'
            )), 400
        
        success, result = CategoriaService.create_categoria(data)
        
        if success:
            return jsonify(ErrorHandler.create_success_response(
                data=result,
                message='Categoría creada exitosamente'
            )), 201
        else:
            return jsonify(ErrorHandler.create_error_response(
                error=result.get('error', 'Error creando categoría'),
                code='CREATION_ERROR',
                details=result.get('error')
            )), 400
            
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'crear categoría', 'categoría')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@categoria_bp.route('/<int:categoria_id>', methods=['PUT'])
@admin_required
def update_categoria(categoria_id):
    """Actualizar una categoría existente"""
    try:
        data = request.get_json()
        if not data:
            return jsonify(ErrorHandler.create_error_response(
                error='Datos requeridos',
                code='VALIDATION_ERROR',
                details='Se requieren datos JSON para actualizar la categoría'
            )), 400
        
        success, result = CategoriaService.update_categoria(categoria_id, data)
        
        if success:
            return jsonify(ErrorHandler.create_success_response(
                data=result,
                message='Categoría actualizada exitosamente'
            )), 200
        else:
            return jsonify(ErrorHandler.create_error_response(
                error=result.get('error', 'Error actualizando categoría'),
                code='UPDATE_ERROR',
                details=result.get('error')
            )), 400
            
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'actualizar categoría', 'categoría')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@categoria_bp.route('/<int:categoria_id>', methods=['DELETE'])
@admin_required
def delete_categoria(categoria_id):
    """Eliminar una categoría"""
    try:
        success, result = CategoriaService.delete_categoria(categoria_id)
        
        if success:
            return jsonify(ErrorHandler.create_success_response(
                data=result,
                message='Categoría eliminada exitosamente'
            )), 200
        else:
            error_text = result.get('error', 'Error eliminando categoría')
            # Mapear a conflicto si la categoría tiene productos asociados
            is_integrity = ('producto' in error_text.lower()) or ('asociad' in error_text.lower())
            status = 409 if is_integrity else 400
            code = 'INTEGRITY_ERROR' if is_integrity else 'DELETE_ERROR'
            error_resp, _ = ErrorHandler.create_error_response({
                'error': error_text,
                'code': code,
                'details': error_text,
            }, status)
            return jsonify(error_resp), status
            
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'eliminar categoría', 'categoría')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@categoria_bp.route('/<int:categoria_id>/productos', methods=['GET'])
@admin_required
def get_categoria_with_products(categoria_id):
    """Obtener una categoría con sus productos"""
    try:
        categoria = CategoriaService.get_categoria_with_products(categoria_id)
        if not categoria:
            return jsonify(ErrorHandler.create_error_response(
                error='Categoría no encontrada',
                code='NOT_FOUND',
                details=f'No se encontró la categoría con ID {categoria_id}'
            )), 404
        
        return jsonify(ErrorHandler.create_success_response(
            data=categoria,
            message='Categoría con productos obtenida exitosamente'
        )), 200
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'obtener categoría con productos', 'categoría')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code
