// scripts/login.js
// Login page with role-based redirection

const API_BASE_URL = 'http://localhost:3002/api';

document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');

  if(!form) return;

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    errorBox.textContent = '';
    errorBox.style.color = 'red';

    const email = form.email.value.trim();
    const password = form.password.value.trim();

    // Simple validation
    if(!email){
      errorBox.textContent = 'Email is required';
      return;
    }
    if(!password){
      errorBox.textContent = 'Password is required';
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Store authentication data
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.user.userId);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userFirstName', data.user.firstName || '');
        localStorage.setItem('userLastName', data.user.lastName || '');
        localStorage.setItem('userEmail', data.user.email);

        // Role-based redirection
        if (data.user.role === 'student') {
          window.location.href = 'student-dashboard.html';
        } else if (data.user.role === 'instructor') {
          window.location.href = 'instructor-hub.html';
        } else {
          errorBox.textContent = 'Unknown user role. Please contact support.';
        }
      } else {
        errorBox.textContent = data.error || 'Login failed. Please check your credentials.';
      }
    } catch (error) {
      console.error('Login error:', error);
      errorBox.textContent = 'Network error. Please try again.';
    }
  });
});
