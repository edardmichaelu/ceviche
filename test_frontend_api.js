// Simulación del apiClient del frontend
const API_BASE_URL = 'http://localhost:5000';

// Simular sessionStorage con un objeto global
const sessionStorage = {
    _storage: {},
    getItem(key) {
        return this._storage[key] || null;
    },
    setItem(key, value) {
        this._storage[key] = value;
    },
    removeItem(key) {
        delete this._storage[key];
    }
};

let storedToken = null;

const apiClient = {
    get: async (endpoint) => {
        console.log(`🔄 apiClient.get('${endpoint}')`);

        // Simular obtener token de sessionStorage
        const token = storedToken;
        console.log('🔍 Token encontrado:', token ? `${token.substring(0, 20)}...` : 'Ninguno');

        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: headers,
            });

            console.log(`📡 Respuesta status: ${response.status}`);
            console.log(`📡 Headers:`, Object.fromEntries(response.headers.entries()));

            if (response.status === 401) {
                console.log('🔐 Sesión expirada o inválida');
                sessionStorage.removeItem('accessToken');
                sessionStorage.removeItem('userData');
                throw new Error('Sesión expirada o inválida.');
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                const htmlText = await response.text();
                console.log('📄 Respuesta HTML (posible error):', htmlText.substring(0, 300));
                throw new Error('Error interno del servidor. La respuesta no es válida.');
            }

            const data = await response.json();

            if (!response.ok) {
                const error = (data && data.error) || response.statusText;
                console.log('❌ Error del servidor:', error);
                throw new Error(error);
            }

            console.log('✅ Respuesta exitosa:', data);
            return data;
        } catch (error) {
            console.log('❌ Error en apiClient:', error.message);
            throw error;
        }
    }
};

// Simular login
async function testLogin() {
    console.log('🔑 Intentando login...');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                identifier: 'cocina1',
                password: 'hashed_password_here'
            })
        });

        const data = await response.json();
        console.log('📋 Login response status:', response.status);
        console.log('📋 Login response data:', data);

        if (response.ok && data.access_token) {
            storedToken = data.access_token;
            console.log('✅ Login exitoso, token guardado');

            // Probar el endpoint de cocina
            console.log('🍳 Probando /api/cocina/ordenes...');
            await apiClient.get('/api/cocina/ordenes');
        } else {
            console.log('❌ Login fallido');
        }
    } catch (error) {
        console.log('❌ Error en login:', error.message);
    }
}

// Ejecutar la prueba
testLogin();
