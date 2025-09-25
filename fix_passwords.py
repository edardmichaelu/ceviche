#!/usr/bin/env python3

from models.user import Usuario
from models import db

# Crear contraseñas reales para los usuarios de cocina
def fix_cocina_passwords():
    """Actualiza las contraseñas de los usuarios de cocina"""

    # Buscar usuarios de cocina
    cocina_users = Usuario.query.filter_by(rol='cocina').all()

    print(f"🔧 Encontrados {len(cocina_users)} usuarios de cocina")

    for user in cocina_users:
        print(f"   - {user.usuario}: {user.correo}")

        # Establecer contraseña real (usando el mismo valor que está en la BD pero hasheado correctamente)
        user.set_password('hashed_password_here')

        print(f"   ✅ Contraseña actualizada para {user.usuario}")

    # Guardar cambios
    db.session.commit()
    print("✅ Todas las contraseñas de cocina actualizadas")

if __name__ == "__main__":
    from app import create_app
    app = create_app()

    with app.app_context():
        fix_cocina_passwords()
