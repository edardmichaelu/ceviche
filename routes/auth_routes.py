import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from services.auth_service import AuthService
from models import db
from models.core import SesionUsuario
from models.user import Usuario

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    """Obtener información del perfil del usuario actual"""
    try:
        current_user_id = get_jwt_identity()
        print(f"🔍 JWT Identity: {current_user_id} (tipo: {type(current_user_id)})")

        # Convertir a int si es string
        if isinstance(current_user_id, str):
            try:
                current_user_id = int(current_user_id)
                print(f"✅ ID convertido a int: {current_user_id}")
            except ValueError:
                print(f"❌ No se pudo convertir ID a int: {current_user_id}")
                return jsonify({"error": "ID de usuario inválido"}), 400

        user = Usuario.query.get(current_user_id)

        if not user:
            print(f"❌ Usuario no encontrado con ID: {current_user_id}")
            return jsonify({"error": "Usuario no encontrado"}), 404

        print(f"✅ Usuario encontrado: {user.usuario} (ID: {user.id}, Rol: {user.rol})")
        return jsonify({
            "success": True,
            "data": {
                "id": user.id,
                "usuario": user.usuario,
                "rol": user.rol,
                "activo": user.activo,
                "email": user.correo
            },
            "message": "Perfil de usuario obtenido exitosamente"
        })
    except Exception as e:
        print(f"❌ Error al obtener perfil: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error al obtener perfil: {str(e)}"}), 500

@auth_bp.route('/test-jwt', methods=['GET'])
@jwt_required()
def test_jwt():
    """Endpoint de prueba para verificar JWT"""
    try:
        current_user_id = get_jwt_identity()
        print(f"🔍 Test JWT - Identity: {current_user_id}")

        return jsonify({
            "success": True,
            "message": "JWT funcionando correctamente",
            "identity": str(current_user_id),
            "type": str(type(current_user_id))
        })
    except Exception as e:
        print(f"❌ Error en test JWT: {str(e)}")
        return jsonify({"error": f"Error JWT: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Endpoint para el inicio de sesión de usuarios."""
    data = request.get_json()
    if not data or not data.get('identifier') or not data.get('password'):
        return jsonify({"error": "El identificador y la contraseña son requeridos"}), 400

    identifier = data.get('identifier')
    password = data.get('password')

    user_obj = AuthService.login_user(identifier, password)

    if not user_obj:
        return jsonify({"error": "Credenciales inválidas"}), 401

    if not user_obj.activo:
        return jsonify({"error": "Este usuario ha sido desactivado."}), 403

    try:
        # Crear el token JWT. La "identidad" del token es el ID del usuario como string.
        expires = datetime.timedelta(hours=8)
        access_token = create_access_token(identity=str(user_obj.id), expires_delta=expires)

        # Crear el registro de la sesión en la base de datos
        nueva_sesion = SesionUsuario(
            usuario_id=user_obj.id,
            token=access_token,  # En un sistema más complejo, se podría guardar un hash del token
            ip=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            expiracion=(datetime.datetime.now(datetime.timezone.utc) + expires)
        )
        db.session.add(nueva_sesion)
        db.session.commit()

        return jsonify({
            "mensaje": f"Bienvenido, {user_obj.usuario}!",
            "access_token": access_token,
            "usuario": {
                "id": user_obj.id,
                "usuario": user_obj.usuario,
                "rol": user_obj.rol,
                "estacion": user_obj.estacion
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        # En un entorno de producción, aquí se registraría el error en un log
        print(f"Error al crear la sesión: {e}")
        return jsonify({"error": "No se pudo procesar el inicio de sesión. Inténtelo de nuevo."}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Endpoint para cerrar la sesión de un usuario."""
    # Esta ruta deberá ser protegida con @jwt_required()
    # y la lógica para invalidar el token se implementará aquí.
    return jsonify({"mensaje": "Sesión cerrada exitosamente (funcionalidad pendiente)"}), 200

