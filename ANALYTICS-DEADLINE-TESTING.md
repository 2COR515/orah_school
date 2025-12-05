# 🧪 Analytics & Deadline System - Quick Testing Guide

## Prerequisites
- Backend server running on port 3002
- Valid JWT tokens for different user roles
- Email credentials configured in `.env`

---

## 📊 Testing Analytics Endpoints

### Test 1: Dashboard Summary (Admin/Instructor)

**Request:**
```bash
curl -X GET http://localhost:3002/api/analytics/dashboard \
  -H "Authorization: Bearer YOUR_INSTRUCTOR_TOKEN"
```

**Expected Response:**
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

**✅ Pass Criteria:**
- Status code: 200
- Response contains all summary sections
- digitalAttendanceRate is calculated correctly
- Instructors only see their own lesson data

**❌ Failure Cases:**
- 401: Token missing or invalid
- 403: User is not instructor/admin
- 500: Server error (check console)

---

### Test 2: Lesson Performance

**Request:**
```bash
curl -X GET http://localhost:3002/api/analytics/lesson/LESSON_ID \
  -H "Authorization: Bearer YOUR_INSTRUCTOR_TOKEN"
```

**Expected Response:**
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

**✅ Pass Criteria:**
- Status code: 200
- All metrics present
- Instructors can only view their own lessons
- Admins can view any lesson

**❌ Failure Cases:**
- 403: Instructor trying to view another instructor's lesson
- 404: Lesson not found

---

### Test 3: Authorization (Should Fail)

**Request (as student):**
```bash
curl -X GET http://localhost:3002/api/analytics/dashboard \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

**Expected Response:**
```json
{
  "ok": false,
  "error": "Access denied"
}
```

**✅ Pass Criteria:**
- Status code: 403
- Students cannot access analytics

---

## ⏰ Testing Deadline Service

### Test 4: Create Old Enrollment (Setup)

**Using Node.js console or test script:**
```javascript
const { saveEnrollment } = require('./backend/db');

// Create enrollment from 4 days ago
const oldDate = new Date(Date.now() - (4 * 24 * 60 * 60 * 1000));

const testEnrollment = {
  lessonId: 'existing_lesson_id',
  userId: 'existing_student_id',
  enrolledAt: oldDate.getTime(),
  enrollmentDate: oldDate.toISOString(),
  lastAccessDate: oldDate.toISOString(),
  status: 'active',
  progress: 0,
  timeSpentSeconds: 0
};

// Save manually or adjust the saveEnrollment function
console.log('Test enrollment created:', testEnrollment);
```

---

### Test 5: Manual Deadline Check

**Modify `backend/deadlineService.js` temporarily:**
```javascript
function startDeadlineService() {
  console.log('🚀 Starting Deadline Service...');
  
  cron.schedule('0 0 * * *', () => {
    console.log('⏰ Running scheduled deadline check...');
    checkDeadlines();
  });
  
  console.log('✅ Deadline Service initialized');
  
  // ✨ ADD THIS LINE FOR TESTING
  checkDeadlines(); // Run immediately on startup
}
```

**Start the server:**
```bash
cd backend
npm start
```

**Expected Console Output:**
```
✓ Server listening on port 3002
🚀 Starting Deadline Service...
✅ Deadline Service initialized - Daily checks scheduled at midnight
🔍 Starting deadline check...
⚠️ Missed topic detected: Enrollment test123 (4 days old)
✅ Student warning email sent to student@example.com for lesson: Introduction to JavaScript
✅ Instructor notification sent to instructor@example.com about John Doe
✅ Deadline check complete: 1 missed topics found, 2 emails sent
```

**✅ Pass Criteria:**
- Service starts successfully
- Old enrollments detected
- Status updated to 'missed' in database
- 2 emails sent (student + instructor)
- Console shows success messages

**❌ Failure Cases:**
- No enrollments detected: Check database for old enrollments
- Emails not sent: Check EMAIL_USER and EMAIL_PASS in `.env`
- Service not starting: Check import in server.js

---

### Test 6: Verify Email Content

**Check Student Email:**
- Subject: "⚠️ Missed Topic Alert: [Lesson Title]"
- Contains: Student name, lesson title, days overdue
- Has: "Go to My Dashboard" button
- Professional HTML formatting

**Check Instructor Email:**
- Subject: "📊 Student Missed Topic: [Student Name] - [Lesson Title]"
- Contains: Student info, lesson details, days overdue
- Has: "View Analytics Dashboard" button
- Suggested actions list

---

### Test 7: Verify Database Update

**Query enrollment status:**
```javascript
const { getEnrollment } = require('./backend/db');

// Check enrollment that should be marked as 'missed'
getEnrollment('enrollment_id').then(enrollment => {
  console.log('Status:', enrollment.status); // Should be 'missed'
  console.log('Last Access:', enrollment.lastAccessDate); // Should be updated
});
```

**✅ Pass Criteria:**
- `status` changed from 'active' to 'missed'
- `lastAccessDate` updated to current timestamp

---

## 🎯 Integration Testing Scenarios

### Scenario 1: Full Enrollment Lifecycle

1. **Student enrolls in lesson**
   - Status: 'active'
   - Progress: 0
   - enrollmentDate: now

2. **Wait 4 days (or modify enrollmentDate)**
   - Status should still be 'active'

3. **Deadline service runs**
   - Status changes to 'missed'
   - 2 emails sent

4. **Student accesses lesson**
   - Update progress > 0
   - Status can be updated back to 'active' (future enhancement)

---

### Scenario 2: Instructor Views Analytics

1. **Instructor logs in**
   - Receives JWT token with role='instructor'

2. **Fetches dashboard summary**
   - GET /api/analytics/dashboard
   - Only sees own lessons

3. **Views specific lesson performance**
   - GET /api/analytics/lesson/lesson123
   - Sees missed enrollment count
   - Digital attendance rate displayed

4. **Checks missed topics**
   - Sees 'missed' status in enrollment data
   - Can follow up with students

---

### Scenario 3: Admin Views System-Wide Analytics

1. **Admin logs in**
   - Receives JWT token with role='admin'

2. **Fetches dashboard summary**
   - GET /api/analytics/dashboard
   - Sees ALL lessons and enrollments

3. **Views any lesson performance**
   - No ownership restrictions
   - Can view all instructor lessons

4. **System monitoring**
   - Tracks overall completion rates
   - Monitors digital attendance rate
   - Identifies at-risk students

---

## 🔧 Manual Testing Checklist

### Analytics API
- [ ] Dashboard summary returns correct data
- [ ] Lesson performance shows accurate metrics
- [ ] Digital Attendance Rate calculated correctly
- [ ] Role-based filtering works (instructor vs admin)
- [ ] Student analytics endpoint accessible
- [ ] Instructor analytics endpoint accessible
- [ ] Authorization properly denies students
- [ ] Error handling for invalid lesson IDs

### Deadline Service
- [ ] Service starts on server startup
- [ ] Cron job scheduled correctly
- [ ] Detects enrollments > 3 days old with 0 progress
- [ ] Updates enrollment status to 'missed'
- [ ] Updates lastAccessDate timestamp
- [ ] Sends student warning email
- [ ] Sends instructor notification email
- [ ] Console logs show correct information
- [ ] Email templates render properly
- [ ] Links in emails work correctly

### Database Integration
- [ ] New enrollments have all required fields
- [ ] Old enrollments can be queried
- [ ] Status updates persist correctly
- [ ] enrollmentDate stored as ISO string
- [ ] timeSpentSeconds initialized to 0

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot read property 'userId' of undefined"
**Cause:** JWT token invalid or missing user data
**Solution:** Re-login to get fresh token with proper payload

### Issue: "Enrollment status not changing to 'missed'"
**Cause:** enrollmentDate field missing or too recent
**Solution:** Manually create test enrollment with old date

### Issue: "Emails not sending"
**Cause:** EMAIL_USER or EMAIL_PASS incorrect
**Solution:** 
```bash
# Verify .env file
cat backend/.env | grep EMAIL

# Should show:
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password
```

### Issue: "Digital Attendance Rate shows NaN%"
**Cause:** No attendance records in database
**Solution:** Create test attendance records using attendance API

### Issue: "Analytics show 0 for all metrics"
**Cause:** Database empty or filtering too restrictive
**Solution:** 
- Create test data (enrollments, attendance)
- Check user role matches data ownership

---

## 📊 Sample Test Data

### Create Test Student
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teststudent@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "Student",
    "role": "student"
  }'
```

### Create Test Instructor
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testinstructor@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "Instructor",
    "role": "instructor"
  }'
```

### Create Test Lesson
```bash
curl -X POST http://localhost:3002/api/lessons \
  -H "Authorization: Bearer INSTRUCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Lesson for Analytics",
    "topic": "Testing",
    "description": "This is a test lesson",
    "videoUrl": "https://example.com/video.mp4",
    "status": "published"
  }'
```

### Create Test Enrollment
```bash
curl -X POST http://localhost:3002/api/enrollments \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lessonId": "lesson_id_from_above"
  }'
```

### Create Test Attendance
```bash
curl -X POST http://localhost:3002/api/attendance \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lessonId": "lesson_id_from_above",
    "status": "present"
  }'
```

---

## ✅ Final Verification

### All Systems Go Checklist
- [ ] Server starts without errors
- [ ] All analytics endpoints return 200 for authorized users
- [ ] Deadline service logs appear in console
- [ ] Emails send successfully (check spam folder)
- [ ] Database updates persist correctly
- [ ] Role-based access control works
- [ ] Digital Attendance Rate calculates properly
- [ ] Cron job scheduled for midnight
- [ ] Documentation matches implementation

---

**Testing Date:** January 22, 2025
**Version:** 1.0.0
**Status:** Ready for Testing ✅
