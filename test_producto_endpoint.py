#!/usr/bin/env python3

import requests
import json

# Configuración
BASE_URL = "http://localhost:5000"

def test_producto_endpoint():
    """Probar el endpoint GET /api/producto/{id}"""

    # Simular un token de autenticación (necesitas un token válido)
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc1ODYwMTE3OCwianRpIjoiZGNiOGFiMmUtODk0MS00MzNjLWExY2ItNWEzNWFjNzYzZjMyIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjEiLCJuYmYiOjE3NTg2MDExNzgsImNzcmYiOiJlODhiOTMzZi00ZTgxLTQ5MGItYmU1MC04NTY4OGNlNGQ4ZTMiLCJleHAiOjE3NTg2Mjk5Nzh9.H1o_thD1WjELWENurjUPULdSOqeBmbSUh1WewNi46dg"

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    # Probar con un ID de producto que debería existir
    producto_id = 1
    endpoint = f"{BASE_URL}/api/producto/{producto_id}"

    print(f"Testing GET {endpoint}")

    try:
        response = requests.get(endpoint, headers=headers)

        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type', 'No content-type')}")

        if response.headers.get('content-type', '').startswith('application/json'):
            data = response.json()
            print(f"Response JSON: {json.dumps(data, indent=2)}")
        else:
            print(f"Response Text: {response.text[:500]}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_producto_endpoint()

