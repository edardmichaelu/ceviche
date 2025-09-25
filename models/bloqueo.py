from . import db
from datetime import datetime

class Bloqueo(db.Model):
    __tablename__ = 'bloqueo'
    
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text)
    fecha_inicio = db.Column(db.Date, nullable=False)
    hora_inicio = db.Column(db.Time, nullable=False)
    fecha_fin = db.Column(db.Date, nullable=False)
    hora_fin = db.Column(db.Time, nullable=False)
    tipo = db.Column(db.Enum('mantenimiento', 'evento', 'reserva_privada', 'otro'), nullable=False)
    estado = db.Column(db.Enum('programado', 'activo', 'completado', 'cancelado'), default='programado', nullable=False)
    
    # Relaciones
    mesa_id = db.Column(db.Integer, db.ForeignKey('mesa.id'))
    zona_id = db.Column(db.Integer, db.ForeignKey('zona.id'))
    piso_id = db.Column(db.Integer, db.ForeignKey('piso.id'))
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    
    mesa = db.relationship('Mesa', back_populates='bloqueos')
    zona = db.relationship('Zona', back_populates='bloqueos')
    piso = db.relationship('Piso', back_populates='bloqueos')
    usuario = db.relationship('Usuario', backref='bloqueos')
    
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)
    actualizado_en = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'titulo': self.titulo,
            'descripcion': self.descripcion,
            'fecha_inicio': self.fecha_inicio.isoformat() if self.fecha_inicio else None,
            'hora_inicio': self.hora_inicio.isoformat() if self.hora_inicio else None,
            'fecha_fin': self.fecha_fin.isoformat() if self.fecha_fin else None,
            'hora_fin': self.hora_fin.isoformat() if self.hora_fin else None,
            'tipo': self.tipo,
            'estado': self.estado,
            'mesa_id': self.mesa_id,
            'zona_id': self.zona_id,
            'piso_id': self.piso_id,
            'usuario_id': self.usuario_id,
            'creado_en': self.creado_en.isoformat() if self.creado_en else None,
            'actualizado_en': self.actualizado_en.isoformat() if self.actualizado_en else None
        }
    
    def __repr__(self):
        return f'<Bloqueo {self.id} - {self.titulo} - {self.fecha_inicio} {self.hora_inicio}>'