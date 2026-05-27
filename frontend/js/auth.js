document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await apiCall('/auth/login', 'POST', { username, password });
                if (response.success) {
                    // Guardar usuario en localStorage
                    localStorage.setItem('user', JSON.stringify(response.data));
                    // Redirigir al dashboard
                    window.location.href = 'dashboard.html';
                }
            } catch (error) {
                alert('Error al iniciar sesión: ' + error.message);
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('regFullName').value;
            const email = document.getElementById('regEmail').value;
            const username = document.getElementById('regUsername').value;
            const passwordHash = document.getElementById('regPassword').value;

            const newUser = {
                fullName,
                email,
                username,
                passwordHash,
                role: 'USER'
            };

            try {
                const response = await apiCall('/auth/register', 'POST', newUser);
                if (response.success) {
                    alert('Registro exitoso. Ahora puede iniciar sesión.');
                    window.location.href = 'index.html';
                }
            } catch (error) {
                alert('Error al registrar: ' + error.message);
            }
        });
    }
});

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}
