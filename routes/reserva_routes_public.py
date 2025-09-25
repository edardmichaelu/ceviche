# Rutas públicas adicionales para reservas
from flask import Blueprint, request, jsonify
from services.reserva_service import ReservaService

reserva_public_bp = Blueprint('reserva_public', __name__, url_prefix='/api/reservas')

@reserva_public_bp.route('/public', methods=['GET'])
def get_reservas_public():
    """Obtener reservas (ruta pública)"""
    try:
        fecha_desde = request.args.get('fecha_desde')
        fecha_hasta = request.args.get('fecha_hasta')

        # Convertir strings a datetime si se proporcionan
        from datetime import datetime
        fecha_desde_dt = None
        fecha_hasta_dt = None

        if fecha_desde:
            try:
                fecha_desde_dt = datetime.strptime(fecha_desde, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Formato de fecha_desde inválido. Use YYYY-MM-DD'}), 400

        if fecha_hasta:
            try:
                fecha_hasta_dt = datetime.strptime(fecha_hasta, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Formato de fecha_hasta inválido. Use YYYY-MM-DD'}), 400

        reservas = ReservaService.get_reservas(fecha_desde_dt, fecha_hasta_dt)

        return jsonify({
            'success': True,
            'reservas': [reserva.to_dict() for reserva in reservas],
            'total': len(reservas)
        }), 200

    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@reserva_public_bp.route('/public', methods=['POST'])
def create_reserva_public():
    """Crear una reserva (ruta pública)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400

        # Validar campos requeridos
        required_fields = ['cliente_nombre', 'cliente_telefono', 'cliente_email',
                          'fecha_reserva', 'hora_reserva', 'numero_personas', 'zona_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'El campo {field} es requerido'}), 400

        # Crear la reserva usando el servicio
        reserva, error = ReservaService.create_reserva(data)
        if error:
            return jsonify(error), 400

        return jsonify({
            'success': True,
            'data': reserva.to_dict(),
            'message': 'Reserva creada exitosamente'
        }), 201

    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@reserva_public_bp.route('/disponibilidad/public', methods=['POST'])
def check_disponibilidad_public():
    """Verificar disponibilidad (ruta pública)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        disponibilidad = ReservaService.check_disponibilidad(
            data['zona_id'],
            data['fecha_reserva'],
            data['hora_reserva'],
            data.get('duracion_estimada', 120),
            data.get('mesa_id')
        )
        
        return jsonify(disponibilidad), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@reserva_public_bp.route('/public/<int:reserva_id>', methods=['DELETE'])
def delete_reserva_public(reserva_id):
    """Eliminar una reserva (ruta pública)"""
    try:
        success, error = ReservaService.delete_reserva(reserva_id)
        if error:
            return jsonify(error), 400
        
        return jsonify({
            'message': 'Reserva eliminada exitosamente'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500



