#!/usr/bin/env python3

import requests
import json

# Configuración
BASE_URL = "http://localhost:5000"

def test_product_images():
    """Probar que las imágenes se están devolviendo correctamente desde el backend"""
    try:
        # Probar endpoint público
        response = requests.get(f"{BASE_URL}/api/producto/public")

        if response.status_code != 200:
            print(f"Error: {response.status_code}")
            return

        data = response.json()

        if not data.get('success'):
            print(f"API Error: {data.get('error')}")
            return

        productos = data.get('data', [])
        productos_con_imagenes = [p for p in productos if p.get('imagenes') and len(p['imagenes']) > 0]

        print(f"Total productos: {len(productos)}")
        print(f"Productos con imágenes: {len(productos_con_imagenes)}")

        if productos_con_imagenes:
            print("\n--- Productos con imágenes ---")
            for producto in productos_con_imagenes[:3]:  # Mostrar solo los primeros 3
                print(f"Producto: {producto['nombre']}")
                for img in producto['imagenes']:
                    print(f"  - {img['imagen_url']} (Principal: {img['es_principal']})")

                    # Probar si la URL es accesible
                    if img['imagen_url'].startswith('/'):
                        full_url = f"{BASE_URL}{img['imagen_url']}"
                        try:
                            img_response = requests.get(full_url, timeout=5)
                            print(f"    ✅ Status: {img_response.status_code}")
                        except Exception as e:
                            print(f"    ❌ Error: {e}")
                print()

        return len(productos_con_imagenes) > 0

    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    success = test_product_images()
    if success:
        print("✅ Backend funcionando correctamente con imágenes")
    else:
        print("❌ Problemas con las imágenes en el backend")

