from . import db
from datetime import datetime

class Reserva(db.Model):
    __tablename__ = 'reserva'
    
    id = db.Column(db.Integer, primary_key=True)
    cliente_nombre = db.Column(db.String(100), nullable=False)
    cliente_telefono = db.Column(db.String(20))
    cliente_email = db.Column(db.String(120))
    fecha_reserva = db.Column(db.Date, nullable=False)
    hora_reserva = db.Column(db.Time, nullable=False)
    duracion_estimada = db.Column(db.Integer, default=120)  # en minutos
    numero_personas = db.Column(db.Integer, nullable=False)
    estado = db.Column(db.Enum('pendiente', 'confirmada', 'cancelada', 'completada'), default='pendiente', nullable=False)
    tipo_reserva = db.Column(db.Enum('normal', 'especial', 'grupo'), default='normal', nullable=False)
    notas = db.Column(db.Text)
    requerimientos_especiales = db.Column(db.Text)
    
    # Relaciones
    zona_id = db.Column(db.Integer, db.ForeignKey('zona.id'))
    mesa_id = db.Column(db.Integer, db.ForeignKey('mesa.id'))
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    
    zona = db.relationship('Zona', back_populates='reservas')
    mesa = db.relationship('Mesa', back_populates='reservas')
    usuario = db.relationship('Usuario', backref='reservas')
    
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)
    actualizado_en = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'cliente_nombre': self.cliente_nombre,
            'cliente_telefono': self.cliente_telefono,
            'cliente_email': self.cliente_email,
            'fecha_reserva': self.fecha_reserva.isoformat() if self.fecha_reserva else None,
            'hora_reserva': self.hora_reserva.isoformat() if self.hora_reserva else None,
            'duracion_estimada': self.duracion_estimada,
            'numero_personas': self.numero_personas,
            'estado': self.estado,
            'tipo_reserva': self.tipo_reserva,
            'notas': self.notas,
            'requerimientos_especiales': self.requerimientos_especiales,
            'zona_id': self.zona_id,
            'mesa_id': self.mesa_id,
            'usuario_id': self.usuario_id,
            'creado_en': self.creado_en.isoformat() if self.creado_en else None,
            'actualizado_en': self.actualizado_en.isoformat() if self.actualizado_en else None
        }
    
    def __repr__(self):
        return f'<Reserva {self.id} - {self.cliente_nombre} - {self.fecha_reserva} {self.hora_reserva}>'


