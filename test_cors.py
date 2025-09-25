#!/usr/bin/env python3
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# Configurar CORS
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"], supports_credentials=True)

print("=== TEST CORS ===")
cors = app.extensions.get('cors')
if cors:
    print(f"✅ CORS configurado: {cors}")
    print(f"✅ CORS origins: {getattr(cors, 'origins', 'No definido')}")
else:
    print("❌ CORS no configurado")

# Verificar configuración
print(f"\nDEBUG: {app.debug}")
print(f"Config CORS: {app.config.get('CORS_ORIGINS', 'No definido')}")

# Verificar headers
with app.test_client() as client:
    response = client.options('/test')
    print(f"\nHeaders en respuesta OPTIONS:")
    for header, value in response.headers.items():
        if 'Access-Control' in header:
            print(f"  {header}: {value}")
