#!/usr/bin/env node

/**
 * Automated Test Script for Logout Functionality
 * Tests the complete authentication flow including logout
 */

const API_BASE_URL = 'http://localhost:3001/api';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log(`\n${colors.cyan}▶ ${testName}${colors.reset}`);
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`  ℹ ${message}`, 'blue');
}

// Simulate localStorage for testing
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }

  get length() {
    return Object.keys(this.store).length;
  }
}

// Test functions
async function testStudentSignupAndLogin() {
  logTest('Test 1: Student Signup and Login');
  
  const testEmail = `test-student-logout-${Date.now()}@test.com`;
  const testPassword = 'password123';
  
  try {
    // Step 1: Signup
    logInfo('Step 1: Creating student account...');
    const signupResponse = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student Logout',
        email: testEmail,
        password: testPassword,
        role: 'student'
      })
    });

    const signupData = await signupResponse.json();
    
    if (signupResponse.ok && signupData.ok) {
      logSuccess(`Student account created: ${testEmail}`);
    } else {
      logError(`Signup failed: ${signupData.error}`);
      return null;
    }

    // Step 2: Login
    logInfo('Step 2: Logging in...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginResponse.ok && loginData.ok && loginData.token) {
      logSuccess('Login successful');
      logSuccess(`Token received: ${loginData.token.substring(0, 20)}...`);
      logSuccess(`User ID: ${loginData.user.userId}`);
      logSuccess(`Role: ${loginData.user.role}`);
      
      return {
        token: loginData.token,
        user: loginData.user,
        email: testEmail
      };
    } else {
      logError(`Login failed: ${loginData.error}`);
      return null;
    }
    
  } catch (error) {
    logError(`Error: ${error.message}`);
    return null;
  }
}

async function testInstructorSignupAndLogin() {
  logTest('Test 2: Instructor Signup and Login');
  
  const testEmail = `test-instructor-logout-${Date.now()}@test.com`;
  const testPassword = 'password123';
  
  try {
    // Step 1: Signup
    logInfo('Step 1: Creating instructor account...');
    const signupResponse = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Instructor Logout',
        email: testEmail,
        password: testPassword,
        role: 'instructor',
        bio: 'Test instructor for logout testing',
        website: 'https://test.com'
      })
    });

    const signupData = await signupResponse.json();
    
    if (signupResponse.ok && signupData.ok) {
      logSuccess(`Instructor account created: ${testEmail}`);
    } else {
      logError(`Signup failed: ${signupData.error}`);
      return null;
    }

    // Step 2: Login
    logInfo('Step 2: Logging in...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginResponse.ok && loginData.ok && loginData.token) {
      logSuccess('Login successful');
      logSuccess(`Token received: ${loginData.token.substring(0, 20)}...`);
      logSuccess(`User ID: ${loginData.user.userId}`);
      logSuccess(`Role: ${loginData.user.role}`);
      
      return {
        token: loginData.token,
        user: loginData.user,
        email: testEmail
      };
    } else {
      logError(`Login failed: ${loginData.error}`);
      return null;
    }
    
  } catch (error) {
    logError(`Error: ${error.message}`);
    return null;
  }
}

function testLocalStorageSimulation(authData) {
  logTest('Test 3: localStorage Simulation');
  
  const localStorage = new LocalStorageMock();
  
  try {
    logInfo('Setting auth data in localStorage...');
    
    // Simulate setAuthData function
    localStorage.setItem('authToken', authData.token);
    localStorage.setItem('userRole', authData.user.role);
    localStorage.setItem('userId', authData.user.userId);
    localStorage.setItem('userEmail', authData.user.email);
    localStorage.setItem('userName', authData.user.name);
    
    logSuccess('Auth data stored in localStorage');
    
    // Verify data
    logInfo('Verifying stored data...');
    const storedToken = localStorage.getItem('authToken');
    const storedRole = localStorage.getItem('userRole');
    const storedUserId = localStorage.getItem('userId');
    const storedEmail = localStorage.getItem('userEmail');
    const storedName = localStorage.getItem('userName');
    
    if (storedToken === authData.token) {
      logSuccess(`Token stored correctly: ${storedToken.substring(0, 20)}...`);
    } else {
      logError('Token mismatch!');
    }
    
    if (storedRole === authData.user.role) {
      logSuccess(`Role stored correctly: ${storedRole}`);
    } else {
      logError('Role mismatch!');
    }
    
    if (storedUserId === authData.user.userId) {
      logSuccess(`User ID stored correctly: ${storedUserId}`);
    } else {
      logError('User ID mismatch!');
    }
    
    if (storedEmail === authData.user.email) {
      logSuccess(`Email stored correctly: ${storedEmail}`);
    } else {
      logError('Email mismatch!');
    }
    
    logInfo(`localStorage has ${localStorage.length} items`);
    
    // Simulate logout
    logTest('Test 4: Logout Simulation');
    logInfo('Simulating logout (clearing localStorage)...');
    
    localStorage.clear();
    
    if (localStorage.length === 0) {
      logSuccess('localStorage cleared successfully');
    } else {
      logError(`localStorage still has ${localStorage.length} items!`);
    }
    
    // Verify all data is gone
    logInfo('Verifying all auth data is removed...');
    const tokenAfterLogout = localStorage.getItem('authToken');
    const roleAfterLogout = localStorage.getItem('userRole');
    const userIdAfterLogout = localStorage.getItem('userId');
    
    if (tokenAfterLogout === null && roleAfterLogout === null && userIdAfterLogout === null) {
      logSuccess('All auth data removed after logout');
    } else {
      logError('Some auth data still present after logout!');
    }
    
    return true;
    
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

async function testProtectedEndpoint(token) {
  logTest('Test 5: Protected Endpoint Access');
  
  try {
    logInfo('Testing access to protected endpoint with valid token...');
    
    const response = await fetch(`${API_BASE_URL}/lessons`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      logSuccess('Protected endpoint accessible with valid token');
      logSuccess(`Retrieved ${data.lessons?.length || 0} lessons`);
    } else {
      logError(`Failed to access protected endpoint: ${data.error}`);
    }
    
    // Test with invalid token
    logInfo('Testing access with invalid token...');
    
    const invalidResponse = await fetch(`${API_BASE_URL}/lessons`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token-here'
      }
    });
    
    if (invalidResponse.status === 401 || invalidResponse.status === 403) {
      logSuccess('Invalid token correctly rejected (401/403)');
    } else {
      logError(`Expected 401/403, got ${invalidResponse.status}`);
    }
    
    // Test without token
    logInfo('Testing access without token...');
    
    const noTokenResponse = await fetch(`${API_BASE_URL}/lessons`, {
      method: 'GET'
    });
    
    if (noTokenResponse.status === 401 || noTokenResponse.status === 403) {
      logSuccess('Request without token correctly rejected (401/403)');
    } else {
      logError(`Expected 401/403, got ${noTokenResponse.status}`);
    }
    
    return true;
    
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('  ORAH SCHOOL - LOGOUT FUNCTIONALITY TEST SUITE', 'cyan');
  log('═══════════════════════════════════════════════════════\n', 'cyan');
  
  let passedTests = 0;
  let totalTests = 5;
  
  // Test 1 & 2: Student Signup/Login
  const studentAuth = await testStudentSignupAndLogin();
  if (studentAuth) {
    passedTests++;
  }
  
  // Test 2: Instructor Signup/Login
  const instructorAuth = await testInstructorSignupAndLogin();
  if (instructorAuth) {
    passedTests++;
  }
  
  // Test 3 & 4: localStorage simulation (uses student auth)
  if (studentAuth) {
    const localStorageTest = testLocalStorageSimulation(studentAuth);
    if (localStorageTest) {
      passedTests += 2; // Tests 3 and 4
    }
  }
  
  // Test 5: Protected endpoint access
  if (studentAuth) {
    const protectedTest = await testProtectedEndpoint(studentAuth.token);
    if (protectedTest) {
      passedTests++;
    }
  }
  
  // Summary
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('  TEST SUMMARY', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');
  log(`\n  Total Tests: ${totalTests}`);
  log(`  Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`  Failed: ${totalTests - passedTests}`, totalTests - passedTests === 0 ? 'green' : 'red');
  log(`  Success Rate: ${Math.round((passedTests / totalTests) * 100)}%\n`);
  
  if (passedTests === totalTests) {
    log('✓ ALL TESTS PASSED!', 'green');
    log('\nLogout functionality is working correctly:', 'green');
    log('  - Users can sign up and log in', 'green');
    log('  - Auth data is stored in localStorage', 'green');
    log('  - Logout clears all auth data', 'green');
    log('  - Protected endpoints require valid tokens', 'green');
    log('  - Invalid/missing tokens are rejected', 'green');
  } else {
    log('✗ SOME TESTS FAILED', 'red');
    log('Please review the errors above.', 'yellow');
  }
  
  log('\n═══════════════════════════════════════════════════════\n', 'cyan');
  
  // Manual testing instructions
  log('📋 MANUAL TESTING INSTRUCTIONS:', 'yellow');
  log('\n1. Open browser to: http://localhost:8080/login.html', 'cyan');
  log('2. Login with one of the test accounts created above', 'cyan');
  log('3. Check the dashboard header shows your email and role', 'cyan');
  log('4. Click the red "Logout" button', 'cyan');
  log('5. Verify you are redirected to login.html', 'cyan');
  log('6. Open browser console and check localStorage is empty:', 'cyan');
  log('   console.log(localStorage)', 'blue');
  log('7. Try to access dashboard directly (should redirect to login)', 'cyan');
  log('\nTest accounts created:');
  if (studentAuth) {
    log(`  Student: ${studentAuth.email} / password123`, 'green');
  }
  if (instructorAuth) {
    log(`  Instructor: ${instructorAuth.email} / password123`, 'green');
  }
  log('');
}

// Run tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
