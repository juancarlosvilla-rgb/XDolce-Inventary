let customersData = [];

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadCustomers();
});

async function loadCustomers() {
    try {
        const customers = await api.get('/customers');
        customersData = customers;
        renderCustomersTable(customers);
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar la lista de clientes.');
    }
}

function renderCustomersTable(data) {
    const tbody = document.getElementById('customersTableBody');
    tbody.innerHTML = '';

    if(data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No se encontraron clientes.</td></tr>';
        return;
    }

    data.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${c.document || `ID-${c.id}`}</strong></td>
            <td>${c.name}</td>
            <td>${c.phone || '-'}</td>
            <td>${c.email || '-'}</td>
            <td>${c.address || '-'}</td>
            <td>
                <button class="btn-icon" onclick="editCustomer(${c.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon" style="color:var(--danger);" onclick="deleteCustomer(${c.id})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filterCustomers() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const filtered = customersData.filter(c => 
        c.name.toLowerCase().includes(search) || 
        (c.document && c.document.toLowerCase().includes(search))
    );
    renderCustomersTable(filtered);
}

function openCustomerModal(id = null) {
    const modal = document.getElementById('customerModal');
    const form = document.getElementById('customerForm');
    
    if (id) {
        document.getElementById('modalTitle').textContent = 'Editar Cliente';
        const customer = customersData.find(c => c.id === id);
        if (customer) {
            document.getElementById('customerId').value = customer.id;
            document.getElementById('custName').value = customer.name;
            document.getElementById('custDoc').value = customer.document || '';
            document.getElementById('custPhone').value = customer.phone || '';
            document.getElementById('custEmail').value = customer.email || '';
            document.getElementById('custAddress').value = customer.address || '';
        }
    } else {
        document.getElementById('modalTitle').textContent = 'Registrar Cliente';
        form.reset();
        document.getElementById('customerId').value = '';
    }
    
    modal.style.display = 'flex';
}

function closeCustomerModal() {
    document.getElementById('customerModal').style.display = 'none';
}

async function saveCustomer(e) {
    e.preventDefault();
    const id = document.getElementById('customerId').value;
    const customer = {
        name: document.getElementById('custName').value,
        document: document.getElementById('custDoc').value,
        phone: document.getElementById('custPhone').value,
        email: document.getElementById('custEmail').value,
        address: document.getElementById('custAddress').value
    };

    try {
        if (id) {
            await api.put(`/customers/${id}`, customer);
        } else {
            await api.post('/customers', customer);
        }
        closeCustomerModal();
        loadCustomers();
    } catch (error) {
        console.error(error);
        alert('Error al guardar el cliente.');
    }
}

async function deleteCustomer(id) {
    if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
        try {
            await api.delete(`/customers/${id}`);
            loadCustomers();
        } catch (error) {
            console.error(error);
            alert('Error al eliminar cliente.');
        }
    }
}
