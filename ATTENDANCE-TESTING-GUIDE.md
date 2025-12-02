# Quick Testing Guide - Attendance & Reminders

## 🚀 Quick Start

### Prerequisites
- Server running on port 3002
- Instructor account created
- At least one lesson created

---

## 📝 Test Attendance Tracking

### Step 1: Login as Instructor
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "instructor@example.com",
    "password": "your-password"
  }'
```

Save the `token` from the response.

### Step 2: Mark Attendance
```bash
curl -X POST http://localhost:3002/api/attendance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "records": [
      {
        "studentId": "STUDENT001",
        "lessonId": "YOUR_LESSON_ID",
        "date": "2025-12-01",
        "status": "present"
      },
      {
        "studentId": "STUDENT002",
        "lessonId": "YOUR_LESSON_ID",
        "date": "2025-12-01",
        "status": "absent"
      }
    ]
  }'
```

Expected: `201` status with confirmation message.

### Step 3: Get Attendance Records
```bash
curl -X GET "http://localhost:3002/api/attendance?lessonId=YOUR_LESSON_ID" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected: Array of attendance records.

### Step 4: Get Statistics
```bash
curl -X GET "http://localhost:3002/api/attendance/stats/YOUR_LESSON_ID?date=2025-12-01" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected: Statistics with total, present, absent, attendanceRate.

---

## 🔔 Test Reminder System

### Method 1: Automated Test Script
```bash
cd backend
node test-reminder-scheduler.js
```

This will:
- Create test enrollments with different scenarios
- Run the reminder processor
- Display which students would receive reminders

### Method 2: Manual Trigger
Edit `backend/reminderService.js` and uncomment line 163:
```javascript
// processReminders(); // ← Uncomment this line
```

Then restart the server:
```bash
cd backend
node server.js
```

Reminders will run immediately on startup.

### Method 3: Change Schedule for Testing
Edit `backend/reminderService.js` line 147:
```javascript
// Change from:
const schedule = '0 9 * * 1'; // Every Monday at 9 AM

// To:
const schedule = '* * * * *'; // Every minute (for testing)
```

Restart server and wait 1 minute.

---

## ✅ Expected Results

### Attendance API:
- ✅ Only instructors can mark attendance (403 for students)
- ✅ Bulk marking works for multiple students
- ✅ Statistics calculate correctly
- ✅ Records can be queried by lesson, student, date
- ✅ Records can be updated and deleted

### Reminder System:
- ✅ Sends reminders for 0% progress after 2+ days
- ✅ Sends reminders for incomplete (1-99%) after 3+ days
- ✅ Skips completed lessons (100%)
- ✅ Skips recent enrollments (< 2 days)
- ✅ Displays formatted email in console

---

## 🔍 Verify Server Logs

```bash
tail -f backend/server.log
```

Look for:
```
✓ Attendance API available at http://localhost:3002/api/attendance
📅 Starting Automated Reminder Scheduler
✅ Reminder scheduler started successfully!
```

---

## 🧪 Full Integration Test

Run the comprehensive test script:
```bash
cd backend
node test-attendance-api.js
```

This tests:
1. ✅ Instructor login
2. ✅ Lesson creation
3. ✅ Bulk attendance marking
4. ✅ Record retrieval with filters
5. ✅ Statistics calculation
6. ✅ Record updates
7. ✅ Authorization checks

---

## 🐛 Troubleshooting

### Attendance endpoint returns 401
- Check token is valid: `localStorage.getItem('token')`
- Verify token in Authorization header: `Bearer YOUR_TOKEN`

### Reminder scheduler not running
- Check server logs for cron syntax errors
- Verify node-cron is installed: `npm list node-cron`
- Check schedule format is valid

### No reminders sent
- Verify enrollments exist with incomplete progress
- Check enrollment dates (must be 2+ days old)
- Look for errors in console output

---

## 📊 Check Database

```bash
cd backend
node -e "
const storage = require('node-persist');
const path = require('path');
storage.init({dir: path.join(__dirname, 'storage')}).then(async () => {
  const attendance = await storage.getItem('attendance') || [];
  console.log('Attendance records:', attendance.length);
  console.log(JSON.stringify(attendance, null, 2));
});
"
```

---

## 🎯 Success Criteria

All of these should work:
- ✅ Instructor can mark attendance via API
- ✅ Records are saved to database
- ✅ Statistics calculate correctly
- ✅ Reminders log to console on schedule
- ✅ Only instructors have access
- ✅ Server starts without errors
- ✅ All test scripts pass

---

**Need Help?** Check `ATTENDANCE-REMINDERS-COMPLETE.md` for detailed documentation.
