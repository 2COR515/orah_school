# 🚀 Quick Start Guide - Testing Analytics & Time Tracking

## Prerequisites
- Backend server running on `localhost:3002`
- Valid instructor/admin account
- At least one lesson created
- At least one student enrollment

---

## Step 1: Test Time Tracking ⏱️

### A. Setup
1. Start backend server:
   ```bash
   cd backend
   npm start
   ```

2. Open browser (Chrome/Firefox with console open)

### B. Test Video Time Tracking
1. Login as a student
2. Navigate to any lesson with video
3. **Open DevTools Console** (F12)
4. Play video for 10 seconds
5. Pause video
6. **Expected Console Output:**
   ```
   ▶️ Video playing - Starting time tracking
   ⏸️ Video paused - Session duration: 10s, Total: 10s
   ✅ Time increment sent: +10s (Session total: 10s)
   ```

7. Resume video for 20 more seconds
8. Pause again
9. **Expected Console Output:**
   ```
   ▶️ Video playing - Starting time tracking
   ⏸️ Video paused - Session duration: 20s, Total: 30s
   ✅ Time increment sent: +20s (Session total: 30s)
   ```

### C. Test Page Unload
1. With video still open, close the tab or navigate away
2. **Expected Console Output:**
   ```
   📤 Final increment sent via beacon: +Xs (Session: 30s)
   ```

### D. Verify Backend
Check backend console for:
```
⏱️ Time spent: +10s → Total: 10s
⏱️ Time spent: +20s → Total: 30s
```

---

## Step 2: Test Analytics Dashboard 📊

### A. Access Dashboard
1. Login as instructor or admin
2. Navigate to **Analytics** page
   - URL: `http://localhost:5500/instructor-analytics.html`
   - Or click "Analytics" in navigation

### B. Verify Overview Stats
Check that all 5 stat boxes populate:
- ✅ Total Lessons: Should show your lesson count
- ✅ Total Enrollments: Should show enrollment count
- ✅ Avg Completion Rate: Percentage value
- ✅ **Digital Attendance Rate**: Percentage (if attendance records exist)
- ✅ Active Students: Count of unique students

**Expected Console Output:**
```
📊 Initializing Analytics Dashboard...
📊 Dashboard Summary: {overview: {...}, enrollments: {...}, attendance: {...}}
✅ Dashboard summary loaded
```

### C. Test Lesson Performance Table
1. Scroll to "Lesson Performance" section
2. Verify table displays with columns:
   - Lesson Title
   - Status (Published/Draft badge)
   - Enrollments
   - Avg Progress
   - Completion Rate
   - **Attendance Rate**
   - Missed Topics (red if > 0)

3. **Hover over a row** → Background should highlight
4. **Click a row** → Modal should open with detailed metrics

**Modal Should Show:**
- 4 metric boxes (enrollments, avg progress, attendance rate, missed topics)
- Progress distribution breakdown
- Engagement metrics (time spent)
- Recent activity (last 7 days)

**Expected Console Output:**
```
✅ Lesson performance table loaded
```

### D. Test Student Progress Tracking
1. Scroll to "Student Progress Tracking" section
2. Verify student cards display with:
   - Student name and email
   - Time spent (top right, in minutes)
   - 4 colored boxes:
     - 🟢 Finished (completed lessons)
     - 🔵 Enrolled (total enrollments)
     - 🟠 In Progress (active lessons)
     - 🔴 Missed (missed topics)

3. **Test Lesson Filter:**
   - Use dropdown to select a specific lesson
   - Student list should update to show only enrollments for that lesson

**Expected Console Output:**
```
✅ Student progress tracking loaded
```

### E. Verify Engagement Insights
Scroll to "Engagement Insights" section. Should show:

1. **Most Popular Lessons** (top 5 by enrollment count)
   ```
   📚 Introduction to JavaScript (25 enrollments)
   📚 HTML Basics (30 enrollments)
   ```

2. **Recent Activity** (last 7 days)
   ```
   📈 12 new enrollments
   ✅ 8 lessons completed
   ```

3. **Completion Trends**
   - Overall percentage
   - Visual progress bar

---

## Step 3: End-to-End Test 🔄

### Complete User Journey

#### As Student:
1. **Enroll in a lesson** (from student dashboard)
2. **Watch video for 2 minutes**
   - Verify time tracking in console
3. **Pause and navigate away**
   - Final time update should send
4. **Return to lesson next day** (or simulate by refreshing)
5. **Watch for 3 more minutes**
   - Time should accumulate (total: 5 minutes)

#### As Instructor:
1. **Navigate to Analytics Dashboard**
2. **Check Overview Stats**
   - Total Enrollments should include new enrollment
3. **View Lesson Performance**
   - Click lesson → See enrollment in modal
4. **Check Student Progress**
   - Find student card
   - Verify "Enrolled: 1" shows
   - Time Spent should show "5 min"

---

## Step 4: Test Edge Cases 🧪

### A. No Data Scenario
1. Create fresh instructor account
2. Navigate to analytics
3. **Expected:**
   - All stats show 0
   - Tables show "No data available" messages
   - No errors in console

### B. Missed Topics Detection
1. Create enrollment with `enrollmentDate` > 3 days ago
2. Keep `progress` at 0 and `status` as 'active'
3. Wait for midnight cron OR manually run `checkDeadlines()`
4. **Expected:**
   - Status updates to 'missed'
   - Analytics shows 1 in "Missed Topics" column
   - Student card shows red "1" in Missed box

### C. Time Tracking Without Progress
1. Play video for 1 minute
2. Pause (do NOT complete lesson)
3. Navigate away
4. Return to analytics
5. **Expected:**
   - Time Spent shows 1 minute
   - Progress still 0%
   - Enrollment status remains 'active'

### D. Multiple Sessions
1. Play video for 30 seconds → Close tab
2. Reopen lesson → Play for 45 seconds → Close tab
3. Reopen lesson → Play for 60 seconds → Close tab
4. Check backend database
5. **Expected:**
   - `timeSpentSeconds` = 135 (30 + 45 + 60)
   - Accumulated correctly across all sessions

---

## Step 5: Verify Backend Logs 📝

### Time Tracking Logs
Look for in backend console:
```
⏱️ Time spent: +30s → Total: 30s
⏱️ Time spent: +45s → Total: 75s
⏱️ Time spent: +60s → Total: 135s
```

### Analytics API Logs
When dashboard loads:
```
GET /api/analytics/dashboard → 200
GET /api/lessons → 200
GET /api/analytics/lesson/lesson123 → 200
GET /api/enrollments → 200
GET /api/auth/users → 200
```

### Deadline Service Logs
After midnight cron (or manual trigger):
```
🔍 Starting deadline check...
⚠️ Missed topic detected: Enrollment test123 (4 days old)
✅ Student warning email sent to student@example.com
✅ Instructor notification sent to instructor@example.com
✅ Deadline check complete: 1 missed topics found, 2 emails sent
```

---

## Common Issues & Solutions 🔧

### Issue 1: Time Tracking Not Working
**Symptoms:** No console logs when playing/pausing video

**Solution:**
1. Check `lesson-player.js` loaded correctly
2. Verify `currentEnrollmentId` is set
3. Check video element has id `lesson-video`
4. Ensure enrollment exists for current user

### Issue 2: Analytics Dashboard Shows All Zeros
**Symptoms:** Stats display 0 despite having data

**Solutions:**
1. Check browser console for errors
2. Verify backend server is running
3. Check authentication token in localStorage
4. Ensure user role is 'instructor' or 'admin'
5. Try: `localStorage.getItem('token')` in console

### Issue 3: Digital Attendance Rate Not Showing
**Symptoms:** Stat box shows "0%" or "N/A"

**Solutions:**
1. Create test attendance records:
   ```bash
   # Use attendance API to create records
   POST /api/attendance
   {
     "lessonId": "lesson123",
     "status": "present"
   }
   ```
2. Refresh analytics dashboard
3. Formula: `(Present / Total) × 100%`

### Issue 4: Student Progress Not Displaying Names
**Symptoms:** Shows "Unknown Student" instead of names

**Solutions:**
1. Check `GET /api/auth/users` endpoint returns user data
2. Verify JWT token has proper permissions
3. Ensure `userId` matches between enrollments and users

### Issue 5: Modal Not Opening
**Symptoms:** Clicking lesson row does nothing

**Solutions:**
1. Check browser console for JavaScript errors
2. Verify `showLessonDetails()` function exists
3. Check if performance data loaded successfully

---

## Success Criteria ✅

### Time Tracking
- [x] Video play/pause events trigger tracking
- [x] Console logs show time accumulation
- [x] Backend receives incremental updates
- [x] Page unload sends final time
- [x] Time accumulates across multiple sessions

### Analytics Dashboard
- [x] Overview stats populate correctly
- [x] Digital Attendance Rate displays
- [x] Lesson performance table renders
- [x] Clicking lesson opens modal with details
- [x] Student progress cards show all 5 metrics
- [x] Time Spent shows in minutes
- [x] Lesson filter updates student list
- [x] Engagement insights populate

### Backend Integration
- [x] `PATCH /enrollments/:id/progress` accepts `timeSpentSeconds`
- [x] Time accumulates correctly in database
- [x] Analytics APIs return proper data
- [x] Role-based filtering works (instructors see only their data)

---

## Performance Benchmarks ⚡

### Expected Load Times
- Dashboard overview: < 1 second
- Lesson performance table (10 lessons): < 2 seconds
- Student progress (50 students): < 3 seconds
- Modal details: < 500ms

### API Response Times
- `GET /analytics/dashboard`: < 500ms
- `GET /analytics/lesson/:id`: < 300ms
- `PATCH /enrollments/:id/progress`: < 200ms

---

## Next Steps After Testing 🎯

1. **Gather Feedback:**
   - Share with instructors
   - Collect usability feedback
   - Note any performance issues

2. **Monitor in Production:**
   - Watch for errors in logs
   - Check time tracking accuracy
   - Verify email delivery (deadline warnings)

3. **Plan Enhancements:**
   - Add graphical charts
   - Implement export functionality
   - Create scheduled email reports

---

## Quick Command Reference 📋

### Start Backend
```bash
cd backend
npm start
```

### Check Backend Logs
```bash
tail -f backend/server.log
```

### Manual Deadline Check (Testing)
Uncomment in `backend/deadlineService.js`:
```javascript
function startDeadlineService() {
  cron.schedule('0 0 * * *', checkDeadlines);
  checkDeadlines(); // ✨ Add this line
}
```

### Check Database State
```javascript
// In Node.js REPL or test script
const { getEnrollment } = require('./backend/db');
getEnrollment('enrollment_id').then(console.log);
```

### Clear Browser Storage (Reset)
```javascript
// In browser console
localStorage.clear();
location.reload();
```

---

**Testing Date:** December 5, 2025
**Version:** 1.0.0
**Status:** ✅ Ready for Testing

Happy Testing! 🎉
