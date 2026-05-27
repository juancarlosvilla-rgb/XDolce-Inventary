let layawaysData = [];
let productsData = [];
let customersData = [];

document.addEventListener('DOMContentLoaded', () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            document.querySelector('.user-profile').innerHTML = `
                <i class="fa-solid fa-circle-user" style="font-size: 24px; color: var(--primary-color);"></i>
                <span style="margin-left: 8px; font-weight: 500;">${user.fullName || user.username}</span>
            `;
        } catch(e) {}
    }
    loadData();
});

async function loadData() {
    try {
        layawaysData = await api.get('/layaways');
        try { productsData = await api.get('/products'); } catch(e) {}
        try { customersData = await api.get('/customers'); } catch(e) {}
        
        renderLayawaysTable();
        updateStats();
        populatePaymentSelect();
    } catch (error) {
        console.error("Error loading layaways data", error);
        document.getElementById('layawayTableBody').innerHTML = 
            `<tr><td colspan="8" style="text-align:center;color:red;">Error de conexión.</td></tr>`;
    }
}

function renderLayawaysTable() {
    const tableBody = document.getElementById('layawayTableBody');
    tableBody.innerHTML = '';

    if (layawaysData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#999;padding:20px;">No hay apartados activos.</td></tr>`;
        return;
    }

    layawaysData.forEach(l => {
        let statusBadge = '';
        if (l.status === 'ACTIVE') statusBadge = `<span class="badge badge-warning">ACTIVO</span>`;
        else if (l.status === 'READY') statusBadge = `<span class="badge badge-success">PAGADO</span>`;
        else if (l.status === 'CANCELLED') statusBadge = `<span class="badge badge-danger">CANCELADO</span>`;

        const pName = l.product ? l.product.name : 'N/A';
        const cName = l.customer ? l.customer.name : 'N/A';
        const balance = l.totalAmount - l.paidAmount;

        tableBody.innerHTML += `
            <tr>
                <td style="font-weight:600;">${cName}</td>
                <td style="color:#666;">${pName} (x${l.quantity})</td>
                <td style="font-weight:600;">${formatCOP(l.totalAmount)}</td>
                <td style="color:#28a745;">${formatCOP(l.paidAmount)}</td>
                <td style="color:var(--danger); font-weight:bold;">${formatCOP(balance)}</td>
                <td>${l.dueDate}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-icon" onclick="editLayaway(${l.id})" title="Editar"><i class="fa-solid fa-pen" style="color:var(--primary-color);"></i></button>
                    ${l.status === 'ACTIVE' ? `<button class="btn-icon" onclick="cancelLayaway(${l.id})" title="Cancelar"><i class="fa-solid fa-ban" style="color:#ff9800;"></i></button>` : ''}
                    <button class="btn-icon" onclick="deleteLayaway(${l.id})" title="Eliminar"><i class="fa-solid fa-trash" style="color:var(--danger);"></i></button>
                </td>
            </tr>
        `;
    });
}

function updateStats() {
    const active = layawaysData.filter(l => l.status === 'ACTIVE').length;
    const totalBalance = layawaysData.filter(l => l.status === 'ACTIVE')
                                     .reduce((sum, l) => sum + (l.totalAmount - l.paidAmount), 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const expired = layawaysData.filter(l => l.status === 'ACTIVE' && l.dueDate < todayStr).length;

    document.getElementById('statActive').textContent = active;
    document.getElementById('statBalance').textContent = formatCOP(totalBalance);
    document.getElementById('statExpired').textContent = expired;
}

function populatePaymentSelect() {
    const sel = document.getElementById('layawaySelect');
    sel.innerHTML = '<option value="">Seleccione apartado activo...</option>';
    layawaysData.filter(l => l.status === 'ACTIVE').forEach(l => {
        const cName = l.customer ? l.customer.name : 'Cliente';
        const balance = l.totalAmount - l.paidAmount;
        sel.innerHTML += `<option value="${l.id}">${cName} - Saldo: ${formatCOP(balance)}</option>`;
    });
}

// ---------------- PAYMENT ----------------
document.querySelectorAll('.payment-panel .btn-group button').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.payment-panel .btn-group button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});

async function registerPayment() {
    const id = document.getElementById('layawaySelect').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    if (!id) { showToast('Seleccione un apartado', 'error'); return; }
    if (!amount || amount <= 0) { showToast('Monto inválido', 'error'); return; }

    const method = document.querySelector('.payment-panel .btn-group button.active').textContent;

    try {
        const res = await fetch(`http://localhost:8080/api/layaways/${id}/pay`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paidAmount: amount, method: method }) // method no soportado por backend aún, pero lo enviamos
        });
        
        if (res.ok) {
            showToast('Pago registrado exitosamente');
            document.getElementById('paymentAmount').value = '';
            await loadData();
        } else {
            const txt = await res.text();
            showToast(txt || 'Error al registrar pago', 'error');
        }
    } catch (e) {
        showToast('Error de conexión', 'error');
    }
}

// ---------------- CRUD MODAL ----------------
function openLayawayModal() {
    document.getElementById('layawayForm').reset();
    document.getElementById('editLayawayId').value = '';
    document.getElementById('layawayModalTitle').textContent = 'Crear Apartado';
    
    // Populate dropdowns
    const cSel = document.getElementById('newLayawayCustomer');
    cSel.innerHTML = '<option value="">Seleccione cliente...</option>';
    customersData.forEach(c => cSel.innerHTML += `<option value="${c.id}">${c.name}</option>`);

    const pSel = document.getElementById('newLayawayProduct');
    pSel.innerHTML = '<option value="">Seleccione producto...</option>';
    productsData.forEach(p => pSel.innerHTML += `<option value="${p.id}" data-price="${p.price}">${p.name} - ${formatCOP(p.price)}</option>`);

    document.getElementById('newLayawayDate').value = new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0];
    document.getElementById('layawayModal').style.display = 'flex';
}

function closeLayawayModal() { document.getElementById('layawayModal').style.display = 'none'; }

function updateLayawayPrice() {
    const pSel = document.getElementById('newLayawayProduct');
    const opt = pSel.options[pSel.selectedIndex];
    const qty = parseInt(document.getElementById('newLayawayQuantity').value) || 1;
    if (opt && opt.value) {
        const price = parseFloat(opt.getAttribute('data-price'));
        document.getElementById('newLayawayTotal').value = price * qty;
    } else {
        document.getElementById('newLayawayTotal').value = '';
    }
}

function editLayaway(id) {
    const layaway = layawaysData.find(l => l.id === id);
    if (!layaway) return;
    
    openLayawayModal();
    document.getElementById('layawayModalTitle').textContent = 'Editar Apartado';
    document.getElementById('editLayawayId').value = layaway.id;
    
    if(layaway.customer) document.getElementById('newLayawayCustomer').value = layaway.customer.id;
    if(layaway.product) document.getElementById('newLayawayProduct').value = layaway.product.id;
    
    document.getElementById('newLayawayQuantity').value = layaway.quantity;
    document.getElementById('newLayawayTotal').value = layaway.totalAmount;
    document.getElementById('newLayawayAbono').value = layaway.paidAmount;
    document.getElementById('newLayawayDate').value = layaway.dueDate;
    document.getElementById('newLayawayNotes').value = layaway.notes || '';
}

async function saveLayaway(e) {
    e.preventDefault();
    const id = document.getElementById('editLayawayId').value;
    
    const payload = {
        customer: { id: parseInt(document.getElementById('newLayawayCustomer').value) },
        product: { id: parseInt(document.getElementById('newLayawayProduct').value) },
        quantity: parseInt(document.getElementById('newLayawayQuantity').value),
        totalAmount: parseFloat(document.getElementById('newLayawayTotal').value),
        paidAmount: parseFloat(document.getElementById('newLayawayAbono').value),
        dueDate: document.getElementById('newLayawayDate').value,
        notes: document.getElementById('newLayawayNotes').value
    };

    if(payload.paidAmount > payload.totalAmount) {
        showToast('El abono no puede superar el total', 'error');
        return;
    }

    try {
        if (id) {
            await api.put(`/layaways/${id}`, payload);
            showToast('Apartado actualizado');
        } else {
            await api.post('/layaways', payload);
            showToast('Apartado creado exitosamente');
        }
        closeLayawayModal();
        await loadData();
    } catch(err) {
        showToast('Error al guardar: ' + err.message, 'error');
    }
}

async function cancelLayaway(id) {
    if (!confirm('¿Está seguro de cancelar este apartado?')) return;
    try {
        const res = await fetch(`http://localhost:8080/api/layaways/${id}/cancel`, { method: 'PUT' });
        if (res.ok) {
            showToast('Apartado cancelado');
            await loadData();
        }
    } catch (e) {
        showToast('Error de conexión', 'error');
    }
}

async function deleteLayaway(id) {
    if (!confirm('¿Eliminar definitivamente este apartado?')) return;
    try {
        const res = await fetch(`http://localhost:8080/api/layaways/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Apartado eliminado');
            await loadData();
        }
    } catch (e) {
        showToast('Error de conexión', 'error');
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
