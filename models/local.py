from . import db
from datetime import datetime
from sqlalchemy import Index

class Piso(db.Model):
    """Modelo para los pisos del local"""
    __tablename__ = 'piso'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text)
    orden = db.Column(db.Integer, default=0)  # Para ordenar los pisos
    activo = db.Column(db.Boolean, default=True)
    creado_en = db.Column(db.DateTime, server_default=db.func.now())
    actualizado_en = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
    
    # Relaciones
    zonas = db.relationship('Zona', back_populates='piso', cascade='all, delete-orphan')
    bloqueos = db.relationship('Bloqueo', back_populates='piso', cascade='all, delete-orphan')
    
    # Índices
    __table_args__ = (
        Index('idx_piso_activo', 'activo'),
        Index('idx_piso_orden', 'orden'),
    )
    
    def __repr__(self):
        return f'<Piso {self.nombre}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'orden': self.orden,
            'activo': self.activo,
            'creado_en': self.creado_en.isoformat() if self.creado_en else None,
            'actualizado_en': self.actualizado_en.isoformat() if self.actualizado_en else None,
            'total_zonas': len(self.zonas) if self.zonas else 0
        }

class Zona(db.Model):
    """Modelo para las zonas del restaurante"""
    __tablename__ = 'zona'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text)
    tipo = db.Column(db.String(50), nullable=False)  # 'salon', 'terraza', 'barra', 'privada', etc.
    capacidad_maxima = db.Column(db.Integer, default=0)
    piso_id = db.Column(db.Integer, db.ForeignKey('piso.id'), nullable=False)
    orden = db.Column(db.Integer, default=0)  # Para ordenar las zonas
    activo = db.Column(db.Boolean, default=True)
    color = db.Column(db.String(7), default='#3B82F6')  # Color hexadecimal para UI
    icono = db.Column(db.String(50), default='🏢')  # Emoji o icono
    creado_en = db.Column(db.DateTime, server_default=db.func.now())
    actualizado_en = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
    
    # Relaciones
    piso = db.relationship('Piso', back_populates='zonas')
    mesas = db.relationship('Mesa', back_populates='zona', cascade='all, delete-orphan')
    reservas = db.relationship('Reserva', back_populates='zona', cascade='all, delete-orphan')
    bloqueos = db.relationship('Bloqueo', back_populates='zona', cascade='all, delete-orphan')
    
    # Índices
    __table_args__ = (
        Index('idx_zona_piso', 'piso_id'),
        Index('idx_zona_tipo', 'tipo'),
        Index('idx_zona_activo', 'activo'),
        Index('idx_zona_orden', 'orden'),
    )
    
    def __repr__(self):
        return f'<Zona {self.nombre} en {self.piso.nombre if self.piso else "Sin piso"}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'tipo': self.tipo,
            'capacidad_maxima': self.capacidad_maxima,
            'piso_id': self.piso_id,
            'piso_nombre': self.piso.nombre if self.piso else None,
            'orden': self.orden,
            'activo': self.activo,
            'color': self.color,
            'icono': self.icono,
            'creado_en': self.creado_en.isoformat() if self.creado_en else None,
            'actualizado_en': self.actualizado_en.isoformat() if self.actualizado_en else None,
            'total_mesas': len(self.mesas) if self.mesas else 0,
            'mesas_ocupadas': len([m for m in self.mesas if m.estado == 'ocupada']) if self.mesas else 0
        }

class Mesa(db.Model):
    """Modelo para las mesas del restaurante"""
    __tablename__ = 'mesa'
    
    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.String(20), nullable=False)  # Número visible de la mesa
    capacidad = db.Column(db.Integer, default=4)  # Capacidad de comensales
    zona_id = db.Column(db.Integer, db.ForeignKey('zona.id'), nullable=False)
    estado = db.Column(db.Enum('disponible', 'ocupada', 'limpieza', 'reservada', 'fuera_servicio'), default='disponible')
    qr_code = db.Column(db.String(255), unique=True)  # Código QR único
    posicion_x = db.Column(db.Float, default=0.0)  # Posición X en el mapa
    posicion_y = db.Column(db.Float, default=0.0)  # Posición Y en el mapa
    activo = db.Column(db.Boolean, default=True)
    notas = db.Column(db.Text)  # Notas especiales de la mesa
    creado_en = db.Column(db.DateTime, server_default=db.func.now())
    actualizado_en = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
    
    # Relaciones
    zona = db.relationship('Zona', back_populates='mesas')
    ordenes = db.relationship('Orden', back_populates='mesa', cascade='all, delete-orphan')
    wishlists = db.relationship('Wishlist', back_populates='mesa', cascade='all, delete-orphan')
    reservas = db.relationship('Reserva', back_populates='mesa', cascade='all, delete-orphan')
    bloqueos = db.relationship('Bloqueo', back_populates='mesa', cascade='all, delete-orphan')
    
    # Índices
    __table_args__ = (
        Index('idx_mesa_zona', 'zona_id'),
        Index('idx_mesa_estado', 'estado'),
        Index('idx_mesa_activo', 'activo'),
        Index('idx_mesa_qr', 'qr_code'),
        Index('idx_mesa_numero', 'numero'),
    )
    
    def __repr__(self):
        return f'<Mesa {self.numero} en {self.zona.nombre if self.zona else "Sin zona"}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'numero': self.numero,
            'capacidad': self.capacidad,
            'zona_id': self.zona_id,
            'zona_nombre': self.zona.nombre if self.zona else None,
            'estado': self.estado,
            'qr_code': self.qr_code,
            'posicion_x': self.posicion_x,
            'posicion_y': self.posicion_y,
            'activo': self.activo,
            'notas': self.notas,
            'creado_en': self.creado_en.isoformat() if self.creado_en else None,
            'actualizado_en': self.actualizado_en.isoformat() if self.actualizado_en else None,
            'total_ordenes': len(self.ordenes) if self.ordenes else 0
        }
    
    def generar_qr_code(self):
        """Genera un código QR único para la mesa"""
        import uuid
        if not self.qr_code:
            self.qr_code = f"MESA_{self.id}_{uuid.uuid4().hex[:8].upper()}"
        return self.qr_code