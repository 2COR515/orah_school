# 🧪 Complete Testing Guide - Reminder Frequency System

## Quick Test Overview

This guide helps you verify that both Phase 1 (Backend) and Phase 2 (Frontend) are working correctly.

---

## Pre-Test Setup ✅

### 1. Verify Packages Installed
```bash
cd backend
npm list nodemailer dotenv
```

**Expected Output:**
```
nodemailer@6.9.14
dotenv@17.2.3
```

### 2. Check Environment Variables
```bash
cd backend
cat .env.example
```

**Create `.env` file if needed:**
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

### 3. Start Server
```bash
cd backend
node server.js
```

**Expected Output:**
```
✅ Reminder scheduler started successfully!
⏰ Schedule: Every day at 9:00 AM
✓ Server listening on port 3002
```

---

## Phase 1 Tests: Backend & Email System

### Test 1: Frequency Logic ✅

```bash
cd backend
node test-reminder-frequency.js
```

**Expected Output:**
```
═══════════════════════════════════════════════════════════
🧪 Testing Reminder Frequency System
═══════════════════════════════════════════════════════════

📅 Test 1: shouldSendReminder() function
Current day: [Today's Day]
-----------------------------------------------------------
daily           → ✅ SEND
weekly          → [✅/❌ based on if Monday]
twice-weekly    → [✅/❌ based on if Mon/Thu]

📧 Test 2: Email Configuration Check
-----------------------------------------------------------
EMAIL_USER: [✅/❌]
EMAIL_PASS: [✅/❌]

🔧 Test 3: Function Availability Check
-----------------------------------------------------------
shouldSendReminder: ✅
processReminders: ✅
runRemindersNow: ✅

📊 Test 4: Weekly Schedule Matrix
-----------------------------------------------------------
Frequency      | Sun | Mon | Tue | Wed | Thu | Fri | Sat
---------------|-----+-----+-----+-----+-----+-----+-----+
daily          |  ✅  |  ✅  |  ✅  |  ✅  |  ✅  |  ✅  |  ✅ 
weekly         |  ❌  |  ✅  |  ❌  |  ❌  |  ❌  |  ❌  |  ❌ 
twice-weekly   |  ❌  |  ✅  |  ❌  |  ❌  |  ✅  |  ❌  |  ❌ 

✅ Reminder frequency system tests complete!
```

**Status:** ✅ PASS if all functions show ✅

---

### Test 2: Manual Reminder Trigger ✅

```bash
cd backend
node -e "require('./reminderService').runRemindersNow()"
```

**Expected Output:**
```
🧪 Running reminders manually (test mode)...

🔔 Running reminder scheduler...
⏰ Time: [Current Time]
📅 Day: [Current Day]
👥 Total users: [Number]
📊 Total enrollments: [Number]

📧 Processing user: [email] (frequency: [frequency])
   [Processing details...]

════════════════════════════════════════════════════════════
📨 Reminders sent: [Number]
⏭️  Reminders skipped (frequency): [Number]
✅ Reminder processing complete.
════════════════════════════════════════════════════════════
```

**Status:** ✅ PASS if no errors

---

### Test 3: Server Endpoints ✅

```bash
# Test health check
curl http://localhost:3002/health

# Expected: {"status":"ok"}
```

**Status:** ✅ PASS if returns JSON

---

## Phase 2 Tests: Frontend Integration

### Test 4: UI Display ✅

1. Open browser: `http://localhost:3002/student-dashboard.html`
2. Login with student credentials
3. Scroll down to find "📧 Reminder Preferences" card

**Checklist:**
- [ ] Card is visible
- [ ] Heading shows "📧 Reminder Preferences"
- [ ] Description text is readable
- [ ] Dropdown shows 4 options
- [ ] "Save Preferences" button exists
- [ ] Styling matches dashboard design

**Status:** ✅ PASS if all visible

---

### Test 5: Load Current Setting ✅

1. Open browser console (F12)
2. Refresh the student dashboard
3. Look for console logs

**Expected Console Output:**
```
🎛️ Initializing reminder preferences...
📧 Loading reminder preference...
✅ Current reminder frequency: weekly
✅ Save button listener attached
```

**Checklist:**
- [ ] No console errors
- [ ] Frequency is loaded
- [ ] Dropdown shows loaded value

**Status:** ✅ PASS if logs appear and no errors

---

### Test 6: Change and Save Setting ✅

1. Select different frequency from dropdown (e.g., "Daily")
2. Click "Save Preferences" button
3. Watch for:
   - Button text changes to "Saving..."
   - Button becomes disabled
   - Success message appears
   - Button returns to "Save Preferences"

**Expected Console Output:**
```
💾 Saving reminder preference...
✅ Reminder frequency updated to: daily
```

**Expected UI:**
```
✅ Preferences saved successfully!
```

**Checklist:**
- [ ] Button shows loading state
- [ ] Success message displays
- [ ] Console logs show update
- [ ] No errors in console

**Status:** ✅ PASS if save completes successfully

---

### Test 7: Verify Persistence ✅

1. After saving in Test 6, **refresh the page** (F5)
2. Check the dropdown value

**Expected:**
- Dropdown should show the value you just saved
- Console should log: `✅ Current reminder frequency: daily`

**Checklist:**
- [ ] Dropdown shows saved value
- [ ] No need to save again
- [ ] Console confirms loaded value

**Status:** ✅ PASS if value persists

---

### Test 8: API Endpoint Tests ✅

Open DevTools (F12) → Network tab

#### Test GET /api/auth/profile

1. Refresh student dashboard
2. Find request to `/api/auth/profile`
3. Check:
   - Method: GET
   - Status: 200 OK
   - Response includes `reminderFrequency`

**Expected Response:**
```json
{
  "ok": true,
  "user": {
    "userId": "...",
    "email": "...",
    "reminderFrequency": "weekly"
  }
}
```

#### Test PATCH /api/auth/profile

1. Change frequency and save
2. Find request to `/api/auth/profile`
3. Check:
   - Method: PATCH
   - Status: 200 OK
   - Request body contains `reminderFrequency`
   - Response confirms update

**Expected Request Body:**
```json
{
  "reminderFrequency": "daily"
}
```

**Expected Response:**
```json
{
  "ok": true,
  "message": "Profile updated successfully",
  "user": { ... }
}
```

**Checklist:**
- [ ] GET request succeeds (200)
- [ ] PATCH request succeeds (200)
- [ ] Authorization header present
- [ ] Response data is correct

**Status:** ✅ PASS if both endpoints work

---

### Test 9: Error Handling ✅

#### Test A: Unauthenticated Request

1. Open DevTools Console
2. Clear localStorage: `localStorage.clear()`
3. Try to save preferences

**Expected:**
- Error message: "Please log in to save preferences"

#### Test B: Invalid Frequency (Manual Test)

Open console and run:
```javascript
fetch('http://localhost:3002/api/auth/profile', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ reminderFrequency: 'invalid' })
})
.then(r => r.json())
.then(console.log);
```

**Expected Response:**
```json
{
  "ok": false,
  "error": "Invalid reminder frequency. Must be: daily, weekly, twice-weekly, or never"
}
```

**Checklist:**
- [ ] Auth error handled gracefully
- [ ] Invalid input rejected
- [ ] Error messages clear

**Status:** ✅ PASS if errors handled properly

---

### Test 10: All Frequency Options ✅

Test each frequency option:

1. **Daily**
   - Select "Daily - Every day"
   - Save
   - Verify success message
   - Check console: `✅ Reminder frequency updated to: daily`

2. **Twice Weekly**
   - Select "Twice Weekly - Monday & Thursday"
   - Save
   - Verify success

3. **Weekly**
   - Select "Weekly - Monday only"
   - Save
   - Verify success

4. **Never**
   - Select "Never - No reminders"
   - Save
   - Verify success

**Checklist:**
- [ ] All 4 options work
- [ ] Each saves successfully
- [ ] Persistence works for each
- [ ] No console errors

**Status:** ✅ PASS if all 4 work

---

## Integration Tests

### Test 11: End-to-End Flow ✅

Complete user journey:

1. ✅ Login as student
2. ✅ Dashboard loads
3. ✅ Reminder settings card visible
4. ✅ Current setting loads automatically
5. ✅ Change frequency
6. ✅ Click save
7. ✅ See success message
8. ✅ Refresh page
9. ✅ Setting still shows new value
10. ✅ Logout
11. ✅ Login again
12. ✅ Setting persists

**Status:** ✅ PASS if entire flow works

---

### Test 12: Database Verification ✅

Check that settings are actually saved:

```bash
cd backend
node -e "
const storage = require('node-persist');
(async () => {
  await storage.init({ dir: './storage' });
  const users = await storage.getItem('users');
  console.log('Users with reminder settings:');
  users.forEach(u => {
    if (u.role === 'student') {
      console.log(\`  \${u.email}: \${u.reminderFrequency || 'weekly'}\`);
    }
  });
})();
"
```

**Expected Output:**
```
Users with reminder settings:
  student1@test.com: daily
  student2@test.com: weekly
  student3@test.com: never
```

**Status:** ✅ PASS if frequencies are stored

---

## Performance Tests

### Test 13: Load Time ✅

1. Open DevTools → Network tab
2. Reload student dashboard
3. Check timing for `/api/auth/profile`

**Expected:**
- Load time: < 100ms
- No errors
- Single request (no retries)

**Status:** ✅ PASS if < 200ms

---

### Test 14: Save Time ✅

1. Open DevTools → Network tab
2. Change frequency and save
3. Check timing for PATCH request

**Expected:**
- Save time: < 200ms
- Response immediate
- UI updates instantly

**Status:** ✅ PASS if < 500ms

---

## Mobile Responsiveness Tests

### Test 15: Mobile View ✅

1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone or Android device
4. Check reminder settings card

**Checklist:**
- [ ] Card is readable
- [ ] Dropdown is usable
- [ ] Button is tappable
- [ ] Text is not truncated
- [ ] Spacing is appropriate

**Status:** ✅ PASS if usable on mobile

---

## Security Tests

### Test 16: Authorization ✅

Try accessing without token:

```bash
curl -X GET http://localhost:3002/api/auth/profile
```

**Expected:**
```json
{
  "error": "Access denied. No token provided."
}
```

**Status:** ✅ PASS if 401 or 403

---

### Test 17: Token Validation ✅

Try with invalid token:

```bash
curl -X GET http://localhost:3002/api/auth/profile \
  -H "Authorization: Bearer invalid-token-here"
```

**Expected:**
```json
{
  "error": "Invalid or expired token"
}
```

**Status:** ✅ PASS if rejected

---

## Final Checklist

### Phase 1 (Backend)
- [ ] Nodemailer installed
- [ ] dotenv installed
- [ ] Environment variables configured
- [ ] Server starts without errors
- [ ] Scheduler initializes
- [ ] Frequency tests pass
- [ ] Manual trigger works
- [ ] Console logs are clear

### Phase 2 (Frontend)
- [ ] UI card displays correctly
- [ ] Dropdown populated
- [ ] Save button functional
- [ ] Settings load on page load
- [ ] Settings save successfully
- [ ] Changes persist after refresh
- [ ] Success messages appear
- [ ] Error handling works
- [ ] Mobile responsive
- [ ] No console errors

### Integration
- [ ] API endpoints respond
- [ ] Authentication works
- [ ] Database saves correctly
- [ ] End-to-end flow complete
- [ ] All 4 frequencies work
- [ ] Performance acceptable
- [ ] Security in place

---

## Test Results Template

```
===========================================
REMINDER FREQUENCY SYSTEM - TEST RESULTS
===========================================

Date: _______________
Tester: _______________

PHASE 1 TESTS:
[ ] Test 1: Frequency Logic
[ ] Test 2: Manual Trigger
[ ] Test 3: Server Endpoints

PHASE 2 TESTS:
[ ] Test 4: UI Display
[ ] Test 5: Load Setting
[ ] Test 6: Save Setting
[ ] Test 7: Persistence
[ ] Test 8: API Endpoints
[ ] Test 9: Error Handling
[ ] Test 10: All Frequencies

INTEGRATION TESTS:
[ ] Test 11: End-to-End Flow
[ ] Test 12: Database Verification

PERFORMANCE TESTS:
[ ] Test 13: Load Time
[ ] Test 14: Save Time

ADDITIONAL TESTS:
[ ] Test 15: Mobile Responsive
[ ] Test 16: Authorization
[ ] Test 17: Token Validation

OVERALL STATUS: [✅ PASS / ❌ FAIL]

NOTES:
_________________________________________
_________________________________________
_________________________________________
```

---

## Troubleshooting Failed Tests

### If Test 1 Fails (Frequency Logic)
- Check `backend/reminderService.js` for syntax errors
- Verify `shouldSendReminder()` function exists
- Run `npm install` again

### If Test 4 Fails (UI Display)
- Check `student-dashboard.html` has reminder settings card
- Verify CSS file is loaded
- Clear browser cache

### If Test 5 Fails (Load Setting)
- Check token exists in localStorage
- Verify `/api/auth/profile` endpoint works
- Check console for errors

### If Test 6 Fails (Save Setting)
- Verify PATCH endpoint exists
- Check token is valid
- Look for CORS errors

### If Test 7 Fails (Persistence)
- Check database is saving
- Verify storage directory exists
- Test with `node -e` command in Test 12

---

## Success Criteria

**✅ ALL TESTS MUST PASS**

Minimum requirements:
- ✅ 15+ tests passing
- ✅ No console errors
- ✅ API returns 200 OK
- ✅ Settings persist
- ✅ All frequencies work
- ✅ Mobile usable

**If all tests pass → System is production ready! 🎉**

---

## Quick Smoke Test (2 minutes)

Just need a quick check? Run this:

```bash
# 1. Start server
cd backend && node server.js &

# 2. Wait 3 seconds
sleep 3

# 3. Test frequency logic
node test-reminder-frequency.js

# 4. Open browser
# http://localhost:3002/student-dashboard.html

# 5. Change reminder setting and save

# 6. Refresh page - verify it persists
```

If all 6 steps work → ✅ System OK!

---

**Happy Testing! 🧪**
