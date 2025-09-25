#!/usr/bin/env python3
from app import create_app

app = create_app()

print("=== CONFIGURACIÓN CORS ===")
cors = app.extensions.get('cors')
if cors:
    print(f"CORS: {cors}")
    print(f"CORS origins: {getattr(cors, 'origins', 'No definido')}")
else:
    print("CORS no configurado")

print("\n=== CONFIGURACIÓN GLOBAL ===")
for key, value in app.config.items():
    if 'CORS' in key.upper() or 'ALLOW' in key.upper():
        print(f"{key}: {value}")

print("\n=== FUNCIONES AFTER_REQUEST ===")
try:
    for func_list in app.after_request_funcs:
        for func in func_list:
            print(f"  - {func.__name__}")
except:
    print("Error al verificar after_request_funcs")
