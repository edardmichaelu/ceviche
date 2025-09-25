#!/usr/bin/env python3

import requests

# Configuración
BASE_URL = "http://localhost:5000"

def test_connection():
    """Probar conexión básica"""
    try:
        response = requests.get(f"{BASE_URL}/api/test")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    test_connection()

