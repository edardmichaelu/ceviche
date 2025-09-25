#!/usr/bin/env python3
"""
Script para verificar que las correcciones de imágenes funcionen
"""

import requests
import json

def test_cors_headers():
    """Probar que los headers CORS estén correctos"""
    print("🌐 Probando headers CORS...")

    # Probar preflight request
    url = "http://localhost:5000/uploads/productos/test.txt"
    headers = {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
    }

    try:
        response = requests.options(url, headers=headers)
        print(f"OPTIONS Status: {response.status_code}")
        print(f"Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin')}")
        print(f"Access-Control-Allow-Credentials: {response.headers.get('Access-Control-Allow-Credentials')}")

        if response.status_code == 200:
            print("✅ Preflight request exitoso")
            return True
        else:
            print("❌ Error en preflight request")
            return False

    except Exception as e:
        print(f"❌ Error en CORS: {e}")
        return False

def test_static_file():
    """Probar que los archivos estáticos se sirvan correctamente"""
    print("\n📄 Probando servicio de archivos estáticos...")

    # Crear un archivo de prueba si no existe
    test_dir = "uploads/productos"
    import os
    os.makedirs(test_dir, exist_ok=True)

    test_file = os.path.join(test_dir, "cors_test.txt")
    with open(test_file, 'w') as f:
        f.write("CORS TEST FILE")

    url = f"http://localhost:5000/uploads/productos/cors_test.txt"

    try:
        response = requests.get(url, headers={'Origin': 'http://localhost:5173'})
        print(f"GET Status: {response.status_code}")
        print(f"Content: {response.text.strip()}")
        print(f"Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin')}")

        if response.status_code == 200:
            print("✅ Archivo estático servido correctamente")
            return True
        else:
            print("❌ Error sirviendo archivo estático")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_test_upload_endpoint():
    """Probar el endpoint de prueba"""
    print("\n🧪 Probando endpoint de prueba...")

    from PIL import Image
    import io

    # Crear imagen de prueba
    img = Image.new('RGB', (100, 100), color='purple')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)

    url = "http://localhost:5000/api/producto/test-upload"

    files = {
        'imagenes': ('test_cors.png', io.BytesIO(img_bytes.getvalue()), 'image/png')
    }

    try:
        response = requests.post(url, files=files, timeout=10)
        print(f"POST Status: {response.status_code}")

        if response.headers.get('Content-Type', '').startswith('application/json'):
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")

            if result.get('success'):
                print("✅ Endpoint de prueba funcionando")
                return True
            else:
                print("❌ Error en respuesta del endpoint")
                return False
        else:
            print(f"Response Content-Type: {response.headers.get('Content-Type')}")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Verificando correcciones de imágenes\n")

    # Probar CORS
    cors_ok = test_cors_headers()

    # Probar archivos estáticos
    static_ok = test_static_file()

    # Probar endpoint
    endpoint_ok = test_test_upload_endpoint()

    print("\n📊 Resultados:")
    print(f"   CORS Headers: {'✅ OK' if cors_ok else '❌ FALLÓ'}")
    print(f"   Archivos Estáticos: {'✅ OK' if static_ok else '❌ FALLÓ'}")
    print(f"   Endpoint de Prueba: {'✅ OK' if endpoint_ok else '❌ FALLÓ'}")

    if cors_ok and static_ok and endpoint_ok:
        print("\n🎉 ¡Todas las correcciones aplicadas correctamente!")
        print("💡 Las imágenes deberían funcionar ahora.")
        print("📝 Pasos para el usuario:")
        print("   1. Reiniciar el backend")
        print("   2. Limpiar cache del navegador (Ctrl+F5)")
        print("   3. Probar subir una imagen en el frontend")
    else:
        print("\n💥 Aún hay problemas que necesitan atención")
        print("🔧 Revisar:")
        print("   - Logs del backend")
        print("   - Configuración de red/firewall")
        print("   - Permisos del directorio uploads")
