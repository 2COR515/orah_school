// deadlineService.js - Service for checking enrollment deadlines and sending warnings
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { 
  listAllEnrollments, 
  updateEnrollment, 
  getAllUsers, 
  getLesson 
} = require('./db');

// Initialize email transporter using environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Generate HTML email template for student warning about missed topic
 * @param {string} studentName - Student's name
 * @param {string} lessonTitle - Lesson title
 * @param {number} daysOverdue - Number of days past the deadline
 * @returns {string} HTML email content
 */
function generateStudentWarningEmail(studentName, lessonTitle, daysOverdue) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ff6b6b; color: white; padding: 20px; border-radius: 5px; }
        .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; margin-top: 20px; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #007bff; 
          color: white; 
          text-decoration: none; 
          border-radius: 5px; 
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>⚠️ Missed Topic Alert</h2>
        </div>
        <div class="content">
          <p>Dear ${studentName},</p>
          
          <div class="warning">
            <strong>Important Notice:</strong> You have a missed topic that requires immediate attention.
          </div>
          
          <p><strong>Lesson:</strong> ${lessonTitle}</p>
          <p><strong>Days Overdue:</strong> ${daysOverdue} days</p>
          
          <p>This lesson was enrolled ${daysOverdue} days ago and has not been started yet. To stay on track with your learning goals, please access this lesson as soon as possible.</p>
          
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>This lesson has been marked as "Missed" in your dashboard</li>
            <li>Your instructor has been notified</li>
            <li>You can still access and complete this lesson at any time</li>
          </ul>
          
          <a href="${process.env.APP_URL || 'http://localhost:5500'}/student-dashboard.html" class="button">
            Go to My Dashboard
          </a>
          
          <p style="margin-top: 20px;">If you need help or have questions, please contact your instructor.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from Orah School Learning Management System.</p>
          <p>To adjust your reminder preferences, visit your dashboard settings.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML email template for instructor notification about student's missed topic
 * @param {string} instructorName - Instructor's name
 * @param {string} studentName - Student's name
 * @param {string} studentEmail - Student's email
 * @param {string} lessonTitle - Lesson title
 * @param {number} daysOverdue - Number of days past the deadline
 * @returns {string} HTML email content
 */
function generateInstructorNotificationEmail(instructorName, studentName, studentEmail, lessonTitle, daysOverdue) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #17a2b8; color: white; padding: 20px; border-radius: 5px; }
        .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; margin-top: 20px; }
        .info-box { background-color: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
        .student-info { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #28a745; 
          color: white; 
          text-decoration: none; 
          border-radius: 5px; 
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📊 Student Missed Topic Notification</h2>
        </div>
        <div class="content">
          <p>Dear ${instructorName},</p>
          
          <div class="info-box">
            <strong>Attention Required:</strong> A student in your course has a missed topic.
          </div>
          
          <div class="student-info">
            <p><strong>Student:</strong> ${studentName}</p>
            <p><strong>Email:</strong> ${studentEmail}</p>
            <p><strong>Lesson:</strong> ${lessonTitle}</p>
            <p><strong>Days Overdue:</strong> ${daysOverdue} days</p>
            <p><strong>Status:</strong> Enrolled but not started</p>
          </div>
          
          <p>This student enrolled in the lesson ${daysOverdue} days ago but has not yet accessed the content. The system has automatically:</p>
          <ul>
            <li>Marked the enrollment as "Missed"</li>
            <li>Sent a warning notification to the student</li>
            <li>Updated the lesson analytics</li>
          </ul>
          
          <p><strong>Suggested Actions:</strong></p>
          <ul>
            <li>Reach out to the student to offer support</li>
            <li>Check if there are any technical or access issues</li>
            <li>Review lesson engagement metrics in your analytics dashboard</li>
          </ul>
          
          <a href="${process.env.APP_URL || 'http://localhost:5500'}/instructor-hub.html" class="button">
            View Analytics Dashboard
          </a>
          
          <p style="margin-top: 20px;">Early intervention can help students get back on track and improve overall course completion rates.</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from Orah School Learning Management System.</p>
          <p>Deadline checks run daily to help you stay informed about student progress.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send warning email to student about missed topic
 * @param {string} recipientEmail - Student's email address
 * @param {string} studentName - Student's name
 * @param {string} lessonTitle - Lesson title
 * @param {number} daysOverdue - Number of days past deadline
 * @returns {Promise<boolean>} Success status
 */
async function sendStudentWarningEmail(recipientEmail, studentName, lessonTitle, daysOverdue) {
  try {
    const htmlContent = generateStudentWarningEmail(studentName, lessonTitle, daysOverdue);
    
    const mailOptions = {
      from: `"Orah School" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `⚠️ Missed Topic Alert: ${lessonTitle}`,
      html: htmlContent
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Student warning email sent to ${recipientEmail} for lesson: ${lessonTitle}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending student warning email to ${recipientEmail}:`, error);
    return false;
  }
}

/**
 * Send notification email to instructor about student's missed topic
 * @param {string} recipientEmail - Instructor's email address
 * @param {string} instructorName - Instructor's name
 * @param {string} studentName - Student's name
 * @param {string} studentEmail - Student's email
 * @param {string} lessonTitle - Lesson title
 * @param {number} daysOverdue - Number of days past deadline
 * @returns {Promise<boolean>} Success status
 */
async function sendInstructorNotificationEmail(recipientEmail, instructorName, studentName, studentEmail, lessonTitle, daysOverdue) {
  try {
    const htmlContent = generateInstructorNotificationEmail(instructorName, studentName, studentEmail, lessonTitle, daysOverdue);
    
    const mailOptions = {
      from: `"Orah School" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `📊 Student Missed Topic: ${studentName} - ${lessonTitle}`,
      html: htmlContent
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Instructor notification sent to ${recipientEmail} about ${studentName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending instructor notification to ${recipientEmail}:`, error);
    return false;
  }
}

/**
 * Process all enrollments and check for missed deadlines
 * Runs daily to identify enrollments that are overdue (> 3 days with 0 progress)
 * Updates status to 'missed' and sends warning emails
 */
async function checkDeadlines() {
  console.log('🔍 Starting deadline check...');
  
  try {
    // Fetch all data
    const [enrollments, users] = await Promise.all([
      listAllEnrollments(),
      getAllUsers()
    ]);
    
    const now = new Date();
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    let missedCount = 0;
    let emailsSent = 0;
    
    // Check each active enrollment
    for (const enrollment of enrollments) {
      // Skip if not active or already has progress
      if (enrollment.status !== 'active' || enrollment.progress > 0) {
        continue;
      }
      
      // Calculate days since enrollment
      const enrollmentDate = new Date(enrollment.enrollmentDate || enrollment.enrolledAt);
      const daysSinceEnrollment = Math.floor((now - enrollmentDate) / (24 * 60 * 60 * 1000));
      
      // Check if deadline is missed (> 3 days)
      if ((now - enrollmentDate) > threeDaysInMs) {
        console.log(`⚠️ Missed topic detected: Enrollment ${enrollment.id} (${daysSinceEnrollment} days old)`);
        
        // Update enrollment status to 'missed'
        await updateEnrollment(enrollment.id, { 
          status: 'missed',
          lastAccessDate: new Date().toISOString()
        });
        
        missedCount++;
        
        // Get student and lesson info
        const student = users.find(u => u.userId === enrollment.userId);
        const lesson = await getLesson(enrollment.lessonId);
        
        if (!student || !lesson) {
          console.error(`❌ Missing data for enrollment ${enrollment.id}`);
          continue;
        }
        
        // Get instructor info
        const instructor = users.find(u => u.userId === lesson.instructorId);
        
        // Send warning email to student
        const studentName = `${student.firstName} ${student.lastName}`;
        const studentEmailSent = await sendStudentWarningEmail(
          student.email,
          studentName,
          lesson.title,
          daysSinceEnrollment
        );
        
        if (studentEmailSent) emailsSent++;
        
        // Send notification email to instructor
        if (instructor) {
          const instructorName = `${instructor.firstName} ${instructor.lastName}`;
          const instructorEmailSent = await sendInstructorNotificationEmail(
            instructor.email,
            instructorName,
            studentName,
            student.email,
            lesson.title,
            daysSinceEnrollment
          );
          
          if (instructorEmailSent) emailsSent++;
        }
      }
    }
    
    console.log(`✅ Deadline check complete: ${missedCount} missed topics found, ${emailsSent} emails sent`);
    
  } catch (error) {
    console.error('❌ Error during deadline check:', error);
  }
}

/**
 * Initialize the deadline service with a daily cron job
 * Runs every day at midnight (00:00)
 */
function startDeadlineService() {
  console.log('🚀 Starting Deadline Service...');
  
  // Schedule daily check at midnight
  cron.schedule('0 0 * * *', () => {
    console.log('⏰ Running scheduled deadline check...');
    checkDeadlines();
  });
  
  console.log('✅ Deadline Service initialized - Daily checks scheduled at midnight');
  
  // Optional: Run check immediately on startup (useful for testing)
  // Uncomment the line below to check deadlines on server start
  // checkDeadlines();
}

module.exports = {
  startDeadlineService,
  checkDeadlines // Export for manual testing
};
