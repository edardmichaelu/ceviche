#!/usr/bin/env python3

import requests
import json

# Configuración
BASE_URL = "http://localhost:5000"

def test_get_productos():
    """Probar el endpoint GET /api/producto/public"""
    endpoint = f"{BASE_URL}/api/producto/public"

    print(f"Testing GET {endpoint}")

    try:
        response = requests.get(endpoint)

        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type', 'No content-type')}")

        if response.headers.get('content-type', '').startswith('application/json'):
            data = response.json()
            print(f"Response JSON: {json.dumps(data, indent=2)}")

            # Verificar si hay productos con imágenes
            if data.get('success') and 'data' in data:
                productos = data['data']
                print(f"\nTotal de productos: {len(productos)}")

                for producto in productos:
                    print(f"\nProducto: {producto['nombre']} (ID: {producto['id']})")
                    print(f"  Imagen URL (legacy): {producto.get('imagen_url', 'None')}")

                    if producto.get('imagenes'):
                        print(f"  Imágenes: {len(producto['imagenes'])}")
                        for img in producto['imagenes']:
                            print(f"    - ID: {img['id']}, URL: {img['imagen_url']}, Principal: {img['es_principal']}")
                    else:
                        print("  Sin imágenes")
        else:
            print("Response is not JSON")
            print(f"Response Text: {response.text}")

    except Exception as e:
        print(f"Error: {e}")

def test_get_producto_individual(producto_id=1):
    """Probar obtener un producto específico (usando endpoint público)"""
    endpoint = f"{BASE_URL}/api/producto/public"

    print(f"\nTesting GET {endpoint}")

    try:
        response = requests.get(endpoint)

        print(f"Status Code: {response.status_code}")

        if response.headers.get('content-type', '').startswith('application/json'):
            data = response.json()
            print(f"Response JSON: {json.dumps(data, indent=2)}")

            if data.get('success') and 'data' in data:
                producto = data['data']
                print(f"\nProducto: {producto['nombre']} (ID: {producto['id']})")

                if producto.get('imagenes'):
                    print(f"Imágenes: {len(producto['imagenes'])}")
                    for img in producto['imagenes']:
                        print(f"  - ID: {img['id']}, URL: {img['imagen_url']}, Principal: {img['es_principal']}")
                else:
                    print("Sin imágenes")
        else:
            print("Response is not JSON")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_get_productos()
    test_get_producto_individual()
