// auth.js
document.addEventListener('DOMContentLoaded', () => {
    const usersApiUrl = 'http://localhost:3001/api';
    const messageArea = document.getElementById('message-area');
    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // LÓGICA DE LOGIN
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            messageArea.textContent = '';
            const email = document.getElementById('login-email').value;
            const senha = document.getElementById('login-password').value;

            try {
                const response = await fetch(`${usersApiUrl}/usuarios/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                
                localStorage.setItem('authToken', data.token);
                window.location.href = 'catalog.html';
            } catch (error) {
                messageArea.textContent = error.message;
                messageArea.className = 'message-area error';
            }
        });
    }

    // LÓGICA DE CADASTRO
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            messageArea.textContent = '';
            const email = document.getElementById('register-email').value;
            const senha = document.getElementById('register-password').value;

            try {
                const response = await fetch(`${usersApiUrl}/usuarios/registro`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);

                messageArea.textContent = 'Cadastro realizado! Redirecionando para o login...';
                messageArea.className = 'message-area success';
                
                setTimeout(() => {
                    window.location.href = 'index.html'; // Redireciona para a nova página de login
                }, 2000);
            } catch (error) {
                messageArea.textContent = error.message;
                messageArea.className = 'message-area error';
            }
        });
    }
});