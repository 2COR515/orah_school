// test-delete-lesson-auth.js
// Test script to verify lesson deletion authorization

const API_BASE_URL = 'http://localhost:3002/api';

// Test configuration
const testConfig = {
  instructorEmail: 'instructor@test.com',
  instructorPassword: 'password123',
  otherInstructorEmail: 'instructor2@test.com',
  otherInstructorPassword: 'password123',
  studentEmail: 'student@test.com',
  studentPassword: 'password123'
};

async function testDeleteLessonAuthorization() {
  console.log('🧪 Testing Lesson Deletion Authorization\n');

  try {
    // Test 1: Login as instructor and create a lesson
    console.log('Test 1: Creating a lesson as instructor...');
    const instructorLogin = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testConfig.instructorEmail,
        password: testConfig.instructorPassword
      })
    });
    const instructorData = await instructorLogin.json();
    const instructorToken = instructorData.token;
    const instructorId = instructorData.user.userId;

    console.log(`✓ Logged in as instructor: ${instructorId}\n`);

    // Create a test lesson
    const createResponse = await fetch(`${API_BASE_URL}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${instructorToken}`
      },
      body: JSON.stringify({
        title: 'Test Lesson for Deletion',
        instructorId: instructorId,
        description: 'This lesson will be deleted in tests',
        videoUrl: '/uploads/test-video.mp4'
      })
    });
    const createData = await createResponse.json();
    const lessonId = createData.lesson.id;

    console.log(`✓ Created lesson with ID: ${lessonId}\n`);

    // Test 2: Try to delete without authentication (should fail with 401)
    console.log('Test 2: Attempting to delete without authentication...');
    const deleteNoAuth = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
      method: 'DELETE'
    });
    console.log(`Status: ${deleteNoAuth.status} - ${deleteNoAuth.status === 401 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Expected: 401 Unauthorized\n`);

    // Test 3: Try to delete with student role (should fail with 403)
    console.log('Test 3: Attempting to delete with student role...');
    const studentLogin = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testConfig.studentEmail,
        password: testConfig.studentPassword
      })
    });
    const studentData = await studentLogin.json();
    const studentToken = studentData.token;

    const deleteAsStudent = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    console.log(`Status: ${deleteAsStudent.status} - ${deleteAsStudent.status === 403 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Expected: 403 Forbidden (from role middleware)\n`);

    // Test 4: Try to delete another instructor's lesson (should fail with 403)
    console.log('Test 4: Attempting to delete another instructor\'s lesson...');
    const otherInstructorLogin = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testConfig.otherInstructorEmail,
        password: testConfig.otherInstructorPassword
      })
    });
    
    if (otherInstructorLogin.ok) {
      const otherInstructorData = await otherInstructorLogin.json();
      const otherInstructorToken = otherInstructorData.token;

      const deleteOtherLesson = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${otherInstructorToken}` }
      });
      const deleteOtherData = await deleteOtherLesson.json();
      console.log(`Status: ${deleteOtherLesson.status} - ${deleteOtherLesson.status === 403 ? '✓ PASS' : '✗ FAIL'}`);
      console.log(`Message: ${deleteOtherData.error}`);
      console.log(`Expected: 403 Forbidden (ownership check)\n`);
    } else {
      console.log('⚠ Skipped: Other instructor account not available\n');
    }

    // Test 5: Delete own lesson (should succeed with 200)
    console.log('Test 5: Deleting own lesson...');
    const deleteOwn = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${instructorToken}` }
    });
    const deleteOwnData = await deleteOwn.json();
    console.log(`Status: ${deleteOwn.status} - ${deleteOwn.status === 200 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Message: ${deleteOwnData.message}`);
    console.log(`Expected: 200 OK\n`);

    // Test 6: Try to delete non-existent lesson (should fail with 404)
    console.log('Test 6: Attempting to delete non-existent lesson...');
    const deleteNonExistent = await fetch(`${API_BASE_URL}/lessons/non-existent-id`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${instructorToken}` }
    });
    console.log(`Status: ${deleteNonExistent.status} - ${deleteNonExistent.status === 404 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Expected: 404 Not Found\n`);

    console.log('✅ All authorization tests completed!');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run tests
testDeleteLessonAuthorization();
