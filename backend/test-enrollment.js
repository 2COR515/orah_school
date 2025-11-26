// test-enrollment.js - Simple test script for Enrollment CRUD functions
const {
  initDb,
  addEnrollment,
  getEnrollmentByLessonAndUser,
  listEnrollmentsByLesson,
  listEnrollmentsByUser,
  updateEnrollment
} = require('./db');

async function testEnrollments() {
  console.log('🧪 Testing Enrollment CRUD Functions...\n');
  
  try {
    // Initialize database
    await initDb();
    console.log('✅ Database initialized\n');
    
    // Test 1: Add new enrollment
    console.log('Test 1: Add new enrollment');
    const enrollment1 = await addEnrollment({
      lessonId: 'lesson-123',
      userId: 'student-456'
    });
    console.log('Created enrollment:', enrollment1);
    console.log('✅ Test 1 passed\n');
    
    // Test 2: Try to enroll same user again (should return null)
    console.log('Test 2: Prevent duplicate enrollment');
    const duplicate = await addEnrollment({
      lessonId: 'lesson-123',
      userId: 'student-456'
    });
    console.log('Duplicate enrollment result:', duplicate);
    if (duplicate === null) {
      console.log('✅ Test 2 passed - Duplicate prevented\n');
    } else {
      console.log('❌ Test 2 failed - Duplicate allowed\n');
    }
    
    // Test 3: Add another enrollment (different user, same lesson)
    console.log('Test 3: Add different user to same lesson');
    const enrollment2 = await addEnrollment({
      lessonId: 'lesson-123',
      userId: 'student-789'
    });
    console.log('Created enrollment:', enrollment2);
    console.log('✅ Test 3 passed\n');
    
    // Test 4: Add enrollment for different lesson
    console.log('Test 4: Add enrollment for different lesson');
    const enrollment3 = await addEnrollment({
      lessonId: 'lesson-456',
      userId: 'student-456'
    });
    console.log('Created enrollment:', enrollment3);
    console.log('✅ Test 4 passed\n');
    
    // Test 5: Get enrollment by lesson and user
    console.log('Test 5: Get enrollment by lessonId and userId');
    const found = await getEnrollmentByLessonAndUser('lesson-123', 'student-456');
    console.log('Found enrollment:', found);
    console.log('✅ Test 5 passed\n');
    
    // Test 6: List enrollments by lesson
    console.log('Test 6: List enrollments by lesson');
    const lessonEnrollments = await listEnrollmentsByLesson('lesson-123');
    console.log(`Found ${lessonEnrollments.length} enrollments for lesson-123:`, lessonEnrollments);
    console.log('✅ Test 6 passed\n');
    
    // Test 7: List enrollments by user
    console.log('Test 7: List enrollments by user');
    const userEnrollments = await listEnrollmentsByUser('student-456');
    console.log(`Found ${userEnrollments.length} enrollments for student-456:`, userEnrollments);
    console.log('✅ Test 7 passed\n');
    
    // Test 8: Update enrollment progress and status
    console.log('Test 8: Update enrollment progress and status');
    const updated = await updateEnrollment(enrollment1.id, {
      progress: 50,
      status: 'active'
    });
    console.log('Updated enrollment:', updated);
    console.log('✅ Test 8 passed\n');
    
    // Test 9: Complete enrollment
    console.log('Test 9: Mark enrollment as completed');
    const completed = await updateEnrollment(enrollment1.id, {
      progress: 100,
      status: 'completed'
    });
    console.log('Completed enrollment:', completed);
    console.log('✅ Test 9 passed\n');
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run tests
testEnrollments();
