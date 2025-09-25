from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from services.reserva_service import ReservaService
from services.error_handler import ErrorHandler
from services.auth_service import AuthService

reserva_bp = Blueprint('reserva', __name__, url_prefix='/api/reservas')

@reserva_bp.route('/', methods=['POST'])
@jwt_required()
def create_reserva():
    """Crear una nueva reserva"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # Obtener usuario actual
        current_user_id = get_jwt_identity()
        data['usuario_id'] = current_user_id
        
        reserva, error = ReservaService.create_reserva(data)
        if error:
            error_response, status_code = ErrorHandler.create_error_response(error)
            return jsonify(error_response), status_code
        
        return jsonify(ErrorHandler.create_success_response(
            data=reserva.to_dict(),
            message="Reserva creada exitosamente"
        )), 201
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@reserva_bp.route('/', methods=['GET'])
@jwt_required()
def get_reservas():
    """Obtener reservas con filtros"""
    try:
        # Parámetros de filtro
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        estado = request.args.get('estado')
        zona_id = request.args.get('zona_id', type=int)
        mesa_id = request.args.get('mesa_id', type=int)
        
        # Convertir fechas
        fecha_inicio_dt = None
        fecha_fin_dt = None
        
        if fecha_inicio:
            fecha_inicio_dt = datetime.fromisoformat(fecha_inicio.replace('Z', '+00:00'))
        if fecha_fin:
            fecha_fin_dt = datetime.fromisoformat(fecha_fin.replace('Z', '+00:00'))
        
        reservas = ReservaService.get_reservas(
            fecha_inicio=fecha_inicio_dt,
            fecha_fin=fecha_fin_dt,
            estado=estado,
            zona_id=zona_id,
            mesa_id=mesa_id
        )
        
        return jsonify({
            'reservas': [reserva.to_dict() for reserva in reservas]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@reserva_bp.route('/<int:reserva_id>', methods=['GET'])
@jwt_required()
def get_reserva(reserva_id):
    """Obtener una reserva por ID"""
    try:
        reserva = ReservaService.get_reserva_by_id(reserva_id)
        if not reserva:
            return jsonify({'error': 'Reserva no encontrada'}), 404
        
        return jsonify({
            'reserva': reserva.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@reserva_bp.route('/<int:reserva_id>', methods=['PUT'])
@jwt_required()
def update_reserva(reserva_id):
    """Actualizar una reserva"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # Obtener usuario actual
        current_user_id = get_jwt_identity()
        data['usuario_id'] = current_user_id
        
        reserva, error = ReservaService.update_reserva(reserva_id, data)
        if error:
            return jsonify(error), 400
        
        return jsonify({
            'message': 'Reserva actualizada exitosamente',
            'reserva': reserva.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@reserva_bp.route('/<int:reserva_id>', methods=['DELETE'])
@jwt_required()
def delete_reserva(reserva_id):
    """Eliminar una reserva"""
    try:
        current_user_id = get_jwt_identity()
        
        success, error = ReservaService.delete_reserva(reserva_id, current_user_id)
        if error:
            return jsonify(error), 400
        
        return jsonify({
            'message': 'Reserva eliminada exitosamente'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@reserva_bp.route('/<int:reserva_id>/confirmar', methods=['POST'])
@jwt_required()
def confirmar_reserva(reserva_id):
    """Confirmar una reserva"""
    try:
        current_user_id = get_jwt_identity()
        
        success, error = ReservaService.confirmar_reserva(reserva_id, current_user_id)
        if error:
            return jsonify(error), 400
        
        return jsonify({
            'message': 'Reserva confirmada exitosamente'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@reserva_bp.route('/<int:reserva_id>/cancelar', methods=['POST'])
@jwt_required()
def cancelar_reserva(reserva_id):
    """Cancelar una reserva"""
    try:
        data = request.get_json() or {}
        current_user_id = get_jwt_identity()
        
        motivo = data.get('motivo', 'Sin motivo especificado')
        
        success, error = ReservaService.cancelar_reserva(reserva_id, motivo, current_user_id)
        if error:
            return jsonify(error), 400
        
        return jsonify({
            'message': 'Reserva cancelada exitosamente'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@reserva_bp.route('/disponibilidad', methods=['POST'])
@jwt_required()
def check_disponibilidad():
    """Verificar disponibilidad para una reserva"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        required_fields = ['zona_id', 'fecha_reserva', 'hora_reserva']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'El campo {field} es requerido'}), 400
        
        fecha_reserva = data['fecha_reserva']
        if isinstance(fecha_reserva, str):
            fecha_reserva = datetime.fromisoformat(fecha_reserva.replace('Z', '+00:00'))
        
        disponibilidad = ReservaService.check_disponibilidad(
            data['zona_id'],
            fecha_reserva,
            data['hora_reserva'],
            data.get('duracion_estimada', 120),
            data.get('mesa_id')
        )
        
        return jsonify(disponibilidad), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@reserva_bp.route('/public', methods=['GET'])
def get_reservas_public():
    """Obtener lista de reservas (ruta pública)"""
    try:
        # Parámetros de consulta opcionales
        fecha_desde = request.args.get('fecha_desde')
        fecha_hasta = request.args.get('fecha_hasta')
        estado = request.args.get('estado')
        
        # Convertir fechas si se proporcionan
        fecha_desde_dt = None
        fecha_hasta_dt = None
        
        if fecha_desde:
            fecha_desde_dt = datetime.fromisoformat(fecha_desde.replace('Z', ''))
        if fecha_hasta:
            fecha_hasta_dt = datetime.fromisoformat(fecha_hasta.replace('Z', ''))
        
        reservas = ReservaService.get_reservas(
            fecha_inicio=fecha_desde_dt,
            fecha_fin=fecha_hasta_dt,
            estado=estado
        )
        
        return jsonify({
            'reservas': [reserva.to_dict() for reserva in reservas],
            'success': True,
            'total': len(reservas)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@reserva_bp.route('/public', methods=['POST'])
def create_reserva_public():
    """Crear una nueva reserva (ruta pública)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # No requerir usuario_id para reservas públicas
        reserva, error = ReservaService.create_reserva(data)
        if error:
            return jsonify(error), 400
        
        return jsonify({
            'success': True,
            'message': 'Reserva creada exitosamente',
            'data': reserva.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

