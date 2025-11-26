// script.js
// Handles view toggle, show-password, and simple validation for login/signup

// Helper: select element
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));

// Elements
const tabs = $$('.tab');
const loginForm = $('#login-form');
const signupForm = $('#signup-form');
const loginBtn = $('#login-btn');
const signupBtn = $('#signup-btn');

// Switch view helper
function showView(view){
  tabs.forEach(t => t.classList.toggle('active', t.dataset.view === view));
  if(view === 'login'){
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
  } else {
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

// Attach tab clicks
tabs.forEach(t => t.addEventListener('click', () => showView(t.dataset.view)));
// Header quick buttons
if(loginBtn) loginBtn.addEventListener('click', () => showView('login'));
if(signupBtn) signupBtn.addEventListener('click', () => showView('signup'));

// Show-password toggle for any .show-pw button (works for multiple fields)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.show-pw');
  if(!btn) return;
  // find the nearest input[type=password] in the same row
  const row = btn.closest('.pw-row');
  if(!row) return;
  const input = row.querySelector('input[type="password"], input[type="text"]');
  if(!input) return;
  if(input.type === 'password'){
    input.type = 'text';
    btn.textContent = 'Hide';
  } else {
    input.type = 'password';
    btn.textContent = 'Show';
  }
});

// Simple validation helpers
function clearErrors(form){
  $$('.error', form).forEach(el => el.remove());
}
function showError(field, message){
  clearErrors(field.form);
  const err = document.createElement('div');
  err.className = 'error';
  err.textContent = message;
  field.parentNode.appendChild(err);
}

// Login submit
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors(loginForm);
  const email = loginForm.email;
  const password = loginForm.password;
  if(!email.value.trim()) return showError(email, 'Email is required');
  if(!password.value.trim()) return showError(password, 'Password is required');

  // Stubbed success — replace with real auth call
  alert('Login submitted (demo)');
  loginForm.reset();
});

// Signup submit
signupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors(signupForm);
  const name = signupForm.name;
  const email = signupForm.email;
  const password = signupForm.password;
  const confirm = signupForm.confirm;
  if(!name.value.trim()) return showError(name, 'Name is required');
  if(!email.value.trim()) return showError(email, 'Email is required');
  if(!password.value.trim()) return showError(password, 'Password is required');
  if(password.value !== confirm.value) return showError(confirm, 'Passwords do not match');

  // Stubbed success — replace with API
  alert('Signup submitted (demo)');
  signupForm.reset();
  showView('login');
});

// Initialize default view
showView('login');
