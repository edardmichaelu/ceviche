#!/usr/bin/env python3
"""
Script para probar las notificaciones de error en el backend
"""

import requests
import json
from app import app

def test_error_notifications():
    """Probar que el backend retorna errores correctamente para las notificaciones"""
    with app.test_client() as client:
        # Simular una solicitud de eliminación de producto
        response = client.delete('/api/producto/1')

        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.get_json(), indent=2)}")

        if response.status_code == 409:
            data = response.get_json()
            if data.get('code') == 'INTEGRITY_ERROR':
                print("✅ Error de integridad detectado correctamente")
                print(f"✅ Mensaje de error: {data.get('error')}")
                return True

        print("❌ Error de integridad no detectado correctamente")
        return False

if __name__ == "__main__":
    print("🧪 Probando notificaciones de error...")
    test_error_notifications()
    print("✅ Prueba completada")

