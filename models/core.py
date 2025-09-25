from . import db

class SesionUsuario(db.Model):
    __tablename__ = 'sesion_usuario'

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    # Cambiamos de String(255) a Text para alojar tokens JWT de cualquier longitud
    token = db.Column(db.Text, nullable=False)
    device = db.Column(db.String(100))
    ip = db.Column(db.String(45))
    user_agent = db.Column(db.String(200))
    activa = db.Column(db.Boolean, default=True)
    inicio = db.Column(db.DateTime, server_default=db.func.now())
    ultimo_acceso = db.Column(db.DateTime, server_default=db.func.now())
    expiracion = db.Column(db.DateTime, nullable=False)

    usuario = db.relationship('Usuario', back_populates='sesiones')

    def __repr__(self):
        return f'<SesionUsuario {self.id} para Usuario {self.usuario_id}>'

class PermisoTemporal(db.Model):
    __tablename__ = 'permiso_temporal'

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    concedido_por = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    permiso = db.Column(db.String(100), nullable=False)
    area = db.Column(db.String(50))
    activo = db.Column(db.Boolean, default=True)
    creado_en = db.Column(db.DateTime, server_default=db.func.now())
    expira_en = db.Column(db.DateTime)

    usuario_receptor = db.relationship('Usuario', back_populates='permisos_recibidos', foreign_keys=[usuario_id])
    concedido_por_usuario = db.relationship('Usuario', back_populates='permisos_concedidos', foreign_keys=[concedido_por])

class Auditoria(db.Model):
    __tablename__ = 'auditoria'

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    entidad = db.Column(db.String(50))
    accion = db.Column(db.String(50))
    id_entidad = db.Column(db.Integer, nullable=True)
    valores_anteriores = db.Column(db.JSON)
    valores_nuevos = db.Column(db.JSON)
    ip = db.Column(db.String(45))
    fecha = db.Column(db.DateTime, server_default=db.func.now())

    usuario = db.relationship('Usuario', backref='auditorias')
