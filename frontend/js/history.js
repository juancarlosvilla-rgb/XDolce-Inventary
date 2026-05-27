let allMovements = [];
let allSales = [];

document.addEventListener('DOMContentLoaded', () => {
    // Set user name
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
        allMovements = await api.get('/movements');
        renderHistory(allMovements);
    } catch (error) {
        console.error("Error loading movements", error);
        document.getElementById('historyTableBody').innerHTML = 
            `<tr><td colspan="7" style="text-align:center;color:red;">Error cargando movimientos</td></tr>`;
    }

    try {
        allSales = await api.get('/sales');
        renderSales(allSales);
    } catch (error) {
        console.error("Error loading sales", error);
        document.getElementById('salesTableBody').innerHTML = 
            `<tr><td colspan="8" style="text-align:center;color:red;">Error cargando ventas</td></tr>`;
    }
}

// ================= SALES (VENTAS) =================

function renderSales(data) {
    const tableBody = document.getElementById('salesTableBody');
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#999;padding:20px;">No hay ventas registradas</td></tr>`;
        return;
    }

    data.forEach(s => {
        const dateObj = new Date(s.saleDate);
        const dateStr = dateObj.toLocaleDateString('es-CO') + ' ' + dateObj.toLocaleTimeString('es-CO', {hour: '2-digit', minute:'2-digit'});
        
        const customerName = s.customer ? s.customer.name : 'Consumidor Final';
        const userName = s.user ? (s.user.fullName || s.user.username) : 'Sistema';
        
        // Formatear productos
        let productsHtml = '';
        if (s.items && s.items.length > 0) {
            productsHtml = s.items.map(i => `${i.product ? i.product.name : 'Desc'} (x${i.quantity})`).join(', ');
        }
        if (productsHtml.length > 40) productsHtml = productsHtml.substring(0, 40) + '...';

        let badgeColor = '#666';
        if (s.paymentMethod === 'EFECTIVO') badgeColor = '#28a745';
        if (s.paymentMethod === 'TRANSFERENCIA' || s.paymentMethod === 'NEQUI' || s.paymentMethod === 'DAVIPLATA') badgeColor = '#17a2b8';
        if (s.paymentMethod === 'TARJETA') badgeColor = '#ffc107';

        tableBody.innerHTML += `
            <tr>
                <td style="font-weight:600;">#V-${s.id.toString().padStart(4, '0')}</td>
                <td>${dateStr}</td>
                <td>${customerName}</td>
                <td style="color:#666; font-size:12px;">${productsHtml}</td>
                <td><span class="badge" style="background-color:${badgeColor}; color:#fff;">${s.paymentMethod || 'N/A'}</span></td>
                <td>${userName}</td>
                <td style="font-weight:600; color:var(--primary-color);">${formatCOP(s.totalAmount)}</td>
                <td>
                    <button class="btn-icon" onclick="viewSaleDetails(${s.id})" title="Ver detalles"><i class="fa-solid fa-eye" style="color:var(--primary-color);"></i></button>
                    <button class="btn-icon" onclick="deleteSale(${s.id})" title="Eliminar y devolver stock"><i class="fa-solid fa-trash" style="color:var(--danger);"></i></button>
                </td>
            </tr>
        `;
    });
}

function filterSales() {
    const search = document.getElementById('salesSearch').value.toLowerCase();
    const method = document.getElementById('salesPaymentFilter').value;

    const filtered = allSales.filter(s => {
        let matchSearch = true;
        let matchMethod = true;

        if (search) {
            const customerName = s.customer ? s.customer.name.toLowerCase() : 'consumidor final';
            const idStr = s.id.toString();
            matchSearch = customerName.includes(search) || idStr.includes(search);
        }

        if (method) {
            matchMethod = s.paymentMethod === method;
        }

        return matchSearch && matchMethod;
    });

    renderSales(filtered);
}

function viewSaleDetails(id) {
    const sale = allSales.find(s => s.id === id);
    if (!sale) return;

    const dateObj = new Date(sale.saleDate);
    const dateStr = dateObj.toLocaleDateString('es-CO') + ' ' + dateObj.toLocaleTimeString('es-CO', {hour: '2-digit', minute:'2-digit'});

    let itemsHtml = '';
    sale.items.forEach(i => {
        const pName = i.product ? i.product.name : 'Producto Eliminado';
        const pSku = i.product ? i.product.sku : 'N/A';
        itemsHtml += `
            <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee;">
                <div>
                    <div style="font-weight:600; font-size:13px;">${pName}</div>
                    <div style="font-size:11px; color:#666;">SKU: ${pSku} | ${formatCOP(i.unitPrice)} x ${i.quantity}</div>
                </div>
                <div style="font-weight:600;">${formatCOP(i.subtotal)}</div>
            </div>
        `;
    });

    const content = document.getElementById('saleDetailsContent');
    content.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:20px; background:#f9f9f9; padding:15px; border-radius:6px; border:1px solid #ddd;">
            <div><span style="font-size:11px; color:#666;">ID VENTA:</span> <br><b>#V-${sale.id.toString().padStart(4, '0')}</b></div>
            <div><span style="font-size:11px; color:#666;">FECHA:</span> <br><b>${dateStr}</b></div>
            <div><span style="font-size:11px; color:#666;">CLIENTE:</span> <br><b>${sale.customer ? sale.customer.name : 'Consumidor Final'}</b></div>
            <div><span style="font-size:11px; color:#666;">VENDEDOR:</span> <br><b>${sale.user ? sale.user.fullName : 'Sistema'}</b></div>
            <div><span style="font-size:11px; color:#666;">MÉTODO PAGO:</span> <br><b>${sale.paymentMethod}</b></div>
            <div><span style="font-size:11px; color:#666;">NOTAS:</span> <br><b>${sale.notes || 'Ninguna'}</b></div>
        </div>
        
        <h4 style="margin-bottom:10px; font-size:14px;">Productos</h4>
        <div style="border:1px solid #eee; padding:10px; border-radius:6px; margin-bottom:15px; max-height:200px; overflow-y:auto;">
            ${itemsHtml}
        </div>

        <div style="display:flex; justify-content:flex-end; gap:20px; font-size:16px;">
            <div>Impuestos: <b>${formatCOP(sale.taxAmount || 0)}</b></div>
            <div>Total: <b style="color:var(--primary-color); font-size:18px;">${formatCOP(sale.totalAmount)}</b></div>
        </div>
    `;

    document.getElementById('saleDetailsModal').style.display = 'flex';
}

function closeSaleDetails() {
    document.getElementById('saleDetailsModal').style.display = 'none';
}

async function deleteSale(id) {
    if (!confirm('¿Está seguro de eliminar esta venta?\n\nAl eliminarla, el stock de los productos vendidos se devolverá automáticamente al inventario. Esta acción no se puede deshacer.')) return;
    
    try {
        const res = await fetch(`http://localhost:8080/api/sales/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert('Venta eliminada y stock restaurado exitosamente');
            loadData(); // Recargar todo
        } else {
            alert('Error al eliminar venta');
        }
    } catch(e) {
        alert('Error de conexión');
    }
}

// ================= MOVIMIENTOS INVENTARIO =================

function renderHistory(data) {
    const tableBody = document.getElementById('historyTableBody');
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#999;padding:20px;">No hay movimientos registrados</td></tr>`;
        return;
    }

    data.forEach(m => {
        const dateObj = new Date(m.movementDate);
        const dateStr = dateObj.toLocaleDateString('es-CO') + ' ' + dateObj.toLocaleTimeString('es-CO', {hour: '2-digit', minute:'2-digit'});
        
        let typeBadge = '';
        let quantityHtml = m.quantity;

        switch (m.movementType) {
            case 'IN':
                typeBadge = `<span class="badge badge-success">ENTRADA</span>`;
                quantityHtml = `<span style="color:#28a745;font-weight:bold;">+${m.quantity}</span>`;
                break;
            case 'OUT':
                typeBadge = `<span class="badge badge-danger">SALIDA</span>`;
                quantityHtml = `<span style="color:#dc3545;font-weight:bold;">-${m.quantity}</span>`;
                break;
            case 'CREATE_PRODUCT':
                typeBadge = `<span class="badge badge-primary">CREACIÓN PROD</span>`;
                quantityHtml = `<span style="color:#1a3696;font-weight:bold;">+${m.quantity} (Inicial)</span>`;
                break;
            case 'EDIT_PRODUCT':
                typeBadge = `<span class="badge" style="background:#ffc107;color:#333;">EDICIÓN PROD</span>`;
                break;
            case 'DELETE_PRODUCT':
                typeBadge = `<span class="badge" style="background:#6c757d;color:#fff;">BORRADO PROD</span>`;
                break;
            case 'LAYAWAY_CREATE':
                typeBadge = `<span class="badge" style="background:#6f42c1;color:#fff;">APARTADO NUEVO</span>`;
                quantityHtml = `<span style="color:#6f42c1;font-weight:bold;">Reserva: ${m.quantity}</span>`;
                break;
            case 'LAYAWAY_PAYMENT':
                typeBadge = `<span class="badge" style="background:#20c997;color:#fff;">ABONO APARTADO</span>`;
                break;
            case 'LAYAWAY_CANCEL':
                typeBadge = `<span class="badge" style="background:#e83e8c;color:#fff;">CANC. APARTADO</span>`;
                break;
            default:
                typeBadge = `<span class="badge badge-secondary">${m.movementType}</span>`;
        }

        const productName = m.product ? `${m.product.name} <br><small style="color:#666;">${m.product.sku}</small>` : '<span style="color:#999;font-style:italic;">Producto Eliminado</span>';
        
        let refProv = m.reference || '';
        if (m.provider) refProv += (refProv ? ' / ' : '') + m.provider;
        if (m.customer) refProv += (refProv ? ' / ' : '') + 'Cliente: ' + m.customer.name;
        if (!refProv) refProv = '<span style="color:#ccc;">N/A</span>';

        const user = m.user ? (m.user.fullName || m.user.username) : 'Sistema';

        tableBody.innerHTML += `
            <tr>
                <td style="font-size:13px;">${dateStr}</td>
                <td>${typeBadge}</td>
                <td style="line-height:1.3;">${productName}</td>
                <td style="font-size:14px;">${quantityHtml}</td>
                <td style="font-size:13px;">${refProv}</td>
                <td>${user}</td>
                <td style="font-size:12px;color:#666;max-width:200px;">${m.notes || ''}</td>
            </tr>
        `;
    });
}

function filterHistory() {
    const type = document.getElementById('typeFilter').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const search = document.getElementById('searchFilter').value.toLowerCase();

    const filtered = allMovements.filter(m => {
        let matchType = true;
        let matchDate = true;
        let matchSearch = true;

        if (type) matchType = m.movementType === type;
        
        if (dateFrom || dateTo) {
            const mDate = new Date(m.movementDate).toISOString().split('T')[0];
            if (dateFrom && mDate < dateFrom) matchDate = false;
            if (dateTo && mDate > dateTo) matchDate = false;
        }

        if (search) {
            const prodName = m.product ? m.product.name.toLowerCase() : '';
            const prodSku = m.product ? m.product.sku.toLowerCase() : '';
            const ref = m.reference ? m.reference.toLowerCase() : '';
            matchSearch = prodName.includes(search) || prodSku.includes(search) || ref.includes(search);
        }

        return matchType && matchDate && matchSearch;
    });

    renderHistory(filtered);
}

function exportHistory() {
    let csv = 'Fecha,Tipo,Producto,SKU,Cantidad,Ref/Proveedor,Usuario,Observaciones\n';
    allMovements.forEach(m => {
        const d = new Date(m.movementDate).toLocaleString('es-CO');
        const pName = m.product ? m.product.name : 'N/A';
        const pSku = m.product ? m.product.sku : 'N/A';
        const u = m.user ? m.user.username : 'Sistema';
        csv += `"${d}","${m.movementType}","${pName}","${pSku}","${m.quantity}","${m.reference||''} / ${m.provider||''}","${u}","${m.notes||''}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'movimientos_xdolce.csv'; a.click();
    window.URL.revokeObjectURL(url);
}

function exportSales() {
    let csv = 'ID,Fecha,Cliente,Metodo Pago,Vendedor,Impuesto,Total\n';
    allSales.forEach(s => {
        const d = new Date(s.saleDate).toLocaleString('es-CO');
        const cName = s.customer ? s.customer.name : 'Consumidor Final';
        const u = s.user ? s.user.username : 'Sistema';
        csv += `"${s.id}","${d}","${cName}","${s.paymentMethod}","${u}","${s.taxAmount}","${s.totalAmount}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ventas_xdolce.csv'; a.click();
    window.URL.revokeObjectURL(url);
}

function logout() { localStorage.removeItem('user'); window.location.href = 'index.html'; }
