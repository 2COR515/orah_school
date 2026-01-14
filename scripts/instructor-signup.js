// scripts/instructor-signup.js
// Instructor signup logic for Orah School with verification redirect

const API_BASE_URL = 'http://localhost:3002/api';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('instructor-form');
  const errorBox = document.getElementById('instructor-signup-error');
  const submitBtn = document.getElementById('signup-btn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorBox) {
      errorBox.textContent = '';
      errorBox.style.display = 'none';
    }

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm-password').value;

    // Validation
    if (!name) {
      showError('Name is required');
      return;
    }
    if (!email) {
      showError('Email is required');
      return;
    }
    if (!phone || phone.length < 10) {
      showError('A valid phone number is required (at least 10 digits)');
      return;
    }
    if (!password) {
      showError('Password is required');
      return;
    }
    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      showError('Passwords do not match');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';
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
          role: 'instructor'
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
      showError('Network error. Please try again.');
      resetButton();
    }
  });

  function showError(message) {
    if (errorBox) {
      errorBox.style.display = 'block';
      errorBox.style.color = '#ef4444';
      errorBox.textContent = message;
    }
  }

  function showSuccess(message) {
    if (errorBox) {
      errorBox.style.display = 'block';
      errorBox.style.color = '#22c55e';
      errorBox.textContent = message;
    }
  }

  function resetButton() {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign Up as Instructor';
    }
  }
});
