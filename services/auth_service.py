from sqlalchemy import or_
from models.user import Usuario
from werkzeug.security import check_password_hash

class AuthService:
    """Servicio para manejar la lógica de autenticación."""

    @staticmethod
    def login_user(identifier, password):
        """
        Valida las credenciales del usuario usando su nombre de usuario O su correo electrónico.
        
        Args:
            identifier (str): El nombre de usuario o el correo del usuario.
            password (str): La contraseña del usuario.

        Returns:
            Usuario: El objeto de usuario si la autenticación es exitosa, None en caso contrario.
        """
        # Buscar al usuario por nombre de usuario o por correo (insensible a mayúsculas/minúsculas)
        user_obj = Usuario.query.filter(
            or_(Usuario.usuario.ilike(identifier), Usuario.correo.ilike(identifier))
        ).first()

        # Verificar si el usuario existe y si la contraseña es correcta
        if user_obj and check_password_hash(user_obj.contrasena, password):
            return user_obj
        
        return None

    @staticmethod
    def logout_user(token):
        """
        Invalida el token de sesión del usuario.
        """
        # Lógica para añadir el token a una lista negra o eliminarlo de la BD
        print(f"Invalidando token: {token}")
        return True

    @staticmethod
    def update_user_profile(user_id, profile_data):
        """
        Actualiza el perfil del usuario actual.

        Args:
            user_id (int): ID del usuario a actualizar
            profile_data (dict): Datos del perfil a actualizar

        Returns:
            tuple: (Usuario actualizado, None) si exitoso, (None, dict_error) si error
        """
        try:
            from models import db

            user = Usuario.query.get(user_id)
            if not user:
                return None, {"error": "Usuario no encontrado", "code": "NOT_FOUND"}

            # Verificar si se está cambiando el usuario o correo (deben ser únicos)
            if 'usuario' in profile_data and profile_data['usuario'] != user.usuario:
                existing_user = Usuario.query.filter_by(usuario=profile_data['usuario']).first()
                if existing_user:
                    return None, {"error": "El nombre de usuario ya existe", "code": "VALIDATION_ERROR"}

            if 'correo' in profile_data and profile_data['correo'] != user.correo:
                existing_email = Usuario.query.filter_by(correo=profile_data['correo']).first()
                if existing_email:
                    return None, {"error": "El correo electrónico ya está en uso", "code": "VALIDATION_ERROR"}

            # Actualizar campos permitidos para edición de perfil
            allowed_fields = ['usuario', 'correo', 'avatar']
            for field in allowed_fields:
                if field in profile_data:
                    setattr(user, field, profile_data[field])

            # Si se proporciona contraseña, actualizarla
            if 'contrasena' in profile_data and profile_data['contrasena']:
                user.set_password(profile_data['contrasena'])

            db.session.commit()
            return user, None

        except Exception as e:
            db.session.rollback()
            return None, {"error": f"Error actualizando perfil: {str(e)}", "code": "INTERNAL_ERROR"}