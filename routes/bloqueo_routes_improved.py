"""
Rutas mejoradas de bloqueos con manejo robusto de errores
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.bloqueo_service import BloqueoService
from services.error_handler import ErrorHandler

bloqueo_bp = Blueprint('bloqueo', __name__)

@bloqueo_bp.route('/', methods=['GET'])
@jwt_required()
def get_bloqueos():
    """Obtener todos los bloqueos"""
    try:
        bloqueos = BloqueoService.get_bloqueos()
        return jsonify(ErrorHandler.create_success_response(
            data=bloqueos,
            message="Bloqueos obtenidos exitosamente"
        ))
    except Exception as e:
        error_response, status_code = ErrorHandler.create_error_response(
            ErrorHandler.handle_service_error(e, "obtener bloqueos", "bloqueo")[1]
        )
        return jsonify(error_response), status_code

@bloqueo_bp.route('/', methods=['POST'])
@jwt_required()
def create_bloqueo():
    """Crear un nuevo bloqueo"""
    try:
        data = request.get_json()
        if not data:
            error_response, status_code = ErrorHandler.create_error_response(
                ErrorHandler.handle_validation_error('data', 'No se proporcionaron datos')[
1]
            )
            return jsonify(error_response), status_code
        
        # Agregar usuario actual
        data['usuario_id'] = get_jwt_identity()
        
        bloqueo, error = BloqueoService.create_bloqueo(data)
        if error:
            error_response, status_code = ErrorHandler.create_error_response(error)
            return jsonify(error_response), status_code
        
        return jsonify(ErrorHandler.create_success_response(
            data=bloqueo.to_dict(),
            message="Bloqueo creado exitosamente"
        )), 201
        
    except Exception as e:
        error_response, status_code = ErrorHandler.create_error_response(
            ErrorHandler.handle_service_error(e, "crear bloqueo", "bloqueo")[1]
        )
        return jsonify(error_response), status_code

@bloqueo_bp.route('/<int:bloqueo_id>', methods=['PUT'])
@jwt_required()
def update_bloqueo(bloqueo_id):
    """Actualizar un bloqueo"""
    try:
        data = request.get_json()
        if not data:
            error_response, status_code = ErrorHandler.create_error_response(
                ErrorHandler.handle_validation_error('data', 'No se proporcionaron datos')[1]
            )
            return jsonify(error_response), status_code
        
        # Agregar usuario actual
        data['usuario_id'] = get_jwt_identity()
        
        bloqueo, error = BloqueoService.update_bloqueo(bloqueo_id, data)
        if error:
            error_response, status_code = ErrorHandler.create_error_response(error)
            return jsonify(error_response), status_code
        
        return jsonify(ErrorHandler.create_success_response(
            data=bloqueo.to_dict(),
            message="Bloqueo actualizado exitosamente"
        ))
        
    except Exception as e:
        error_response, status_code = ErrorHandler.create_error_response(
            ErrorHandler.handle_service_error(e, "actualizar bloqueo", "bloqueo")[1]
        )
        return jsonify(error_response), status_code

@bloqueo_bp.route('/<int:bloqueo_id>', methods=['DELETE'])
@jwt_required()
def delete_bloqueo(bloqueo_id):
    """Eliminar un bloqueo"""
    try:
        current_user_id = get_jwt_identity()
        success, error = BloqueoService.delete_bloqueo(bloqueo_id, current_user_id)
        if error:
            error_response, status_code = ErrorHandler.create_error_response(error)
            return jsonify(error_response), status_code
        
        return jsonify(ErrorHandler.create_success_response(
            message="Bloqueo eliminado exitosamente"
        ))
        
    except Exception as e:
        error_response, status_code = ErrorHandler.create_error_response(
            ErrorHandler.handle_service_error(e, "eliminar bloqueo", "bloqueo")[1]
        )
        return jsonify(error_response), status_code

@bloqueo_bp.route('/<int:bloqueo_id>/activar', methods=['POST'])
@jwt_required()
def activar_bloqueo(bloqueo_id):
    """Activar un bloqueo"""
    try:
        current_user_id = get_jwt_identity()
        success, error = BloqueoService.activar_bloqueo(bloqueo_id, current_user_id)
        if error:
            error_response, status_code = ErrorHandler.create_error_response(error)
            return jsonify(error_response), status_code
        
        return jsonify(ErrorHandler.create_success_response(
            message="Bloqueo activado exitosamente"
        ))
        
    except Exception as e:
        error_response, status_code = ErrorHandler.create_error_response(
            ErrorHandler.handle_service_error(e, "activar bloqueo", "bloqueo")[1]
        )
        return jsonify(error_response), status_code

@bloqueo_bp.route('/<int:bloqueo_id>/completar', methods=['POST'])
@jwt_required()
def completar_bloqueo(bloqueo_id):
    """Completar un bloqueo"""
    try:
        current_user_id = get_jwt_identity()
        success, error = BloqueoService.completar_bloqueo(bloqueo_id, current_user_id)
        if error:
            error_response, status_code = ErrorHandler.create_error_response(error)
            return jsonify(error_response), status_code
        
        return jsonify(ErrorHandler.create_success_response(
            message="Bloqueo completado exitosamente"
        ))
        
    except Exception as e:
        error_response, status_code = ErrorHandler.create_error_response(
            ErrorHandler.handle_service_error(e, "completar bloqueo", "bloqueo")[1]
        )
        return jsonify(error_response), status_code
