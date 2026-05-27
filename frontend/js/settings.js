document.addEventListener('DOMContentLoaded', () => {
    // Load current user profile from local storage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user) {
        document.getElementById('profileName').value = user.fullName || user.name || '';
        document.getElementById('profileEmail').value = user.email || '';
        
        // Esconder eliminar cuenta para admins
        if (user.role === 'ADMIN') {
            const deleteBtn = document.getElementById('deleteAccountBtn');
            if (deleteBtn) deleteBtn.style.display = 'none';
        }
    }

    // Load theme preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').checked = true;
    }
    
    // Load stock alert preference
    if (localStorage.getItem('stockAlertsEnabled') !== 'false') {
        // default true
        document.getElementById('stockAlertToggle').checked = true;
    } else {
        document.getElementById('stockAlertToggle').checked = false;
    }
});

function toggleTheme() {
    const isDark = document.getElementById('themeToggle').checked;
    if (isDark) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
}

function toggleStockAlerts() {
    const isEnabled = document.getElementById('stockAlertToggle').checked;
    if (isEnabled) {
        localStorage.setItem('stockAlertsEnabled', 'true');
        showToast('Alertas de stock activadas', 'success');
    } else {
        localStorage.setItem('stockAlertsEnabled', 'false');
        showToast('Alertas de stock desactivadas', 'success');
    }
}

async function saveAllSettings() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const name = document.getElementById('profileName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();

    if (!name) {
        showToast('El nombre no puede estar vacío', 'error');
        return;
    }

    try {
        const userId = user.id || 1;
        const response = await fetch(`http://localhost:8080/api/auth/profile/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName: name, email: email })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.data) {
                // Update local storage
                const updated = { ...user, fullName: name, email: email };
                localStorage.setItem('user', JSON.stringify(updated));
            }
            showToast('Perfil guardado exitosamente', 'success');
        } else {
            showToast('Error al guardar perfil', 'error');
        }
    } catch(e) {
        // Fallback: save locally only
        const updated = { ...user, fullName: name, email: email };
        localStorage.setItem('user', JSON.stringify(updated));
        showToast('Cambios guardados localmente', 'success');
    }
}

function openPasswordModal() {
    document.getElementById('passwordModal').style.display = 'flex';
    document.getElementById('currentPass').value = '';
    document.getElementById('newPass').value = '';
    document.getElementById('confirmPass').value = '';
}

function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
}

async function submitPasswordChange() {
    const current = document.getElementById('currentPass').value;
    const newPass = document.getElementById('newPass').value;
    const confirmPass = document.getElementById('confirmPass').value;

    if (!current || !newPass || !confirmPass) {
        showToast('Complete todos los campos', 'error');
        return;
    }
    if (newPass !== confirmPass) {
        showToast('Las contraseñas nuevas no coinciden', 'error');
        return;
    }
    if (newPass.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const username = user.username || 'admin';

    try {
        const response = await fetch('http://localhost:8080/api/auth/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, currentPassword: current, newPassword: newPass })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            showToast('Contraseña actualizada exitosamente', 'success');
            closePasswordModal();
        } else {
            showToast(data.message || 'Error al cambiar contraseña', 'error');
        }
    } catch(e) {
        showToast('Error de conexión al servidor', 'error');
    }
}

function showToast(message, type = 'success') {
    const existing = document.getElementById('toastNotif');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'toastNotif';
    toast.style.cssText = `
        position: fixed; bottom: 30px; right: 30px; z-index: 9999;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white; padding: 14px 22px; border-radius: 8px;
        font-weight: 600; font-size: 14px; font-family: Inter, sans-serif;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        display: flex; align-items: center; gap: 10px;
    `;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}
