from . import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

class Usuario(db.Model, UserMixin):
    __tablename__ = 'usuario'

    id = db.Column(db.Integer, primary_key=True)
    usuario = db.Column(db.String(80), unique=True, nullable=False)
    correo = db.Column(db.String(120), unique=True, nullable=False)
    contrasena = db.Column(db.String(255), nullable=False)
    rol = db.Column(db.Enum('admin', 'mozo', 'cocina', 'caja'), nullable=False, index=True)
    estacion = db.Column(db.String(50), nullable=True)
    activo = db.Column(db.Boolean, default=True, index=True)
    intentos_fallidos = db.Column(db.Integer, default=0)
    bloqueado_hasta = db.Column(db.DateTime, nullable=True)
    preferencias = db.Column(db.JSON, nullable=True)
    avatar = db.Column(db.String(255), nullable=True)
    fecha_creacion = db.Column(db.DateTime, server_default=db.func.now())
    fecha_actualizacion = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    # Relaciones
    sesiones = db.relationship('SesionUsuario', back_populates='usuario', cascade="all, delete-orphan")
    ordenes_atendidas = db.relationship('Orden', back_populates='mozo', foreign_keys='Orden.mozo_id')
    permisos_concedidos = db.relationship('PermisoTemporal', back_populates='concedido_por_usuario', foreign_keys='PermisoTemporal.concedido_por')
    permisos_recibidos = db.relationship('PermisoTemporal', back_populates='usuario_receptor', foreign_keys='PermisoTemporal.usuario_id')

    def set_password(self, password):
        self.contrasena = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.contrasena, password)

    def to_dict(self):
        return {
            'id': self.id,
            'usuario': self.usuario,
            'correo': self.correo,
            'rol': self.rol,
            'estacion': self.estacion,
            'activo': self.activo,
            'intentos_fallidos': self.intentos_fallidos,
            'bloqueado_hasta': self.bloqueado_hasta.isoformat() if self.bloqueado_hasta else None,
            'preferencias': self.preferencias,
            'avatar': self.avatar,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'fecha_actualizacion': self.fecha_actualizacion.isoformat() if self.fecha_actualizacion else None
        }

    def __repr__(self):
        return f'<Usuario {self.id}: {self.usuario}>'
