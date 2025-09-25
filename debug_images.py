#!/usr/bin/env python3
"""
Script para debuggear problemas con las imágenes
"""

import os
import requests
from PIL import Image
import io

def check_uploads_directory():
    """Verificar el estado del directorio de uploads"""
    print("📁 Verificando directorio de uploads...")

    upload_dir = "uploads/productos"
    if os.path.exists(upload_dir):
        files = os.listdir(upload_dir)
        print(f"✅ Directorio existe: {upload_dir}")
        print(f"📄 Archivos encontrados: {len(files)}")
        for file in files[:5]:  # Mostrar solo los primeros 5
            print(f"   - {file}")
        if len(files) > 5:
            print(f"   ... y {len(files) - 5} más")
    else:
        print(f"❌ Directorio no existe: {upload_dir}")
        return False

    return True

def test_image_save():
    """Probar guardar una imagen directamente"""
    print("\n💾 Probando guardado directo de imagen...")

    upload_dir = "uploads/productos"
    os.makedirs(upload_dir, exist_ok=True)

    # Crear imagen de prueba
    img = Image.new('RGB', (100, 100), color='blue')
    test_path = os.path.join(upload_dir, "test_debug.png")

    try:
        img.save(test_path)
        print(f"✅ Imagen guardada: {test_path}")

        # Verificar que el archivo existe
        if os.path.exists(test_path):
            size = os.path.getsize(test_path)
            print(f"✅ Archivo verificado: {size} bytes")
            return True
        else:
            print("❌ Archivo no encontrado después de guardar")
            return False

    except Exception as e:
        print(f"❌ Error guardando imagen: {e}")
        return False

def test_backend_route():
    """Probar la ruta del backend para servir archivos"""
    print("\n🌐 Probando ruta del backend...")

    # Buscar archivos de prueba
    upload_dir = "uploads/productos"
    if os.path.exists(upload_dir):
        files = os.listdir(upload_dir)
        if files:
            filename = files[0]
            url = f"http://localhost:5000/uploads/productos/{filename}"

            try:
                response = requests.get(url, timeout=5)
                print(f"Status: {response.status_code}")
                print(f"Content-Type: {response.headers.get('Content-Type')}")
                print(f"Content-Length: {response.headers.get('Content-Length')}")

                if response.status_code == 200:
                    print("✅ Ruta del backend funcionando")
                    return True
                else:
                    print("❌ Error en ruta del backend")
                    return False

            except Exception as e:
                print(f"❌ Error conectando al backend: {e}")
                return False
        else:
            print("⚠️  No hay archivos para probar")
            return False
    else:
        print("❌ Directorio no existe")
        return False

if __name__ == "__main__":
    print("🔍 Debug de imágenes en el sistema\n")

    # Verificar directorio
    dir_ok = check_uploads_directory()

    # Probar guardado
    save_ok = test_image_save()

    # Probar backend
    backend_ok = test_backend_route()

    print("
📊 Resultados del debug:"    print(f"   Directorio uploads: {'✅ OK' if dir_ok else '❌ FALLÓ'}")
    print(f"   Guardado de archivos: {'✅ OK' if save_ok else '❌ FALLÓ'}")
    print(f"   Backend serving: {'✅ OK' if backend_ok else '❌ FALLÓ'}")

    if dir_ok and save_ok and backend_ok:
        print("\n🎉 Todo parece estar funcionando correctamente")
        print("💡 Si las imágenes no se muestran, podría ser un problema de:")
        print("   - Cache del navegador")
        print("   - Permisos de CORS específicos")
        print("   - Formato de imagen incompatible")
    else:
        print("\n💥 Hay problemas que necesitan atención")
