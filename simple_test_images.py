#!/usr/bin/env python3
"""
Script simple para probar las imágenes
"""

import os
import json

def check_uploads_directory():
    """Verificar el directorio de uploads"""
    print("📁 Verificando directorio de uploads...")

    upload_dir = "uploads/productos"
    if os.path.exists(upload_dir):
        files = os.listdir(upload_dir)
        print(f"✅ Directorio existe: {upload_dir}")
        print(f"📄 Archivos encontrados: {len(files)}")

        # Mostrar algunos archivos
        for file in files[:10]:
            filepath = os.path.join(upload_dir, file)
            size = os.path.getsize(filepath)
            print(f"   - {file} ({size} bytes)")

        return True
    else:
        print(f"❌ Directorio no existe: {upload_dir}")
        return False

def create_test_image():
    """Crear una imagen de prueba simple"""
    try:
        from PIL import Image
        import io

        # Crear imagen
        img = Image.new('RGB', (200, 200), color='blue')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)

        return img_bytes.getvalue()
    except ImportError:
        # Si PIL no está disponible, crear un archivo de texto
        return b"TEST IMAGE FILE"

def test_backend_response():
    """Probar la respuesta del backend"""
    print("\n🌐 Probando respuesta del backend...")

    try:
        response = requests.get("http://localhost:5000/uploads/productos/", timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")

        if response.status_code == 200:
            print("✅ Backend responde correctamente")
            return True
        else:
            print("❌ Error en respuesta del backend")
            return False

    except Exception as e:
        print(f"❌ Error conectando al backend: {e}")
        return False

def test_image_creation():
    """Probar crear una imagen manualmente"""
    print("\n🎨 Probando creación de imagen...")

    upload_dir = "uploads/productos"
    os.makedirs(upload_dir, exist_ok=True)

    test_file = os.path.join(upload_dir, "manual_test.png")

    try:
        # Crear imagen simple
        with open(test_file, 'wb') as f:
            f.write(create_test_image())

        if os.path.exists(test_file):
            size = os.path.getsize(test_file)
            print(f"✅ Imagen creada: {test_file} ({size} bytes)")
            return True
        else:
            print("❌ No se pudo crear el archivo")
            return False

    except Exception as e:
        print(f"❌ Error creando imagen: {e}")
        return False

if __name__ == "__main__":
    import requests

    print("🔍 Test simple de imágenes\n")

    # Verificar directorio
    dir_ok = check_uploads_directory()

    # Probar backend
    backend_ok = test_backend_response()

    # Probar creación de imagen
    image_ok = test_image_creation()

    print("
📊 Resultados:"    print(f"   Directorio uploads: {'✅ OK' if dir_ok else '❌ FALLÓ'}")
    print(f"   Backend response: {'✅ OK' if backend_ok else '❌ FALLÓ'}")
    print(f"   Creación de imagen: {'✅ OK' if image_ok else '❌ FALLÓ'}")

    if dir_ok and backend_ok and image_ok:
        print("\n🎉 Todo parece funcionar correctamente")
        print("💡 Las imágenes deberían mostrarse bien")
    else:
        print("\n💥 Hay problemas que necesitan atención")
        print("🔧 Posibles soluciones:")
        print("   - Reiniciar el backend")
        print("   - Verificar permisos del directorio")
        print("   - Limpiar cache del navegador")
