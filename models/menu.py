from . import db
from datetime import datetime

class TipoIngrediente(db.Model):
    __tablename__ = 'tipo_ingrediente'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False, unique=True)
    descripcion = db.Column(db.Text)
    color = db.Column(db.String(7), default='#6B7280')  # Color hex para categorización visual

    ingredientes = db.relationship('Ingrediente', back_populates='tipo')

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'color': self.color
        }

class Categoria(db.Model):
    __tablename__ = 'categoria'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), unique=True, nullable=False)
    descripcion = db.Column(db.Text)
    icono = db.Column(db.String(10), default='🍽️')
    color = db.Column(db.String(20), default='blue')
    activo = db.Column(db.Boolean, default=True)

    productos = db.relationship('Producto', back_populates='categoria', cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Categoria {self.id}: {self.nombre}>'

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'icono': self.icono,
            'color': self.color,
            'activo': self.activo,
            'cantidad_productos': len(self.productos) if self.productos else 0,
            'creado_en': self.creado_en.isoformat() if hasattr(self, 'creado_en') and self.creado_en else None,
            'actualizado_en': self.actualizado_en.isoformat() if hasattr(self, 'actualizado_en') and self.actualizado_en else None
        }

class ProductoImagen(db.Model):
    __tablename__ = 'producto_imagen'

    id = db.Column(db.Integer, primary_key=True)
    producto_id = db.Column(db.Integer, db.ForeignKey('producto.id'), nullable=False)
    imagen_url = db.Column(db.String(255), nullable=False)
    orden = db.Column(db.Integer, default=0)  # Para ordenar las imágenes
    es_principal = db.Column(db.Boolean, default=False)  # Para marcar la imagen principal
    descripcion = db.Column(db.String(200))  # Descripción opcional de la imagen
    creado_en = db.Column(db.DateTime, server_default=db.func.now())

    producto = db.relationship('Producto', back_populates='imagenes')

    def to_dict(self):
        return {
            'id': self.id,
            'producto_id': self.producto_id,
            'imagen_url': self.imagen_url,
            'orden': self.orden,
            'es_principal': self.es_principal,
            'descripcion': self.descripcion,
            'creado_en': self.creado_en.isoformat() if self.creado_en else None
        }

class Producto(db.Model):
    __tablename__ = 'producto'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text)
    precio = db.Column(db.Numeric(10, 2), nullable=False)
    categoria_id = db.Column(db.Integer, db.ForeignKey('categoria.id'), nullable=False)
    tipo_estacion = db.Column(db.Enum('frio', 'caliente', 'bebida', 'postre'), nullable=False)
    tiempo_preparacion = db.Column(db.Integer)
    nivel_picante = db.Column(db.Enum('ninguno', 'bajo', 'medio', 'alto'))
    ingredientes = db.Column(db.Text)
    etiquetas = db.Column(db.String(200))
    disponible = db.Column(db.Boolean, default=True, index=True)
    stock = db.Column(db.Integer)
    alerta_stock = db.Column(db.Integer, default=0)
    es_favorito = db.Column(db.Boolean, default=False, index=True)  # Campo para favoritos
    imagen_url = db.Column(db.String(255))  # Mantener para compatibilidad con imagen principal
    creado_en = db.Column(db.DateTime, server_default=db.func.now())
    actualizado_en = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    categoria = db.relationship('Categoria', back_populates='productos')
    items_orden = db.relationship('ItemOrden', back_populates='producto')
    ingredientes_asociados = db.relationship('ProductoIngrediente', back_populates='producto', cascade="all, delete-orphan")
    resenas = db.relationship('Resena', back_populates='producto', cascade="all, delete-orphan")
    imagenes = db.relationship('ProductoImagen', back_populates='producto', cascade="all, delete-orphan", order_by="ProductoImagen.orden")

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'precio': float(self.precio) if self.precio else 0,
            'categoria_id': self.categoria_id,
            'categoria': self.categoria.to_dict() if self.categoria else None,
            'tipo_estacion': self.tipo_estacion,
            'tiempo_preparacion': self.tiempo_preparacion,
            'nivel_picante': self.nivel_picante,
            'ingredientes': self.ingredientes,
            'etiquetas': self.etiquetas,
            'disponible': self.disponible,
            'stock': self.stock,
            'alerta_stock': self.alerta_stock,
            'es_favorito': self.es_favorito,
            'imagen_url': getattr(self, 'imagen_url', None),  # Para compatibilidad
            'imagenes': [imagen.to_dict() for imagen in self.imagenes] if self.imagenes else [],
            'creado_en': self.creado_en.isoformat() if self.creado_en else None,
            'actualizado_en': self.actualizado_en.isoformat() if self.actualizado_en else None
        }

class Ingrediente(db.Model):
    __tablename__ = 'ingrediente'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text)
    stock = db.Column(db.Numeric(10, 3), default=0)
    stock_minimo = db.Column(db.Numeric(10, 3), default=0)
    unidad = db.Column(db.String(20))
    precio_unitario = db.Column(db.Numeric(10, 2), default=0)
    tipo_ingrediente_id = db.Column(db.Integer, db.ForeignKey('tipo_ingrediente.id'))
    activo = db.Column(db.Boolean, default=True, index=True)
    fecha_vencimiento = db.Column(db.Date)
    proveedor = db.Column(db.String(100))
    codigo_barras = db.Column(db.String(50), unique=True)
    ubicacion_almacen = db.Column(db.String(50))

    creado_en = db.Column(db.DateTime, server_default=db.func.now())
    actualizado_en = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    # Relaciones
    tipo = db.relationship('TipoIngrediente', back_populates='ingredientes')
    productos_asociados = db.relationship('ProductoIngrediente', back_populates='ingrediente')

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'stock': float(self.stock),
            'stock_minimo': float(self.stock_minimo),
            'unidad': self.unidad,
            'precio_unitario': float(self.precio_unitario),
            'tipo_ingrediente_id': self.tipo_ingrediente_id,
            'tipo_ingrediente': self.tipo.to_dict() if self.tipo else None,
            'activo': self.activo,
            'fecha_vencimiento': self.fecha_vencimiento.isoformat() if self.fecha_vencimiento else None,
            'proveedor': self.proveedor,
            'codigo_barras': self.codigo_barras,
            'ubicacion_almacen': self.ubicacion_almacen,
            'creado_en': self.creado_en.isoformat() if self.creado_en else None,
            'actualizado_en': self.actualizado_en.isoformat() if self.actualizado_en else None
        }

class ProductoIngrediente(db.Model):
    __tablename__ = 'producto_ingrediente'

    id = db.Column(db.Integer, primary_key=True)
    producto_id = db.Column(db.Integer, db.ForeignKey('producto.id'), nullable=False)
    ingrediente_id = db.Column(db.Integer, db.ForeignKey('ingrediente.id'), nullable=False)
    cantidad = db.Column(db.Numeric(10, 3), nullable=False)

    producto = db.relationship('Producto', back_populates='ingredientes_asociados')
    ingrediente = db.relationship('Ingrediente', back_populates='productos_asociados')

    def to_dict(self):
        return {
            'id': self.id,
            'producto_id': self.producto_id,
            'ingrediente_id': self.ingrediente_id,
            'cantidad': float(self.cantidad),
            'producto': self.producto.to_dict() if self.producto else None,
            'ingrediente': self.ingrediente.to_dict() if self.ingrediente else None
        }
