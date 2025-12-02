// reminderService.js - Automated reminder scheduling service
const cron = require('node-cron');
const { listAllEnrollments, findUserByEmail } = require('./db');

/**
 * Send reminder (simulated - logs to console)
 * In production, this would integrate with an email service like SendGrid, AWS SES, etc.
 * @param {Object} student - Student user object
 * @param {Object} enrollment - Enrollment object
 * @param {Object} lesson - Lesson object
 */
function sendReminderEmail(student, enrollment, lesson) {
  const reminderMessage = `
╔══════════════════════════════════════════════════════════════╗
║                  📧 ORAH SCHOOL REMINDER                     ║
╚══════════════════════════════════════════════════════════════╝

To: ${student.email}
Subject: Reminder: Complete Your Lesson

Dear ${student.firstName} ${student.lastName},

We noticed you haven't completed the following lesson yet:

📚 Lesson: ${lesson.title}
📊 Current Progress: ${enrollment.progress}%
🎯 Target: 100%

${enrollment.progress === 0 
  ? '⏰ You have not started this lesson yet. Get started today!' 
  : `💪 You are ${enrollment.progress}% of the way there! Keep going!`}

👉 Log in now to continue: http://localhost:3002/student-dashboard.html

Keep up the great work!

Best regards,
The Orah School Team

═══════════════════════════════════════════════════════════════
  `;
  
  console.log(reminderMessage);
}

/**
 * Process incomplete enrollments and send reminders
 */
async function processReminders() {
  console.log('\n🔔 Running reminder scheduler...');
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);
  
  try {
    // Get all enrollments
    const enrollments = await listAllEnrollments();
    
    if (!enrollments || enrollments.length === 0) {
      console.log('ℹ️  No enrollments found. Skipping reminder processing.');
      return;
    }
    
    console.log(`📊 Total enrollments: ${enrollments.length}`);
    
    // Filter incomplete enrollments (progress < 100%)
    const incompleteEnrollments = enrollments.filter(e => 
      e.status === 'active' && (e.progress || 0) < 100
    );
    
    console.log(`📝 Incomplete enrollments: ${incompleteEnrollments.length}`);
    
    if (incompleteEnrollments.length === 0) {
      console.log('✅ All students have completed their lessons!');
      return;
    }
    
    // Load necessary data
    const { getLesson } = require('./db');
    const users = await require('./db').findUserByEmail; // Get access to user functions
    
    let remindersSent = 0;
    let errors = 0;
    
    // Process each incomplete enrollment
    for (const enrollment of incompleteEnrollments) {
      try {
        // Get lesson details
        const lesson = await getLesson(enrollment.lessonId);
        
        if (!lesson) {
          console.log(`⚠️  Lesson not found for enrollment ${enrollment.id}`);
          errors++;
          continue;
        }
        
        // Get student details (simplified - in production would query users by ID)
        const student = {
          email: `student_${enrollment.userId}@example.com`, // Placeholder
          firstName: 'Student',
          lastName: enrollment.userId.substring(0, 6),
          userId: enrollment.userId
        };
        
        // Calculate days since enrollment
        const daysSinceEnrollment = Math.floor(
          (Date.now() - enrollment.enrolledAt) / (1000 * 60 * 60 * 24)
        );
        
        // Send reminder if:
        // 1. No progress at all after 2+ days
        // 2. Incomplete after 3+ days
        const shouldSendReminder = 
          (enrollment.progress === 0 && daysSinceEnrollment >= 2) ||
          (enrollment.progress > 0 && enrollment.progress < 100 && daysSinceEnrollment >= 3);
        
        if (shouldSendReminder) {
          sendReminderEmail(student, enrollment, lesson);
          remindersSent++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing enrollment ${enrollment.id}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n📨 Reminders sent: ${remindersSent}`);
    if (errors > 0) {
      console.log(`⚠️  Errors encountered: ${errors}`);
    }
    console.log('✅ Reminder processing complete.\n');
    
  } catch (error) {
    console.error('❌ Fatal error in reminder processing:', error);
  }
}

/**
 * Start the automated reminder scheduler
 * Runs every Monday at 9:00 AM
 * For testing, you can change to: '* * * * *' (every minute)
 */
function startReminderScheduler() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📅 Starting Automated Reminder Scheduler');
  console.log('═══════════════════════════════════════════════════════════');
  
  // Schedule: Every Monday at 9:00 AM
  // Cron format: minute hour day-of-month month day-of-week
  // '0 9 * * 1' = At 09:00 on Monday
  const schedule = '0 9 * * 1';
  
  // For testing purposes, uncomment the line below to run every hour:
  // const schedule = '0 * * * *'; // Every hour
  
  // For development/testing, uncomment to run every minute:
  // const schedule = '* * * * *'; // Every minute
  
  console.log(`⏰ Schedule: Every Monday at 9:00 AM (cron: ${schedule})`);
  console.log('📝 Reminders will be sent to students with:');
  console.log('   • 0% progress after 2+ days of enrollment');
  console.log('   • Incomplete progress (1-99%) after 3+ days');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Validate cron expression
  if (!cron.validate(schedule)) {
    console.error('❌ Invalid cron schedule:', schedule);
    return null;
  }
  
  // Create and start the cron job
  const task = cron.schedule(schedule, async () => {
    await processReminders();
  }, {
    scheduled: true,
    timezone: "America/New_York" // Adjust to your timezone
  });
  
  console.log('✅ Reminder scheduler started successfully!');
  console.log(`🌍 Timezone: America/New_York`);
  console.log('💡 Tip: Change schedule in reminderService.js for testing\n');
  
  // Run immediately on startup for testing (optional)
  // Uncomment the line below to send reminders immediately when server starts:
  // processReminders();
  
  return task;
}

/**
 * Stop the reminder scheduler (for graceful shutdown)
 * @param {Object} task - The cron task to stop
 */
function stopReminderScheduler(task) {
  if (task) {
    task.stop();
    console.log('🛑 Reminder scheduler stopped');
  }
}

/**
 * Run reminders manually (for testing)
 */
async function runRemindersNow() {
  console.log('🧪 Running reminders manually (test mode)...\n');
  await processReminders();
}

module.exports = {
  startReminderScheduler,
  stopReminderScheduler,
  runRemindersNow,
  processReminders
};
