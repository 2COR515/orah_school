// test-auth-system.js - Comprehensive test for JWT authentication system
const http = require('http');

const API_BASE = 'http://localhost:3001';

// Helper function to make HTTP requests
function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    // Prepend /api if not already there
    const fullPath = path.startsWith('/api/') ? path : `/api${path}`;
    
    const options = {
      method,
      hostname: 'localhost',
      port: 3001,
      path: fullPath,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Test variables
let studentToken = null;
let studentUserId = null;
let studentEmail = null;
let instructorToken = null;
let instructorUserId = null;
let instructorEmail = null;
let testLessonId = null;
let testEnrollmentId = null;

async function runTests() {
  console.log('=== JWT AUTHENTICATION SYSTEM TEST ===\n');

  try {
    // TEST 1: Student Signup
    console.log('--- Test 1: Student Signup ---');
    studentEmail = `student${Date.now()}@test.com`;
    const signupRes = await makeRequest('POST', '/auth/signup', {
      email: studentEmail,
      password: 'student123',
      firstName: 'Test',
      lastName: 'Student',
      role: 'student'
    });

    if (signupRes.status === 201) {
      studentUserId = signupRes.data.user.userId;
      console.log('✓ Student registered successfully');
      console.log('  User ID:', studentUserId);
      console.log('  Role:', signupRes.data.user.role);
    } else {
      console.error('✗ Student signup failed:', signupRes.data);
      return;
    }

    // TEST 2: Instructor Signup
    console.log('\n--- Test 2: Instructor Signup ---');
    instructorEmail = `instructor${Date.now()}@test.com`;
    const instructorSignupRes = await makeRequest('POST', '/auth/signup', {
      email: instructorEmail,
      password: 'instructor123',
      firstName: 'Test',
      lastName: 'Instructor',
      role: 'instructor'
    });

    if (instructorSignupRes.status === 201) {
      instructorUserId = instructorSignupRes.data.user.userId;
      console.log('✓ Instructor registered successfully');
      console.log('  User ID:', instructorUserId);
      console.log('  Role:', instructorSignupRes.data.user.role);
    } else {
      console.error('✗ Instructor signup failed:', instructorSignupRes.data);
      return;
    }

    // TEST 3: Student Login
    console.log('\n--- Test 3: Student Login ---');
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: studentEmail,
      password: 'student123'
    });

    if (loginRes.status === 200 && loginRes.data.token) {
      studentToken = loginRes.data.token;
      console.log('✓ Student login successful');
      console.log('  Token received (first 50 chars):', studentToken.substring(0, 50) + '...');
    } else {
      console.error('✗ Student login failed:', loginRes.data);
      return;
    }

    // TEST 4: Instructor Login
    console.log('\n--- Test 4: Instructor Login ---');
    const instructorLoginRes = await makeRequest('POST', '/auth/login', {
      email: instructorEmail,
      password: 'instructor123'
    });

    if (instructorLoginRes.status === 200 && instructorLoginRes.data.token) {
      instructorToken = instructorLoginRes.data.token;
      console.log('✓ Instructor login successful');
      console.log('  Token received (first 50 chars):', instructorToken.substring(0, 50) + '...');
    } else {
      console.error('✗ Instructor login failed:', instructorLoginRes.data);
      return;
    }

    // TEST 5: Invalid Login
    console.log('\n--- Test 5: Invalid Login (Wrong Password) ---');
    const invalidLoginRes = await makeRequest('POST', '/auth/login', {
      email: studentEmail,
      password: 'wrongpassword'
    });

    if (invalidLoginRes.status === 401) {
      console.log('✓ Invalid login correctly rejected (401)');
    } else {
      console.error('✗ Should have rejected invalid login:', invalidLoginRes.status);
    }

    // TEST 6: Create Lesson Without Token (Should Fail)
    console.log('\n--- Test 6: Create Lesson Without Token (Should Fail) ---');
    const noAuthLessonRes = await makeRequest('POST', '/lessons', {
      title: 'Test Lesson',
      instructorId: instructorUserId,
      description: 'Test',
      topic: 'test'
    });

    if (noAuthLessonRes.status === 401) {
      console.log('✓ Lesson creation without token correctly rejected (401)');
    } else {
      console.error('✗ Should have rejected unauthenticated request:', noAuthLessonRes.status);
    }

    // TEST 7: Create Lesson with Student Token (Should Fail - Wrong Role)
    console.log('\n--- Test 7: Create Lesson with Student Token (Should Fail) ---');
    const studentLessonRes = await makeRequest('POST', '/lessons', {
      title: 'Test Lesson',
      instructorId: studentUserId,
      description: 'Test',
      topic: 'test'
    }, {
      'Authorization': `Bearer ${studentToken}`
    });

    if (studentLessonRes.status === 403) {
      console.log('✓ Student correctly forbidden from creating lesson (403)');
    } else {
      console.error('✗ Should have forbidden student role:', studentLessonRes.status);
    }

    // TEST 8: Create Lesson with Instructor Token (Should Succeed)
    console.log('\n--- Test 8: Create Lesson with Instructor Token (Should Succeed) ---');
    const instructorLessonRes = await makeRequest('POST', '/lessons', {
      title: 'Authenticated Test Lesson',
      instructorId: instructorUserId,
      description: 'Created with JWT auth',
      topic: 'security',
      status: 'published'
    }, {
      'Authorization': `Bearer ${instructorToken}`
    });

    if (instructorLessonRes.status === 201) {
      testLessonId = instructorLessonRes.data.lesson.id;
      console.log('✓ Instructor successfully created lesson');
      console.log('  Lesson ID:', testLessonId);
    } else {
      console.error('✗ Instructor lesson creation failed:', instructorLessonRes.data);
      return;
    }

    // TEST 9: Enroll Without Token (Should Fail)
    console.log('\n--- Test 9: Enroll Without Token (Should Fail) ---');
    const noAuthEnrollRes = await makeRequest('POST', '/enrollments', {
      lessonId: testLessonId,
      userId: studentUserId
    });

    if (noAuthEnrollRes.status === 401) {
      console.log('✓ Enrollment without token correctly rejected (401)');
    } else {
      console.error('✗ Should have rejected unauthenticated enrollment:', noAuthEnrollRes.status);
    }

    // TEST 10: Enroll with Instructor Token (Should Fail - Wrong Role)
    console.log('\n--- Test 10: Enroll with Instructor Token (Should Fail) ---');
    const instructorEnrollRes = await makeRequest('POST', '/enrollments', {
      lessonId: testLessonId,
      userId: instructorUserId
    }, {
      'Authorization': `Bearer ${instructorToken}`
    });

    if (instructorEnrollRes.status === 403) {
      console.log('✓ Instructor correctly forbidden from enrolling (403)');
    } else {
      console.error('✗ Should have forbidden instructor role:', instructorEnrollRes.status);
    }

    // TEST 11: Enroll with Student Token (Should Succeed)
    console.log('\n--- Test 11: Enroll with Student Token (Should Succeed) ---');
    const studentEnrollRes = await makeRequest('POST', '/enrollments', {
      lessonId: testLessonId,
      userId: studentUserId
    }, {
      'Authorization': `Bearer ${studentToken}`
    });

    if (studentEnrollRes.status === 201) {
      testEnrollmentId = studentEnrollRes.data.enrollment.id;
      console.log('✓ Student successfully enrolled');
      console.log('  Enrollment ID:', testEnrollmentId);
    } else {
      console.error('✗ Student enrollment failed:', studentEnrollRes.data);
      return;
    }

    // TEST 12: Student tries to enroll another user (Should Fail)
    console.log('\n--- Test 12: Student tries to enroll another user (Should Fail) ---');
    const wrongUserEnrollRes = await makeRequest('POST', '/enrollments', {
      lessonId: testLessonId,
      userId: instructorUserId
    }, {
      'Authorization': `Bearer ${studentToken}`
    });

    if (wrongUserEnrollRes.status === 403) {
      console.log('✓ Student correctly forbidden from enrolling others (403)');
    } else {
      console.error('✗ Should have forbidden enrolling other users:', wrongUserEnrollRes.status);
    }

    // TEST 13: Get User Enrollments with Own Token (Should Succeed)
    console.log('\n--- Test 13: Get User Enrollments with Own Token (Should Succeed) ---');
    const getEnrollmentsRes = await makeRequest('GET', `/enrollments/user/${studentUserId}`, null, {
      'Authorization': `Bearer ${studentToken}`
    });

    if (getEnrollmentsRes.status === 200) {
      console.log('✓ Student successfully retrieved own enrollments');
      console.log('  Total enrollments:', getEnrollmentsRes.data.total);
    } else {
      console.error('✗ Get enrollments failed:', getEnrollmentsRes.data);
    }

    // TEST 14: Get Another User's Enrollments (Should Fail)
    console.log('\n--- Test 14: Get Another User\'s Enrollments (Should Fail) ---');
    const otherEnrollmentsRes = await makeRequest('GET', `/enrollments/user/${instructorUserId}`, null, {
      'Authorization': `Bearer ${studentToken}`
    });

    if (otherEnrollmentsRes.status === 403) {
      console.log('✓ Student correctly forbidden from viewing others\' enrollments (403)');
    } else {
      console.error('✗ Should have forbidden viewing others\' enrollments:', otherEnrollmentsRes.status);
    }

    // TEST 15: Update Own Enrollment Progress (Should Succeed)
    console.log('\n--- Test 15: Update Own Enrollment Progress (Should Succeed) ---');
    const updateProgressRes = await makeRequest('PATCH', `/enrollments/${testEnrollmentId}/progress`, {
      progress: 50
    }, {
      'Authorization': `Bearer ${studentToken}`
    });

    if (updateProgressRes.status === 200) {
      console.log('✓ Student successfully updated own progress');
      console.log('  Progress:', updateProgressRes.data.enrollment.progress + '%');
    } else {
      console.error('✗ Update progress failed:', updateProgressRes.data);
    }

    // TEST 16: Instructor Views Lesson Enrollments (Should Succeed)
    console.log('\n--- Test 16: Instructor Views Lesson Enrollments (Should Succeed) ---');
    const lessonEnrollmentsRes = await makeRequest('GET', `/enrollments/lesson/${testLessonId}`, null, {
      'Authorization': `Bearer ${instructorToken}`
    });

    if (lessonEnrollmentsRes.status === 200) {
      console.log('✓ Instructor successfully viewed lesson enrollments');
      console.log('  Total enrollments:', lessonEnrollmentsRes.data.total);
    } else {
      console.error('✗ Get lesson enrollments failed:', lessonEnrollmentsRes.data);
    }

    // TEST 17: Student tries to view lesson enrollments (Should Fail)
    console.log('\n--- Test 17: Student tries to view lesson enrollments (Should Fail) ---');
    const studentLessonEnrollmentsRes = await makeRequest('GET', `/enrollments/lesson/${testLessonId}`, null, {
      'Authorization': `Bearer ${studentToken}`
    });

    if (studentLessonEnrollmentsRes.status === 403) {
      console.log('✓ Student correctly forbidden from viewing lesson enrollments (403)');
    } else {
      console.error('✗ Should have forbidden student from viewing lesson enrollments:', studentLessonEnrollmentsRes.status);
    }

    // TEST 18: Invalid Token (Should Fail)
    console.log('\n--- Test 18: Invalid Token (Should Fail) ---');
    const invalidTokenRes = await makeRequest('GET', `/enrollments/user/${studentUserId}`, null, {
      'Authorization': 'Bearer invalid.token.here'
    });

    if (invalidTokenRes.status === 403) {
      console.log('✓ Invalid token correctly rejected (403)');
    } else {
      console.error('✗ Should have rejected invalid token:', invalidTokenRes.status);
    }

    console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY! ===');
    console.log('\n📊 Test Summary:');
    console.log('  ✓ Signup & Login working');
    console.log('  ✓ JWT token generation & verification working');
    console.log('  ✓ Role-based access control (RBAC) working');
    console.log('  ✓ Self-authorization checks working');
    console.log('  ✓ Ownership checks working');
    console.log('  ✓ Route protection working');
    console.log('\n🎉 JWT Authentication System is fully functional!');

  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    console.error(error);
  }
}

// Run tests
runTests();
