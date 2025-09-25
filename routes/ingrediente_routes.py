from flask import Blueprint, request, jsonify
from services.ingrediente_service import IngredienteService
from services.error_handler import ErrorHandler
from routes.admin_routes import admin_required
from routes.mesero_routes import mesero_or_admin_required

ingrediente_bp = Blueprint('ingrediente_bp', __name__)

@ingrediente_bp.route('/', methods=['GET'])
@mesero_or_admin_required
def get_ingredientes():
    """Obtener todos los ingredientes"""
    try:
        ingredientes = IngredienteService.get_ingredientes()
        return jsonify(ErrorHandler.create_success_response(
            data=ingredientes,
            message='Ingredientes obtenidos exitosamente'
        )), 200
    except Exception as e:
        # Asegurar respuesta JSON consistente en errores
        _, error_dict = ErrorHandler.handle_service_error(e, 'obtener ingredientes', 'ingrediente')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@ingrediente_bp.route('/<int:ingrediente_id>', methods=['GET'])
@mesero_or_admin_required
def get_ingrediente(ingrediente_id):
    """Obtener un ingrediente específico por ID"""
    try:
        ingrediente = IngredienteService.get_ingrediente_by_id(ingrediente_id)
        if not ingrediente:
            return jsonify(ErrorHandler.create_error_response(
                error='Ingrediente no encontrado',
                code='NOT_FOUND',
                details=f'No se encontró el ingrediente con ID {ingrediente_id}'
            )), 404

        return jsonify(ErrorHandler.create_success_response(
            data=ingrediente,
            message='Ingrediente obtenido exitosamente'
        )), 200
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'obtener ingrediente', 'ingrediente')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@ingrediente_bp.route('/', methods=['POST'])
@admin_required
def create_ingrediente():
    """Crear un nuevo ingrediente"""
    try:
        data = request.get_json()
        if not data:
            error_data = {
                "error": 'Datos requeridos',
                "code": 'VALIDATION_ERROR',
                "details": 'Debe proporcionar los datos del ingrediente'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
            return jsonify(error_resp), status_code

        success, result = IngredienteService.create_ingrediente(data)

        if success:
            return jsonify(ErrorHandler.create_success_response(
                data=result,
                message='Ingrediente creado exitosamente'
            )), 201
        else:
            error_data = {
                "error": result.get('error', 'Error desconocido'),
                "code": 'VALIDATION_ERROR'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
            return jsonify(error_resp), status_code
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'crear ingrediente', 'ingrediente')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@ingrediente_bp.route('/<int:ingrediente_id>', methods=['PUT'])
@admin_required
def update_ingrediente(ingrediente_id):
    """Actualizar un ingrediente existente"""
    try:
        data = request.get_json()
        if not data:
            error_data = {
                "error": 'Datos requeridos',
                "code": 'VALIDATION_ERROR',
                "details": 'Debe proporcionar los datos del ingrediente'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
            return jsonify(error_resp), status_code

        success, result = IngredienteService.update_ingrediente(ingrediente_id, data)

        if success:
            return jsonify(ErrorHandler.create_success_response(
                data=result,
                message='Ingrediente actualizado exitosamente'
            )), 200
        else:
            error_data = {
                "error": result.get('error', 'Error desconocido'),
                "code": 'VALIDATION_ERROR'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
            return jsonify(error_resp), status_code
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'actualizar ingrediente', 'ingrediente')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@ingrediente_bp.route('/<int:ingrediente_id>', methods=['DELETE'])
@admin_required
def delete_ingrediente(ingrediente_id):
    """Eliminar un ingrediente"""
    try:
        success, result = IngredienteService.delete_ingrediente(ingrediente_id)

        if success:
            return jsonify(ErrorHandler.create_success_response(
                message=result.get('message', 'Ingrediente eliminado exitosamente')
            )), 200
        else:
            error_data = {
                "error": result.get('error', 'Error desconocido'),
                "code": 'VALIDATION_ERROR'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
            return jsonify(error_resp), status_code
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'eliminar ingrediente', 'ingrediente')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@ingrediente_bp.route('/<int:ingrediente_id>/with-productos', methods=['GET'])
@admin_required
def get_ingrediente_with_productos(ingrediente_id):
    """Obtener un ingrediente con sus productos asociados"""
    try:
        ingrediente = IngredienteService.get_ingrediente_with_productos(ingrediente_id)
        if not ingrediente:
            return jsonify(ErrorHandler.create_error_response(
                error='Ingrediente no encontrado',
                code='NOT_FOUND',
                details=f'No se encontró el ingrediente con ID {ingrediente_id}'
            )), 404

        return jsonify(ErrorHandler.create_success_response(
            data=ingrediente,
            message='Ingrediente con productos obtenido exitosamente'
        )), 200
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'obtener ingrediente con productos', 'ingrediente')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@ingrediente_bp.route('/bajos-stock', methods=['GET'])
@admin_required
def get_ingredientes_bajos_stock():
    """Obtener ingredientes con stock bajo"""
    try:
        ingredientes = IngredienteService.get_ingredientes_bajos_stock()
        return jsonify(ErrorHandler.create_success_response(
            data=ingredientes,
            message=f'Se encontraron {len(ingredientes)} ingrediente(s) con stock bajo'
        )), 200
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'obtener ingredientes con stock bajo', 'ingrediente')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code