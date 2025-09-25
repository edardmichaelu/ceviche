#!/usr/bin/env python3

import requests
import json

# Configuración
BASE_URL = "http://localhost:5000"
IMAGE_ID = 2  # Cambia este ID por uno que exista en tu base de datos

def test_delete_image():
    endpoint = f"{BASE_URL}/api/producto/imagenes/{IMAGE_ID}"

    print(f"Testing DELETE {endpoint}")

    try:
        response = requests.delete(endpoint)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Text: {response.text}")

        if response.headers.get('content-type', '').startswith('application/json'):
            print(f"Response JSON: {response.json()}")
        else:
            print("Response is not JSON")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_delete_image()
