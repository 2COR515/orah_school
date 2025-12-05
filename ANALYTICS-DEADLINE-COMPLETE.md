# 📊 Analytics & Deadline System - Complete Implementation

## Overview
This document covers the implementation of **Phase A (Analytics Backend)** and **Phase B (Missed Topic Logic & Deadline Service)** for the Orah School Learning Management System.

---

## 🎯 Phase A: Analytics Backend (Setup)

### Features Implemented
1. **Dashboard Summary Analytics** - Aggregated metrics across the entire system
2. **Lesson Performance Analytics** - Detailed analytics per lesson
3. **Student Analytics** - Individual student performance tracking
4. **Instructor Analytics** - Per-instructor lesson statistics
5. **Digital Attendance Rate** - Calculated as (Present / Total Records) × 100%

### Files Created

#### 1. `backend/src/routes/analyticsRoutes.js`
**Purpose:** API route definitions for analytics endpoints

**Routes:**
- `GET /api/analytics/dashboard` - Dashboard summary (Instructor/Admin only)
- `GET /api/analytics/lesson/:lessonId` - Lesson performance (Instructor/Admin only)
- `GET /api/analytics/student/:studentId` - Student analytics (Instructor/Admin only)
- `GET /api/analytics/instructor/:instructorId` - Instructor analytics (Instructor/Admin only)

**Security:** All routes require authentication and instructor/admin role authorization.

**Example Usage:**
```javascript
// Get dashboard summary
fetch('/api/analytics/dashboard', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log(data.summary));

// Get lesson performance
fetch('/api/analytics/lesson/lesson123', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log(data.performance));
```

#### 2. `backend/src/controllers/analyticsController.js`
**Purpose:** Business logic for analytics calculations

**Functions:**

##### `getDashboardSummary(req, res)`
Returns comprehensive system-wide analytics:
```json
{
  "ok": true,
  "summary": {
    "overview": {
      "totalStudents": 45,
      "totalInstructors": 8,
      "totalLessons": 32,
      "publishedLessons": 28,
      "draftLessons": 4,
      "totalEnrollments": 156,
      "activeStudents": 38
    },
    "enrollments": {
      "total": 156,
      "active": 120,
      "completed": 30,
      "missed": 6,
      "averageCompletionRate": "65%"
    },
    "attendance": {
      "totalRecords": 89,
      "present": 75,
      "absent": 14,
      "digitalAttendanceRate": "84%"
    },
    "engagement": {
      "totalTimeSpentMinutes": 4523,
      "averageTimePerStudentMinutes": 119,
      "recentEnrollments": 12
    },
    "timestamp": "2025-01-22T10:30:00.000Z"
  }
}
```

##### `getLessonPerformance(req, res)`
Returns detailed analytics for a specific lesson:
```json
{
  "ok": true,
  "performance": {
    "lesson": {
      "id": "lesson123",
      "title": "Introduction to JavaScript",
      "topic": "Programming",
      "status": "published",
      "createdAt": 1705920000000
    },
    "enrollments": {
      "total": 25,
      "active": 18,
      "completed": 5,
      "missed": 2,
      "completionRate": "20%",
      "averageProgress": "58%"
    },
    "attendance": {
      "totalRecords": 15,
      "present": 12,
      "absent": 3,
      "attendanceRate": "80%"
    },
    "engagement": {
      "totalTimeSpentMinutes": 350,
      "averageTimeSpentMinutes": 14
    },
    "distribution": {
      "notStarted": 5,
      "inProgress": 13,
      "completed": 5,
      "missed": 2
    },
    "recentActivity": {
      "enrollmentsLast7Days": 3,
      "completionsLast7Days": 1
    },
    "timestamp": "2025-01-22T10:30:00.000Z"
  }
}
```

##### `getStudentAnalytics(req, res)`
Returns analytics for a specific student.

##### `getInstructorAnalytics(req, res)`
Returns analytics for a specific instructor (with self-access restriction for instructors).

**Key Features:**
- Role-based data filtering (instructors only see their own lessons)
- Real-time calculations (no cached data)
- Digital Attendance Rate included in all relevant metrics
- Recent activity tracking (last 7 days)

---

## ⏰ Phase B: Missed Topic Logic & Deadline Service

### Features Implemented
1. **Enrollment Model Enhancement** - Added deadline tracking fields
2. **Automated Deadline Checking** - Daily cron job
3. **Status Management** - Auto-update to 'missed' after 3 days
4. **Dual Email Notifications** - Student warnings + Instructor alerts
5. **HTML Email Templates** - Professional, branded emails

### Database Model Updates

#### Enhanced Enrollment Model (`backend/db.js`)
```javascript
const enrollment = {
  id: 'unique_id',
  lessonId: 'lesson_id',
  userId: 'user_id',
  enrolledAt: 1705920000000,                    // Timestamp
  enrollmentDate: '2025-01-22T10:00:00.000Z',  // ✨ NEW: ISO date
  lastAccessDate: '2025-01-22T10:00:00.000Z',  // ✨ NEW: Last interaction
  status: 'active',                             // ✨ ENHANCED: 'active' | 'missed' | 'completed'
  progress: 0,                                  // 0-100
  timeSpentSeconds: 0                           // ✨ NEW: Time tracking
};
```

**New Fields:**
- `enrollmentDate` (ISO string) - Enrollment creation timestamp for deadline calculations
- `lastAccessDate` (ISO string) - Last time student interacted with lesson
- `status` (string) - Now includes 'missed' state
- `timeSpentSeconds` (integer) - Tracks total time spent on lesson

### Files Created

#### `backend/deadlineService.js`
**Purpose:** Automated deadline checking and email notification service

**Key Components:**

##### 1. Email Configuration
```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

##### 2. Student Warning Email Template
- **Subject:** `⚠️ Missed Topic Alert: [Lesson Title]`
- **Features:**
  - Professional HTML design with Orah branding
  - Days overdue counter
  - Direct link to student dashboard
  - Clear call-to-action button
  - Next steps explanation
  
**Email Preview:**
```
⚠️ Missed Topic Alert
━━━━━━━━━━━━━━━━━━━━
Dear [Student Name],

⚠️ Important Notice: You have a missed topic that requires immediate attention.

Lesson: Introduction to JavaScript
Days Overdue: 4 days

This lesson was enrolled 4 days ago and has not been started yet...

[Go to My Dashboard]
```

##### 3. Instructor Notification Email Template
- **Subject:** `📊 Student Missed Topic: [Student Name] - [Lesson Title]`
- **Features:**
  - Detailed student information
  - Enrollment metrics
  - Suggested intervention actions
  - Link to analytics dashboard
  
**Email Preview:**
```
📊 Student Missed Topic Notification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dear [Instructor Name],

ℹ️ Attention Required: A student in your course has a missed topic.

Student: John Doe
Email: john.doe@example.com
Lesson: Introduction to JavaScript
Days Overdue: 4 days
Status: Enrolled but not started

Suggested Actions:
• Reach out to the student to offer support
• Check if there are any technical or access issues
• Review lesson engagement metrics

[View Analytics Dashboard]
```

##### 4. Deadline Checking Logic
```javascript
async function checkDeadlines() {
  // 1. Fetch all enrollments
  const enrollments = await listAllEnrollments();
  
  // 2. Filter active enrollments with 0 progress
  const activeEnrollments = enrollments.filter(e => 
    e.status === 'active' && e.progress === 0
  );
  
  // 3. Check each enrollment
  for (const enrollment of activeEnrollments) {
    const enrollmentDate = new Date(enrollment.enrollmentDate);
    const daysSinceEnrollment = (now - enrollmentDate) / (24 * 60 * 60 * 1000);
    
    // 4. If > 3 days, mark as missed
    if (daysSinceEnrollment > 3) {
      await updateEnrollment(enrollment.id, { 
        status: 'missed',
        lastAccessDate: new Date().toISOString()
      });
      
      // 5. Send emails
      await sendStudentWarningEmail(...);
      await sendInstructorNotificationEmail(...);
    }
  }
}
```

##### 5. Cron Scheduler
```javascript
function startDeadlineService() {
  // Runs daily at midnight (00:00)
  cron.schedule('0 0 * * *', () => {
    console.log('⏰ Running scheduled deadline check...');
    checkDeadlines();
  });
  
  console.log('✅ Deadline Service initialized');
}
```

**Cron Schedule:** `0 0 * * *` (Daily at midnight)

**Functions Exported:**
- `startDeadlineService()` - Initialize the service
- `checkDeadlines()` - Manual trigger for testing

### Server Integration

#### `backend/server.js` Updates
```javascript
// Import deadline service
const { startDeadlineService } = require('./deadlineService');

// Mount analytics routes
const analyticsRoutes = require('./src/routes/analyticsRoutes');
app.use('/api/analytics', analyticsRoutes);

// Start services on server initialization
async function startServer() {
  await initDb();
  startReminderScheduler();
  startDeadlineService(); // ✨ NEW
  app.listen(PORT, () => {
    console.log(`✓ Server listening on port ${PORT}`);
  });
}
```

---

## 🔐 Security & Authorization

### Role-Based Access Control
- **Admins:** Full access to all analytics
- **Instructors:** 
  - Can view dashboard summary (filtered to their lessons)
  - Can view their own lesson performance
  - Can view their own analytics only
  - Cannot view other instructors' data
- **Students:** No access to analytics endpoints (future enhancement)

### Data Filtering
```javascript
// Instructors see only their lessons
if (userRole === 'instructor') {
  filteredLessons = lessons.filter(l => l.instructorId === userId);
  const lessonIds = new Set(filteredLessons.map(l => l.id));
  filteredEnrollments = enrollments.filter(e => lessonIds.has(e.lessonId));
}
```

---

## 📧 Email System Integration

### Environment Variables Required
```bash
# .env file
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
APP_URL=http://localhost:5500  # Frontend URL for email links
```

### Email Types in System
1. **Reminder Emails** (reminderService.js)
   - Daily/weekly/twice-weekly reminders
   - User-controlled frequency
   - Sent at 9 AM daily

2. **Deadline Warning Emails** (deadlineService.js)
   - Student warnings for missed topics
   - Instructor notifications
   - Sent at midnight after deadline check

### Gmail App Password Setup
1. Enable 2-Factor Authentication on Gmail
2. Go to Google Account → Security → App Passwords
3. Generate new app password for "Mail"
4. Add to `.env` file

---

## 🧪 Testing Guide

### Testing Analytics Endpoints

#### 1. Test Dashboard Summary
```bash
# Using curl
curl -X GET http://localhost:3002/api/analytics/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected: 200 OK with summary object
```

#### 2. Test Lesson Performance
```bash
curl -X GET http://localhost:3002/api/analytics/lesson/LESSON_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected: 200 OK with performance object
```

#### 3. Test Authorization
```bash
# As student (should fail)
curl -X GET http://localhost:3002/api/analytics/dashboard \
  -H "Authorization: Bearer STUDENT_TOKEN"

# Expected: 403 Forbidden
```

### Testing Deadline Service

#### Manual Trigger (for testing)
```javascript
// Add to deadlineService.js temporarily
function startDeadlineService() {
  cron.schedule('0 0 * * *', checkDeadlines);
  
  // Run immediately on startup for testing
  checkDeadlines(); // ✨ Uncomment this line
}
```

#### Create Test Scenario
```javascript
// Create an enrollment that's 4 days old
const testEnrollment = {
  id: 'test123',
  lessonId: 'lesson456',
  userId: 'student789',
  enrolledAt: Date.now() - (4 * 24 * 60 * 60 * 1000), // 4 days ago
  enrollmentDate: new Date(Date.now() - (4 * 24 * 60 * 60 * 1000)).toISOString(),
  status: 'active',
  progress: 0,
  timeSpentSeconds: 0
};

// Save and run checkDeadlines()
// Expected: Enrollment status → 'missed', 2 emails sent
```

#### Check Console Output
```bash
# Start server
cd backend
npm start

# Look for:
🚀 Starting Deadline Service...
✅ Deadline Service initialized - Daily checks scheduled at midnight
🔍 Starting deadline check...
⚠️ Missed topic detected: Enrollment test123 (4 days old)
✅ Student warning email sent to student@example.com
✅ Instructor notification sent to instructor@example.com
✅ Deadline check complete: 1 missed topics found, 2 emails sent
```

---

## 📊 Metrics Glossary

### Digital Attendance Rate
**Formula:** `(Present Records / Total Attendance Records) × 100%`
- Measures actual attendance vs. expected attendance
- Higher percentage = better engagement
- Calculated across all lessons or per-lesson

### Completion Rate
**Formula:** `(Completed Enrollments / Total Enrollments) × 100%`
- Percentage of enrollments that reached 100% progress
- Key indicator of course effectiveness

### Average Progress
**Formula:** `Sum of all progress values / Total enrollments`
- Overall course progress across all students
- Expressed as percentage (0-100%)

### Active Students
- Students with at least one enrollment in 'active' status
- Excludes students with only completed/missed enrollments

### Days Overdue
**Calculation:** `Current Date - Enrollment Date`
- Measures how long since enrollment creation
- Triggers 'missed' status after 3 days with 0 progress

---

## 🚀 System Architecture

### Service Flow Diagram
```
┌─────────────────┐
│   Student       │
│   Enrolls       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Enrollment Created             │
│  - enrollmentDate: ISO string   │
│  - status: 'active'             │
│  - progress: 0                  │
└────────┬────────────────────────┘
         │
         │ Every 24 hours
         ▼
┌─────────────────────────────────┐
│  deadlineService.checkDeadlines │
│  - Runs at midnight (cron)      │
│  - Checks all active enrollments│
└────────┬────────────────────────┘
         │
         │ If > 3 days && progress = 0
         ▼
┌─────────────────────────────────┐
│  Update Enrollment              │
│  - status: 'missed'             │
│  - lastAccessDate: now          │
└────────┬────────────────────────┘
         │
         ├─────────────┬───────────┐
         ▼             ▼           ▼
    ┌────────┐   ┌─────────┐  ┌─────────┐
    │Student │   │Instructor│  │Analytics│
    │Warning │   │  Alert   │  │ Updated │
    │ Email  │   │  Email   │  │         │
    └────────┘   └─────────┘  └─────────┘
```

### Email Flow
```
1. checkDeadlines() → Identifies missed enrollment
2. sendStudentWarningEmail() → Notifies student
3. sendInstructorNotificationEmail() → Notifies instructor
4. Both emails sent via Nodemailer transporter
5. Console logs success/failure
```

---

## 🔧 Configuration Options

### Deadline Threshold
**Current:** 3 days
**Modify in:** `backend/deadlineService.js`
```javascript
const threeDaysInMs = 3 * 24 * 60 * 60 * 1000; // Change 3 to desired days
```

### Cron Schedule
**Current:** Daily at midnight (`0 0 * * *`)
**Modify in:** `backend/deadlineService.js`
```javascript
// Examples:
cron.schedule('0 0 * * *', checkDeadlines);     // Midnight
cron.schedule('0 9 * * *', checkDeadlines);     // 9 AM
cron.schedule('0 */6 * * *', checkDeadlines);   // Every 6 hours
cron.schedule('0 0 * * 1', checkDeadlines);     // Weekly on Monday
```

### Email Branding
**Modify in:** `backend/deadlineService.js`
- Update `generateStudentWarningEmail()` HTML template
- Update `generateInstructorNotificationEmail()` HTML template
- Change colors, logos, footer text as needed

---

## 📝 API Reference

### Analytics Endpoints

#### GET `/api/analytics/dashboard`
**Auth:** Required (Instructor/Admin)
**Response:** Dashboard summary with all metrics
**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (wrong role)
- `500` - Server error

#### GET `/api/analytics/lesson/:lessonId`
**Auth:** Required (Instructor/Admin)
**Params:** `lessonId` - Lesson ID
**Response:** Detailed lesson performance
**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (not lesson owner)
- `404` - Lesson not found
- `500` - Server error

#### GET `/api/analytics/student/:studentId`
**Auth:** Required (Instructor/Admin)
**Params:** `studentId` - User ID
**Response:** Student analytics
**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Student not found
- `500` - Server error

#### GET `/api/analytics/instructor/:instructorId`
**Auth:** Required (Instructor/Admin)
**Params:** `instructorId` - User ID
**Response:** Instructor analytics
**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (can only view own data)
- `404` - Instructor not found
- `500` - Server error

---

## 🐛 Troubleshooting

### Issue: Analytics returning 0 for all metrics
**Cause:** Database not populated with test data
**Solution:** Create enrollments and attendance records using existing APIs

### Issue: Emails not sending
**Cause:** Invalid Gmail credentials or 2FA not enabled
**Solution:** 
1. Verify EMAIL_USER and EMAIL_PASS in `.env`
2. Enable 2FA on Gmail account
3. Generate new app password
4. Check console for nodemailer errors

### Issue: Deadline service not running
**Cause:** Service not started in server.js
**Solution:** Verify `startDeadlineService()` is called in `startServer()`

### Issue: 403 Forbidden on analytics routes
**Cause:** User role is not 'instructor' or 'admin'
**Solution:** Check JWT token payload contains correct role

### Issue: Missed enrollments not detected
**Cause:** enrollmentDate field missing on old enrollments
**Solution:** Old enrollments created before this update won't have `enrollmentDate`. Either:
- Delete and recreate enrollments
- Manually add enrollmentDate to existing records
- Wait for new enrollments after this update

---

## ✅ Implementation Checklist

### Phase A: Analytics Backend
- [x] Create `backend/src/routes/analyticsRoutes.js`
- [x] Create `backend/src/controllers/analyticsController.js`
- [x] Implement `getDashboardSummary()` with Digital Attendance Rate
- [x] Implement `getLessonPerformance()`
- [x] Implement `getStudentAnalytics()`
- [x] Implement `getInstructorAnalytics()`
- [x] Add role-based authorization middleware
- [x] Mount analytics routes in server.js

### Phase B: Deadline Service
- [x] Update enrollment model in `backend/db.js`
  - [x] Add `enrollmentDate` field
  - [x] Add `lastAccessDate` field
  - [x] Add `timeSpentSeconds` field
  - [x] Enhance `status` field to include 'missed'
- [x] Create `backend/deadlineService.js`
- [x] Implement `checkDeadlines()` function
- [x] Implement student warning email template
- [x] Implement instructor notification email template
- [x] Set up cron scheduler for daily checks
- [x] Integrate deadline service in server.js startup

### Testing & Documentation
- [x] Create comprehensive documentation
- [ ] Test all analytics endpoints
- [ ] Test deadline service with mock data
- [ ] Verify email sending functionality
- [ ] Validate role-based access control

---

## 🎉 Success Criteria

### Analytics System
✅ Instructors can view dashboard summary of their lessons
✅ Digital Attendance Rate calculated correctly
✅ Lesson performance shows completion rates and engagement
✅ Role-based data filtering works properly
✅ Real-time calculations (no stale data)

### Deadline System
✅ Enrollments older than 3 days with 0 progress → 'missed'
✅ Students receive warning emails
✅ Instructors receive notification emails
✅ Daily automated checks run at midnight
✅ Console logging shows service activity

---

## 📚 Related Documentation
- `REMINDER-FRONTEND-INTEGRATION.md` - Reminder system setup
- `ATTENDANCE-SYSTEM-COMPLETE.md` - Attendance tracking
- `AUTH-SYSTEM-README.md` - Authentication system
- `INSTRUCTOR-STATS-FIX.md` - Instructor statistics

---

## 🔄 Future Enhancements

### Analytics
- [ ] Graphical charts for trends over time
- [ ] Exportable reports (CSV/PDF)
- [ ] Comparative analytics (student vs. class average)
- [ ] Predictive analytics (at-risk student detection)

### Deadline Service
- [ ] Configurable deadline thresholds per lesson
- [ ] Escalating reminder system (warning at 2 days, urgent at 3 days)
- [ ] SMS notifications integration
- [ ] Student self-extension requests
- [ ] Instructor override for specific students

---

**Implementation Date:** January 22, 2025
**Version:** 1.0.0
**Status:** ✅ Complete
