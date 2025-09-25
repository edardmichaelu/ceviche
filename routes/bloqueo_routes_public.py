from flask import Blueprint, jsonify, request
from services.bloqueo_service import BloqueoService

# Blueprint para rutas públicas de bloqueos
bloqueo_public_bp = Blueprint('bloqueo_public', __name__, url_prefix='/api/bloqueos')

@bloqueo_public_bp.route('/public', methods=['GET'])
def get_bloqueos_public():
    """Obtener lista de bloqueos (ruta pública)"""
    try:
        from datetime import datetime
        
        # Parámetros de consulta opcionales
        estado = request.args.get('estado')
        tipo = request.args.get('tipo')
        fecha_desde = request.args.get('fecha_desde')
        fecha_hasta = request.args.get('fecha_hasta')
        
        # Convertir fechas de string a datetime si están presentes
        fecha_inicio = None
        fecha_fin = None
        
        if fecha_desde:
            try:
                fecha_inicio = datetime.fromisoformat(fecha_desde)
            except ValueError:
                return jsonify({'error': 'Formato de fecha_desde inválido'}), 400
        
        if fecha_hasta:
            try:
                fecha_fin = datetime.fromisoformat(fecha_hasta)
            except ValueError:
                return jsonify({'error': 'Formato de fecha_hasta inválido'}), 400
        
        bloqueos = BloqueoService.get_bloqueos(
            estado=estado,
            tipo=tipo,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
        
        return jsonify({
            'bloqueos': bloqueos,
            'success': True,
            'total': len(bloqueos)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@bloqueo_public_bp.route('/public', methods=['POST'])
def create_bloqueo_public():
    """Crear un bloqueo (ruta pública)"""
    try:
        data = request.get_json()
        
        # Crear el bloqueo usando el servicio
        bloqueo, error = BloqueoService.create_bloqueo(data)
        
        if error:
            return jsonify(error), 400
        
        return jsonify({
            'message': 'Bloqueo creado exitosamente',
            'bloqueo': bloqueo.to_dict(),
            'success': True
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@bloqueo_public_bp.route('/public/<int:bloqueo_id>', methods=['DELETE'])
def delete_bloqueo_public(bloqueo_id):
    """Eliminar un bloqueo (ruta pública)"""
    try:
        success, error = BloqueoService.delete_bloqueo(bloqueo_id)
        if error:
            # Si el bloqueo no se encuentra, devolver 404
            if "no encontrado" in error.get('error', '').lower():
                return jsonify(error), 404
            return jsonify(error), 400
        
        return jsonify({
            'message': 'Bloqueo eliminado exitosamente',
            'success': True
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500
