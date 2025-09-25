from . import db
from datetime import datetime

class Orden(db.Model):
    __tablename__ = 'orden'

    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.String(20), unique=True, nullable=False)
    mesa_id = db.Column(db.Integer, db.ForeignKey('mesa.id'))
    mozo_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    tipo = db.Column(db.Enum('local', 'llevar', 'delivery'), nullable=False)
    estado = db.Column(db.Enum('pendiente', 'confirmada', 'preparando', 'lista', 'servida', 'pagada', 'cancelada'), nullable=False)
    monto_total = db.Column(db.Numeric(10, 2), nullable=False)
    num_comensales = db.Column(db.Integer, nullable=False, default=1)  # Número de comensales en esta orden
    cliente_nombre = db.Column(db.String(100), nullable=True)
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)
    actualizado_en = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    mesa = db.relationship('Mesa', back_populates='ordenes')
    mozo = db.relationship('Usuario', back_populates='ordenes_atendidas', overlaps="ordenes_mozo")
    items = db.relationship('ItemOrden', back_populates='orden', cascade='all, delete-orphan')
    pagos = db.relationship('Pago', back_populates='orden', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'numero': self.numero,
            'mesa_id': self.mesa_id,
            'mozo_id': self.mozo_id,
            'tipo': self.tipo,
            'estado': self.estado,
            'monto_total': float(self.monto_total),
            'num_comensales': self.num_comensales,
            'cliente_nombre': self.cliente_nombre,
            'creado_en': self.creado_en.isoformat() if self.creado_en else None,
            'actualizado_en': self.actualizado_en.isoformat() if self.actualizado_en else None,
            'total': float(self.monto_total),  # Alias para compatibilidad
            'items': [item.to_dict() for item in self.items] if self.items else []
        }

class ItemOrden(db.Model):
    __tablename__ = 'item_orden'
    
    id = db.Column(db.Integer, primary_key=True)
    orden_id = db.Column(db.Integer, db.ForeignKey('orden.id'), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey('producto.id'), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    precio_unitario = db.Column(db.Numeric(10, 2), nullable=False)
    estado = db.Column(db.Enum('pendiente', 'en_cola', 'preparando', 'listo', 'servido', 'cancelado'), nullable=False)
    estacion = db.Column(db.Enum('frio', 'caliente', 'bebida', 'postre'))
    fecha_inicio = db.Column(db.DateTime)
    fecha_listo = db.Column(db.DateTime)
    fecha_servido = db.Column(db.DateTime)
    notas = db.Column(db.Text, nullable=True)
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)
    actualizado_en = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    orden = db.relationship('Orden', back_populates='items')
    producto = db.relationship('Producto', back_populates='items_orden')
    
    def to_dict(self):
        return {
            'id': self.id,
            'orden_id': self.orden_id,
            'producto_id': self.producto_id,
            'cantidad': self.cantidad,
            'precio_unitario': float(self.precio_unitario),
            'estado': self.estado,
            'estacion': self.estacion,
            'fecha_inicio': self.fecha_inicio.isoformat() if self.fecha_inicio else None,
            'fecha_listo': self.fecha_listo.isoformat() if self.fecha_listo else None,
            'fecha_servido': self.fecha_servido.isoformat() if self.fecha_servido else None,
            'notas': self.notas,
            'creado_en': self.creado_en.isoformat() if self.creado_en else None,
            'actualizado_en': self.actualizado_en.isoformat() if self.actualizado_en else None,
            'producto': {
                'id': self.producto.id if self.producto else None,
                'nombre': self.producto.nombre if self.producto else None,
                'descripcion': self.producto.descripcion if self.producto else None
            } if self.producto else None
        }

class Pago(db.Model):
    __tablename__ = 'pago'
    
    id = db.Column(db.Integer, primary_key=True)
    orden_id = db.Column(db.Integer, db.ForeignKey('orden.id'), nullable=False)
    monto = db.Column(db.Numeric(10, 2), nullable=False)
    metodo = db.Column(db.Enum('efectivo', 'tarjeta', 'yape', 'plin', 'transferencia'), nullable=False)
    estado = db.Column(db.Enum('pendiente', 'pagado', 'anulado'), nullable=False)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relaciones
    orden = db.relationship('Orden', back_populates='pagos')
    
    def to_dict(self):
        return {
            'id': self.id,
            'orden_id': self.orden_id,
            'monto': float(self.monto),
            'metodo': self.metodo,
            'estado': self.estado,
            'fecha': self.fecha.isoformat() if self.fecha else None
        }

class Wishlist(db.Model):
    __tablename__ = 'wishlist'
    
    id = db.Column(db.Integer, primary_key=True)
    qr_sesion_id = db.Column(db.String(100), nullable=False)
    mesa_id = db.Column(db.Integer, db.ForeignKey('mesa.id'), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey('producto.id'), nullable=False)
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relaciones
    mesa = db.relationship('Mesa', back_populates='wishlists')
    producto = db.relationship('Producto', backref='wishlist_items')
    
    def to_dict(self):
        return {
            'id': self.id,
            'qr_sesion_id': self.qr_sesion_id,
            'mesa_id': self.mesa_id,
            'producto_id': self.producto_id,
            'creado_en': self.creado_en.isoformat() if self.creado_en else None
        }

class Resena(db.Model):
    __tablename__ = 'resena'
    
    id = db.Column(db.Integer, primary_key=True)
    producto_id = db.Column(db.Integer, db.ForeignKey('producto.id'), nullable=False)
    nombre_cliente = db.Column(db.String(100))
    puntuacion = db.Column(db.Integer)
    comentario = db.Column(db.Text)
    aprobada = db.Column(db.Boolean, default=None)
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relaciones
    producto = db.relationship('Producto', back_populates='resenas')
    
    def to_dict(self):
        return {
            'id': self.id,
            'producto_id': self.producto_id,
            'nombre_cliente': self.nombre_cliente,
            'puntuacion': self.puntuacion,
            'comentario': self.comentario,
            'aprobada': self.aprobada,
            'creado_en': self.creado_en.isoformat() if self.creado_en else None
        }

