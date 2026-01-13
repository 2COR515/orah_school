// scripts/instructor-signup.js
// Instructor signup logic for Orah School

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
      errorBox.style.color = '#c00';
    }

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm-password').value;

    // Validation
    if (!name) {
      errorBox.textContent = 'Name is required';
      return;
    }
    if (!email) {
      errorBox.textContent = 'Email is required';
      return;
    }
    if (!password) {
      errorBox.textContent = 'Password is required';
      return;
    }
    if (password.length < 6) {
      errorBox.textContent = 'Password must be at least 6 characters';
      return;
    }
    if (password !== confirm) {
      errorBox.textContent = 'Passwords do not match';
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
          password,
          role: 'instructor'
        })
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        alert('Account Created');
        window.location.href = 'login.html';
      } else {
        errorBox.textContent = data.error || 'Registration failed. Please try again.';
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign Up';
        }
      }
    } catch (error) {
      errorBox.textContent = 'Network error. Please try again.';
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign Up';
      }
    }
  });
});
