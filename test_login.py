#!/usr/bin/env python3
"""
Script para probar el login y operaciones CRUD básicas
"""
from app import create_app
import json

app = create_app()

def test_login():
    """Probar el login con un usuario existente"""
    print("=== PROBANDO LOGIN ===")

    with app.app_context():
        from services.auth_service import AuthService
        from models.user import Usuario

        # Verificar que los usuarios existen
        usuarios = Usuario.query.all()
        print(f"Usuarios encontrados: {len(usuarios)}")
        for u in usuarios:
            print(f"  - {u.usuario}: {u.rol}")

        # Probar login con admin
        user = AuthService.login_user('admin', 'admin123')
        if user:
            print(f"✅ Login exitoso para {user.usuario}")
            print(f"   Rol: {user.rol}")
            print(f"   Activo: {user.activo}")
        else:
            print("❌ Login fallido")

        # Probar login con mozo
        user = AuthService.login_user('mozo1', 'mozo123')
        if user:
            print(f"✅ Login exitoso para {user.usuario}")
            print(f"   Rol: {user.rol}")
        else:
            print("❌ Login fallido para mozo1")

def test_crud_operations():
    """Probar operaciones CRUD básicas"""
    print("\n=== PROBANDO CRUD ===")

    with app.app_context():
        from models.user import Usuario
        from models.menu import Categoria

        # Contar usuarios
        users_count = Usuario.query.count()
        print(f"Usuarios totales: {users_count}")

        # Contar categorías
        cats_count = Categoria.query.count()
        print(f"Categorías totales: {cats_count}")

        # Obtener primera categoría
        cat = Categoria.query.first()
        if cat:
            print(f"Primera categoría: {cat.nombre}")
            print(f"Descripción: {cat.descripcion}")
        else:
            print("❌ No se encontraron categorías")

if __name__ == '__main__':
    print("🚀 Iniciando pruebas...")
    test_login()
    test_crud_operations()
    print("\n✅ Pruebas completadas")
