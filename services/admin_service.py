from models import db
from models.user import Usuario
from models.core import PermisoTemporal
from models.menu import Producto, Categoria # <-- Importar modelos de menú
from werkzeug.security import generate_password_hash
import datetime
from services.error_handler import ErrorHandler, ValidationError, BusinessLogicError

class AdminService:
    
    # --- Métodos de Gestión de Usuarios ---
    
    @staticmethod
    def get_users():
        """Obtener lista de usuarios"""
        users = Usuario.query.all()
        return [user.to_dict() for user in users]
    
    @staticmethod
    def create_user(data):
        """Crear nuevo usuario"""
        try:
            # Verificar si el usuario ya existe
            existing_user = Usuario.query.filter(
                (Usuario.usuario == data['usuario']) | 
                (Usuario.correo == data['correo'])
            ).first()
            
            if existing_user:
                return None, {"error": "El usuario o correo ya existe"}
            
            # Crear nuevo usuario
            user = Usuario(
                usuario=data['usuario'],
                correo=data['correo'],
                contrasena=generate_password_hash(data['contrasena']),
                rol=data['rol'],
                estacion=data.get('estacion'),
                activo=data.get('activo', True),
                avatar=data.get('avatar')
            )
            
            db.session.add(user)
            db.session.commit()
            
            return user, None
            
        except Exception as e:
            db.session.rollback()
            return ErrorHandler.handle_service_error(e, "crear usuario", "usuario")
    
    @staticmethod
    def update_user(user_id, data):
        """Actualizar usuario"""
        try:
            user = Usuario.query.get(user_id)
            if not user:
                return None, {"error": "Usuario no encontrado"}
            
            # Actualizar campos
            if 'usuario' in data:
                user.usuario = data['usuario']
            if 'correo' in data:
                user.correo = data['correo']
            if 'contrasena' in data:
                user.contrasena = generate_password_hash(data['contrasena'])
            if 'rol' in data:
                user.rol = data['rol']
            if 'estacion' in data:
                user.estacion = data['estacion']
            if 'activo' in data:
                user.activo = data['activo']
            if 'avatar' in data:
                user.avatar = data['avatar']
            
            db.session.commit()
            return user, None
            
        except Exception as e:
            db.session.rollback()
            return ErrorHandler.handle_service_error(e, "actualizar usuario", "usuario")
    
    @staticmethod
    def delete_user(user_id):
        """Eliminar usuario"""
        try:
            user = Usuario.query.get(user_id)
            if not user:
                return False, {"error": "Usuario no encontrado"}
            
            db.session.delete(user)
            db.session.commit()
            return True, None
            
        except Exception as e:
            db.session.rollback()
            return ErrorHandler.handle_service_error(e, "eliminar usuario", "usuario")

    # --- NUEVOS Métodos de Gestión de Productos ---

    @staticmethod
    def get_all_products():
        """Devuelve una lista de todos los productos."""
        products = Producto.query.order_by(Producto.id).all()
        return [
            {
                "id": p.id,
                "nombre": p.nombre,
                "descripcion": p.descripcion,
                "precio": float(p.precio),
                "categoria": p.categoria.nombre,
                "tipo_estacion": p.tipo_estacion,
                "disponible": p.disponible,
            } for p in products
        ]

    @staticmethod
    def create_product(data):
        """Crea un nuevo producto."""
        # Aquí iría la lógica para encontrar o crear la categoría
        # Por simplicidad, asumimos que la categoría ya existe
        categoria = Categoria.query.filter_by(nombre=data.get('categoria','Varios')).first()
        if not categoria:
            categoria = Categoria(nombre=data.get('categoria','Varios'))
            db.session.add(categoria)

        new_product = Producto(
            nombre=data['nombre'],
            descripcion=data.get('descripcion'),
            precio=data['precio'],
            categoria=categoria,
            tipo_estacion=data['tipo_estacion'],
            disponible=data.get('disponible', True)
        )
        db.session.add(new_product)
        db.session.commit()
        return new_product, None

    @staticmethod
    def update_product_status(product_id, disponible):
        """Actualiza solo el estado de disponibilidad de un producto."""
        product = Producto.query.get(product_id)
        if not product:
            return None, {"error": "Producto no encontrado."}
        product.disponible = disponible
        db.session.commit()
        return product, None
