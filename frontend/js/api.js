const API_BASE_URL = 'http://localhost:8080/api';

// Función genérica para peticiones Fetch
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            // Manejar errores
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || 'Error en la petición');
        }
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}

// Validar si el usuario está logueado
function checkAuth() {
    const user = localStorage.getItem('user');
    const path = window.location.pathname;
    const isAuthPage = path.endsWith('index.html') || path.endsWith('register.html') || path === '/' || path.endsWith('/frontend/');

    if (!user && !isAuthPage) {
        window.location.href = 'index.html';
    } else if (user && isAuthPage) {
        window.location.href = 'dashboard.html';
    }
}

const api = {
    get: (endpoint) => apiCall(endpoint, 'GET'),
    post: (endpoint, data) => apiCall(endpoint, 'POST', data),
    put: (endpoint, data) => apiCall(endpoint, 'PUT', data),
    delete: (endpoint) => apiCall(endpoint, 'DELETE')
};

// Formatear a Pesos Colombianos (COP)
const formatCOP = (num) => {
    if (num === null || num === undefined) return '';
    return new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP', 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
};

// Ejecutar checkAuth en la carga
document.addEventListener('DOMContentLoaded', () => {
    // checkAuth(); // Descomentar para activar validacion de sesion
});
