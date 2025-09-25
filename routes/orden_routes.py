from flask import Blueprint, request, jsonify
from services.orden_service import OrdenService
from services.caja_service import CajaService
from services.error_handler import ErrorHandler
from routes.admin_routes import admin_required
from routes.mesero_routes import mesero_or_admin_required
from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import Usuario
from flask import jsonify

orden_bp = Blueprint('orden_bp', __name__)

# --- DECORADORES DE PERMISOS ---

def cocina_or_admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = Usuario.query.get(current_user_id)
        if user and (user.rol in ['cocina', 'admin']):
            return fn(*args, **kwargs)
        else:
            return jsonify({"error": "Acceso denegado. Se requiere rol de Cocina o Administrador."}), 403
    return wrapper

def orden_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = Usuario.query.get(current_user_id)
        if user and (user.rol in ['admin', 'mozo', 'cocina', 'caja']):
            return fn(*args, **kwargs)
        else:
            return jsonify({"error": "Acceso denegado. Se requiere rol de Admin, Mozo, Cocina o Caja."}), 403
    return wrapper

# Mantener el decorador específico para caja si es necesario para otras rutas
def caja_or_admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = Usuario.query.get(current_user_id)
        if user and (user.rol in ['caja', 'admin']):
            return fn(*args, **kwargs)
        else:
            return jsonify({"error": "Acceso denegado. Se requiere rol de Caja o Administrador."}), 403
    return wrapper

# --- RUTAS PARA MESEROS ---

@orden_bp.route('/mesero/detalladas', methods=['GET'])
@orden_required
def get_ordenes_detalladas_mesero():
    """Obtener órdenes detalladas para el mesero"""
    try:
        # Obtener órdenes activas con información completa
        ordenes = OrdenService.obtener_ordenes_activas()

        # Convertir a formato detallado para el mesero
        ordenes_detalladas = []
        for orden in ordenes:
            orden_dict = orden.to_dict()
            orden_dict['mesa_numero'] = orden.mesa.numero if orden.mesa else None
            orden_dict['mozo_nombre'] = orden.mozo.usuario if orden.mozo else None

            # Incluir información completa de items
            if orden.items:
                orden_dict['items'] = [item.to_dict() for item in orden.items]
            else:
                orden_dict['items'] = []

            ordenes_detalladas.append(orden_dict)

        return jsonify(ErrorHandler.create_success_response(
            data=ordenes_detalladas,
            message='Órdenes detalladas obtenidas exitosamente'
        )), 200
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener órdenes detalladas', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/', methods=['GET'])
@orden_required
def get_ordenes_activas():
    """Obtener todas las órdenes activas"""
    try:
        ordenes = OrdenService.obtener_ordenes_activas()
        return jsonify(ErrorHandler.create_success_response(
            data=[orden.to_dict() for orden in ordenes],
            message='Órdenes activas obtenidas exitosamente'
        )), 200
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener órdenes activas', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/<int:orden_id>', methods=['GET'])
@orden_required
def get_orden(orden_id):
    """Obtener una orden específica por ID"""
    try:
        orden = OrdenService.obtener_orden_por_id(orden_id)
        return jsonify(ErrorHandler.create_success_response(
            data=orden.to_dict(),
            message='Orden obtenida exitosamente'
        )), 200
    except ValueError as e:
        error_data = {
            "error": str(e),
            "code": 'NOT_FOUND',
            "details": f'No se encontró la orden con ID {orden_id}'
        }
        error_resp, status_code = ErrorHandler.create_error_response(error_data, 404)
        return jsonify(error_resp), status_code
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener orden', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/', methods=['POST'])
@orden_required
def crear_orden():
    """Crear una nueva orden"""
    try:
        data = request.get_json()

        # Validar campos requeridos
        required_fields = ['mesa_id', 'mozo_id']
        for field in required_fields:
            if field not in data:
                error_data = {
                    "error": f'Campo requerido faltante: {field}',
                    "code": 'MISSING_FIELD',
                    "details": f'El campo {field} es obligatorio'
                }
                error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
                return jsonify(error_resp), status_code

        # Validar num_comensales si se proporciona
        num_comensales = data.get('num_comensales', 1)
        if num_comensales < 1:
            error_data = {
                "error": 'Número de comensales inválido',
                "code": 'VALIDATION_ERROR',
                "details": 'El número de comensales debe ser al menos 1'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
            return jsonify(error_resp), status_code

        orden = OrdenService.crear_orden(
            mesa_id=data['mesa_id'],
            mozo_id=data['mozo_id'],
            tipo=data.get('tipo', 'local'),
            cliente_nombre=data.get('cliente_nombre'),
            num_comensales=num_comensales
        )

        return jsonify(ErrorHandler.create_success_response(
            data=orden.to_dict(),
            message='Orden creada exitosamente'
        )), 201

    except ValueError as e:
        error_data = {
            "error": str(e),
            "code": 'VALIDATION_ERROR',
            "details": str(e)
        }
        error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
        return jsonify(error_resp), status_code
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'crear orden', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/<int:orden_id>/productos', methods=['POST'])
@orden_required
def agregar_producto_a_orden(orden_id):
    """Agregar un producto a una orden existente"""
    try:
        data = request.get_json()

        # Validar campos requeridos
        required_fields = ['producto_id', 'cantidad', 'precio_unitario']
        for field in required_fields:
            if field not in data:
                error_data = {
                    "error": f'Campo requerido faltante: {field}',
                    "code": 'MISSING_FIELD',
                    "details": f'El campo {field} es obligatorio'
                }
                error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
                return jsonify(error_resp), status_code

        item = OrdenService.agregar_producto_a_orden(
            orden_id=orden_id,
            producto_id=data['producto_id'],
            cantidad=data['cantidad'],
            precio_unitario=data['precio_unitario'],
            estacion=data.get('estacion'),
            notas=data.get('notas')
        )

        return jsonify(ErrorHandler.create_success_response(
            data=item.to_dict(),
            message='Producto agregado a la orden exitosamente'
        )), 201

    except ValueError as e:
        error_data = {
            "error": str(e),
            "code": 'VALIDATION_ERROR',
            "details": str(e)
        }
        error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
        return jsonify(error_resp), status_code
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'agregar producto a orden', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/<int:orden_id>/cancelar', methods=['PUT'])
@orden_required
def cancelar_orden(orden_id):
    """Cancelar una orden"""
    try:
        orden = OrdenService.cancelar_orden(orden_id)

        return jsonify(ErrorHandler.create_success_response(
            data=orden.to_dict(),
            message='Orden cancelada exitosamente'
        )), 200

    except ValueError as e:
        error_data = {
            "error": str(e),
            "code": 'VALIDATION_ERROR',
            "details": str(e)
        }
        error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
        return jsonify(error_resp), status_code
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'cancelar orden', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

# --- RUTAS PARA COCINA ---

@orden_bp.route('/cocina/pendientes', methods=['GET'])
@cocina_or_admin_required
def get_ordenes_pendientes():
    """Obtener órdenes detalladas para cocina (confirmadas, preparando, lista, servida y con items en preparación)"""
    try:
        print("🍳 Endpoint /cocina/pendientes llamado")
        ordenes = OrdenService.obtener_ordenes_activas()
        print(f"🍳 Órdenes activas obtenidas: {len(ordenes)}")

        # Filtrar órdenes que cocina necesita ver:
        # 1. Órdenes en estado 'confirmada', 'preparando', 'lista', 'servida', 'cancelada'
        # 2. Órdenes que tienen items en estado 'en_cola', 'preparando', 'listo'
        ordenes_pendientes = [
            o for o in ordenes
            if o.estado in ['confirmada', 'preparando', 'lista', 'servida', 'cancelada'] or
               (o.items and any(item.estado in ['en_cola', 'preparando', 'listo'] for item in o.items))
        ]

        print(f"🍳 Órdenes filtradas para cocina: {len(ordenes_pendientes)}")

        ordenes_dict = []
        for orden in ordenes_pendientes:
            orden_dict = orden.to_dict()
            print(f"🍳 Orden {orden.id}: estado={orden.estado}, items={len(orden.items or [])}")
            ordenes_dict.append(orden_dict)

        return jsonify(ErrorHandler.create_success_response(
            data=ordenes_dict,
            message='Órdenes detalladas obtenidas exitosamente'
        )), 200
    except Exception as e:
        print(f"🍳 Error en /cocina/pendientes: {str(e)}")
        import traceback
        print(f"🍳 Traceback: {traceback.format_exc()}")
        error_dict = ErrorHandler.handle_service_error(e, 'obtener órdenes detalladas', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/<int:orden_id>/estado', methods=['PUT'])
@orden_required
def actualizar_estado_orden(orden_id):
    """Actualizar el estado de una orden"""
    try:
        print(f"🍳 Endpoint actualizar_estado_orden llamado para orden {orden_id}")

        # Verificar autorización
        current_user_id = get_jwt_identity()
        print(f"🍳 Usuario autenticado: {current_user_id}")

        data = request.get_json()
        print(f"🍳 Datos recibidos: {data}")

        if not data or 'estado' not in data:
            error_data = {
                "error": 'Campo requerido faltante: estado',
                "code": 'MISSING_FIELD',
                "details": 'El campo estado es obligatorio'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
            print(f"🍳 Error de validación: {error_resp}")
            return jsonify(error_resp), status_code

        print(f"🍳 Llamando a OrdenService.actualizar_estado_orden({orden_id}, {data['estado']})")
        orden = OrdenService.actualizar_estado_orden(orden_id, data['estado'])
        print(f"🍳 Orden actualizada correctamente: {orden.id} -> {orden.estado}")

        # Verificar que la orden existe y está en el estado correcto
        if not orden:
            error_data = {
                "error": 'Orden no encontrada después de actualización',
                "code": 'NOT_FOUND',
                "details": f'No se pudo encontrar la orden {orden_id} después de la actualización'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 404)
            print(f"🍳 Error: orden no encontrada después de actualización")
            return jsonify(error_resp), status_code

        response_data = orden.to_dict()
        print(f"🍳 Serializando orden: {response_data}")

        success_response = ErrorHandler.create_success_response(
            data=response_data,
            message='Estado de orden actualizado exitosamente'
        )
        print(f"🍳 Respuesta exitosa: {success_response}")

        return jsonify(success_response), 200

    except ValueError as e:
        error_data = {
            "error": str(e),
            "code": 'VALIDATION_ERROR',
            "details": str(e)
        }
        error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
        print(f"🍳 Error de validación: {error_resp}")
        return jsonify(error_resp), status_code
    except Exception as e:
        print(f"🍳 Error inesperado: {str(e)}")
        import traceback
        print(f"🍳 Traceback: {traceback.format_exc()}")
        error_dict = ErrorHandler.handle_service_error(e, 'actualizar estado de orden', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/items/<int:item_id>/estado', methods=['PUT'])
@cocina_or_admin_required
def actualizar_estado_item(item_id):
    """Actualizar el estado de un item específico"""
    try:
        data = request.get_json()

        if 'estado' not in data:
            error_data = {
                "error": 'Campo requerido faltante: estado',
                "code": 'MISSING_FIELD',
                "details": 'El campo estado es obligatorio'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
            return jsonify(error_resp), status_code

        item = OrdenService.actualizar_estado_item(item_id, data['estado'])

        return jsonify(ErrorHandler.create_success_response(
            data=item.to_dict(),
            message='Estado de item actualizado exitosamente'
        )), 200

    except ValueError as e:
        error_data = {
            "error": str(e),
            "code": 'VALIDATION_ERROR',
            "details": str(e)
        }
        error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
        return jsonify(error_resp), status_code
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'actualizar estado de item', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

# --- RUTAS PARA CAJA ---

@orden_bp.route('/caja/pendientes', methods=['GET'])
@orden_required
def get_ordenes_para_pagar():
    """Obtener órdenes listas para pagar (servidas)"""
    try:
        ordenes = OrdenService.obtener_ordenes_activas()
        # Filtrar solo las que están listas para pagar
        ordenes_pendientes = [o for o in ordenes if o.estado == 'servida']

        return jsonify(ErrorHandler.create_success_response(
            data=[orden.to_dict() for orden in ordenes_pendientes],
            message='Órdenes para pagar obtenidas exitosamente'
        )), 200
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener órdenes para pagar', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/<int:orden_id>/pagar', methods=['POST'])
@caja_or_admin_required
def procesar_pago(orden_id):
    """Procesar el pago de una orden"""
    try:
        data = request.get_json()

        if 'metodo' not in data:
            error_data = {
                "error": 'Campo requerido faltante: metodo',
                "code": 'MISSING_FIELD',
                "details": 'El campo metodo es obligatorio'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
            return jsonify(error_resp), status_code

        pago = OrdenService.procesar_pago(
            orden_id=orden_id,
            metodo=data['metodo'],
            monto=data.get('monto')
        )

        return jsonify(ErrorHandler.create_success_response(
            data=pago.to_dict(),
            message='Pago procesado exitosamente'
        )), 201

    except ValueError as e:
        error_data = {
            "error": str(e),
            "code": 'VALIDATION_ERROR',
            "details": str(e)
        }
        error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
        return jsonify(error_resp), status_code
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'procesar pago', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

# --- RUTAS PARA ADMINISTRADOR ---

@orden_bp.route('/estadisticas', methods=['GET'])
@admin_required
def get_estadisticas_pedidos():
    """Obtener estadísticas de pedidos para dashboard admin"""
    try:
        estadisticas = OrdenService.obtener_estadisticas_pedidos()

        return jsonify(ErrorHandler.create_success_response(
            data=estadisticas,
            message='Estadísticas de pedidos obtenidas exitosamente'
        )), 200
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener estadísticas de pedidos', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/historico', methods=['GET'])
@admin_required
def get_ordenes_historico():
    """Obtener histórico completo de órdenes"""
    try:
        # Obtener todas las órdenes (incluyendo pagadas y canceladas)
        ordenes = Orden.query.all()

        return jsonify(ErrorHandler.create_success_response(
            data=[orden.to_dict() for orden in ordenes],
            message='Histórico de órdenes obtenido exitosamente'
        )), 200
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener histórico de órdenes', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

# --- RUTAS ADICIONALES PARA CRUD COMPLETO ---

@orden_bp.route('/<int:orden_id>', methods=['PUT'])
@orden_required
def editar_orden(orden_id):
    """Edita una orden existente"""
    try:
        data = request.get_json()

        orden = OrdenService.editar_orden(orden_id, data)

        return jsonify(ErrorHandler.create_success_response(
            data=orden.to_dict(),
            message='Orden editada exitosamente'
        )), 200

    except ValueError as e:
        error_data = {
            "error": str(e),
            "code": 'VALIDATION_ERROR',
            "details": str(e)
        }
        error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
        return jsonify(error_resp), status_code
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'editar orden', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/<int:orden_id>', methods=['DELETE'])
@orden_required
def eliminar_orden(orden_id):
    """Elimina una orden"""
    try:
        result = OrdenService.eliminar_orden(orden_id)

        return jsonify(ErrorHandler.create_success_response(
            message='Orden eliminada exitosamente'
        )), 200

    except ValueError as e:
        error_data = {
            "error": str(e),
            "code": 'VALIDATION_ERROR',
            "details": str(e)
        }
        error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
        return jsonify(error_resp), status_code
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'eliminar orden', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/<int:orden_id>/items', methods=['GET'])
@orden_required
def get_items_orden(orden_id):
    """Obtiene todos los items de una orden específica"""
    try:
        items = OrdenService.obtener_items_por_orden(orden_id)

        return jsonify(ErrorHandler.create_success_response(
            data=[item.to_dict() for item in items],
            message='Items de orden obtenidos exitosamente'
        )), 200

    except ValueError as e:
        error_data = {
            "error": str(e),
            "code": 'VALIDATION_ERROR',
            "details": str(e)
        }
        error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
        return jsonify(error_resp), status_code
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener items de orden', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/items/<int:item_id>', methods=['PUT'])
@orden_required
def editar_item_orden(item_id):
    """Edita un item de orden específico"""
    try:
        data = request.get_json()

        item = OrdenService.editar_item_orden(item_id, data)

        return jsonify(ErrorHandler.create_success_response(
            data=item.to_dict(),
            message='Item de orden editado exitosamente'
        )), 200

    except ValueError as e:
        error_data = {
            "error": str(e),
            "code": 'VALIDATION_ERROR',
            "details": str(e)
        }
        error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
        return jsonify(error_resp), status_code
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'editar item de orden', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/items/<int:item_id>', methods=['DELETE'])
@orden_required
def eliminar_item_orden(item_id):
    """Elimina un item de orden"""
    try:
        result = OrdenService.eliminar_item_orden(item_id)

        return jsonify(ErrorHandler.create_success_response(
            message='Item de orden eliminado exitosamente'
        )), 200

    except ValueError as e:
        error_data = {
            "error": str(e),
            "code": 'VALIDATION_ERROR',
            "details": str(e)
        }
        error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
        return jsonify(error_resp), status_code
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'eliminar item de orden', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/mozo/<int:mozo_id>', methods=['GET'])
@orden_required
def get_ordenes_por_mozo(mozo_id):
    """Obtiene órdenes de un mozo específico"""
    try:
        ordenes = OrdenService.obtener_ordenes_por_mozo(mozo_id)

        return jsonify(ErrorHandler.create_success_response(
            data=[orden.to_dict() for orden in ordenes],
            message='Órdenes del mozo obtenidas exitosamente'
        )), 200

    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener órdenes por mozo', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/mesa/<int:mesa_id>', methods=['GET'])
@orden_required
def get_ordenes_por_mesa(mesa_id):
    """Obtiene órdenes de una mesa específica"""
    try:
        ordenes = OrdenService.obtener_ordenes_por_mesa(mesa_id)

        return jsonify(ErrorHandler.create_success_response(
            data=[orden.to_dict() for orden in ordenes],
            message='Órdenes de la mesa obtenidas exitosamente'
        )), 200

    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener órdenes por mesa', 'orden')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code


@orden_bp.route('/pagos', methods=['GET'])
@caja_or_admin_required
def get_pagos():
    """Obtiene todos los pagos"""
    try:
        pagos = CajaService.obtener_pagos_activos()
        return jsonify(ErrorHandler.create_success_response(
            data=[pago.to_dict() for pago in pagos],
            message='Pagos obtenidos exitosamente'
        )), 200
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener pagos', 'pago')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/pagos/<int:pago_id>', methods=['GET'])
@caja_or_admin_required
def get_pago(pago_id):
    """Obtiene un pago específico por ID"""
    try:
        pago = CajaService.obtener_pago_por_id(pago_id)
        return jsonify(ErrorHandler.create_success_response(
            data=pago.to_dict(),
            message='Pago obtenido exitosamente'
        )), 200
    except ValueError as e:
        error_data = {
            "error": str(e),
            "code": 'NOT_FOUND',
            "details": f'No se encontró el pago con ID {pago_id}'
        }
        error_resp, status_code = ErrorHandler.create_error_response(error_data, 404)
        return jsonify(error_resp), status_code
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener pago', 'pago')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/pagos/estadisticas', methods=['GET'])
@admin_required
def get_estadisticas_pagos():
    """Obtiene estadísticas de pagos"""
    try:
        estadisticas = CajaService.obtener_estadisticas_pagos()
        return jsonify(ErrorHandler.create_success_response(
            data=estadisticas,
            message='Estadísticas de pagos obtenidas exitosamente'
        )), 200
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener estadísticas de pagos', 'pago')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/pagos/fecha', methods=['GET'])
@caja_or_admin_required
def get_pagos_por_fecha():
    """Obtiene pagos por rango de fechas"""
    try:
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')

        if not fecha_inicio or not fecha_fin:
            error_data = {
                "error": 'Campos requeridos faltantes: fecha_inicio, fecha_fin',
                "code": 'MISSING_FIELD',
                "details": 'Ambos campos de fecha son obligatorios'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
            return jsonify(error_resp), status_code

        pagos = CajaService.obtener_pagos_por_fecha(fecha_inicio, fecha_fin)
        return jsonify(ErrorHandler.create_success_response(
            data=[pago.to_dict() for pago in pagos],
            message='Pagos por fecha obtenidos exitosamente'
        )), 200
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener pagos por fecha', 'pago')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/pagos/<int:pago_id>/anular', methods=['PUT'])
@caja_or_admin_required
def anular_pago(pago_id):
    """Anula un pago"""
    try:
        pago = CajaService.anular_pago(pago_id)
        return jsonify(ErrorHandler.create_success_response(
            data=pago.to_dict(),
            message='Pago anulado exitosamente'
        )), 200
    except ValueError as e:
        error_data = {
            "error": str(e),
            "code": 'VALIDATION_ERROR',
            "details": str(e)
        }
        error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
        return jsonify(error_resp), status_code
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'anular pago', 'pago')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@orden_bp.route('/cuentas-abiertas', methods=['GET'])
@caja_or_admin_required
def get_cuentas_abiertas():
    """Obtiene cuentas abiertas para pagar"""
    try:
        cuentas = CajaService.get_open_accounts()
        return jsonify(ErrorHandler.create_success_response(
            data=cuentas,
            message='Cuentas abiertas obtenidas exitosamente'
        )), 200
    except Exception as e:
        error_dict = ErrorHandler.handle_service_error(e, 'obtener cuentas abiertas', 'caja')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code
