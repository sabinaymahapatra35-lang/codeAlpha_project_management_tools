document.addEventListener('DOMContentLoaded', () => {
    checkAuth(false);

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorDiv = document.getElementById('login-error');
            
            errorDiv.textContent = '';
            
            try {
                const data = await apiRequest('/auth/login', 'POST', { email, password });
                setToken(data.token);
                localStorage.setItem('pm_user', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } catch (err) {
                errorDiv.textContent = err.message;
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const errorDiv = document.getElementById('register-error');
            
            errorDiv.textContent = '';
            
            try {
                const data = await apiRequest('/auth/register', 'POST', { name, email, password });
                setToken(data.token);
                localStorage.setItem('pm_user', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } catch (err) {
                errorDiv.textContent = err.message;
            }
        });
    }
});

function toggleAuthForm(mode) {
    const loginForm = document.getElementById('login-form-container');
    const regForm = document.getElementById('register-form-container');
    
    if (mode === 'login') {
        regForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    } else {
        loginForm.classList.add('hidden');
        regForm.classList.remove('hidden');
    }
}
