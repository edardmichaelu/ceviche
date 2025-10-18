import requests
import json

# Probar login con credenciales inválidas
try:
    response = requests.post('http://localhost:5000/auth/login',
                           json={'identifier': 'usuario_inexistente', 'password': 'password123'},
                           timeout=5)
    print(f'Status: {response.status_code}')
    if response.status_code == 401:
        data = response.json()
        print(f'Error message: {data.get("error", "No error message")}')
    else:
        print(f'Unexpected status code: {response.status_code}')
except Exception as e:
    print(f'Error connecting: {e}')

