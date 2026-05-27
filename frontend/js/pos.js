let currentCart = [];
let allProducts = [];
let displayedProducts = [];
let selectedPaymentMethod = 'EFECTIVO';

document.addEventListener('DOMContentLoaded', () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            document.getElementById('userNameDisplay').textContent = user.fullName || user.username || 'Usuario';
        } catch(e) {}
    }
    loadPOSData();
});

async function loadPOSData() {
    try {
        allProducts = await api.get('/products');
        displayedProducts = [...allProducts];
        
        try {
            const categories = await api.get('/categories');
            const pillsContainer = document.getElementById('categoryPills');
            pillsContainer.innerHTML = '<div class="pill active" onclick="filterCategory(null, this)">Todos</div>';
            categories.forEach(c => {
                pillsContainer.innerHTML += `<div class="pill" onclick="filterCategory(${c.id}, this)">${c.name}</div>`;
            });
        } catch(e) {}

        try {
            const customers = await api.get('/customers');
            const custSelect = document.getElementById('saleCustomer');
            custSelect.innerHTML = '<option value="">-- Consumidor Final --</option>';
            customers.forEach(c => {
                custSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });
        } catch(e) {}

        renderProducts(allProducts);
    } catch (error) {
        console.error("Error loading POS data", error);
        showToast('Error cargando datos del sistema', 'error');
    }
}

function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    
    // Only show active products with stock > 0
    const available = products.filter(p => p.status === 'ACTIVE' && p.stockLevel > 0);

    if(available.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">No hay productos con stock disponible</div>`;
        return;
    }

    available.forEach(p => {
        let img = p.imageUrl && p.imageUrl.trim() !== '' ? p.imageUrl : 'https://via.placeholder.com/150';
        grid.innerHTML += `
            <div class="product-card" onclick="addToCart(${p.id})">
                <img src="${img}" alt="${p.name}">
                <div class="product-card-sku">SKU: ${p.sku} | Disp: ${p.stockLevel}</div>
                <div class="product-card-name">${p.name}</div>
                <div class="product-card-price">${formatCOP(p.price)}</div>
            </div>
        `;
    });
}

function searchProducts(q) {
    q = q.toLowerCase();
    displayedProducts = allProducts.filter(p => 
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
    renderProducts(displayedProducts);
}

function filterCategory(catId, element) {
    document.querySelectorAll('.category-pills .pill').forEach(p => p.classList.remove('active'));
    if(element) element.classList.add('active');

    if (catId === null) {
        displayedProducts = [...allProducts];
    } else {
        displayedProducts = allProducts.filter(p => p.category && p.category.id === catId);
    }
    renderProducts(displayedProducts);
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product || product.stockLevel <= 0) {
        showToast('Producto sin stock', 'error');
        return;
    }

    const existingItem = currentCart.find(item => item.product.id === productId);
    if (existingItem) {
        if(existingItem.quantity >= product.stockLevel) {
            showToast('No hay más stock disponible', 'error');
            return;
        }
        existingItem.quantity++;
    } else {
        currentCart.push({ product: product, quantity: 1 });
    }
    updateCartUI();
}

function updateQuantity(productId, delta) {
    const item = currentCart.find(i => i.product.id === productId);
    if (item) {
        const newQty = item.quantity + delta;
        if(newQty > item.product.stockLevel) {
            showToast('No hay más stock disponible', 'error');
            return;
        }
        item.quantity = newQty;
        if (item.quantity <= 0) {
            currentCart = currentCart.filter(i => i.product.id !== productId);
        }
        updateCartUI();
    }
}

function clearCart() {
    currentCart = [];
    updateCartUI();
    document.getElementById('saleCustomer').value = '';
    document.getElementById('saleNotes').value = '';
    document.querySelector('.pm-btn[data-method="EFECTIVO"]').click();
}

function updateCartUI() {
    const cartContainer = document.getElementById('cartItems');
    cartContainer.innerHTML = '';

    if(currentCart.length === 0) {
        cartContainer.innerHTML = `<div style="text-align:center; padding:30px; color:#999;">
            <i class="fa-solid fa-cart-shopping" style="font-size:30px; margin-bottom:10px;"></i><br>
            El carrito está vacío
        </div>`;
    }

    let subtotal = 0;
    currentCart.forEach(item => {
        const itemTotal = item.product.price * item.quantity;
        subtotal += itemTotal;
        let img = item.product.imageUrl && item.product.imageUrl.trim() !== '' ? item.product.imageUrl : 'https://via.placeholder.com/40';

        cartContainer.innerHTML += `
            <div class="cart-item">
                <img src="${img}" alt="img">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.product.name}</div>
                    <div class="cart-item-sku">SKU: ${item.product.sku} | Unit: ${formatCOP(item.product.price)}</div>
                </div>
                <div class="cart-item-qty">
                    <button onclick="updateQuantity(${item.product.id}, -1)">-</button>
                    <span style="font-size: 13px; width: 15px; text-align: center;">${item.quantity}</span>
                    <button onclick="updateQuantity(${item.product.id}, 1)">+</button>
                </div>
                <div class="cart-item-price" style="min-width:70px; text-align:right;">${formatCOP(itemTotal)}</div>
            </div>
        `;
    });

    const tax = 0; // Configurable if needed
    const total = subtotal + tax;

    document.getElementById('cartSubtotal').textContent = formatCOP(subtotal);
    document.getElementById('cartTax').textContent = formatCOP(tax);
    document.getElementById('cartTotal').textContent = formatCOP(total);
}

function selectPaymentMethod(element) {
    document.querySelectorAll('.pm-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    selectedPaymentMethod = element.getAttribute('data-method');
}

async function checkout() {
    if (currentCart.length === 0) {
        showToast("El carrito está vacío", 'error');
        return;
    }

    const btn = document.querySelector('.pos-summary .btn-primary');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';

    const userStr = localStorage.getItem('user');
    let userId = 1; // Default
    if (userStr) {
        try { userId = JSON.parse(userStr).id; } catch(e){}
    }

    const customerId = document.getElementById('saleCustomer').value;
    const notes = document.getElementById('saleNotes').value.trim();

    const items = currentCart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.price
    }));

    const payload = {
        userId: userId,
        customerId: customerId ? parseInt(customerId) : null,
        paymentMethod: selectedPaymentMethod,
        taxAmount: 0,
        notes: notes,
        items: items
    };

    try {
        const response = await api.post('/sales', payload);
        showToast('Venta registrada con éxito', 'success');
        clearCart();
        // Recargar stock
        await loadPOSData();
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-cash-register" style="margin-right: 8px;"></i> Procesar Venta';
    }
}

function showToast(message, type = 'success') {
    const existing = document.getElementById('toastNotif');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'toastNotif';
    toast.style.cssText = `
        position:fixed;bottom:30px;right:30px;z-index:9999;
        background:${type === 'success' ? '#28a745' : '#dc3545'};
        color:white;padding:14px 22px;border-radius:8px;
        font-weight:600;font-size:14px;font-family:Inter,sans-serif;
        box-shadow:0 4px 20px rgba(0,0,0,0.2);display:flex;align-items:center;gap:10px;
        animation:slideInToast 0.3s ease;
    `;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
}

function logout() { localStorage.removeItem('user'); window.location.href = 'index.html'; }
