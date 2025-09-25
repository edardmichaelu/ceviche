#!/usr/bin/env python3
from app import create_app

app = create_app()

print("=== CONFIGURACIÓN DE LA APLICACIÓN ===")
print(f"DEBUG: {app.debug}")
print(f"Config: {app.config.get('SQLALCHEMY_DATABASE_URI', 'No configurado')}")

print("\n=== BLUEPRINTS REGISTRADOS ===")
for name, blueprint in app.blueprints.items():
    print(f"  - {name}: {blueprint}")

print("\n=== EXTENSIONES ===")
for name, ext in app.extensions.items():
    print(f"  - {name}: {ext}")

print("\n=== FUNCIONES AFTER_REQUEST ===")
for funcs in app.after_request_funcs:
    for func in funcs:
        print(f"  - {func.__name__}")

print("\n=== CORS ===")
cors = app.extensions.get('cors')
if cors:
    print(f"  - CORS configurado: {cors}")
else:
    print("  - CORS no configurado")
