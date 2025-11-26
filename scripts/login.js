// scripts/login.js
// Basic login page validation and submit handling

document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');

  if(!form) return;

  form.addEventListener('submit', function(e){
    e.preventDefault();
    errorBox.textContent = '';

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

    // Demo: log data and simulate success
    console.log('Login submitted', { email });
    errorBox.style.color = 'green';
    errorBox.textContent = 'Login submitted (demo)';
    form.reset();
  });
});
