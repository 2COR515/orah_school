// scripts/verify-account.js
// Handles email and phone verification with auto-login on success

const API_BASE_URL = 'http://localhost:3002/api';

document.addEventListener('DOMContentLoaded', async () => {
  // Get stored email from signup
  const email = localStorage.getItem('pendingVerificationEmail');
  const phone = localStorage.getItem('pendingVerificationPhone');

  if (!email) {
    // No pending verification, redirect to signup
    alert('No pending verification found. Please sign up first.');
    window.location.href = 'signup.html';
    return;
  }

  // Display email and phone (masked)
  document.getElementById('email-display').textContent = email;
  document.getElementById('phone-display').textContent = phone ? maskPhone(phone) : 'Not available';

  // Load initial verification status
  await loadVerificationStatus();

  // Set up event listeners
  setupEventListeners();
});

/**
 * Mask phone number for display (show last 4 digits)
 */
function maskPhone(phone) {
  if (!phone || phone.length < 4) return phone;
  return '***-***-' + phone.slice(-4);
}

/**
 * Load verification status from server
 */
async function loadVerificationStatus() {
  const email = localStorage.getItem('pendingVerificationEmail');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verification-status?email=${encodeURIComponent(email)}`);
    const data = await response.json();

    if (data.ok) {
      updateStatusBadge('email', data.isEmailVerified);
      updateStatusBadge('phone', data.isPhoneVerified);

      // If either is verified, user can proceed
      if (data.isEmailVerified || data.isPhoneVerified) {
        // Already verified, they should be able to login
        showMessage('email', 'success', 'At least one verification complete! You can now login.');
      }
    }
  } catch (error) {
    console.error('Failed to load verification status:', error);
  }
}

/**
 * Update status badge UI
 */
function updateStatusBadge(type, isVerified) {
  const badge = document.getElementById(`${type}-status`);
  const section = document.getElementById(`${type}-section`);
  
  if (isVerified) {
    badge.textContent = '✓ Verified';
    badge.className = 'status-badge verified';
    section.classList.add('verified');
    
    // Disable inputs for verified section
    document.getElementById(`${type}-code`).disabled = true;
    document.getElementById(`verify-${type}-btn`).disabled = true;
    document.getElementById(`resend-${type}-btn`).disabled = true;
  } else {
    badge.textContent = 'Pending';
    badge.className = 'status-badge pending';
    section.classList.remove('verified');
  }
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Email verification
  document.getElementById('verify-email-btn').addEventListener('click', () => verifyCode('email'));
  document.getElementById('resend-email-btn').addEventListener('click', () => resendCode('email'));
  
  // Phone verification
  document.getElementById('verify-phone-btn').addEventListener('click', () => verifyCode('phone'));
  document.getElementById('resend-phone-btn').addEventListener('click', () => resendCode('phone'));

  // Auto-submit on 6 digits
  document.getElementById('email-code').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    if (e.target.value.length === 6) {
      verifyCode('email');
    }
  });

  document.getElementById('phone-code').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    if (e.target.value.length === 6) {
      verifyCode('phone');
    }
  });
}

/**
 * Verify a code (email or phone)
 */
async function verifyCode(type) {
  const email = localStorage.getItem('pendingVerificationEmail');
  const codeInput = document.getElementById(`${type}-code`);
  const code = codeInput.value.trim();
  const btn = document.getElementById(`verify-${type}-btn`);

  // Clear previous messages
  hideMessage(type);

  if (!code || code.length !== 6) {
    showMessage(type, 'error', 'Please enter a 6-digit code');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Verifying...';

  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, type })
    });

    const data = await response.json();

    if (data.ok) {
      // SUCCESS! Verification complete
      showMessage(type, 'success', `${type === 'email' ? 'Email' : 'Phone'} verified! Redirecting to login...`);
      updateStatusBadge(type, true);
      
      // Clear verification data
      localStorage.removeItem('pendingVerificationEmail');
      localStorage.removeItem('pendingVerificationPhone');

      // Redirect to login page
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    } else {
      showMessage(type, 'error', data.error || 'Invalid code. Please try again.');
      btn.disabled = false;
      btn.textContent = `Verify ${type === 'email' ? 'Email' : 'Phone'}`;
    }
  } catch (error) {
    console.error('Verification error:', error);
    showMessage(type, 'error', 'Network error. Please try again.');
    btn.disabled = false;
    btn.textContent = `Verify ${type === 'email' ? 'Email' : 'Phone'}`;
  }
}

/**
 * Resend verification code
 */
async function resendCode(type) {
  const email = localStorage.getItem('pendingVerificationEmail');
  const btn = document.getElementById(`resend-${type}-btn`);

  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type })
    });

    const data = await response.json();

    if (data.ok) {
      showMessage(type, 'success', `New code sent! Check your ${type === 'email' ? 'inbox' : 'phone (console)'}.`);
    } else {
      showMessage(type, 'error', data.error || 'Failed to resend code.');
    }
  } catch (error) {
    console.error('Resend error:', error);
    showMessage(type, 'error', 'Network error. Please try again.');
  }

  btn.disabled = false;
  btn.textContent = 'Resend';
}

/**
 * Show error or success message
 */
function showMessage(type, status, message) {
  const errorEl = document.getElementById(`${type}-error`);
  const successEl = document.getElementById(`${type}-success`);

  if (status === 'error') {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    successEl.style.display = 'none';
  } else {
    successEl.textContent = message;
    successEl.style.display = 'block';
    errorEl.style.display = 'none';
  }
}

/**
 * Hide all messages for a type
 */
function hideMessage(type) {
  document.getElementById(`${type}-error`).style.display = 'none';
  document.getElementById(`${type}-success`).style.display = 'none';
}
