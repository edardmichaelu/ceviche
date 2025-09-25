from flask_sqlalchemy import SQLAlchemy

# Inicializa la instancia de la base de datos.
db = SQLAlchemy()

# Importar todos los modelos para que SQLAlchemy los reconozca
# al momento de crear las tablas (db.create_all()).
from .user import Usuario
from .core import SesionUsuario, PermisoTemporal, Auditoria
from .local import Piso, Zona, Mesa
from .menu import Categoria, Producto, Ingrediente, ProductoIngrediente
# Se importa Reserva junto con las otras clases de order.py
from .order import Orden, ItemOrden, Pago, Wishlist, Resena
from .reserva import Reserva
from .bloqueo import Bloqueo 
