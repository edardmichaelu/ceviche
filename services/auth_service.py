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
