let productsData = [];
let categoriesData = [];
let customersData = [];
let selectedProductIds = new Set();

document.addEventListener('DOMContentLoaded', () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            document.getElementById('userNameDisplay').textContent = user.fullName || user.username || 'Usuario';
        } catch(e) {}
    }
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        productsData = await api.get('/products');
        try { categoriesData = await api.get('/categories'); } catch(e) {}
        try { customersData = await api.get('/customers'); } catch(e) {}

        renderInventoryTable(productsData);
        updateDashboardStats(productsData);
    } catch (error) {
        console.error("Error loading dashboard data", error);
        document.getElementById('inventoryTableBody').innerHTML =
            `<tr><td colspan="7" style="text-align:center;color:red;padding:30px;">
                <i class="fa-solid fa-triangle-exclamation"></i> No se pudo conectar al servidor.<br>
                <small>Asegúrate de que Spring Boot esté corriendo en el puerto 8080.</small>
            </td></tr>`;
    }
}

function renderInventoryTable(data) {
    const tableBody = document.getElementById('inventoryTableBody');
    tableBody.innerHTML = '';
    selectedProductIds.clear();
    updateBulkDeleteBtn();

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#999;padding:40px;">
            <i class="fa-solid fa-box-open" style="font-size:32px;margin-bottom:10px;display:block;"></i>
            No hay productos registrados. Haz clic en "Registrar Producto" para comenzar.
        </td></tr>`;
        return;
    }

    data.forEach(p => {
        let stockBadge = '';
        if (p.stockLevel > 50) {
            stockBadge = `<span class="badge badge-primary" style="background:#e6f4ea;color:#1e8e3e;">ÓPTIMO</span>`;
        } else if (p.stockLevel > 10) {
            stockBadge = `<span class="badge badge-warning">STOCK BAJO</span>`;
        } else {
            stockBadge = `<span class="badge badge-danger">CRÍTICO</span>`;
        }

        let imgHtml = p.imageUrl && p.imageUrl.trim() !== ''
            ? `<img src="${p.imageUrl}" alt="img" style="width:36px;height:36px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:10px;border:1px solid #eee;">`
            : `<div style="width:36px;height:36px;background:#f0f2f5;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;margin-right:10px;vertical-align:middle;border:1px solid #e1e4e8;"><i class="fa-regular fa-image" style="color:#a0aabf;font-size:13px;"></i></div>`;

        const tr = document.createElement('tr');
        tr.dataset.id = p.id;
        tr.innerHTML = `
            <td style="width:36px;padding-right:0;">
                <input type="checkbox" class="product-checkbox" data-id="${p.id}"
                    onchange="toggleProductSelect(${p.id}, this.checked)"
                    style="width:16px;height:16px;cursor:pointer;accent-color:var(--primary-color);">
            </td>
            <td style="color:#666;font-size:13px;">#${p.sku}</td>
            <td style="font-weight:600;">${imgHtml}${p.name}</td>
            <td><span class="badge" style="background:#eef2f9;color:#555;">${p.category ? p.category.name : 'Sin categoría'}</span></td>
            <td>${p.stockLevel} &nbsp;${stockBadge}</td>
            <td style="font-weight:600;">${formatCOP(p.price)}</td>
            <td>
                <button class="btn-icon" onclick="editProduct(${p.id})" title="Editar" style="color:var(--primary-color);"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon" style="color:var(--danger);" onclick="deleteProduct(${p.id})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function updateDashboardStats(data) {
    const totalSku = data.length;
    const lowStockCount = data.filter(p => p.stockLevel <= 10).length;
    document.getElementById('statTotalSku').textContent = totalSku;
    document.getElementById('statLowStock').textContent = lowStockCount;
}

// ------------------- CHECKBOX / BULK SELECT -------------------
function toggleSelectAll(checked) {
    document.querySelectorAll('.product-checkbox').forEach(cb => {
        cb.checked = checked;
        const id = parseInt(cb.dataset.id);
        if (checked) selectedProductIds.add(id);
        else selectedProductIds.delete(id);
    });
    updateBulkDeleteBtn();
}

function toggleProductSelect(id, checked) {
    if (checked) selectedProductIds.add(id);
    else selectedProductIds.delete(id);

    // Update select-all checkbox state
    const allCbs = document.querySelectorAll('.product-checkbox');
    const selectAllCb = document.getElementById('selectAllCheckbox');
    if (selectAllCb) {
        selectAllCb.checked = allCbs.length > 0 && selectedProductIds.size === allCbs.length;
        selectAllCb.indeterminate = selectedProductIds.size > 0 && selectedProductIds.size < allCbs.length;
    }
    updateBulkDeleteBtn();
}

function updateBulkDeleteBtn() {
    const btn = document.getElementById('bulkDeleteBtn');
    if (!btn) return;
    if (selectedProductIds.size > 0) {
        btn.style.display = 'inline-flex';
        btn.textContent = `Eliminar ${selectedProductIds.size} seleccionado${selectedProductIds.size > 1 ? 's' : ''}`;
        btn.innerHTML = `<i class="fa-solid fa-trash" style="margin-right:6px;"></i> Eliminar ${selectedProductIds.size} seleccionado${selectedProductIds.size > 1 ? 's' : ''}`;
    } else {
        btn.style.display = 'none';
    }
}

async function deleteSelectedProducts() {
    if (selectedProductIds.size === 0) return;
    const ids = Array.from(selectedProductIds);
    const names = ids.map(id => {
        const p = productsData.find(x => x.id === id);
        return p ? `• ${p.name} (${p.sku})` : `• ID ${id}`;
    }).join('\n');

    if (!confirm(`¿Está seguro de eliminar los siguientes ${ids.length} producto(s)?\n\n${names}\n\nEsta acción no se puede deshacer.`)) return;

    try {
        const result = await fetch('http://localhost:8080/api/products/bulk', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ids)
        });
        const data = await result.json();
        showToast(`${data.deleted} producto(s) eliminado(s) exitosamente`, 'success');
        selectedProductIds.clear();
        await loadDashboardData();
    } catch(e) {
        showToast('Error al eliminar productos seleccionados', 'error');
    }
}

// ------------------- PRODUCT MODAL -------------------
function openProductModal() {
    document.getElementById('productModal').style.display = 'flex';
    document.getElementById('productForm').reset();
    document.getElementById('prodId').value = '';
    document.getElementById('productModalTitle').textContent = 'Registrar Producto';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('imagePreviewIcon').style.display = 'block';
    document.getElementById('prodImageUrl').value = '';
    document.getElementById('prodImage').value = '';
    const lbl = document.getElementById('uploadStatusLabel');
    if (lbl) { lbl.textContent = ''; }
    populateCategories();
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

function populateCategories() {
    const sel = document.getElementById('prodCategory');
    sel.innerHTML = '<option value="">Sin categoría</option>';
    categoriesData.forEach(c => {
        sel.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
}

function editProduct(id) {
    const p = productsData.find(x => x.id === id);
    if (p) {
        openProductModal();
        document.getElementById('productModalTitle').textContent = 'Editar Producto';
        document.getElementById('prodId').value = p.id;
        document.getElementById('prodName').value = p.name || '';
        document.getElementById('prodSku').value = p.sku || '';
        document.getElementById('prodDescription').value = p.description || '';
        document.getElementById('prodPrice').value = p.price || '';
        document.getElementById('prodStock').value = p.stockLevel || 0;
        document.getElementById('prodStatus').value = p.status || 'ACTIVE';
        document.getElementById('prodImageUrl').value = p.imageUrl || '';
        if (p.category && p.category.id) {
            setTimeout(() => { document.getElementById('prodCategory').value = p.category.id; }, 50);
        }
        if (p.imageUrl) {
            document.getElementById('imagePreview').src = p.imageUrl;
            document.getElementById('imagePreview').style.display = 'block';
            document.getElementById('imagePreviewIcon').style.display = 'none';
        }
    }
}

async function deleteProduct(id) {
    const p = productsData.find(x => x.id === id);
    const name = p ? `"${p.name}"` : `#${id}`;
    if (!confirm(`¿Eliminar el producto ${name}?\n\nEsta acción no se puede deshacer.`)) return;
    try {
        const res = await fetch(`http://localhost:8080/api/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Producto eliminado exitosamente', 'success');
            await loadDashboardData();
        } else {
            const err = await res.json().catch(() => ({}));
            showToast('Error: ' + (err.message || 'No se pudo eliminar'), 'error');
        }
    } catch(e) {
        showToast('Error de conexión al eliminar producto', 'error');
    }
}

document.getElementById('prodImage').addEventListener('change', async function() {
    const file = this.files[0];
    if (!file) return;

    // Validaciones frontend
    if (file.size > 5 * 1024 * 1024) {
        showToast('El archivo excede los 5MB permitidos.', 'error');
        this.value = '';
        return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        showToast('Formato no válido. Use JPG, PNG o WEBP.', 'error');
        this.value = '';
        return;
    }

    // Preview inmediata con FileReader (no depende del server)
    const reader = new FileReader();
    reader.onload = e => {
        const preview = document.getElementById('imagePreview');
        const icon = document.getElementById('imagePreviewIcon');
        preview.src = e.target.result;
        preview.style.display = 'block';
        icon.style.display = 'none';
    };
    reader.readAsDataURL(file);

    // Bloquear botón guardar mientras sube
    const saveBtn = document.querySelector('#productForm button[type="submit"]');
    const uploadLabel = document.getElementById('uploadStatusLabel');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.style.opacity = '0.6'; }
    if (uploadLabel) { uploadLabel.textContent = '⏳ Subiendo imagen...'; uploadLabel.style.color = '#888'; }

    const formData = new FormData();
    formData.append('file', file);
    try {
        const res = await fetch('http://localhost:8080/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok && data.url) {
            document.getElementById('prodImageUrl').value = 'http://localhost:8080' + data.url;
            if (uploadLabel) { uploadLabel.textContent = '✅ Imagen lista'; uploadLabel.style.color = '#28a745'; }
            showToast('Imagen subida correctamente', 'success');
        } else {
            document.getElementById('prodImageUrl').value = '';
            if (uploadLabel) { uploadLabel.textContent = '❌ Error al subir imagen'; uploadLabel.style.color = '#dc3545'; }
            showToast(data.error || 'Error al subir imagen', 'error');
        }
    } catch(e) {
        document.getElementById('prodImageUrl').value = '';
        if (uploadLabel) { uploadLabel.textContent = '❌ Sin conexión con el servidor'; uploadLabel.style.color = '#dc3545'; }
        showToast('No se pudo conectar al servidor para subir la imagen.', 'error');
    } finally {
        // Re-habilitar botón guardar siempre
        if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = '1'; }
    }
});

async function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('prodId').value;
    const catId = document.getElementById('prodCategory').value;
    const payload = {
        name: document.getElementById('prodName').value.trim(),
        sku: document.getElementById('prodSku').value.trim(),
        description: document.getElementById('prodDescription').value.trim(),
        price: parseFloat(document.getElementById('prodPrice').value),
        stockLevel: parseInt(document.getElementById('prodStock').value) || 0,
        status: document.getElementById('prodStatus').value,
        imageUrl: document.getElementById('prodImageUrl').value || null
    };
    if (catId) payload.category = { id: parseInt(catId) };

    try {
        if (id) {
            await api.put(`/products/${id}`, payload);
            showToast('Producto actualizado exitosamente', 'success');
        } else {
            await api.post('/products', payload);
            showToast('Producto registrado exitosamente', 'success');
        }
        closeProductModal();
        await loadDashboardData();
    } catch(e) {
        showToast('Error al guardar producto: ' + (e.message || ''), 'error');
    }
}

// ------------------- ENTRY MODAL -------------------
function openEntryModal() {
    document.getElementById('entryModal').style.display = 'flex';
    document.getElementById('entryForm').reset();
    const sel = document.getElementById('entryProduct');
    sel.innerHTML = '<option value="">Seleccione producto...</option>';
    productsData.forEach(p => {
        sel.innerHTML += `<option value="${p.id}">${p.name} (SKU: ${p.sku}) — Stock: ${p.stockLevel}</option>`;
    });
    document.getElementById('entryDate').value = new Date().toISOString().split('T')[0];
}

function closeEntryModal() { document.getElementById('entryModal').style.display = 'none'; }

async function saveEntry(e) {
    e.preventDefault();
    const productId = document.getElementById('entryProduct').value;
    const quantity = parseInt(document.getElementById('entryQuantity').value);
    if (!productId) { showToast('Seleccione un producto', 'error'); return; }
    if (!quantity || quantity <= 0) { showToast('La cantidad debe ser mayor a 0', 'error'); return; }
    const payload = {
        product: { id: parseInt(productId) },
        movementType: 'IN',
        quantity: quantity,
        provider: document.getElementById('entryProvider').value.trim(),
        reference: document.getElementById('entryRef').value.trim(),
        notes: document.getElementById('entryNotes').value.trim(),
        movementDate: document.getElementById('entryDate').value + 'T00:00:00',
        user: { id: 1 }
    };
    try {
        await api.post('/movements', payload);
        closeEntryModal();
        await loadDashboardData();
        showToast('Entrada registrada exitosamente', 'success');
    } catch(e) { showToast('Error al registrar entrada: ' + (e.message || ''), 'error'); }
}

// ------------------- EXIT MODAL -------------------
function openExitModal() {
    document.getElementById('exitModal').style.display = 'flex';
    document.getElementById('exitForm').reset();
    const sel = document.getElementById('exitProduct');
    sel.innerHTML = '<option value="">Seleccione producto...</option>';
    productsData.forEach(p => { sel.innerHTML += `<option value="${p.id}">${p.name} (SKU: ${p.sku}) — Stock: ${p.stockLevel}</option>`; });
    const cust = document.getElementById('exitCustomer');
    cust.innerHTML = '<option value="">Consumidor Final</option>';
    customersData.forEach(c => { cust.innerHTML += `<option value="${c.id}">${c.name}</option>`; });
    document.getElementById('exitStockLabel').textContent = 'Stock actual: —';
    document.getElementById('exitDate').value = new Date().toISOString().split('T')[0];
}

function closeExitModal() { document.getElementById('exitModal').style.display = 'none'; }

function updateExitMax() {
    const pid = document.getElementById('exitProduct').value;
    const p = productsData.find(x => x.id == pid);
    document.getElementById('exitStockLabel').textContent = p ? 'Stock actual: ' + p.stockLevel : 'Stock actual: —';
    if (p) document.getElementById('exitQuantity').max = p.stockLevel;
}

async function saveExit(e) {
    e.preventDefault();
    const productId = document.getElementById('exitProduct').value;
    const quantity = parseInt(document.getElementById('exitQuantity').value);
    const custId = document.getElementById('exitCustomer').value;
    if (!productId) { showToast('Seleccione un producto', 'error'); return; }
    const p = productsData.find(x => x.id == productId);
    if (p && quantity > p.stockLevel) { showToast(`Stock insuficiente. Disponible: ${p.stockLevel}`, 'error'); return; }
    const payload = {
        product: { id: parseInt(productId) },
        movementType: 'OUT',
        quantity: quantity,
        reference: document.getElementById('exitRef').value.trim(),
        notes: document.getElementById('exitNotes').value.trim(),
        movementDate: document.getElementById('exitDate').value + 'T00:00:00',
        user: { id: 1 }
    };
    if (custId) payload.customer = { id: parseInt(custId) };
    try {
        await api.post('/movements', payload);
        closeExitModal();
        await loadDashboardData();
        showToast('Salida registrada exitosamente', 'success');
    } catch(e) { showToast('Error al registrar salida.', 'error'); }
}

function exportInventory() {
    let csv = 'SKU,Nombre,Categoria,Stock,Precio COP\n';
    productsData.forEach(p => {
        csv += `"${p.sku}","${p.name}","${p.category ? p.category.name : 'N/A'}","${p.stockLevel}","${formatCOP(p.price)}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'inventario_xdolce.csv'; a.click();
    window.URL.revokeObjectURL(url);
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
