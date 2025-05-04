document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const termsAccepted = document.getElementById('termsAccepted').checked;
    const errorAlert = document.getElementById('errorAlert');
    
    // Validate password match
    if (password !== confirmPassword) {
        errorAlert.textContent = 'Passwords do not match';
        errorAlert.style.display = 'block';
        return;
    }
    
    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        errorAlert.textContent = 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character';
        errorAlert.style.display = 'block';
        return;
    }
    
    // Validate terms acceptance
    if (!termsAccepted) {
        errorAlert.textContent = 'Please accept the terms and conditions';
        errorAlert.style.display = 'block';
        return;
    }
    
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                email,
                password
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
        }
        
        // Store the token
        localStorage.setItem('auth_token', data.token);
        
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