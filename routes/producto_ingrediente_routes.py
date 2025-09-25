from flask import Blueprint, request, jsonify
from services.producto_ingrediente_service import ProductoIngredienteService
from services.error_handler import ErrorHandler
from routes.admin_routes import admin_required

producto_ingrediente_bp = Blueprint('producto_ingrediente_bp', __name__)

@producto_ingrediente_bp.route('/', methods=['GET'])
@admin_required
def get_productos_ingredientes():
    """Obtener todas las asociaciones producto-ingrediente"""
    try:
        asociaciones = ProductoIngredienteService.get_productos_ingredientes()
        return jsonify(ErrorHandler.create_success_response(
            data=asociaciones,
            message='Asociaciones producto-ingrediente obtenidas exitosamente'
        )), 200
    except Exception as e:
        # Asegurar respuesta JSON consistente en errores
        _, error_dict = ErrorHandler.handle_service_error(e, 'obtener asociaciones producto-ingrediente', 'producto-ingrediente')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@producto_ingrediente_bp.route('/<int:asociacion_id>', methods=['GET'])
@admin_required
def get_producto_ingrediente(asociacion_id):
    """Obtener una asociación producto-ingrediente específica por ID"""
    try:
        asociacion = ProductoIngredienteService.get_producto_ingrediente_by_id(asociacion_id)
        if asociacion is None:
            return jsonify({
                'success': False,
                'error': 'Asociación producto-ingrediente no encontrada',
                'code': 'NOT_FOUND'
            }), 404

        return jsonify({
            'success': True,
            'data': asociacion
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo asociación producto-ingrediente: {str(e)}'
        }), 500

@producto_ingrediente_bp.route('/producto/<int:producto_id>', methods=['GET'])
@admin_required
def get_ingredientes_by_producto(producto_id):
    """Obtener todos los ingredientes de un producto"""
    try:
        ingredientes = ProductoIngredienteService.get_ingredientes_by_producto(producto_id)
        return jsonify({
            'success': True,
            'data': ingredientes,
            'total': len(ingredientes),
            'producto_id': producto_id
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo ingredientes del producto: {str(e)}'
        }), 500

@producto_ingrediente_bp.route('/ingrediente/<int:ingrediente_id>', methods=['GET'])
@admin_required
def get_productos_by_ingrediente(ingrediente_id):
    """Obtener todos los productos que usan un ingrediente"""
    try:
        productos = ProductoIngredienteService.get_productos_by_ingrediente(ingrediente_id)
        return jsonify({
            'success': True,
            'data': productos,
            'total': len(productos),
            'ingrediente_id': ingrediente_id
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo productos del ingrediente: {str(e)}'
        }), 500

@producto_ingrediente_bp.route('/', methods=['POST'])
@admin_required
def create_producto_ingrediente():
    """Crear una nueva asociación producto-ingrediente"""
    try:
        data = request.get_json()
        if not data:
            error_data = {
                "error": 'Datos requeridos',
                "code": 'VALIDATION_ERROR',
                "details": 'Debe proporcionar los datos de la asociación producto-ingrediente'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
            return jsonify(error_resp), status_code

        success, result = ProductoIngredienteService.create_producto_ingrediente(data)

        if success:
            return jsonify(ErrorHandler.create_success_response(
                data=result,
                message='Asociación producto-ingrediente creada exitosamente'
            )), 201
        else:
            return jsonify(ErrorHandler.create_error_response(
                error=result.get('error', 'Error desconocido'),
                code='VALIDATION_ERROR'
            )), 400
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'crear asociación producto-ingrediente', 'producto-ingrediente')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@producto_ingrediente_bp.route('/<int:asociacion_id>', methods=['PUT'])
@admin_required
def update_producto_ingrediente(asociacion_id):
    """Actualizar una asociación producto-ingrediente existente"""
    try:
        data = request.get_json()
        if not data:
            error_data = {
                "error": 'Datos requeridos',
                "code": 'VALIDATION_ERROR',
                "details": 'Debe proporcionar los datos de la asociación producto-ingrediente'
            }
            error_resp, status_code = ErrorHandler.create_error_response(error_data, 400)
            return jsonify(error_resp), status_code

        success, result = ProductoIngredienteService.update_producto_ingrediente(asociacion_id, data)

        if success:
            return jsonify(ErrorHandler.create_success_response(
                data=result,
                message='Asociación producto-ingrediente actualizada exitosamente'
            )), 200
        else:
            return jsonify(ErrorHandler.create_error_response(
                error=result.get('error', 'Error desconocido'),
                code='VALIDATION_ERROR'
            )), 400
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'actualizar asociación producto-ingrediente', 'producto-ingrediente')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@producto_ingrediente_bp.route('/<int:asociacion_id>', methods=['DELETE'])
@admin_required
def delete_producto_ingrediente(asociacion_id):
    """Eliminar una asociación producto-ingrediente"""
    try:
        success, result = ProductoIngredienteService.delete_producto_ingrediente(asociacion_id)

        if success:
            return jsonify(ErrorHandler.create_success_response(
                message=result.get('message', 'Asociación producto-ingrediente eliminada exitosamente')
            )), 200
        else:
            return jsonify(ErrorHandler.create_error_response(
                error=result.get('error', 'Error desconocido'),
                code='VALIDATION_ERROR'
            )), 400
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'eliminar asociación producto-ingrediente', 'producto-ingrediente')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code

@producto_ingrediente_bp.route('/verificar-stock/<int:producto_id>', methods=['GET'])
# @admin_required  # Temporalmente comentado para debug
def verificar_stock_suficiente(producto_id):
    """Verificar si hay stock suficiente para producir un producto"""
    try:
        print(f"[DEBUG] Verificando stock para producto_id: {producto_id}")
        cantidad_necesaria = request.args.get('cantidad', 1, type=int)
        print(f"[DEBUG] Cantidad necesaria: {cantidad_necesaria}")

        success, result = ProductoIngredienteService.verificar_stock_suficiente(producto_id, cantidad_necesaria)
        print(f"[DEBUG] Resultado del servicio: success={success}, result={result}")

        if success:
            return jsonify(ErrorHandler.create_success_response(
                message=result.get('message', 'Stock suficiente disponible')
            )), 200
        else:
            return jsonify(ErrorHandler.create_error_response(
                error=result.get('error', 'Error verificando stock'),
                code='STOCK_ERROR',
                details={'ingredientes_insuficientes': result.get('ingredientes_insuficientes', [])}
            )), 400
    except Exception as e:
        _, error_dict = ErrorHandler.handle_service_error(e, 'verificar stock suficiente', 'producto-ingrediente')
        error_resp, status_code = ErrorHandler.create_error_response(error_dict, 500)
        return jsonify(error_resp), status_code
