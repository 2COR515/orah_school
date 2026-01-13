// scripts/signup.js
// Student signup with backend registration and login redirect

const API_BASE_URL = 'http://localhost:3002/api';

document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('signup-form');
  const errorBox = document.getElementById('signup-error');
  const submitButton = form ? form.querySelector('button[type="submit"]') : null;
  
  if(!form) return;

  // Add "Already have an account?" link if it doesn't exist
  const loginLinkContainer = document.createElement('div');
  loginLinkContainer.style.cssText = 'text-align: center; margin-top: 1rem;';
  loginLinkContainer.innerHTML = `
    <p style="color: #666;">
      Already have an account? 
      <a href="login.html" style="color: #6F00FF; text-decoration: none; font-weight: 600;">Login here</a>
    </p>
  `;
  form.parentNode.appendChild(loginLinkContainer);

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    errorBox.textContent = '';
    errorBox.style.color = 'red';

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirm = form.confirm.value;

    // Validation
    if(!name){ errorBox.textContent = 'Name is required'; return; }
    if(!email){ errorBox.textContent = 'Email is required'; return; }
    if(!password){ errorBox.textContent = 'Password is required'; return; }
    if(password.length < 6){ errorBox.textContent = 'Password must be at least 6 characters'; return; }
    if(password !== confirm){ errorBox.textContent = 'Passwords do not match'; return; }

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
          password,
          role: 'student'
        })
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        errorBox.style.color = 'green';
        errorBox.textContent = 'Account created successfully! Redirecting...';
        
        // Redirect to login after 1 second
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1000);
      } else {
        errorBox.textContent = data.error || 'Registration failed. Please try again.';
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Sign Up';
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      errorBox.textContent = 'Network error. Please check your connection and try again.';
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Sign Up';
      }
    }
  });
});
