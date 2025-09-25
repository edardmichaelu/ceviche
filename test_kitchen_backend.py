#!/usr/bin/env python3
"""
Script de test simple para verificar que el backend de cocina funcione correctamente
"""
import requests
import json

def test_backend():
    """Test básico del backend"""
    print("🔧 Probando conexión con backend...")

    try:
        # Test 1: Verificar que el servidor responde (sin autenticación)
        response = requests.get('http://localhost:5000/api/orden/cocina/pendientes', timeout=10)
        print(f"✅ Servidor responde: {response.status_code}")

        if response.status_code == 401:
            print("🔐 Requiere autenticación. Verificando perfil de usuario...")

            # Test 2: Verificar perfil de usuario (sin autenticación primero)
            profile_response = requests.get('http://localhost:5000/auth/profile', timeout=10)
            print(f"👤 Perfil (sin auth): {profile_response.status_code}")

            if profile_response.status_code == 401:
                print("❌ No hay sesión activa. Debes hacer login primero.")
                print("💡 Inicia sesión con un usuario que tenga rol 'cocina' o 'admin'")
            else:
                print(f"   Respuesta: {profile_response.text}")

        elif response.status_code == 403:
            print("❌ Acceso denegado. El usuario no tiene permisos de cocina.")
            print("💡 Asegúrate de que el usuario tenga rol 'cocina' o 'admin'")
        elif response.status_code == 200:
            data = response.json()
            print(f"✅ Datos recibidos: {len(data.get('data', []))} órdenes")

            # Mostrar información de la primera orden si existe
            orders = data.get('data', [])
            if orders:
                first_order = orders[0]
                print(f"📋 Primera orden: #{first_order.get('numero', 'N/A')}")
                print(f"   Items: {len(first_order.get('items', []))}")
                if first_order.get('items'):
                    print(f"   Primer item: {first_order['items'][0].get('producto', {}).get('nombre', 'N/A')}")
        else:
            print(f"❌ Error del servidor: {response.status_code}")
            print(f"   Respuesta: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar al servidor. ¿Está ejecutándose en localhost:5000?")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

def login_and_test():
    """Login con un usuario de cocina y luego probar el endpoint"""
    print("🔑 Intentando login con usuario de cocina...")

    try:
        login_data = {
            "identifier": "cocina1",
            "password": "12345"
        }

        response = requests.post('http://localhost:5000/auth/login', json=login_data)
        print(f"🔑 Login response: {response.status_code}")

        if response.status_code == 200:
            login_result = response.json()
            print(f"✅ Login exitoso: {login_result}")

            # Extraer token
            token = login_result.get('access_token')
            if token:
                print(f"🔑 Token obtenido: {token[:20]}...")

                # Test del endpoint de cocina con autenticación
                headers = {'Authorization': f'Bearer {token}'}
                cocina_response = requests.get('http://localhost:5000/api/orden/cocina/pendientes', headers=headers)

                print(f"🍳 Endpoint de cocina: {cocina_response.status_code}")

                if cocina_response.status_code == 200:
                    cocina_data = cocina_response.json()
                    print(f"✅ Órdenes de cocina obtenidas: {len(cocina_data.get('data', []))}")

                    # Test del perfil
                    profile_response = requests.get('http://localhost:5000/auth/profile', headers=headers)
                    print(f"👤 Perfil: {profile_response.status_code}")

                    if profile_response.status_code == 200:
                        profile_data = profile_response.json()
                        print(f"✅ Perfil: {profile_data.get('data', {}).get('rol')}")
                else:
                    print(f"❌ Error en endpoint de cocina: {cocina_response.text}")
            else:
                print("❌ No se pudo obtener el token")
        else:
            print(f"❌ Error en login: {response.text}")

    except Exception as e:
        print(f"❌ Error en login: {e}")

if __name__ == "__main__":
    # Primero probar sin autenticación
    print("=== TEST SIN AUTENTICACIÓN ===")
    test_backend()

    print("\n=== TEST CON LOGIN ===")
    login_and_test()
