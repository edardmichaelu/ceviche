#!/usr/bin/env python3

import requests
import json

# Configuración
BASE_URL = "http://localhost:5000"

def test_image_url():
    """Probar una URL de imagen específica"""
    image_url = f"{BASE_URL}/uploads/productos/1758598842_Telefonos.webp"

    print(f"Testing image URL: {image_url}")

    try:
        response = requests.get(image_url, stream=True)

        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type', 'No content-type')}")
        print(f"Content-Length: {response.headers.get('content-length', 'Unknown')}")

        if response.status_code == 200:
            print("✅ Image accessible!")
        else:
            print("❌ Image not accessible")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"Error accessing image: {e}")

if __name__ == "__main__":
    test_image_url()

