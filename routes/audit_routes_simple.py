from flask import Blueprint, request, jsonify
from services.audit_service import AuditService
from datetime import datetime
import logging

audit_bp_simple = Blueprint('audit_simple', __name__)

@audit_bp_simple.route('/logs', methods=['GET'])
def get_audit_logs():
    """Obtener logs de auditoría con filtros (sin autenticación para prueba)"""
    try:
        # Obtener parámetros de consulta
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 50)), 100)  # Máximo 100 por página
        usuario_id = request.args.get('usuario_id')
        entidad = request.args.get('entidad')
        accion = request.args.get('accion')
        fecha_desde = request.args.get('fecha_desde')
        fecha_hasta = request.args.get('fecha_hasta')
        
        # Convertir fechas si se proporcionan
        fecha_desde_dt = None
        fecha_hasta_dt = None
        
        if fecha_desde:
            try:
                fecha_desde_dt = datetime.fromisoformat(fecha_desde.replace('Z', '+00:00'))
            except ValueError:
                return jsonify({"error": "Formato de fecha_desde inválido"}), 400
                
        if fecha_hasta:
            try:
                fecha_hasta_dt = datetime.fromisoformat(fecha_hasta.replace('Z', '+00:00'))
            except ValueError:
                return jsonify({"error": "Formato de fecha_hasta inválido"}), 400
        
        # Obtener logs
        result = AuditService.get_audit_logs(
            page=page,
            per_page=per_page,
            usuario_id=int(usuario_id) if usuario_id else None,
            entidad=entidad,
            accion=accion,
            fecha_desde=fecha_desde_dt,
            fecha_hasta=fecha_hasta_dt
        )
        
        return jsonify(result), 200
        
    except Exception as e:
        logging.error(f"Error en get_audit_logs: {str(e)}")
        return jsonify({"error": str(e)}), 500

@audit_bp_simple.route('/statistics', methods=['GET'])
def get_audit_statistics():
    """Obtener estadísticas de auditoría (sin autenticación para prueba)"""
    try:
        stats = AuditService.get_audit_statistics()
        return jsonify(stats), 200
    except Exception as e:
        logging.error(f"Error en get_audit_statistics: {str(e)}")
        return jsonify({"error": str(e)}), 500

@audit_bp_simple.route('/entities', methods=['GET'])
def get_available_entities():
    """Obtener entidades disponibles (sin autenticación para prueba)"""
    try:
        entities = AuditService.get_available_entities()
        return jsonify({"entities": entities}), 200
    except Exception as e:
        logging.error(f"Error en get_available_entities: {str(e)}")
        return jsonify({"error": str(e)}), 500

@audit_bp_simple.route('/actions', methods=['GET'])
def get_available_actions():
    """Obtener acciones disponibles (sin autenticación para prueba)"""
    try:
        actions = AuditService.get_available_actions()
        return jsonify({"actions": actions}), 200
    except Exception as e:
        logging.error(f"Error en get_available_actions: {str(e)}")
        return jsonify({"error": str(e)})


