# Quick Testing Guide - Student Lesson Flow

## 🚀 Quick Start Testing

### Step 1: Start the Server
```bash
cd backend
node server.js
```
Server should show:
```
✓ Server listening on port 3002
✓ Lesson API available at http://localhost:3002/api/lessons
```

### Step 2: Create Test Accounts (if needed)
You need:
- 1 Instructor account
- 1 Student account

### Step 3: Test Instructor Flow
1. Open `http://localhost:3002/login.html` (or open index.html)
2. Login as instructor
3. Click "Lessons" in the hub
4. Create a new lesson:
   - Title: "Test Video Lesson"
   - Description: "Testing the complete flow"
   - Select a video file (MP4)
   - Add quiz questions (optional)
   - Click "Create Lesson"
5. Verify success message
6. Logout

### Step 4: Test Student Flow - NEW LESSON
1. Login as student
2. You should see "Available Lessons" section
3. Find "Test Video Lesson" 
4. Click **"Enroll Now"** button
5. ✅ EXPECTED: Dashboard briefly refreshes showing the lesson in "My Enrolled Lessons"
6. ✅ EXPECTED: Redirect to lesson player after ~500ms
7. ✅ EXPECTED: URL looks like: `lesson-player.html?id=123&enrollmentId=456`
8. ✅ EXPECTED: Video loads and plays
9. Watch video for a few seconds
10. Check browser console for progress updates
11. Return to dashboard (use browser back or navigation)

### Step 5: Test Student Flow - WATCHING AGAIN
1. On dashboard, find lesson in "My Enrolled Lessons" section
2. Click **"Watch Now →"** button
3. ✅ EXPECTED: Direct redirect to lesson player (no enrollment step)
4. ✅ EXPECTED: Video plays immediately
5. ✅ EXPECTED: Progress indicator shows current progress

---

## 🔍 What to Check

### ✅ Enrollment Button Works
- [ ] "Enroll Now" button appears on available lessons
- [ ] Button has purple background (#6F00FF)
- [ ] Clicking button shows success message
- [ ] Dashboard refreshes briefly before redirect

### ✅ Redirect URL is Correct
- [ ] URL contains `?id=` parameter with lesson ID
- [ ] URL contains `&enrollmentId=` parameter with enrollment ID
- [ ] Both IDs are numeric/alphanumeric strings (not undefined)

### ✅ Video Playback Works
- [ ] Video player element loads
- [ ] Video controls appear
- [ ] Video plays when play button clicked
- [ ] No error messages about "Video Not Found"

### ✅ Progress Tracking Works
Open browser console (F12), watch video, and check for:
```
Progress milestone reached: 25%
Progress updated to 25%: {ok: true, enrollment: {...}}
```

### ✅ Enrolled Lessons Display
- [ ] Lesson appears in "My Enrolled Lessons" after enrollment
- [ ] Progress percentage shows (initially 0%)
- [ ] "Watch Now →" button appears
- [ ] Clicking "Watch Now" loads lesson player

### ✅ Stats Update
Check "Quick Stats" section:
- [ ] Enrolled: Shows correct count
- [ ] Completed: Updates when progress = 100%
- [ ] Completion Rate: Calculates correctly (completed/enrolled * 100)

---

## 🐛 Troubleshooting

### Problem: "No lesson ID provided" error
**Check:**
```javascript
// Open browser console on lesson-player.html
// Type:
new URLSearchParams(window.location.search).get('id')
// Should show lesson ID, not null
```

**Fix:** Make sure dashboard link uses `?id=` not `?lessonId=`

### Problem: Video doesn't play
**Check:**
```bash
# In terminal, verify video file exists
ls -la backend/uploads/

# Test direct access
curl -I http://localhost:3002/uploads/[filename].mp4
# Should return HTTP 200 OK
```

**Check database:**
```bash
cd backend
node test-check-lessons.js
# Should show videoUrl: /uploads/[filename].mp4
```

### Problem: Enrollment doesn't show
**Check browser console:**
```javascript
// After clicking "Enroll Now", check network tab
// Look for POST request to /api/enrollments
// Should return 201 with enrollment object containing id
```

**Check response structure:**
```json
{
  "ok": true,
  "enrollment": {
    "id": "17644...",  // ← This is critical!
    "lessonId": "...",
    "userId": "...",
    "progress": 0
  }
}
```

### Problem: Progress doesn't track
**Check console during video playback:**
```javascript
// Should see logs every time you cross 25%, 50%, 75%, 100%
// If no logs appear, video timeupdate event isn't firing
```

**Check currentEnrollmentId:**
```javascript
// In browser console on lesson-player.html
currentEnrollmentId
// Should show enrollment ID, not null
```

---

## 📝 Expected Console Output

### On Enrollment:
```
Enrollment successful
Dashboard refreshed
Redirecting to lesson-player.html?id=123&enrollmentId=456
```

### On Video Playback:
```
Video loaded successfully
Progress milestone reached: 25%
Progress updated to 25%: {ok: true, enrollment: {...}}
Progress milestone reached: 50%
Progress updated to 50%: {ok: true, enrollment: {...}}
...
```

### On Return to Dashboard:
```
Loaded 15 lessons
Loaded 1 enrollments
Rendered 1 enrolled lessons
Rendered 14 available lessons
Stats updated: Enrolled: 1, Completed: 0, Rate: 0%
```

---

## 🎯 Success Criteria

All of these should work:
✅ Click "Enroll Now" → Redirects to lesson player with video playing
✅ Click "Watch Now" on enrolled lesson → Video plays immediately
✅ Video progress tracks at 25%, 50%, 75%, 100%
✅ Stats show correct enrollment and completion counts
✅ Returning to dashboard shows lesson in "My Enrolled Lessons"
✅ No "No lesson ID provided" errors
✅ No "Video Not Found" errors
✅ Quiz appears after video (if quiz exists)

---

## 🆘 Still Having Issues?

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+Shift+R)
3. **Check browser console** for JavaScript errors
4. **Check network tab** for failed API requests
5. **Verify server is running** on port 3002
6. **Check server logs**: `tail -f backend/server.log`

If still broken, check:
- `backend/storage/` directory exists and has files
- No port conflicts (3002 is available)
- No CORS errors in console
- Token is valid: `localStorage.getItem('token')`
- User ID is set: `localStorage.getItem('userId')`

---

**Last Updated:** November 29, 2025
**All fixes verified and tested!** ✅
