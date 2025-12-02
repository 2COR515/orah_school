// test-attendance-authorization.js
// Tests attendance API authorization - verifies instructor access and student rejection

const API_BASE = 'http://localhost:3002/api';

// Test credentials
const instructorCreds = {
  email: 'instructor@test.com',
  password: 'instructor123',
  role: 'instructor'
};

const studentCreds = {
  email: 'student@test.com',
  password: 'student123',
  role: 'student'
};

let instructorToken = null;
let studentToken = null;
let testLessonId = null;

/**
 * Helper function to make fetch requests
 */
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, ok: response.ok, data };
  } catch (error) {
    console.error('Request error:', error);
    return { status: 0, ok: false, error: error.message };
  }
}

/**
 * Test 1: Login as Instructor
 */
async function testInstructorLogin() {
  console.log('\n🔐 Test 1: Login as Instructor');
  console.log('─────────────────────────────');
  
  const result = await makeRequest(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: instructorCreds.email,
      password: instructorCreds.password
    })
  });

  if (result.ok && result.data.token) {
    instructorToken = result.data.token;
    console.log('✅ Instructor login successful');
    console.log('   Token:', instructorToken.substring(0, 30) + '...');
    console.log('   Role:', result.data.role);
    return true;
  } else {
    console.log('❌ Instructor login failed:', result.data.error || 'Unknown error');
    return false;
  }
}

/**
 * Test 2: Login as Student
 */
async function testStudentLogin() {
  console.log('\n🔐 Test 2: Login as Student');
  console.log('─────────────────────────────');
  
  const result = await makeRequest(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: studentCreds.email,
      password: studentCreds.password
    })
  });

  if (result.ok && result.data.token) {
    studentToken = result.data.token;
    console.log('✅ Student login successful');
    console.log('   Token:', studentToken.substring(0, 30) + '...');
    console.log('   Role:', result.data.role);
    return true;
  } else {
    console.log('❌ Student login failed:', result.data.error || 'Unknown error');
    return false;
  }
}

/**
 * Test 3: Instructor can GET attendance records (authorized)
 */
async function testInstructorGetAttendance() {
  console.log('\n✅ Test 3: Instructor GET /api/attendance');
  console.log('─────────────────────────────────────────');
  
  const result = await makeRequest(`${API_BASE}/attendance`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${instructorToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (result.ok && result.status === 200) {
    console.log('✅ SUCCESS: Instructor can access attendance records');
    console.log('   Status:', result.status);
    console.log('   Records found:', result.data.records?.length || 0);
    return true;
  } else {
    console.log('❌ FAILED: Instructor cannot access attendance records');
    console.log('   Status:', result.status);
    console.log('   Error:', result.data.error);
    return false;
  }
}

/**
 * Test 4: Student CANNOT GET attendance records (unauthorized)
 */
async function testStudentGetAttendance() {
  console.log('\n🚫 Test 4: Student GET /api/attendance (should fail)');
  console.log('──────────────────────────────────────────────────');
  
  const result = await makeRequest(`${API_BASE}/attendance`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!result.ok && result.status === 403) {
    console.log('✅ SUCCESS: Student correctly blocked with 403 Forbidden');
    console.log('   Status:', result.status);
    console.log('   Error:', result.data.error);
    return true;
  } else if (result.ok) {
    console.log('❌ FAILED: Student can access attendance (SECURITY ISSUE!)');
    console.log('   Status:', result.status);
    return false;
  } else {
    console.log('⚠️  UNEXPECTED: Different error than expected');
    console.log('   Status:', result.status);
    console.log('   Error:', result.data.error);
    return false;
  }
}

/**
 * Test 5: Instructor can POST attendance records (authorized)
 */
async function testInstructorPostAttendance() {
  console.log('\n✅ Test 5: Instructor POST /api/attendance');
  console.log('─────────────────────────────────────────');
  
  const testRecords = [
    {
      studentId: 'test-student-1',
      lessonId: 'test-lesson-1',
      date: '2025-12-02',
      status: 'present'
    },
    {
      studentId: 'test-student-2',
      lessonId: 'test-lesson-1',
      date: '2025-12-02',
      status: 'absent'
    }
  ];

  const result = await makeRequest(`${API_BASE}/attendance`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${instructorToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ records: testRecords })
  });

  if (result.ok && result.status === 201) {
    console.log('✅ SUCCESS: Instructor can mark attendance');
    console.log('   Status:', result.status);
    console.log('   Records saved:', result.data.saved?.length || 0);
    return true;
  } else {
    console.log('❌ FAILED: Instructor cannot mark attendance');
    console.log('   Status:', result.status);
    console.log('   Error:', result.data.error);
    return false;
  }
}

/**
 * Test 6: Student CANNOT POST attendance records (unauthorized)
 */
async function testStudentPostAttendance() {
  console.log('\n🚫 Test 6: Student POST /api/attendance (should fail)');
  console.log('───────────────────────────────────────────────────');
  
  const testRecords = [
    {
      studentId: 'test-student-1',
      lessonId: 'test-lesson-1',
      date: '2025-12-02',
      status: 'present'
    }
  ];

  const result = await makeRequest(`${API_BASE}/attendance`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ records: testRecords })
  });

  if (!result.ok && result.status === 403) {
    console.log('✅ SUCCESS: Student correctly blocked with 403 Forbidden');
    console.log('   Status:', result.status);
    console.log('   Error:', result.data.error);
    return true;
  } else if (result.ok) {
    console.log('❌ FAILED: Student can mark attendance (SECURITY ISSUE!)');
    console.log('   Status:', result.status);
    return false;
  } else {
    console.log('⚠️  UNEXPECTED: Different error than expected');
    console.log('   Status:', result.status);
    console.log('   Error:', result.data.error);
    return false;
  }
}

/**
 * Test 7: No token provided (should fail)
 */
async function testNoToken() {
  console.log('\n🚫 Test 7: GET /api/attendance without token (should fail)');
  console.log('────────────────────────────────────────────────────────');
  
  const result = await makeRequest(`${API_BASE}/attendance`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!result.ok && result.status === 401) {
    console.log('✅ SUCCESS: Request correctly blocked with 401 Unauthorized');
    console.log('   Status:', result.status);
    console.log('   Error:', result.data.error);
    return true;
  } else if (result.ok) {
    console.log('❌ FAILED: Request succeeded without token (SECURITY ISSUE!)');
    console.log('   Status:', result.status);
    return false;
  } else {
    console.log('⚠️  UNEXPECTED: Different error than expected');
    console.log('   Status:', result.status);
    console.log('   Error:', result.data.error);
    return false;
  }
}

/**
 * Test 8: Invalid token (should fail)
 */
async function testInvalidToken() {
  console.log('\n🚫 Test 8: GET /api/attendance with invalid token (should fail)');
  console.log('──────────────────────────────────────────────────────────────');
  
  const result = await makeRequest(`${API_BASE}/attendance`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer invalid.token.here',
      'Content-Type': 'application/json'
    }
  });

  if (!result.ok && result.status === 403) {
    console.log('✅ SUCCESS: Request correctly blocked with 403 Forbidden');
    console.log('   Status:', result.status);
    console.log('   Error:', result.data.error);
    return true;
  } else if (result.ok) {
    console.log('❌ FAILED: Request succeeded with invalid token (SECURITY ISSUE!)');
    console.log('   Status:', result.status);
    return false;
  } else {
    console.log('⚠️  UNEXPECTED: Different error than expected');
    console.log('   Status:', result.status);
    console.log('   Error:', result.data.error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🧪 ATTENDANCE AUTHORIZATION TESTING');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Testing URL:', API_BASE);
  console.log('Date:', new Date().toISOString());
  
  const results = {
    passed: 0,
    failed: 0,
    total: 8
  };

  // Test 1 & 2: Login
  const instructorLoggedIn = await testInstructorLogin();
  const studentLoggedIn = await testStudentLogin();

  if (!instructorLoggedIn || !studentLoggedIn) {
    console.log('\n❌ Cannot proceed: Login failed');
    console.log('   Make sure test accounts exist:');
    console.log('   - instructor@test.com / instructor123');
    console.log('   - student@test.com / student123');
    return;
  }

  // Test 3: Instructor GET (authorized)
  if (await testInstructorGetAttendance()) results.passed++;
  else results.failed++;

  // Test 4: Student GET (unauthorized)
  if (await testStudentGetAttendance()) results.passed++;
  else results.failed++;

  // Test 5: Instructor POST (authorized)
  if (await testInstructorPostAttendance()) results.passed++;
  else results.failed++;

  // Test 6: Student POST (unauthorized)
  if (await testStudentPostAttendance()) results.passed++;
  else results.failed++;

  // Test 7: No token (unauthorized)
  if (await testNoToken()) results.passed++;
  else results.failed++;

  // Test 8: Invalid token (unauthorized)
  if (await testInvalidToken()) results.passed++;
  else results.failed++;

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Total Tests:  ${results.total}`);
  console.log(`Passed:       ${results.passed} ✅`);
  console.log(`Failed:       ${results.failed} ❌`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════════════════════');

  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED - Authorization is working correctly!');
    console.log('\n✅ Security Status:');
    console.log('   • Instructor can access attendance endpoints');
    console.log('   • Student is blocked from attendance endpoints');
    console.log('   • No token requests are rejected');
    console.log('   • Invalid tokens are rejected');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - Review security implementation!');
  }
}

// Run tests
runAllTests();
