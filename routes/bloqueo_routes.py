from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from services.bloqueo_service import BloqueoService
from services.error_handler import ErrorHandler
from services.auth_service import AuthService

bloqueo_bp = Blueprint('bloqueo', __name__, url_prefix='/api/bloqueos')

@bloqueo_bp.route('/', methods=['POST'])
@jwt_required()
def create_bloqueo():
    """Crear un nuevo bloqueo"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # Obtener usuario actual
        current_user_id = get_jwt_identity()
        data['usuario_id'] = current_user_id
        
        bloqueo, error = BloqueoService.create_bloqueo(data)
        if error:
            error_response, status_code = ErrorHandler.create_error_response(error)
            return jsonify(error_response), status_code
        
        return jsonify(ErrorHandler.create_success_response(
            data=bloqueo.to_dict(),
            message="Bloqueo creado exitosamente"
        )), 201
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@bloqueo_bp.route('/', methods=['GET'])
@jwt_required()
def get_bloqueos():
    """Obtener bloqueos con filtros"""
    try:
        # Parámetros de filtro
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        estado = request.args.get('estado')
        tipo = request.args.get('tipo')
        mesa_id = request.args.get('mesa_id', type=int)
        zona_id = request.args.get('zona_id', type=int)
        piso_id = request.args.get('piso_id', type=int)
        
        # Convertir fechas
        fecha_inicio_dt = None
        fecha_fin_dt = None
        
        if fecha_inicio:
            fecha_inicio_dt = datetime.fromisoformat(fecha_inicio.replace('Z', '+00:00'))
        if fecha_fin:
            fecha_fin_dt = datetime.fromisoformat(fecha_fin.replace('Z', '+00:00'))
        
        bloqueos = BloqueoService.get_bloqueos(
            fecha_inicio=fecha_inicio_dt,
            fecha_fin=fecha_fin_dt,
            estado=estado,
            tipo=tipo,
            mesa_id=mesa_id,
            zona_id=zona_id,
            piso_id=piso_id
        )
        
        return jsonify({
            'bloqueos': bloqueos
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@bloqueo_bp.route('/<int:bloqueo_id>', methods=['GET'])
@jwt_required()
def get_bloqueo(bloqueo_id):
    """Obtener un bloqueo por ID"""
    try:
        bloqueo = BloqueoService.get_bloqueo_by_id(bloqueo_id)
        if not bloqueo:
            return jsonify({'error': 'Bloqueo no encontrado'}), 404
        
        return jsonify({
            'bloqueo': bloqueo.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@bloqueo_bp.route('/<int:bloqueo_id>', methods=['PUT'])
@jwt_required()
def update_bloqueo(bloqueo_id):
    """Actualizar un bloqueo"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # Obtener usuario actual
        current_user_id = get_jwt_identity()
        data['usuario_id'] = current_user_id
        
        bloqueo, error = BloqueoService.update_bloqueo(bloqueo_id, data)
        if error:
            return jsonify(error), 400
        
        return jsonify({
            'message': 'Bloqueo actualizado exitosamente',
            'bloqueo': bloqueo.to_dict(),
            'success': True
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@bloqueo_bp.route('/<int:bloqueo_id>', methods=['DELETE'])
@jwt_required()
def delete_bloqueo(bloqueo_id):
    """Eliminar un bloqueo"""
    try:
        current_user_id = get_jwt_identity()
        
        success, error = BloqueoService.delete_bloqueo(bloqueo_id, current_user_id)
        if error:
            return jsonify(error), 400
        
        return jsonify({
            'message': 'Bloqueo eliminado exitosamente'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@bloqueo_bp.route('/<int:bloqueo_id>/activar', methods=['POST'])
@jwt_required()
def activar_bloqueo(bloqueo_id):
    """Activar un bloqueo"""
    try:
        current_user_id = get_jwt_identity()
        
        success, error = BloqueoService.activar_bloqueo(bloqueo_id, current_user_id)
        if error:
            return jsonify(error), 400
        
        return jsonify({
            'message': 'Bloqueo activado exitosamente'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@bloqueo_bp.route('/<int:bloqueo_id>/completar', methods=['POST'])
@jwt_required()
def completar_bloqueo(bloqueo_id):
    """Completar un bloqueo"""
    try:
        current_user_id = get_jwt_identity()
        
        success, error = BloqueoService.completar_bloqueo(bloqueo_id, current_user_id)
        if error:
            return jsonify(error), 400
        
        return jsonify({
            'message': 'Bloqueo completado exitosamente'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@bloqueo_bp.route('/activos', methods=['GET'])
@jwt_required()
def get_bloqueos_activos():
    """Obtener bloqueos activos en este momento"""
    try:
        bloqueos = BloqueoService.get_bloqueos_activos_ahora()
        
        return jsonify({
            'bloqueos': [bloqueo.to_dict() for bloqueo in bloqueos]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@bloqueo_bp.route('/por-vencer', methods=['GET'])
@jwt_required()
def get_bloqueos_por_vencer():
    """Obtener bloqueos que van a vencer"""
    try:
        horas = request.args.get('horas', 24, type=int)
        bloqueos = BloqueoService.get_bloqueos_por_vencer(horas)
        
        return jsonify({
            'bloqueos': [bloqueo.to_dict() for bloqueo in bloqueos]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

