#!/usr/bin/env python3
"""
Script para probar la eliminación de productos y verificar que los errores se manejen correctamente.
"""

import requests
import json
from app import app

def test_delete_product_with_dependencies():
    """Probar eliminar un producto que tiene órdenes asociadas"""
    with app.test_client() as client:
        # Simular una solicitud de eliminación de producto
        response = client.delete('/api/producto/1')

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.get_json()}")

        if response.status_code == 409:
            data = response.get_json()
            if data.get('code') == 'INTEGRITY_ERROR':
                print("✅ Error de integridad detectado correctamente")
                print(f"✅ Mensaje de error: {data.get('error')}")
            else:
                print("❌ Error de integridad pero código incorrecto")
        else:
            print(f"❌ Status code inesperado: {response.status_code}")

def test_delete_nonexistent_product():
    """Probar eliminar un producto que no existe"""
    with app.test_client() as client:
        response = client.delete('/api/producto/99999')

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.get_json()}")

        if response.status_code == 404:
            data = response.get_json()
            if data.get('code') == 'NOT_FOUND':
                print("✅ Producto no encontrado detectado correctamente")
                print(f"✅ Mensaje de error: {data.get('error')}")
            else:
                print("❌ Producto no encontrado pero código incorrecto")
        else:
            print(f"❌ Status code inesperado: {response.status_code}")

if __name__ == "__main__":
    print("🔍 Probando eliminación de productos con errores...")
    print("\n1. Probando eliminación de producto con dependencias:")
    test_delete_product_with_dependencies()

    print("\n2. Probando eliminación de producto inexistente:")
    test_delete_nonexistent_product()

    print("\n✅ Pruebas completadas")

