#!/usr/bin/env python3
"""
Script para probar la subida de imágenes desde el frontend
"""

import requests
from PIL import Image
import io
import json

def create_test_image():
    """Crear una imagen de prueba"""
    img = Image.new('RGB', (400, 300), color='orange')
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    draw.text((20, 20), "FRONTEND TEST", fill='black')

    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)

    return img_bytes.getvalue()

def test_frontend_upload():
    """Probar el endpoint de prueba desde el frontend"""
    print("🧪 Probando subida desde frontend...")

    url = "http://localhost:5000/api/producto/test-upload"

    # Crear imagen de prueba
    image_data = create_test_image()

    # Preparar como FormData (igual que el frontend)
    files = {
        'imagenes': ('frontend_test.png', io.BytesIO(image_data), 'image/png')
    }

    try:
        print(f"Enviando imagen de {len(image_data)} bytes a {url}")

        response = requests.post(url, files=files, timeout=10)

        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")

        if response.headers.get('Content-Type', '').startswith('application/json'):
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")

            if result.get('success'):
                print("✅ Subida exitosa desde frontend")
                return True
            else:
                print("❌ Error en respuesta del backend")
                return False
        else:
            print(f"Response Text: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_uploaded_files():
    """Verificar archivos subidos"""
    print("\n📁 Verificando archivos subidos...")

    upload_dir = "uploads/productos"
    if os.path.exists(upload_dir):
        import os
        files = [f for f in os.listdir(upload_dir) if f.startswith('frontend_test')]
        print(f"Archivos de prueba encontrados: {files}")

        for file in files:
            filepath = os.path.join(upload_dir, file)
            size = os.path.getsize(filepath)
            print(f"  - {file}: {size} bytes")
    else:
        print("❌ Directorio no existe")

if __name__ == "__main__":
    import os
    print("🔍 Probando subida de imágenes desde frontend\n")

    # Probar subida
    upload_ok = test_frontend_upload()

    # Verificar archivos
    check_uploaded_files()

    print("
📊 Resultado:"    print(f"   Subida desde frontend: {'✅ OK' if upload_ok else '❌ FALLÓ'}")

    if upload_ok:
        print("\n💡 Posibles soluciones:")
        print("   - Verificar autenticación del usuario en el frontend")
        print("   - Limpiar cache del navegador (Ctrl+F5)")
        print("   - Verificar que el usuario tenga permisos de admin")
    else:
        print("\n🔧 Revisar:")
        print("   - Configuración del endpoint")
        print("   - Formato de FormData en el frontend")
        print("   - Headers de la petición")
