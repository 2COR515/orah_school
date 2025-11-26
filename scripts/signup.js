// scripts/signup.js
// Basic client-side validation for signup form

document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('signup-form');
  const errorBox = document.getElementById('signup-error');
  if(!form) return;

  form.addEventListener('submit', function(e){
    e.preventDefault();
    errorBox.textContent = '';

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirm = form.confirm.value;

    // Basic validation
    if(!name){ errorBox.textContent = 'Name is required'; return; }
    if(!email){ errorBox.textContent = 'Email is required'; return; }
    if(!password){ errorBox.textContent = 'Password is required'; return; }
    if(password !== confirm){ errorBox.textContent = 'Passwords do not match'; return; }

    // Demo submit
    console.log('Signup submitted', { name, email });
    errorBox.style.color = 'green';
    errorBox.textContent = 'Signup submitted (demo)';
    form.reset();
  });
});
