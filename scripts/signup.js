// scripts/signup.js
// Student signup with backend registration and verification redirect

const API_BASE_URL = 'http://localhost:3002/api';

document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('signup-form');
  const errorBox = document.getElementById('signup-error');
  const submitButton = form ? form.querySelector('button[type="submit"]') : null;
  
  if(!form) return;

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    errorBox.textContent = '';
    errorBox.style.display = 'none';

    const name = document.getElementById('name-input').value.trim();
    const email = document.getElementById('email-input').value.trim();
    const phone = document.getElementById('phone-input').value.trim();
    const password = document.getElementById('password-input').value;
    const confirm = document.getElementById('confirm-input').value;

    // Validation
    if(!name){ showError('Name is required'); return; }
    if(!email){ showError('Email is required'); return; }
    if(!phone || phone.length < 10){ showError('A valid phone number is required (at least 10 digits)'); return; }
    if(!password){ showError('Password is required'); return; }
    if(password.length < 6){ showError('Password must be at least 6 characters'); return; }
    if(password !== confirm){ showError('Passwords do not match'); return; }

    // Disable submit button
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Creating account...';
    }

    try {
      // Split full name into first and last name
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          password,
          role: 'student'
        })
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        // Save email to localStorage for verification page
        localStorage.setItem('pendingVerificationEmail', email);
        localStorage.setItem('pendingVerificationPhone', phone);
        
        showSuccess('Account created! Redirecting to verification...');
        
        // Redirect to verification page
        setTimeout(() => {
          window.location.href = data.redirect || 'verify-account.html';
        }, 1000);
      } else {
        showError(data.error || 'Registration failed. Please try again.');
        resetButton();
      }
    } catch (error) {
      console.error('Signup error:', error);
      showError('Network error. Please check your connection and try again.');
      resetButton();
    }
  });

  function showError(message) {
    errorBox.style.display = 'block';
    errorBox.style.color = '#ef4444';
    errorBox.textContent = message;
  }

  function showSuccess(message) {
    errorBox.style.display = 'block';
    errorBox.style.color = '#22c55e';
    errorBox.textContent = message;
  }

  function resetButton() {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Create account';
    }
  }
});
