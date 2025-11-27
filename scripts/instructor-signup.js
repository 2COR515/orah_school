// scripts/instructor-signup.js
// Instructor signup with backend registration

const API_BASE_URL = 'http://localhost:3001/api';

document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('instructor-form');
  const errorBox = document.getElementById('instructor-error');
  const submitButton = form ? form.querySelector('button[type="submit"]') : null;
  
  if(!form) return;

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    errorBox.textContent = '';
    errorBox.style.color = 'red';

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirm = form.confirm.value;
    const bio = form.bio.value.trim();
    const website = form.website.value.trim();

    // Basic validation
    if(!name){ errorBox.textContent = 'Name is required'; return; }
    if(!email){ errorBox.textContent = 'Email is required'; return; }
    if(!password){ errorBox.textContent = 'Password is required'; return; }
    if(password.length < 6){ errorBox.textContent = 'Password must be at least 6 characters'; return; }
    if(password !== confirm){ errorBox.textContent = 'Passwords do not match'; return; }
    if(!bio){ errorBox.textContent = 'Bio is required'; return; }

    // Disable submit button during request
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Creating account...';
    }

    try {
      // POST to /api/auth/signup with role: 'instructor'
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role: 'instructor',
          bio,
          website
        })
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        // Show success message
        errorBox.style.color = 'green';
        errorBox.textContent = 'Instructor account created successfully! Redirecting to login...';

        // Redirect to login page after short delay
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);

      } else {
        // Display error message from server (e.g., duplicate email - 409)
        errorBox.textContent = data.error || 'Registration failed. Please try again.';
        
        // Re-enable submit button
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Apply to teach';
        }
      }

    } catch (error) {
      console.error('Instructor signup error:', error);
      errorBox.textContent = 'Network error. Please check your connection and try again.';
      
      // Re-enable submit button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Apply to teach';
      }
    }
  });
});
