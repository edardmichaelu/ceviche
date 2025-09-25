from flask import Blueprint, request, jsonify
from services.audit_service import AuditService
from routes.admin_routes import admin_required
from datetime import datetime
import logging

audit_bp = Blueprint('audit', __name__)

@audit_bp.route('/logs', methods=['GET'])
@admin_required
def get_audit_logs():
    """Obtener logs de auditoría con filtros"""
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

@audit_bp.route('/statistics', methods=['GET'])
@admin_required
def get_audit_statistics():
    """Obtener estadísticas de auditoría"""
    try:
        stats = AuditService.get_audit_statistics()
        return jsonify(stats), 200
    except Exception as e:
        logging.error(f"Error en get_audit_statistics: {str(e)}")
        return jsonify({"error": str(e)}), 500

@audit_bp.route('/entities', methods=['GET'])
@admin_required
def get_available_entities():
    """Obtener entidades disponibles"""
    try:
        entities = AuditService.get_available_entities()
        return jsonify({"entities": entities}), 200
    except Exception as e:
        logging.error(f"Error en get_available_entities: {str(e)}")
        return jsonify({"error": str(e)}), 500

@audit_bp.route('/actions', methods=['GET'])
@admin_required
def get_available_actions():
    """Obtener acciones disponibles"""
    try:
        actions = AuditService.get_available_actions()
        return jsonify({"actions": actions}), 200
    except Exception as e:
        logging.error(f"Error en get_available_actions: {str(e)}")
        return jsonify({"error": str(e)}), 500

@audit_bp.route('/summary', methods=['GET'])
@admin_required
def get_audit_summary():
    """Obtener resumen de auditoría por rango de fechas"""
    try:
        fecha_desde = request.args.get('fecha_desde')
        fecha_hasta = request.args.get('fecha_hasta')
        
        if not fecha_desde or not fecha_hasta:
            return jsonify({"error": "fecha_desde y fecha_hasta son requeridas"}), 400
        
        try:
            fecha_desde_dt = datetime.fromisoformat(fecha_desde.replace('Z', '+00:00'))
            fecha_hasta_dt = datetime.fromisoformat(fecha_hasta.replace('Z', '+00:00'))
        except ValueError:
            return jsonify({"error": "Formato de fechas inválido"}), 400
        
        summary = AuditService.get_audit_summary_by_date_range(
            fecha_desde_dt, 
            fecha_hasta_dt
        )
        
        return jsonify(summary), 200
        
    except Exception as e:
        logging.error(f"Error en get_audit_summary: {str(e)}")
        return jsonify({"error": str(e)}), 500

@audit_bp.route('/export', methods=['GET'])
@admin_required
def export_audit_logs():
    """Exportar logs de auditoría en formato CSV"""
    try:
        # Obtener todos los logs (sin paginación para export)
        result = AuditService.get_audit_logs(
            page=1,
            per_page=10000,  # Límite alto para export
            usuario_id=request.args.get('usuario_id'),
            entidad=request.args.get('entidad'),
            accion=request.args.get('accion'),
            fecha_desde=request.args.get('fecha_desde'),
            fecha_hasta=request.args.get('fecha_hasta')
        )
        
        # Formatear para CSV
        csv_data = []
        csv_data.append([
            'ID', 'Usuario', 'Email', 'Rol', 'Entidad', 'Acción', 
            'ID Entidad', 'IP', 'Fecha', 'Valores Anteriores', 'Valores Nuevos'
        ])
        
        for log in result['logs']:
            csv_data.append([
                log['id'],
                log['usuario']['usuario'] if log['usuario'] else 'N/A',
                log['usuario']['correo'] if log['usuario'] else 'N/A',
                log['usuario']['rol'] if log['usuario'] else 'N/A',
                log['entidad'],
                log['accion'],
                log['id_entidad'] or 'N/A',
                log['ip'] or 'N/A',
                log['fecha'] or 'N/A',
                json.dumps(log['valores_anteriores']) if log['valores_anteriores'] else 'N/A',
                json.dumps(log['valores_nuevos']) if log['valores_nuevos'] else 'N/A'
            ])
        
        return jsonify({"csv_data": csv_data}), 200
        
    except Exception as e:
        logging.error(f"Error en export_audit_logs: {str(e)}")
        return jsonify({"error": str(e)}), 500


