#!/usr/bin/env python3
"""
Script para probar el endpoint de subida de imágenes
"""

import requests
from PIL import Image
import io
import json

def create_test_image():
    """Crear una imagen de prueba simple"""
    img = Image.new('RGB', (300, 200), color='green')
    # Agregar texto para identificación
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    draw.text((10, 10), "TEST IMAGE", fill='white')

    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)

    return img_bytes.getvalue()

def test_upload_endpoint():
    """Probar el endpoint de subida sin autenticación"""
    print("🧪 Probando endpoint de subida...")

    url = "http://localhost:5000/api/producto/1/imagenes"

    # Crear imagen de prueba
    image_data = create_test_image()

    # Preparar el archivo
    files = {
        'imagenes': ('test_upload.png', io.BytesIO(image_data), 'image/png')
    }

    # Headers
    headers = {
        'Authorization': 'Bearer test-token'  # Token de prueba
    }

    try:
        print(f"Enviando petición a: {url}")
        print(f"Tamaño de imagen: {len(image_data)} bytes")

        response = requests.post(url, files=files, headers=headers, timeout=10)

        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")

        if response.status_code == 401:
            print("⚠️  Error de autenticación - intentando sin token...")

            # Intentar sin token
            response = requests.post(url, files=files, timeout=10)
            print(f"Status Code sin token: {response.status_code}")

        if response.headers.get('Content-Type', '').startswith('application/json'):
            try:
                result = response.json()
                print(f"Response JSON: {json.dumps(result, indent=2)}")
            except:
                print(f"Response Text: {response.text}")
        else:
            print(f"Response Content-Type: {response.headers.get('Content-Type')}")
            print(f"Response Length: {len(response.content)}")

        if response.status_code in [200, 201]:
            print("✅ Endpoint de subida funcionando")
            return True
        else:
            print("❌ Error en endpoint de subida")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_with_different_extensions():
    """Probar con diferentes extensiones de archivo"""
    print("\n🧪 Probando diferentes extensiones...")

    extensions = ['PNG', 'JPEG', 'JPG']
    colors = ['red', 'blue', 'purple']

    for ext, color in zip(extensions, colors):
        print(f"\nProbando con {ext}...")

        # Crear imagen
        img = Image.new('RGB', (200, 150), color=color)
        img_bytes = io.BytesIO()
        img.save(img_bytes, format=ext)
        img_bytes.seek(0)

        # Preparar archivo
        files = {
            'imagenes': (f'test.{ext.lower()}', io.BytesIO(img_bytes.getvalue()), f'image/{ext.lower()}')
        }

        try:
            response = requests.post("http://localhost:5000/api/producto/1/imagenes", files=files, timeout=5)
            print(f"  {ext}: Status {response.status_code}")
        except Exception as e:
            print(f"  {ext}: Error {e}")

if __name__ == "__main__":
    print("🔍 Debug del endpoint de subida de imágenes\n")

    # Probar endpoint
    upload_ok = test_upload_endpoint()

    # Probar extensiones
    test_with_different_extensions()

    print("
📊 Resultado:"    print(f"   Endpoint de subida: {'✅ OK' if upload_ok else '❌ FALLÓ'}")

    if upload_ok:
        print("\n💡 Posibles soluciones:")
        print("   - Verificar autenticación del usuario")
        print("   - Limpiar cache del navegador")
        print("   - Verificar permisos del directorio uploads")
    else:
        print("\n🔧 Necesario revisar:")
        print("   - Configuración del endpoint")
        print("   - Permisos del directorio uploads")
        print("   - Configuración CORS")
