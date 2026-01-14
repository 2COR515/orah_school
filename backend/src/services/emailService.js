// backend/src/services/emailService.js
// Email and Mock SMS Service for Verification

const nodemailer = require('nodemailer');

// Create transporter for email sending with timeout
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 5000, // 5 second connection timeout
  greetingTimeout: 5000,   // 5 second greeting timeout
  socketTimeout: 10000     // 10 second socket timeout
});

/**
 * Send verification email with 6-digit code
 * @param {string} to - Recipient email
 * @param {string} code - 6-digit verification code
 * @param {string} firstName - User's first name for personalization
 */
async function sendVerificationEmail(to, code, firstName) {
  const mailOptions = {
    from: `"Orah Schools" <${process.env.EMAIL_USER || 'noreply@orahschools.com'}>`,
    to: to,
    subject: 'Verify Your Orah Schools Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #0d0d0d; color: #e5e5e5; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; padding: 32px; border: 1px solid #333; }
          .logo { text-align: center; margin-bottom: 24px; }
          h1 { color: #22c55e; text-align: center; margin-bottom: 16px; }
          .code { background-color: #22c55e; color: #0d0d0d; font-size: 32px; font-weight: bold; text-align: center; padding: 16px; border-radius: 8px; letter-spacing: 8px; margin: 24px 0; }
          p { line-height: 1.6; margin: 12px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #333; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h2 style="color: #22c55e; margin: 0;">🎓 Orah Schools</h2>
          </div>
          <h1>Verify Your Email</h1>
          <p>Hi ${firstName || 'there'},</p>
          <p>Welcome to Orah Schools! Use the verification code below to complete your account setup:</p>
          <div class="code">${code}</div>
          <p>This code expires in <strong>15 minutes</strong>.</p>
          <p>If you didn't create an account with Orah Schools, you can safely ignore this email.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Orah Schools. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 [EMAIL] Verification email sent to: ${to}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ [EMAIL ERROR] Failed to send to ${to}:`, error.message);
    // Log the code to console as fallback for demo
    console.log(`📧 [EMAIL FALLBACK] To: ${to}, Code: ${code}`);
    return { success: false, error: error.message };
  }
}

/**
 * Mock SMS - logs to console (for demo purposes)
 * @param {string} phoneNumber - Phone number
 * @param {string} code - 6-digit verification code
 */
function sendMockSMS(phoneNumber, code) {
  console.log('📲 [MOCK SMS] To:', phoneNumber, 'Code:', code);
  return { success: true };
}

/**
 * Generate a random 6-digit verification code
 * @returns {string} 6-digit code
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Send enrollment confirmation email to student
 * @param {string} studentEmail - Student's email
 * @param {Object} details - Enrollment details
 */
async function sendEnrollmentConfirmation(studentEmail, details) {
  const { 
    studentName, 
    lessonTitle, 
    instructorName, 
    instructorEmail, 
    instructorPhone,
    deadline,
    enrolledAt 
  } = details;

  const formattedDeadline = deadline ? new Date(deadline).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'No deadline set';

  const formattedEnrolledAt = new Date(enrolledAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const mailOptions = {
    from: `"Orah Schools" <${process.env.EMAIL_USER || 'noreply@orahschools.com'}>`,
    to: studentEmail,
    subject: `🎉 You're enrolled in: ${lessonTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #0d0d0d; color: #e5e5e5; margin: 0; padding: 20px; }
          .container { max-width: 550px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; padding: 32px; border: 1px solid #333; }
          .header { text-align: center; margin-bottom: 24px; }
          .header h1 { color: #22c55e; margin: 0; }
          .success-badge { background: #22c55e; color: #0d0d0d; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin: 16px 0; }
          .lesson-card { background: #262626; border-left: 4px solid #22c55e; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .lesson-title { color: #22c55e; font-size: 1.3rem; margin: 0 0 8px 0; }
          .instructor-section { background: #1f1f1f; padding: 16px; border-radius: 8px; margin: 16px 0; }
          .instructor-section h3 { color: #a855f7; margin: 0 0 12px 0; }
          .contact-item { display: flex; align-items: center; margin: 8px 0; }
          .contact-icon { margin-right: 10px; font-size: 1.2rem; }
          .deadline-box { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .deadline-box h4 { margin: 0; color: white; }
          .deadline-box p { margin: 8px 0 0 0; font-size: 1.1rem; color: white; font-weight: bold; }
          .cta-button { display: inline-block; background: #22c55e; color: #0d0d0d; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #333; }
          p { line-height: 1.6; margin: 12px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Orah Schools</h1>
            <span class="success-badge">✓ Enrollment Confirmed</span>
          </div>
          
          <p>Hi ${studentName || 'there'},</p>
          <p>Great news! You've successfully enrolled in a new lesson. Here are your course details:</p>
          
          <div class="lesson-card">
            <h2 class="lesson-title">📚 ${lessonTitle}</h2>
            <p style="color: #999; margin: 0;">Enrolled on: ${formattedEnrolledAt}</p>
          </div>
          
          <div class="instructor-section">
            <h3>👨‍🏫 Your Instructor</h3>
            <div class="contact-item">
              <span class="contact-icon">👤</span>
              <span><strong>${instructorName || 'Instructor'}</strong></span>
            </div>
            <div class="contact-item">
              <span class="contact-icon">📧</span>
              <span><a href="mailto:${instructorEmail}" style="color: #22c55e;">${instructorEmail || 'Not provided'}</a></span>
            </div>
            <div class="contact-item">
              <span class="contact-icon">📱</span>
              <span>${instructorPhone || 'Not provided'}</span>
            </div>
          </div>
          
          <div class="deadline-box">
            <h4>⏰ Course Deadline</h4>
            <p>${formattedDeadline}</p>
          </div>
          
          <p>Ready to start learning? Click below to access your lesson:</p>
          
          <div style="text-align: center;">
            <a href="http://localhost:3002/student-dashboard.html" class="cta-button">Go to My Dashboard</a>
          </div>
          
          <div class="footer">
            <p>Need help? Contact your instructor directly using the details above.</p>
            <p>© ${new Date().getFullYear()} Orah Schools. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 [ENROLLMENT EMAIL] Confirmation sent to student: ${studentEmail}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ [EMAIL ERROR] Failed to send enrollment confirmation to ${studentEmail}:`, error.message);
    // Fallback logging
    console.log(`📧 [ENROLLMENT FALLBACK] Student: ${studentEmail}, Lesson: ${lessonTitle}, Instructor: ${instructorName}, Deadline: ${formattedDeadline}`);
    return { success: false, error: error.message };
  }
}

/**
 * Send enrollment alert to instructor when a student enrolls
 * @param {string} instructorEmail - Instructor's email
 * @param {Object} details - Enrollment details
 */
async function sendInstructorEnrollmentAlert(instructorEmail, details) {
  const { 
    instructorName,
    studentName, 
    studentEmail,
    lessonTitle,
    enrolledAt,
    deadline
  } = details;

  const formattedDeadline = deadline ? new Date(deadline).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'No deadline set';

  const formattedEnrolledAt = new Date(enrolledAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const mailOptions = {
    from: `"Orah Schools" <${process.env.EMAIL_USER || 'noreply@orahschools.com'}>`,
    to: instructorEmail,
    subject: `📢 New Student Enrolled: ${lessonTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #0d0d0d; color: #e5e5e5; margin: 0; padding: 20px; }
          .container { max-width: 550px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; padding: 32px; border: 1px solid #333; }
          .header { text-align: center; margin-bottom: 24px; }
          .header h1 { color: #a855f7; margin: 0; }
          .alert-badge { background: #a855f7; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin: 16px 0; }
          .student-card { background: #262626; border-left: 4px solid #a855f7; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .student-name { color: #22c55e; font-size: 1.3rem; margin: 0 0 8px 0; }
          .info-row { display: flex; align-items: center; margin: 10px 0; }
          .info-icon { margin-right: 10px; font-size: 1.2rem; }
          .lesson-box { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .lesson-box h4 { margin: 0; color: white; }
          .lesson-box p { margin: 8px 0 0 0; font-size: 1.1rem; color: white; font-weight: bold; }
          .cta-button { display: inline-block; background: #a855f7; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #333; }
          p { line-height: 1.6; margin: 12px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Orah Schools</h1>
            <span class="alert-badge">🆕 New Enrollment</span>
          </div>
          
          <p>Hi ${instructorName || 'Instructor'},</p>
          <p>A new student has enrolled in one of your lessons!</p>
          
          <div class="student-card">
            <h2 class="student-name">👤 ${studentName || 'New Student'}</h2>
            <div class="info-row">
              <span class="info-icon">📧</span>
              <span><a href="mailto:${studentEmail}" style="color: #22c55e;">${studentEmail}</a></span>
            </div>
            <div class="info-row">
              <span class="info-icon">📅</span>
              <span>Enrolled: ${formattedEnrolledAt}</span>
            </div>
          </div>
          
          <div class="lesson-box">
            <h4>📚 Lesson</h4>
            <p>${lessonTitle}</p>
          </div>
          
          <div style="background: #262626; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
            <strong>⏰ Deadline:</strong> ${formattedDeadline}
          </div>
          
          <p>View your instructor dashboard to track this student's progress:</p>
          
          <div style="text-align: center;">
            <a href="http://localhost:3002/instructor-dashboard.html" class="cta-button">View Dashboard</a>
          </div>
          
          <div class="footer">
            <p>You're receiving this because a student enrolled in your course.</p>
            <p>© ${new Date().getFullYear()} Orah Schools. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 [INSTRUCTOR ALERT] Enrollment notification sent to: ${instructorEmail}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ [EMAIL ERROR] Failed to send instructor alert to ${instructorEmail}:`, error.message);
    // Fallback logging
    console.log(`📧 [INSTRUCTOR FALLBACK] Instructor: ${instructorEmail}, Student: ${studentName} (${studentEmail}), Lesson: ${lessonTitle}`);
    return { success: false, error: error.message };
  }
}

/**
 * Send enrollment SMS notification to student (Mock for now)
 * @param {string} phone - Student's phone number
 * @param {Object} details - Enrollment details
 */
function sendEnrollmentSMS(phone, details) {
  const { lessonTitle, instructorName, instructorPhone, deadline } = details;
  const formattedDeadline = deadline ? new Date(deadline).toLocaleDateString() : 'TBD';
  
  console.log('📲 [MOCK SMS - ENROLLMENT]');
  console.log(`   To: ${phone}`);
  console.log(`   Message: You're enrolled in "${lessonTitle}"!`);
  console.log(`   Instructor: ${instructorName} (${instructorPhone || 'N/A'})`);
  console.log(`   Deadline: ${formattedDeadline}`);
  
  return { success: true };
}

module.exports = {
  sendVerificationEmail,
  sendMockSMS,
  generateVerificationCode,
  isValidEmail,
  sendEnrollmentConfirmation,
  sendInstructorEnrollmentAlert,
  sendEnrollmentSMS
};
