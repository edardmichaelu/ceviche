from flask import Blueprint, request, jsonify
from services.tipo_ingrediente_service import TipoIngredienteService
from services.error_handler import ErrorHandler
from routes.admin_routes import admin_required
from routes.mesero_routes import mesero_or_admin_required

tipo_ingrediente_bp = Blueprint('tipo_ingrediente_bp', __name__)

@tipo_ingrediente_bp.route('/', methods=['GET'])
@mesero_or_admin_required
def get_tipos_ingrediente():
    """Obtener todos los tipos de ingrediente"""
    try:
        tipos = TipoIngredienteService.get_tipos_ingrediente()
        return jsonify(ErrorHandler.create_success_response(
            data=tipos,
            message='Tipos de ingrediente obtenidos exitosamente'
        )), 200
    except Exception as e:
        # Asegurar respuesta JSON consistente en errores
        _, error_dict = ErrorHandler.handle_service_error(e, 'obtener tipos de ingrediente', 'tipo de ingrediente')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@tipo_ingrediente_bp.route('/<int:tipo_id>', methods=['GET'])
@mesero_or_admin_required
def get_tipo_ingrediente(tipo_id):
    """Obtener un tipo de ingrediente específico por ID"""
    try:
        tipo = TipoIngredienteService.get_tipo_ingrediente_by_id(tipo_id)
        if not tipo:
            error_data = {
                "error": 'Tipo de ingrediente no encontrado',
                "code": 'NOT_FOUND',
                "details": f'No se encontró el tipo de ingrediente con ID {tipo_id}'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 404)
            return jsonify(error_resp), status_code

        return jsonify(ErrorHandler.create_success_response(
            data=tipo,
            message='Tipo de ingrediente obtenido exitosamente'
        )), 200
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'obtener tipo de ingrediente', 'tipo de ingrediente')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@tipo_ingrediente_bp.route('/', methods=['POST'])
@admin_required
def create_tipo_ingrediente():
    """Crear un nuevo tipo de ingrediente"""
    try:
        data = request.get_json()
        if not data:
            error_data = {
                "error": 'Datos requeridos',
                "code": 'VALIDATION_ERROR',
                "details": 'Debe proporcionar los datos del tipo de ingrediente'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
            return jsonify(error_resp), status_code

        success, result = TipoIngredienteService.create_tipo_ingrediente(data)

        if success:
            return jsonify(ErrorHandler.create_success_response(
                data=result,
                message='Tipo de ingrediente creado exitosamente'
            )), 201
        else:
            error_data = {
                "error": result.get('error', 'Error desconocido'),
                "code": 'VALIDATION_ERROR'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
            return jsonify(error_resp), status_code
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'crear tipo de ingrediente', 'tipo de ingrediente')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@tipo_ingrediente_bp.route('/<int:tipo_id>', methods=['PUT'])
@admin_required
def update_tipo_ingrediente(tipo_id):
    """Actualizar un tipo de ingrediente existente"""
    try:
        data = request.get_json()
        if not data:
            error_data = {
                "error": 'Datos requeridos',
                "code": 'VALIDATION_ERROR',
                "details": 'Debe proporcionar los datos del tipo de ingrediente'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
            return jsonify(error_resp), status_code

        success, result = TipoIngredienteService.update_tipo_ingrediente(tipo_id, data)

        if success:
            return jsonify(ErrorHandler.create_success_response(
                data=result,
                message='Tipo de ingrediente actualizado exitosamente'
            )), 200
        else:
            error_data = {
                "error": result.get('error', 'Error desconocido'),
                "code": 'VALIDATION_ERROR'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
            return jsonify(error_resp), status_code
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'actualizar tipo de ingrediente', 'tipo de ingrediente')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@tipo_ingrediente_bp.route('/<int:tipo_id>', methods=['DELETE'])
@admin_required
def delete_tipo_ingrediente(tipo_id):
    """Eliminar un tipo de ingrediente"""
    try:
        success, result = TipoIngredienteService.delete_tipo_ingrediente(tipo_id)

        if success:
            return jsonify(ErrorHandler.create_success_response(
                message=result.get('message', 'Tipo de ingrediente eliminado exitosamente')
            )), 200
        else:
            error_data = {
                "error": result.get('error', 'Error desconocido'),
                "code": 'VALIDATION_ERROR'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
            return jsonify(error_resp), status_code
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'eliminar tipo de ingrediente', 'tipo de ingrediente')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@tipo_ingrediente_bp.route('/<int:tipo_id>/with-ingredientes', methods=['GET'])
@admin_required
def get_tipo_ingrediente_with_ingredientes(tipo_id):
    """Obtener un tipo de ingrediente con sus ingredientes asociados"""
    try:
        tipo = TipoIngredienteService.get_tipo_ingrediente_with_ingredientes(tipo_id)
        if tipo is None:
            error_data = {
                "error": 'Tipo de ingrediente no encontrado',
                "code": 'NOT_FOUND',
                "details": f'No se encontró el tipo de ingrediente con ID {tipo_id}'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 404)
            return jsonify(error_resp), status_code

        return jsonify(ErrorHandler.create_success_response(
            data=tipo,
            message='Tipo de ingrediente con ingredientes obtenido exitosamente'
        )), 200
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'obtener tipo de ingrediente con ingredientes', 'tipo de ingrediente')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code
