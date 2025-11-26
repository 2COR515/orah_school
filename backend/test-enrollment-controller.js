// test-enrollment-controller.js - Test script for enrollment controller
const {
  enrollUser,
  listUserEnrollments,
  updateProgress,
  listLessonEnrollments
} = require('./src/controllers/enrollmentController');

// Mock Express request and response objects
function createMockReq(params = {}, body = {}, query = {}) {
  return { params, body, query };
}

function createMockRes() {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  return res;
}

async function runTests() {
  console.log('🧪 Testing Enrollment Controller Functions...\n');
  
  try {
    // Test 1: Enroll a user in a lesson
    console.log('Test 1: Enroll user in lesson');
    const req1 = createMockReq({}, { lessonId: 'lesson-999', userId: 'student-111' });
    const res1 = createMockRes();
    await enrollUser(req1, res1);
    console.log('Status:', res1.statusCode);
    console.log('Response:', res1.jsonData);
    if (res1.statusCode === 201 && res1.jsonData.ok) {
      console.log('✅ Test 1 passed\n');
    } else {
      console.log('❌ Test 1 failed\n');
    }
    
    // Test 2: Try to enroll same user again (should return 409)
    console.log('Test 2: Attempt duplicate enrollment');
    const req2 = createMockReq({}, { lessonId: 'lesson-999', userId: 'student-111' });
    const res2 = createMockRes();
    await enrollUser(req2, res2);
    console.log('Status:', res2.statusCode);
    console.log('Response:', res2.jsonData);
    if (res2.statusCode === 409 && res2.jsonData.error.includes('already enrolled')) {
      console.log('✅ Test 2 passed\n');
    } else {
      console.log('❌ Test 2 failed\n');
    }
    
    // Test 3: Enroll same user in different lesson
    console.log('Test 3: Enroll user in different lesson');
    const req3 = createMockReq({}, { lessonId: 'lesson-888', userId: 'student-111' });
    const res3 = createMockRes();
    await enrollUser(req3, res3);
    console.log('Status:', res3.statusCode);
    console.log('Response:', res3.jsonData);
    if (res3.statusCode === 201 && res3.jsonData.ok) {
      console.log('✅ Test 3 passed\n');
    } else {
      console.log('❌ Test 3 failed\n');
    }
    
    // Test 4: List user enrollments
    console.log('Test 4: List enrollments for user');
    const req4 = createMockReq({ userId: 'student-111' });
    const res4 = createMockRes();
    await listUserEnrollments(req4, res4);
    console.log('Status:', res4.statusCode);
    console.log('Response:', res4.jsonData);
    if (res4.statusCode === 200 && res4.jsonData.total === 2) {
      console.log('✅ Test 4 passed\n');
    } else {
      console.log('❌ Test 4 failed\n');
    }
    
    // Test 5: Update progress to 50%
    console.log('Test 5: Update enrollment progress to 50%');
    const enrollmentId = res1.jsonData.enrollment.id;
    const req5 = createMockReq({ enrollmentId }, { progress: 50 });
    const res5 = createMockRes();
    await updateProgress(req5, res5);
    console.log('Status:', res5.statusCode);
    console.log('Response:', res5.jsonData);
    if (res5.statusCode === 200 && res5.jsonData.enrollment.progress === 50) {
      console.log('✅ Test 5 passed\n');
    } else {
      console.log('❌ Test 5 failed\n');
    }
    
    // Test 6: Update progress to 100% (should auto-complete)
    console.log('Test 6: Update progress to 100% (auto-complete)');
    const req6 = createMockReq({ enrollmentId }, { progress: 100 });
    const res6 = createMockRes();
    await updateProgress(req6, res6);
    console.log('Status:', res6.statusCode);
    console.log('Response:', res6.jsonData);
    if (res6.statusCode === 200 && 
        res6.jsonData.enrollment.progress === 100 && 
        res6.jsonData.enrollment.status === 'completed') {
      console.log('✅ Test 6 passed - Auto-completed!\n');
    } else {
      console.log('❌ Test 6 failed\n');
    }
    
    // Test 7: Validate progress range (should fail with 400)
    console.log('Test 7: Validate progress range (invalid: 150)');
    const req7 = createMockReq({ enrollmentId }, { progress: 150 });
    const res7 = createMockRes();
    await updateProgress(req7, res7);
    console.log('Status:', res7.statusCode);
    console.log('Response:', res7.jsonData);
    if (res7.statusCode === 400 && res7.jsonData.error.includes('between 0 and 100')) {
      console.log('✅ Test 7 passed\n');
    } else {
      console.log('❌ Test 7 failed\n');
    }
    
    // Test 8: List lesson enrollments WITHOUT instructor auth (should fail with 403)
    console.log('Test 8: List lesson enrollments without auth');
    const req8 = createMockReq({ lessonId: 'lesson-999' }, {}, {});
    const res8 = createMockRes();
    await listLessonEnrollments(req8, res8);
    console.log('Status:', res8.statusCode);
    console.log('Response:', res8.jsonData);
    if (res8.statusCode === 403 && res8.jsonData.error.includes('Forbidden')) {
      console.log('✅ Test 8 passed\n');
    } else {
      console.log('❌ Test 8 failed\n');
    }
    
    // Test 9: List lesson enrollments WITH instructor auth
    console.log('Test 9: List lesson enrollments with instructor auth');
    const req9 = createMockReq({ lessonId: 'lesson-999' }, {}, { isInstructor: 'true' });
    const res9 = createMockRes();
    await listLessonEnrollments(req9, res9);
    console.log('Status:', res9.statusCode);
    console.log('Response:', res9.jsonData);
    if (res9.statusCode === 200 && res9.jsonData.total >= 1) {
      console.log('✅ Test 9 passed\n');
    } else {
      console.log('❌ Test 9 failed\n');
    }
    
    // Test 10: Missing required fields (should fail with 400)
    console.log('Test 10: Enroll without userId');
    const req10 = createMockReq({}, { lessonId: 'lesson-999' });
    const res10 = createMockRes();
    await enrollUser(req10, res10);
    console.log('Status:', res10.statusCode);
    console.log('Response:', res10.jsonData);
    if (res10.statusCode === 400 && res10.jsonData.error.includes('userId')) {
      console.log('✅ Test 10 passed\n');
    } else {
      console.log('❌ Test 10 failed\n');
    }
    
    console.log('🎉 All controller tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run tests
runTests();
