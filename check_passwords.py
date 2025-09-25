#!/usr/bin/env python3
"""
Script para verificar las contraseñas de los usuarios
"""
from app import create_app
from werkzeug.security import check_password_hash

app = create_app()

def check_user_passwords():
    """Verificar contraseñas de usuarios"""
    print("=== VERIFICANDO CONTRASEÑAS ===")

    with app.app_context():
        from models.user import Usuario

        usuarios = Usuario.query.all()
        for user in usuarios:
            print(f"Usuario: {user.usuario}")
            print(f"  Rol: {user.rol}")
            print(f"  Contraseña (hash): {user.contrasena[:50]}...")
            print(f"  Activo: {user.activo}")

            # Verificar si la contraseña está hasheada
            if user.contrasena.startswith('pbkdf2:'):
                print("  ✅ Contraseña hasheada con pbkdf2")
            else:
                print("  ❌ Formato de contraseña desconocido")

            # Probar contraseñas comunes
            common_passwords = ['admin123', 'mozo123', 'cocina123', 'caja123', '123456', 'password', 'admin']
            for pwd in common_passwords:
                try:
                    if check_password_hash(user.contrasena, pwd):
                        print(f"  🔑 Contraseña encontrada: {pwd}")
                        break
                except:
                    pass
            else:
                print("  ❓ Contraseña no encontrada en lista común")
            print()

def fix_passwords():
    """Establecer contraseñas por defecto"""
    print("=== ESTABLECIENDO CONTRASEÑAS POR DEFECTO ===")

    with app.app_context():
        from models.user import Usuario

        usuarios = Usuario.query.all()
        passwords = {
            'admin': 'admin123',
            'mozo1': 'mozo123',
            'mozo2': 'mozo123',
            'cocina1': 'cocina123',
            'cocina2': 'cocina123',
            'cocina3': 'cocina123',
            'caja1': 'caja123'
        }

        for user in usuarios:
            if user.usuario in passwords:
                user.set_password(passwords[user.usuario])
                print(f"✅ Contraseña establecida para {user.usuario}")

        from models import db
        db.session.commit()
        print("✅ Cambios guardados")

if __name__ == '__main__':
    check_user_passwords()
    print("\n--- Estableciendo contraseñas por defecto ---")
    fix_passwords()
    print("\n--- Verificando contraseñas después del cambio ---")
    check_user_passwords()
