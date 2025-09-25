from flask import Blueprint, request, jsonify
from services.local_service import LocalService
from routes.admin_routes import admin_required
from flask_jwt_extended import get_jwt_identity
from services.audit_service import AuditService
from services.error_handler import ErrorHandler

local_bp = Blueprint('local', __name__)

# --- RUTAS PÚBLICAS (SIN AUTENTICACIÓN) ---

@local_bp.route('/zonas/public', methods=['GET'])
def get_zonas_public():
    """Obtener zonas públicas para desplegables"""
    try:
        zonas = LocalService.get_zonas(activos_only=True)
        return jsonify({
            'success': True,
            'data': [zona.to_dict() for zona in zonas],
            'total': len(zonas)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo zonas: {str(e)}'
        }), 500

@local_bp.route('/mesas/public', methods=['GET'])
def get_mesas_public():
    """Obtener mesas públicas para desplegables"""
    try:
        zona_id = request.args.get('zona_id', type=int)
        mesas = LocalService.get_mesas(zona_id=zona_id, activos_only=True)
        return jsonify({
            'success': True,
            'data': [mesa.to_dict() for mesa in mesas],
            'total': len(mesas)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo mesas: {str(e)}'
        }), 500

@local_bp.route('/pisos/public', methods=['GET'])
def get_pisos_public():
    """Obtener pisos públicos para desplegables"""
    try:
        pisos = LocalService.get_pisos(activos_only=True)
        return jsonify({
            'success': True,
            'data': [piso.to_dict() for piso in pisos],
            'total': len(pisos)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo pisos: {str(e)}'
        }), 500

# --- RUTAS DE PISOS ---

@local_bp.route('/pisos', methods=['GET'])
@admin_required
def get_pisos():
    """Obtener todos los pisos"""
    try:
        activos_only = request.args.get('activos_only', 'true').lower() == 'true'
        pisos = LocalService.get_pisos(activos_only=activos_only)
        
        return jsonify({
            'success': True,
            'data': [piso.to_dict() for piso in pisos],
            'total': len(pisos)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo pisos: {str(e)}'
        }), 500

@local_bp.route('/pisos/<int:piso_id>', methods=['GET'])
@admin_required
def get_piso(piso_id):
    """Obtener un piso por ID"""
    try:
        piso = LocalService.get_piso_by_id(piso_id)
        if not piso:
            return jsonify({
                'success': False,
                'error': 'Piso no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'data': piso.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo piso: {str(e)}'
        }), 500

@local_bp.route('/pisos', methods=['POST'])
@admin_required
def create_piso():
    """Crear un nuevo piso"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        # Validaciones
        if not data.get('nombre'):
            return jsonify({
                'success': False,
                'error': 'El nombre del piso es requerido'
            }), 400
        
        piso, error = LocalService.create_piso(data)
        if error:
            return jsonify({
                'success': False,
                'error': error['error']
            }), 400
        
        # Registrar en auditoría
        try:
            AuditService.log_event(
                usuario_id=current_user_id,
                entidad='piso',
                accion='create',
                id_entidad=piso.id,
                valores_nuevos=piso.to_dict()
            )
        except Exception as e:
            print(f"Error registrando auditoría: {e}")
        
        return jsonify({
            'success': True,
            'data': piso.to_dict(),
            'message': 'Piso creado exitosamente'
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error creando piso: {str(e)}'
        }), 500

@local_bp.route('/pisos/<int:piso_id>', methods=['PUT'])
@admin_required
def update_piso(piso_id):
    """Actualizar un piso"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        piso, error = LocalService.update_piso(piso_id, data)
        if error:
            return jsonify({
                'success': False,
                'error': error['error']
            }), 400
        
        # Registrar en auditoría
        try:
            AuditService.log_event(
                usuario_id=current_user_id,
                entidad='piso',
                accion='update',
                id_entidad=piso.id,
                valores_nuevos=piso.to_dict()
            )
        except Exception as e:
            print(f"Error registrando auditoría: {e}")
        
        return jsonify({
            'success': True,
            'data': piso.to_dict(),
            'message': 'Piso actualizado exitosamente'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error actualizando piso: {str(e)}'
        }), 500

@local_bp.route('/pisos/<int:piso_id>', methods=['DELETE'])
@admin_required
def delete_piso(piso_id):
    """Eliminar un piso"""
    try:
        current_user_id = get_jwt_identity()
        
        success, error = LocalService.delete_piso(piso_id)
        if error:
            error_response, status_code = ErrorHandler.create_error_response(error)
            return jsonify(error_response), status_code
        
        # Registrar en auditoría
        try:
            AuditService.log_event(
                usuario_id=current_user_id,
                entidad='piso',
                accion='delete',
                id_entidad=piso_id
            )
        except Exception as e:
            print(f"Error registrando auditoría: {e}")
        
        return jsonify({
            'success': True,
            'message': 'Piso eliminado exitosamente'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error eliminando piso: {str(e)}'
        }), 500

# --- RUTAS DE ZONAS ---

@local_bp.route('/zonas', methods=['GET'])
@admin_required
def get_zonas():
    """Obtener todas las zonas"""
    try:
        piso_id = request.args.get('piso_id', type=int)
        activos_only = request.args.get('activos_only', 'true').lower() == 'true'
        zonas = LocalService.get_zonas(piso_id=piso_id, activos_only=activos_only)
        
        return jsonify({
            'success': True,
            'data': [zona.to_dict() for zona in zonas],
            'total': len(zonas)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo zonas: {str(e)}'
        }), 500

@local_bp.route('/zonas/<int:zona_id>', methods=['GET'])
@admin_required
def get_zona(zona_id):
    """Obtener una zona por ID"""
    try:
        zona = LocalService.get_zona_by_id(zona_id)
        if not zona:
            return jsonify({
                'success': False,
                'error': 'Zona no encontrada'
            }), 404
        
        return jsonify({
            'success': True,
            'data': zona.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo zona: {str(e)}'
        }), 500

@local_bp.route('/zonas', methods=['POST'])
@admin_required
def create_zona():
    """Crear una nueva zona"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        # Validaciones
        if not data.get('nombre'):
            return jsonify({
                'success': False,
                'error': 'El nombre de la zona es requerido'
            }), 400
        
        if not data.get('tipo'):
            return jsonify({
                'success': False,
                'error': 'El tipo de zona es requerido'
            }), 400
        
        if not data.get('piso_id'):
            return jsonify({
                'success': False,
                'error': 'El ID del piso es requerido'
            }), 400
        
        zona, error = LocalService.create_zona(data)
        if error:
            return jsonify({
                'success': False,
                'error': error['error']
            }), 400
        
        # Registrar en auditoría
        try:
            AuditService.log_event(
                usuario_id=current_user_id,
                entidad='zona',
                accion='create',
                id_entidad=zona.id,
                valores_nuevos=zona.to_dict()
            )
        except Exception as e:
            print(f"Error registrando auditoría: {e}")
        
        return jsonify({
            'success': True,
            'data': zona.to_dict(),
            'message': 'Zona creada exitosamente'
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error creando zona: {str(e)}'
        }), 500

@local_bp.route('/zonas/<int:zona_id>', methods=['PUT'])
@admin_required
def update_zona(zona_id):
    """Actualizar una zona"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        zona, error = LocalService.update_zona(zona_id, data)
        if error:
            return jsonify({
                'success': False,
                'error': error['error']
            }), 400
        
        # Registrar en auditoría
        try:
            AuditService.log_event(
                usuario_id=current_user_id,
                entidad='zona',
                accion='update',
                id_entidad=zona.id,
                valores_nuevos=zona.to_dict()
            )
        except Exception as e:
            print(f"Error registrando auditoría: {e}")
        
        return jsonify({
            'success': True,
            'data': zona.to_dict(),
            'message': 'Zona actualizada exitosamente'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error actualizando zona: {str(e)}'
        }), 500

@local_bp.route('/zonas/<int:zona_id>', methods=['DELETE'])
@admin_required
def delete_zona(zona_id):
    """Eliminar una zona"""
    try:
        current_user_id = get_jwt_identity()
        
        success, error = LocalService.delete_zona(zona_id)
        if error:
            error_response, status_code = ErrorHandler.create_error_response(error)
            return jsonify(error_response), status_code
        
        # Registrar en auditoría
        try:
            AuditService.log_event(
                usuario_id=current_user_id,
                entidad='zona',
                accion='delete',
                id_entidad=zona_id
            )
        except Exception as e:
            print(f"Error registrando auditoría: {e}")
        
        return jsonify({
            'success': True,
            'message': 'Zona eliminada exitosamente'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error eliminando zona: {str(e)}'
        }), 500

# --- RUTAS DE MESAS ---

@local_bp.route('/mesas', methods=['GET'])
@admin_required
def get_mesas():
    """Obtener todas las mesas"""
    try:
        zona_id = request.args.get('zona_id', type=int)
        estado = request.args.get('estado')
        activos_only = request.args.get('activos_only', 'true').lower() == 'true'
        mesas = LocalService.get_mesas(zona_id=zona_id, estado=estado, activos_only=activos_only)
        
        return jsonify({
            'success': True,
            'data': [mesa.to_dict() for mesa in mesas],
            'total': len(mesas)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo mesas: {str(e)}'
        }), 500

@local_bp.route('/mesas/<int:mesa_id>', methods=['GET'])
@admin_required
def get_mesa(mesa_id):
    """Obtener una mesa por ID"""
    try:
        mesa = LocalService.get_mesa_by_id(mesa_id)
        if not mesa:
            return jsonify({
                'success': False,
                'error': 'Mesa no encontrada'
            }), 404
        
        return jsonify({
            'success': True,
            'data': mesa.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo mesa: {str(e)}'
        }), 500

@local_bp.route('/mesas', methods=['POST'])
@admin_required
def create_mesa():
    """Crear una nueva mesa"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        # Validaciones
        if not data.get('numero'):
            return jsonify({
                'success': False,
                'error': 'El número de mesa es requerido'
            }), 400
        
        if not data.get('zona_id'):
            return jsonify({
                'success': False,
                'error': 'El ID de la zona es requerido'
            }), 400
        
        mesa, error = LocalService.create_mesa(data)
        if error:
            return jsonify({
                'success': False,
                'error': error['error']
            }), 400
        
        # Registrar en auditoría
        try:
            AuditService.log_event(
                usuario_id=current_user_id,
                entidad='mesa',
                accion='create',
                id_entidad=mesa.id,
                valores_nuevos=mesa.to_dict()
            )
        except Exception as e:
            print(f"Error registrando auditoría: {e}")
        
        return jsonify({
            'success': True,
            'data': mesa.to_dict(),
            'message': 'Mesa creada exitosamente'
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error creando mesa: {str(e)}'
        }), 500

@local_bp.route('/mesas/<int:mesa_id>', methods=['PUT'])
@admin_required
def update_mesa(mesa_id):
    """Actualizar una mesa"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        mesa, error = LocalService.update_mesa(mesa_id, data)
        if error:
            return jsonify({
                'success': False,
                'error': error['error']
            }), 400
        
        # Registrar en auditoría
        try:
            AuditService.log_event(
                usuario_id=current_user_id,
                entidad='mesa',
                accion='update',
                id_entidad=mesa.id,
                valores_nuevos=mesa.to_dict()
            )
        except Exception as e:
            print(f"Error registrando auditoría: {e}")
        
        return jsonify({
            'success': True,
            'data': mesa.to_dict(),
            'message': 'Mesa actualizada exitosamente'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error actualizando mesa: {str(e)}'
        }), 500

@local_bp.route('/mesas/<int:mesa_id>', methods=['DELETE'])
@admin_required
def delete_mesa(mesa_id):
    """Eliminar una mesa"""
    try:
        current_user_id = get_jwt_identity()
        
        success, error = LocalService.delete_mesa(mesa_id)
        if error:
            error_response, status_code = ErrorHandler.create_error_response(error)
            return jsonify(error_response), status_code
        
        # Registrar en auditoría
        try:
            AuditService.log_event(
                usuario_id=current_user_id,
                entidad='mesa',
                accion='delete',
                id_entidad=mesa_id
            )
        except Exception as e:
            print(f"Error registrando auditoría: {e}")
        
        return jsonify({
            'success': True,
            'message': 'Mesa eliminada exitosamente'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error eliminando mesa: {str(e)}'
        }), 500

@local_bp.route('/mesas/<int:mesa_id>/estado', methods=['PUT'])
@admin_required
def cambiar_estado_mesa(mesa_id):
    """Cambiar el estado de una mesa"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        nuevo_estado = data.get('estado')
        if not nuevo_estado:
            return jsonify({
                'success': False,
                'error': 'El nuevo estado es requerido'
            }), 400
        
        success, error = LocalService.cambiar_estado_mesa(mesa_id, nuevo_estado)
        if error:
            return jsonify({
                'success': False,
                'error': error['error']
            }), 400
        
        # Registrar en auditoría
        try:
            AuditService.log_event(
                usuario_id=current_user_id,
                entidad='mesa',
                accion='cambiar_estado',
                id_entidad=mesa_id,
                valores_nuevos={'estado': nuevo_estado}
            )
        except Exception as e:
            print(f"Error registrando auditoría: {e}")
        
        return jsonify({
            'success': True,
            'message': f'Estado de mesa cambiado a {nuevo_estado}'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error cambiando estado de mesa: {str(e)}'
        }), 500

# --- RUTAS DE CONSULTA AVANZADA ---

@local_bp.route('/estadisticas', methods=['GET'])
@admin_required
def get_estadisticas():
    """Obtener estadísticas de zonas y mesas"""
    try:
        estadisticas = LocalService.get_estadisticas_zonas()
        return jsonify({
            'success': True,
            'data': estadisticas
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo estadísticas: {str(e)}'
        }), 500

@local_bp.route('/mapa', methods=['GET'])
@admin_required
def get_mapa_restaurante():
    """Obtener datos para el mapa del restaurante"""
    try:
        mapa = LocalService.get_mapa_restaurante()
        return jsonify({
            'success': True,
            'data': mapa
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo mapa: {str(e)}'
        }), 500

# --- RUTAS PÚBLICAS (para QR) ---

@local_bp.route('/mesas/qr/<qr_code>', methods=['GET'])
def get_mesa_by_qr(qr_code):
    """Obtener información de mesa por QR (público)"""
    try:
        mesa = LocalService.get_mesa_by_qr(qr_code)
        if not mesa:
            return jsonify({
                'success': False,
                'error': 'Mesa no encontrada'
            }), 404
        
        return jsonify({
            'success': True,
            'data': mesa.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo mesa: {str(e)}'
        }), 500

