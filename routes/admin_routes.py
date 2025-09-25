from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from models.user import Usuario
from services.admin_service import AdminService
from services.error_handler import ErrorHandler

admin_bp = Blueprint('admin_bp', __name__)

# --- Decorador de Rol de Administrador (ya existente) ---
def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = Usuario.query.get(current_user_id)
        if user and user.rol == 'admin':
            return fn(*args, **kwargs)
        else:
            return jsonify({"error": "Acceso denegado. Se requiere rol de administrador."}), 403
    wrapper.__name__ = f"admin_protected_{fn.__name__}"
    return wrapper

# --- Endpoints de Gestión de Usuarios ---
@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """Obtener lista de usuarios"""
    try:
        users = AdminService.get_users()
        return jsonify(users), 200
    except Exception as e:
        return jsonify({'error': f'Error obteniendo usuarios: {str(e)}'}), 500

@admin_bp.route('/users', methods=['POST'])
@admin_required
def create_user():
    """Crear nuevo usuario"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        user, error = AdminService.create_user(data)
        if error:
            return jsonify(error), 400
        
        return jsonify({
            'message': 'Usuario creado exitosamente',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Error creando usuario: {str(e)}'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """Actualizar usuario"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        user, error = AdminService.update_user(user_id, data)
        if error:
            return jsonify(error), 400
        
        return jsonify({
            'message': 'Usuario actualizado exitosamente',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error actualizando usuario: {str(e)}'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Eliminar usuario"""
    try:
        success, error = AdminService.delete_user(user_id)
        if error:
            return jsonify(error), 400
        
        return jsonify({'message': 'Usuario eliminado exitosamente'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Error eliminando usuario: {str(e)}'}), 500

# --- Endpoints de Gestión de Permisos (ya existentes) ---
# ... (rutas de /permissions se mantienen igual)

# --- NUEVOS Endpoints para Gestión de Productos ---

@admin_bp.route('/products', methods=['GET'])
@admin_required
def get_all_products():
    """Obtiene todos los productos del menú."""
    products = AdminService.get_all_products()
    return jsonify(products)

@admin_bp.route('/products', methods=['POST'])
@admin_required
def create_product():
    """Crea un nuevo producto."""
    data = request.get_json()
    new_product, error = AdminService.create_product(data)
    if error:
        return jsonify(error), 400
    # Devolvemos el producto recién creado para que el frontend pueda actualizar la tabla
    product_data = { "id": new_product.id, "nombre": new_product.nombre, "descripcion": new_product.descripcion, "precio": float(new_product.precio), "categoria": new_product.categoria.nombre, "tipo_estacion": new_product.tipo_estacion, "disponible": new_product.disponible }
    return jsonify({"mensaje": "Producto creado exitosamente", "producto": product_data}), 201

@admin_bp.route('/products/<int:product_id>/status', methods=['PUT'])
@admin_required
def update_product_status(product_id):
    """Actualiza el estado de disponibilidad de un producto."""
    data = request.get_json()
    disponible = data.get('disponible')
    if disponible is None:
        return jsonify({"error": "El campo 'disponible' es requerido."}), 400

    updated_product, error = AdminService.update_product_status(product_id, disponible)
    if error:
        return jsonify(error), 404
    return jsonify({"mensaje": "Estado del producto actualizado"})
