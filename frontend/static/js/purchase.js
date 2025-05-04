document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const cardNumber = document.getElementById('cardNumber').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    const name = document.getElementById('name').value;
    const errorAlert = document.getElementById('errorAlert');
    const successAlert = document.getElementById('successAlert');
    
    // Validate card number
    if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
        errorAlert.textContent = 'Please enter a valid 16-digit card number';
        errorAlert.style.display = 'block';
        return;
    }
    
    // Validate expiry date
    if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiryDate)) {
        errorAlert.textContent = 'Please enter a valid expiry date (MM/YY)';
        errorAlert.style.display = 'block';
        return;
    }
    
    // Validate CVV
    if (!/^\d{3,4}$/.test(cvv)) {
        errorAlert.textContent = 'Please enter a valid CVV';
        errorAlert.style.display = 'block';
        return;
    }
    
    try {
        const response = await fetch('/api/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
                card_number: cardNumber,
                expiry_date: expiryDate,
                cvv: cvv,
                name: name,
                amount: 8.99
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Purchase failed');
        }
        
        // Show success message
        successAlert.textContent = 'Purchase successful! You now have access to all premium features.';
        successAlert.style.display = 'block';
        
        // Redirect to home page after 3 seconds
        setTimeout(() => {
            window.location.href = '/';
        }, 3000);
    } catch (error) {
        errorAlert.textContent = error.message;
        errorAlert.style.display = 'block';
        setTimeout(() => {
            errorAlert.style.display = 'none';
        }, 5000);
    }
});

// Check if user is logged in
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) {
        window.location.href = '/login';
    }
}); 