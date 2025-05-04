document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const errorAlert = document.getElementById('errorAlert');
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password,
                remember_me: rememberMe
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        // Store the token if remember me is checked
        if (rememberMe && data.token) {
            localStorage.setItem('auth_token', data.token);
        } else if (data.token) {
            sessionStorage.setItem('auth_token', data.token);
        }
        
        // Redirect to home page
        window.location.href = '/';
    } catch (error) {
        errorAlert.textContent = error.message;
        errorAlert.style.display = 'block';
        setTimeout(() => {
            errorAlert.style.display = 'none';
        }, 5000);
    }
});

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
        window.location.href = '/';
    }
}); 