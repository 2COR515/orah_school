// reminderService.js - Automated reminder scheduling service with Nodemailer
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { listAllEnrollments, getAllUsers, getLesson } = require('./db');

// ==================== EMAIL VALIDATION ====================

/**
 * Validate email format for fault tolerance
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// ==================== NODEMAILER CONFIGURATION ====================

/**
 * Configure Nodemailer transporter using environment variables
 * Expects EMAIL_USER and EMAIL_PASS to be set in environment
 */
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or any other email service (e.g., 'outlook', 'yahoo')
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', // Replace with your email
    pass: process.env.EMAIL_PASS || 'your-app-password'      // Replace with your app password
  }
});

/**
 * Send reminder email to a student using Nodemailer
 * @param {string} recipientEmail - Student's email address
 * @param {string} lessonTitle - Title of the lesson
 * @param {Object} details - Additional details (studentName, progress)
 * @returns {Promise<void>}
 */
async function sendReminderEmail(recipientEmail, lessonTitle, details = {}) {
  const { studentName = 'Student', progress = 0 } = details;
  
  const mailOptions = {
    from: `"Orah School" <${process.env.EMAIL_USER || 'noreply@orahschool.com'}>`,
    to: recipientEmail,
    subject: `Reminder: Complete Your Lesson - ${lessonTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .lesson-card {
            background: white;
            padding: 20px;
            border-left: 4px solid #667eea;
            margin: 20px 0;
            border-radius: 5px;
          }
          .progress-bar {
            background: #e0e0e0;
            height: 20px;
            border-radius: 10px;
            overflow: hidden;
            margin: 15px 0;
          }
          .progress-fill {
            background: linear-gradient(90deg, #667eea, #764ba2);
            height: 100%;
            width: ${progress}%;
            transition: width 0.3s ease;
          }
          .cta-button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📚 Orah School</h1>
          <p>Learning Reminder</p>
        </div>
        <div class="content">
          <p>Dear ${studentName},</p>
          
          <p>We hope you're enjoying your learning journey! This is a friendly reminder about your ongoing lesson:</p>
          
          <div class="lesson-card">
            <h3>📖 ${lessonTitle}</h3>
            <p><strong>Current Progress:</strong></p>
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
            <p style="text-align: center; font-weight: bold; color: #667eea;">${progress}% Complete</p>
          </div>
          
          ${progress === 0 
            ? '<p>⏰ <strong>You haven\'t started this lesson yet.</strong> There\'s no better time than now to begin your learning journey!</p>' 
            : `<p>💪 <strong>Great progress!</strong> You're ${progress}% of the way there. Keep up the excellent work and you'll complete this lesson in no time!</p>`
          }
          
          <center>
            <a href="http://localhost:3002/student-dashboard.html" class="cta-button">
              Continue Learning →
            </a>
          </center>
          
          <p>Remember, consistency is key to mastering new skills. Even a few minutes each day can make a big difference!</p>
          
          <p>Best regards,<br>
          <strong>The Orah School Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2025 Orah School. All rights reserved.</p>
          <p>This is an automated reminder. Please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `,
    text: `
Dear ${studentName},

We hope you're enjoying your learning journey! This is a friendly reminder about your ongoing lesson:

� Lesson: ${lessonTitle}
📊 Current Progress: ${progress}%

${progress === 0 
  ? 'You haven\'t started this lesson yet. There\'s no better time than now to begin your learning journey!' 
  : `Great progress! You're ${progress}% of the way there. Keep up the excellent work!`
}

Continue Learning: http://localhost:3002/student-dashboard.html

Best regards,
The Orah School Team
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${recipientEmail}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${recipientEmail}:`, error.message);
    // Log to console as fallback
    console.log(`📧 [FALLBACK] Reminder for ${recipientEmail} - Lesson: ${lessonTitle} (${progress}% complete)`);
    throw error;
  }
}

// ==================== FREQUENCY HELPER FUNCTIONS ====================

/**
 * Determine if a reminder should be sent today based on user's frequency preference
 * @param {string} frequency - User's reminder frequency ('daily', 'weekly', 'twice-weekly')
 * @returns {boolean} True if reminder should be sent today
 */
function shouldSendReminder(frequency) {
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  switch (frequency) {
    case 'daily':
      return true; // Send every day
      
    case 'weekly':
      return today === 1; // Send only on Monday
      
    case 'twice-weekly':
      return today === 1 || today === 4; // Send on Monday and Thursday
      
    default:
      console.warn(`⚠️  Unknown frequency: ${frequency}. Defaulting to weekly.`);
      return today === 1; // Default to weekly (Monday)
  }
}

// ==================== REMINDER PROCESSING ====================

/**
 * Process incomplete enrollments and send reminders based on user frequency preferences
 */
async function processReminders() {
  console.log('\n🔔 Running reminder scheduler...');
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);
  console.log(`📅 Day: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]}`);
  
  try {
    // Get all users
    const users = await getAllUsers();
    
    if (!users || users.length === 0) {
      console.log('ℹ️  No users found. Skipping reminder processing.');
      return;
    }
    
    console.log(`� Total users: ${users.length}`);
    
    // Get all enrollments
    const enrollments = await listAllEnrollments();
    
    if (!enrollments || enrollments.length === 0) {
      console.log('ℹ️  No enrollments found. Skipping reminder processing.');
      return;
    }
    
    console.log(`� Total enrollments: ${enrollments.length}`);
    
    let remindersSent = 0;
    let remindersSkipped = 0;
    let errors = 0;
    
    // Process each user
    for (const user of users) {
      try {
        // Skip non-students
        if (user.role !== 'student') {
          continue;
        }

        // Validate email format - skip invalid emails silently for fault tolerance
        if (!isValidEmail(user.email)) {
          console.log(`⚠️  Skipping user ${user.userId} - invalid email format: ${user.email}`);
          remindersSkipped++;
          continue;
        }
        
        // Check if reminder should be sent today based on user's frequency
        const frequency = user.reminderFrequency || 'weekly';
        const sendToday = shouldSendReminder(frequency);
        
        if (!sendToday) {
          console.log(`⏭️  Skipping ${user.email} (frequency: ${frequency}, not scheduled for today)`);
          remindersSkipped++;
          continue;
        }
        
        console.log(`\n📧 Processing user: ${user.email} (frequency: ${frequency})`);
        
        // Get this user's incomplete enrollments
        const userEnrollments = enrollments.filter(e => 
          e.userId === user.userId && 
          e.status === 'active' && 
          (e.progress || 0) < 100
        );
        
        if (userEnrollments.length === 0) {
          console.log(`   ✅ No incomplete enrollments for ${user.email}`);
          continue;
        }
        
        console.log(`   📝 Found ${userEnrollments.length} incomplete enrollment(s)`);
        
        // Send reminder for each incomplete enrollment
        for (const enrollment of userEnrollments) {
          try {
            // Get lesson details
            const lesson = await getLesson(enrollment.lessonId);
            
            if (!lesson) {
              console.log(`   ⚠️  Lesson not found for enrollment ${enrollment.id}`);
              errors++;
              continue;
            }
            
            // Calculate days since enrollment
            const daysSinceEnrollment = Math.floor(
              (Date.now() - enrollment.enrolledAt) / (1000 * 60 * 60 * 24)
            );
            
            // Send reminder if:
            // 1. No progress at all after 2+ days
            // 2. Incomplete after 3+ days
            const shouldSend = 
              (enrollment.progress === 0 && daysSinceEnrollment >= 2) ||
              (enrollment.progress > 0 && enrollment.progress < 100 && daysSinceEnrollment >= 3);
            
            if (shouldSend) {
              console.log(`   📤 Sending reminder for lesson: "${lesson.title}" (${enrollment.progress}% complete)`);
              
              // Send email
              await sendReminderEmail(
                user.email,
                lesson.title,
                {
                  studentName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student',
                  progress: enrollment.progress || 0
                }
              );
              
              remindersSent++;
            } else {
              console.log(`   ⏱️  Too soon to remind (enrolled ${daysSinceEnrollment} days ago)`);
            }
            
          } catch (error) {
            console.error(`   ❌ Error processing enrollment ${enrollment.id}:`, error.message);
            errors++;
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📨 Reminders sent: ${remindersSent}`);
    console.log(`⏭️  Reminders skipped (frequency): ${remindersSkipped}`);
    if (errors > 0) {
      console.log(`⚠️  Errors encountered: ${errors}`);
    }
    console.log('✅ Reminder processing complete.');
    console.log(`${'═'.repeat(60)}\n`);
    
  } catch (error) {
    console.error('❌ Fatal error in reminder processing:', error);
  }
}

// ==================== SCHEDULER ====================

/**
 * Start the automated reminder scheduler
 * Runs every day at 9:00 AM
 * Individual users' frequency preferences determine if they receive reminders that day
 */
function startReminderScheduler() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📅 Starting Automated Reminder Scheduler with Nodemailer');
  console.log('═══════════════════════════════════════════════════════════');
  
  // Schedule: Every day at 9:00 AM
  // Cron format: minute hour day-of-month month day-of-week
  // '0 9 * * *' = At 09:00 every day
  const schedule = '0 9 * * *';
  
  // For testing purposes, uncomment the line below to run every hour:
  // const schedule = '0 * * * *'; // Every hour
  
  // For development/testing, uncomment to run every minute:
  // const schedule = '* * * * *'; // Every minute
  
  console.log(`⏰ Schedule: Every day at 9:00 AM (cron: ${schedule})`);
  console.log('📝 User frequency preferences:');
  console.log('   • daily: Reminders sent every day');
  console.log('   • weekly: Reminders sent on Monday only');
  console.log('   • twice-weekly: Reminders sent on Monday and Thursday');
  console.log('📧 Email service: Nodemailer (configured via env variables)');
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
  processReminders,
  shouldSendReminder, // Export for testing
  sendReminderEmail   // Export for testing
};
