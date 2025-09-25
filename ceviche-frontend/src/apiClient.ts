// Resolver dinámicamente el backend para funcionar en la misma red (IP del servidor)
const API_BASE_URL = (() => {
  try {
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const port = 5000; // Puerto del backend Flask
    return `${protocol}//${host}:${port}`;
  } catch {
    return 'http://localhost:5000';
  }
})();

// Función auxiliar para obtener el token de la sesión
const getAuthToken = () => sessionStorage.getItem('accessToken');

// Función auxiliar para manejar las respuestas de la API
const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    // Si el token es inválido o ha expirado, limpiamos la sesión y recargamos la página.
    // Esto efectivamente deslogueará al usuario.
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('userData');
    window.location.href = '/login';
    throw new Error('Sesión expirada o inválida.');
  }

  // Verificar si la respuesta es HTML (error 500 que devuelve página HTML)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    const htmlText = await response.text();
    console.error('Respuesta HTML recibida en lugar de JSON:', htmlText.substring(0, 200));
    throw new Error('Error interno del servidor. La respuesta no es válida.');
  }

  const data = await response.json();

  if (!response.ok) {
    // Lanza un error con el mensaje del backend si la respuesta no es exitosa
    const error = (data && data.error) || response.statusText;
    throw new Error(error);
  }

  return data;
};

// --- Métodos del Cliente de API con Depuración ---

const createRequest = async (endpoint: string, options: RequestInit) => {
    const token = getAuthToken();

    // --- PASO DE DEPURACIÓN CRÍTICO ---
    console.log(`[API Client] Preparando petición para: ${options.method} ${endpoint}`);
    console.log("[API Client] API_BASE_URL:", API_BASE_URL);
    console.log("[API Client] URL completa:", `${API_BASE_URL}${endpoint}`);
    console.log("[API Client] Token recuperado de sessionStorage:", token);
    // --------------------------------

    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    return handleResponse(response);
};

// Cliente para rutas públicas (sin autenticación)
const createPublicRequest = async (endpoint: string, options: RequestInit) => {
    console.log(`[API Client] Preparando petición PÚBLICA para: ${options.method} ${endpoint}`);
    
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    // NO agregamos Authorization header para rutas públicas

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    return handleResponse(response);
};

export const apiClient = {
  get: <T>(endpoint: string): Promise<T> => {
    return createRequest(endpoint, { method: 'GET' });
  },

  post: <T>(endpoint: string, body: any): Promise<T> => {
    return createRequest(endpoint, { method: 'POST', body: JSON.stringify(body) });
  },

  put: <T>(endpoint: string, body: any): Promise<T> => {
    return createRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  },

  del: <T>(endpoint: string): Promise<T> => {
    return createRequest(endpoint, { method: 'DELETE' });
  },

  // Métodos públicos (sin autenticación)
  getPublic: <T>(endpoint: string): Promise<T> => {
    return createPublicRequest(endpoint, { method: 'GET' });
  },

  postPublic: <T>(endpoint: string, body: any): Promise<T> => {
    return createPublicRequest(endpoint, { method: 'POST', body: JSON.stringify(body) });
  },

  delPublic: <T>(endpoint: string): Promise<T> => {
    return createPublicRequest(endpoint, { method: 'DELETE' });
  },

  // Método para subir archivos (sin JSON.stringify)
  upload: <T>(endpoint: string, body: FormData): Promise<T> => {
    return createRequest(endpoint, { method: 'POST', body });
  },

  // Método para eliminar archivos
  deleteFile: <T>(endpoint: string): Promise<T> => {
    return createRequest(endpoint, { method: 'DELETE' });
  },
};
