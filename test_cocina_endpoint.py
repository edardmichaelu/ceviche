#!/usr/bin/env python3

import requests
import json

# Configuración
BASE_URL = 'http://localhost:5000'
TEST_ENDPOINTS = [
    '/api/cocina/test-public',
    '/api/cocina/test',  # Este requiere autenticación
    '/api/cocina/ordenes'  # Este requiere autenticación
]

def test_endpoint(endpoint, headers=None):
    """Prueba un endpoint específico"""
    try:
        url = f"{BASE_URL}{endpoint}"
        print(f"\n🧪 Probando: {url}")
        print(f"   Headers: {headers}")

        response = requests.get(url, headers=headers)

        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")

        if response.status_code == 200:
            try:
                data = response.json()
                print(f"   ✅ Éxito: {data.get('message', 'Sin mensaje')}")
                return True
            except:
                print("   ✅ Éxito (respuesta no JSON)")
                return True
        else:
            print(f"   ❌ Error: {response.status_code}")
            return False

    except Exception as e:
        print(f"   ❌ Error de conexión: {str(e)}")
        return False

def main():
    print("🚀 Probando endpoints de cocina...")

    # Probar endpoint público (sin autenticación)
    print("\n1️⃣ Probando endpoint público:")
    test_endpoint('/api/cocina/test-public')

    # Probar con autenticación de cocina
    print("\n2️⃣ Probando con autenticación de cocina:")

    # Simular login de cocina
    login_data = {
        'identifier': 'cocina1',
        'password': 'hashed_password_here'  # Contraseña de la base de datos
    }

    try:
        login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)

        if login_response.status_code == 200:
            auth_data = login_response.json()
            print(f"   📋 Respuesta completa del login: {auth_data}")

            # El token puede estar en diferentes campos según la estructura de respuesta
            token = (auth_data.get('data', {}).get('token') or
                    auth_data.get('access_token') or
                    auth_data.get('token'))

            if token:
                headers = {'Authorization': f'Bearer {token}'}
                print(f"   ✅ Login exitoso, token obtenido: {token[:20]}...")

                # Probar endpoints con autenticación
                test_endpoint('/api/cocina/test', headers)
                test_endpoint('/api/cocina/ordenes', headers)
            else:
                print("   ❌ No se pudo obtener el token")
                print(f"   Campos disponibles en respuesta: {list(auth_data.keys())}")
                if 'data' in auth_data:
                    print(f"   Campos en data: {list(auth_data['data'].keys())}")
        else:
            print(f"   ❌ Error en login: {login_response.status_code}")
            print(f"   Response: {login_response.text}")

    except Exception as e:
        print(f"   ❌ Error en autenticación: {str(e)}")

if __name__ == "__main__":
    main()
