from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from models.user import Usuario
from services.caja_service import CajaService

caja_bp = Blueprint('caja_bp', __name__)

# --- Decorador para verificar rol de Caja o Admin ---
def caja_or_admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = Usuario.query.get(current_user_id)
        if user and (user.rol == 'caja' or user.rol == 'admin'):
            return fn(*args, **kwargs)
        else:
            return jsonify({"error": "Acceso denegado. Se requiere rol de Caja o Administrador."}), 403
    return wrapper

# --- Endpoint para la Interfaz de Caja ---

@caja_bp.route('/cuentas-abiertas', methods=['GET'])
@caja_or_admin_required
def get_open_accounts_for_cashier():
    """Obtiene todas las órdenes servidas listas para cobrar."""
    cuentas = CajaService.get_open_accounts()
    return jsonify(cuentas)
