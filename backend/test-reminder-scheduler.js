// test-reminder-scheduler.js - Test the reminder scheduler functionality
const { initDb, addEnrollment, listAllEnrollments } = require('./db');

async function testReminderScheduler() {
  console.log('🧪 Testing Reminder Scheduler Logic...\n');
  
  try {
    await initDb();
    
    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    
    // Create test enrollments with different ages
    console.log('Creating test enrollments...\n');
    
    // 1. Fresh enrollment (should NOT trigger reminder)
    const fresh = await addEnrollment({
      lessonId: 'test-lesson-fresh',
      userId: 'student-fresh'
    });
    console.log('✅ Created fresh enrollment (0 days old)');
    
    // 2. 2-day-old enrollment (SHOULD trigger reminder)
    const twoDaysOld = await addEnrollment({
      lessonId: 'test-lesson-2days',
      userId: 'student-2days'
    });
    // Manually backdate the enrollment
    const storage = require('node-persist');
    await storage.init({ dir: require('path').join(__dirname, 'storage') });
    const enrollments = await storage.getItem('enrollments') || [];
    const idx = enrollments.findIndex(e => e.id === twoDaysOld.id);
    if (idx !== -1) {
      enrollments[idx].enrolledAt = Date.now() - (2.5 * 24 * 60 * 60 * 1000); // 2.5 days ago
      await storage.setItem('enrollments', enrollments);
      console.log('✅ Created 2.5-day-old enrollment (SHOULD trigger reminder)');
    }
    
    // 3. 4-day-old enrollment (should NOT trigger reminder - too old)
    const fourDaysOld = await addEnrollment({
      lessonId: 'test-lesson-4days',
      userId: 'student-4days'
    });
    const idx2 = enrollments.findIndex(e => e.id === fourDaysOld.id);
    if (idx2 !== -1) {
      enrollments[idx2] = await storage.getItem('enrollments').then(arr => arr.find(e => e.id === fourDaysOld.id));
    }
    const allEnrollments = await storage.getItem('enrollments') || [];
    const idx3 = allEnrollments.findIndex(e => e.id === fourDaysOld.id);
    if (idx3 !== -1) {
      allEnrollments[idx3].enrolledAt = Date.now() - (4 * 24 * 60 * 60 * 1000); // 4 days ago
      await storage.setItem('enrollments', allEnrollments);
      console.log('✅ Created 4-day-old enrollment (should NOT trigger - too old)');
    }
    
    // Now simulate the cron job logic
    console.log('\n--- Simulating Cron Job Logic ---\n');
    
    const now = Date.now();
    const testEnrollments = await listAllEnrollments();
    
    let reminderCount = 0;
    
    testEnrollments.forEach(enrollment => {
      if (enrollment.status === 'active' && enrollment.progress < 100) {
        const enrollmentAge = now - enrollment.enrolledAt;
        const ageInDays = (enrollmentAge / (24 * 60 * 60 * 1000)).toFixed(2);
        
        console.log(`Checking enrollment: User ${enrollment.userId}, Age: ${ageInDays} days`);
        
        if (enrollmentAge >= TWO_DAYS_MS && enrollmentAge < THREE_DAYS_MS) {
          console.log(`  ✅ [REMINDER SENT] User ${enrollment.userId} for Lesson ${enrollment.lessonId} is 2 days overdue.`);
          reminderCount++;
        } else if (enrollmentAge < TWO_DAYS_MS) {
          console.log(`  ⏳ Too early (< 2 days)`);
        } else {
          console.log(`  ⏰ Too late (>= 3 days)`);
        }
      }
    });
    
    console.log(`\n📊 Total reminders sent: ${reminderCount}`);
    console.log('\n✅ Reminder scheduler logic test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testReminderScheduler();
