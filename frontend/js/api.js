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

// Validar si el usuario está logueado y sus permisos
function checkAuth() {
    const userStr = localStorage.getItem('user');
    const path = window.location.pathname;
    const isAuthPage = path.endsWith('index.html') || path.endsWith('register.html') || path === '/' || path.endsWith('/frontend/') || path.endsWith('x_dolce_inventory/frontend');

    if (!userStr && !isAuthPage) {
        window.location.href = 'index.html';
        return;
    } 
    
    if (userStr) {
        let user = {};
        try { user = JSON.parse(userStr); } catch(e){}
        
        if (isAuthPage) {
            window.location.href = user.role === 'ADMIN' ? 'dashboard.html' : 'pos.html';
            return;
        }

        // Si es un cajero (USER) y trata de acceder a módulos de Admin
        if (user.role === 'USER') {
            const allowedPages = ['pos.html'];
            const isAllowed = allowedPages.some(page => path.endsWith(page));
            if (!isAllowed) {
                window.location.href = 'pos.html';
                return;
            }
        }
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
    checkAuth();
    
    // Configurar la interfaz según el rol
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try { 
            const user = JSON.parse(userStr); 
            if (user.role === 'USER') {
                // Ocultar links del sidebar que no sean Punto de Venta o Salir
                document.querySelectorAll('.sidebar-menu a').forEach(link => {
                    const href = link.getAttribute('href');
                    const isLogout = link.getAttribute('onclick') && link.getAttribute('onclick').includes('logout');
                    if (href !== 'pos.html' && !isLogout) {
                        link.parentElement.style.display = 'none';
                    }
                });
                
                // Ocultar botón de "Nueva Entrada"
                const sidebarAction = document.querySelector('.sidebar-action');
                if (sidebarAction) {
                    sidebarAction.style.display = 'none';
                }
            }
        } catch(e){}
    }
    
    // Initialize global notifications if elements exist
    initGlobalNotifications();
});

// ------------------- GLOBAL NOTIFICATIONS -------------------
async function initGlobalNotifications() {
    const badge = document.getElementById('notifBadge');
    const countLabel = document.getElementById('notifCount');
    const list = document.getElementById('notificationsList');
    
    // Si no existen los elementos en esta vista, no hacemos nada
    if (!badge || !countLabel || !list) return;
    
    try {
        const products = await api.get('/products');
        const lowStockProducts = products.filter(p => p.stockLevel <= 10);
        const lowStockCount = lowStockProducts.length;
        
        if (lowStockCount > 0) {
            badge.style.display = 'block';
            countLabel.textContent = lowStockCount;
            list.innerHTML = '';
            lowStockProducts.forEach(p => {
                const isCritical = p.stockLevel <= 0;
                // Si la vista actual es dashboard, el click puede abrir el modal, de lo contrario redirige a dashboard
                const clickAction = window.location.pathname.endsWith('dashboard.html') 
                    ? `onclick="editProduct(${p.id}); toggleGlobalNotifications();"`
                    : `onclick="window.location.href='dashboard.html';"`;
                    
                list.innerHTML += `
                    <div style="padding:12px 15px; border-bottom:1px solid #f5f5f5; cursor:pointer; transition:background 0.2s;" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='white'" ${clickAction}>
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <strong style="font-size:13px; color:#333;">${p.name}</strong>
                            <span style="font-size:11px; font-weight:700; color:${isCritical ? 'var(--danger)' : '#ff9800'};">${p.stockLevel} un.</span>
                        </div>
                        <div style="font-size:11px; color:#777;">SKU: ${p.sku} — <span style="color:${isCritical ? 'var(--danger)' : '#ff9800'};">${isCritical ? '¡Agotado!' : 'Stock Bajo'}</span></div>
                    </div>
                `;
            });
        } else {
            badge.style.display = 'none';
            countLabel.textContent = '0';
            list.innerHTML = '<div style="padding:20px; text-align:center; color:#999; font-size:13px;">No hay alertas de stock.</div>';
        }
    } catch(e) {
        console.error('Error al cargar notificaciones globales', e);
    }
}

function toggleGlobalNotifications() {
    const dropdown = document.getElementById('notificationsDropdown');
    if (dropdown) {
        if (dropdown.style.display === 'none' || !dropdown.style.display) {
            dropdown.style.display = 'block';
        } else {
            dropdown.style.display = 'none';
        }
    }
}

// Cerrar notificaciones si se hace click fuera
document.addEventListener('click', function(e) {
    const btn = document.getElementById('notificationBellBtn');
    const dropdown = document.getElementById('notificationsDropdown');
    if (btn && dropdown && !btn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});
