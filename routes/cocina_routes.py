from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from datetime import datetime
from models.user import Usuario
from services.cocina_service import CocinaService
from services.error_handler import ErrorHandler

cocina_bp = Blueprint('cocina_bp', __name__)

# --- Decorador para verificar rol de Cocina o Admin ---
def cocina_or_admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = Usuario.query.get(current_user_id)
        print(f"🔍 Decorador cocina_or_admin_required ejecutado para función {fn.__name__}")
        print(f"🔍 Usuario: {user.usuario if user else 'None'}, Rol: {user.rol if user else 'None'}")
        if user and (user.rol in ['cocina', 'admin']):
            print(f"✅ Acceso permitido para {user.usuario}")
            kwargs['current_user'] = user
            return fn(*args, **kwargs)
        else:
            print(f"❌ Acceso denegado para {user.usuario if user else 'None'}")
            return jsonify({"error": "Acceso denegado. Se requiere rol de Cocina o Administrador."}), 403
    # Renombrar el decorador para evitar conflictos en Flask
    wrapper.__name__ = f"cocina_protected_{fn.__name__}"
    return wrapper

# --- Endpoints para la Interfaz de Cocina ---

@cocina_bp.route('/test-public', methods=['GET'])
def test_cocina_public():
    """Endpoint de prueba público para verificar que el blueprint funciona"""
    return jsonify({
        "success": True,
        "message": "Blueprint de cocina funcionando correctamente (público)",
        "data": {
            "status": "activo",
            "timestamp": datetime.utcnow().isoformat()
        }
    })

@cocina_bp.route('/items', methods=['GET'])
@cocina_or_admin_required
def get_kitchen_items(current_user):
    """Obtiene los ítems activos para la estación del cocinero logueado."""
    try:
        if not current_user.estacion:
            return jsonify(ErrorHandler.create_error_response(
                error='Estación no asignada',
                code='VALIDATION_ERROR',
                details='Este usuario no tiene una estación de cocina asignada'
            )), 400

        kanban_data = CocinaService.get_active_items_by_station(current_user.estacion)
        return jsonify(ErrorHandler.create_success_response(
            data=kanban_data,
            message='Ítems de cocina obtenidos exitosamente'
        )), 200
    except Exception as e:
        return jsonify(ErrorHandler.create_error_response(e, 'obtener ítems de cocina')[0]), ErrorHandler.create_error_response(e, 'obtener ítems de cocina')[1]

@cocina_bp.route('/mesas/<estacion>', methods=['GET'])
@cocina_or_admin_required
def get_mesas_with_items(current_user, estacion):
    """Obtiene las mesas con ítems activos para una estación específica."""
    try:
        mesas = CocinaService.get_mesas_with_items_by_station(estacion)
        return jsonify(ErrorHandler.create_success_response(
            data=mesas,
            message=f'Mesas con ítems de estación {estacion} obtenidas exitosamente'
        )), 200
    except Exception as e:
        return jsonify(ErrorHandler.create_error_response(e, 'obtener mesas con ítems')[0]), ErrorHandler.create_error_response(e, 'obtener mesas con ítems')[1]

@cocina_bp.route('/items/<int:item_id>/status', methods=['PUT'])
@cocina_or_admin_required
def update_item_status(item_id, current_user):
    """Actualiza el estado de un ítem de orden."""
    try:
        data = request.get_json()
        nuevo_estado = data.get('estado')

        if not nuevo_estado:
            return jsonify(ErrorHandler.create_error_response(
                error='Estado requerido',
                code='VALIDATION_ERROR',
                details='El campo estado es obligatorio'
            )), 400

        updated_item, error = CocinaService.update_item_status(item_id, nuevo_estado)

        if error:
            return jsonify(ErrorHandler.create_error_response(
                error=error.get('error', 'Error actualizando ítem'),
                code='UPDATE_ERROR',
                details=error.get('error')
            )), 400

        return jsonify(ErrorHandler.create_success_response(
            message=f'Ítem {item_id} actualizado a {nuevo_estado} exitosamente'
        )), 200
    except Exception as e:
        return jsonify(ErrorHandler.create_error_response(e, 'actualizar estado de ítem')[0]), ErrorHandler.create_error_response(e, 'actualizar estado de ítem')[1]

@cocina_bp.route('/estadisticas/<estacion>', methods=['GET'])
@cocina_or_admin_required
def get_estadisticas_estacion(current_user, estacion):
    """Obtiene estadísticas de una estación de cocina."""
    try:
        estadisticas = CocinaService.get_estadisticas_estacion(estacion)
        return jsonify(ErrorHandler.create_success_response(
            data=estadisticas,
            message=f'Estadísticas de estación {estacion} obtenidas exitosamente'
        )), 200
    except Exception as e:
        return jsonify(ErrorHandler.create_error_response(e, 'obtener estadísticas de estación')[0]), ErrorHandler.create_error_response(e, 'obtener estadísticas de estación')[1]

@cocina_bp.route('/urgentes/<estacion>', methods=['GET'])
@cocina_or_admin_required
def get_items_urgentes(current_user, estacion):
    """Obtiene ítems urgentes de una estación."""
    try:
        items_urgentes = CocinaService.get_items_urgentes(estacion)
        return jsonify(ErrorHandler.create_success_response(
            data=items_urgentes,
            message=f'Ítems urgentes de estación {estacion} obtenidos exitosamente'
        )), 200
    except Exception as e:
        return jsonify(ErrorHandler.create_error_response(e, 'obtener ítems urgentes')[0]), ErrorHandler.create_error_response(e, 'obtener ítems urgentes')[1]

@cocina_bp.route('/test', methods=['GET'])
def test_cocina():
    """Endpoint de prueba para verificar que el blueprint funciona"""
    return jsonify({
        "success": True,
        "message": "Blueprint de cocina funcionando correctamente",
        "data": {
            "endpoints_disponibles": [
                "/api/cocina/test",
                "/api/cocina/items",
                "/api/cocina/mesas/<estacion>",
                "/api/cocina/estadisticas/<estacion>",
                "/api/cocina/urgentes/<estacion>",
                "/api/cocina/ordenes"
            ]
        }
    })

@cocina_bp.route('/test-simple', methods=['GET'])
def test_simple_cocina():
    """Endpoint de prueba simple que devuelve un array de órdenes"""
    try:
        # Crear datos de prueba
        test_ordenes = [
            {
                "id": 1,
                "numero": "TEST-001",
                "mesa_id": 1,
                "mozo_id": 1,
                "tipo": "mesa",
                "estado": "confirmada",
                "monto_total": 45.50,
                "cliente_nombre": "Cliente Test 1",
                "creado_en": "2024-01-01T10:00:00Z",
                "actualizado_en": "2024-01-01T10:30:00Z",
                "mesa": {"numero": "1", "zona": "Principal", "piso": "1"},
                "mozo": {"usuario": "mesero1"},
                "items": [
                    {
                        "id": 1,
                        "producto_id": 1,
                        "cantidad": 2,
                        "estado": "en_cola",
                        "producto": {"nombre": "Ceviche Mixto"}
                    }
                ]
            },
            {
                "id": 2,
                "numero": "TEST-002",
                "mesa_id": 2,
                "mozo_id": 2,
                "tipo": "mesa",
                "estado": "preparando",
                "monto_total": 32.00,
                "cliente_nombre": "Cliente Test 2",
                "creado_en": "2024-01-01T11:00:00Z",
                "actualizado_en": "2024-01-01T11:15:00Z",
                "mesa": {"numero": "2", "zona": "Terraza", "piso": "1"},
                "mozo": {"usuario": "mesero2"},
                "items": [
                    {
                        "id": 2,
                        "producto_id": 2,
                        "cantidad": 1,
                        "estado": "preparando",
                        "producto": {"nombre": "Arroz con Mariscos"}
                    }
                ]
            }
        ]

        return jsonify({
            "success": True,
            "message": "Datos de prueba de cocina",
            "data": test_ordenes
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@cocina_bp.route('/ordenes', methods=['GET'])
@cocina_or_admin_required
def get_ordenes_detalladas(current_user):
    """Obtiene órdenes detalladas para cocina"""
    try:
        print(f"🍳 Endpoint /cocina/ordenes llamado por usuario {current_user.usuario} con rol {current_user.rol}")
        print(f"🍳 Estación del usuario: {current_user.estacion}")

        from services.orden_service import OrdenService
        ordenes = OrdenService.obtener_ordenes_activas()

        print(f"🍳 Total órdenes activas: {len(ordenes)}")
        for orden in ordenes:
            print(f"  - Orden {orden.numero}: {orden.estado}, Items: {len(orden.items) if orden.items else 0}")

        # Filtrar órdenes que cocina necesita ver:
        # 1. Órdenes en estado 'confirmada' o 'preparando'
        # 2. Órdenes que tienen items en estado 'en_cola'
        ordenes_pendientes = [
            o for o in ordenes
            if o.estado in ['confirmada', 'preparando'] or
               (o.items and any(item.estado == 'en_cola' for item in o.items))
        ]

        print(f"🍳 Órdenes filtradas para cocina: {len(ordenes_pendientes)}")
        for orden in ordenes_pendientes:
            print(f"  - Orden filtrada {orden.numero}: {orden.estado}")

        # Crear respuesta con datos completos
        ordenes_array = [orden.to_dict() for orden in ordenes_pendientes]

        print(f"🍳 Devolviendo {len(ordenes_array)} órdenes")
        print(f"🍳 Primera orden: {ordenes_array[0] if ordenes_array else 'Sin órdenes'}")

        return jsonify(ErrorHandler.create_success_response(
            data=ordenes_array,  # Devolver directamente el array
            message='Órdenes detalladas obtenidas exitosamente'
        )), 200
    except Exception as e:
        print(f"❌ Error en /cocina/ordenes: {str(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return jsonify(ErrorHandler.create_error_response(e, 'obtener órdenes detalladas')[0]), ErrorHandler.create_error_response(e, 'obtener órdenes detalladas')[1]