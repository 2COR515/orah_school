# 🔧 Student Name Resolution - Debugging Guide

## Issue
Table shows "No Name" instead of actual student names in Student Progress Tracking

## Root Cause
The `fetchUserMap()` function is returning an empty map or the enrollment.userId doesn't match any user.userId in the database.

---

## 🧪 How to Diagnose

### Step 1: Open Browser DevTools
1. Open instructor-analytics.html
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Scroll to "Student Progress Tracking" section

### Step 2: Check Console Logs

Look for these log messages:

```javascript
📋 API Response: { totalUsers: X, sampleUser: {...} }
✓ Loaded X users into lookup map
🗂️ User Map Keys: ['S101', 'S102', ...]

🔍 Rendering progress for enrollments: { 
  totalEnrollments: Y,
  sampleEnrollment: {...},
  userMapSize: Z
}

📌 Enrollment S101: { found: true, name: 'John Doe', mapHas: true }
```

### Step 3: Identify the Problem

**If you see:**

❌ `✓ Loaded 0 users into lookup map`
   → Users API is returning empty array
   
❌ `📋 API Response: Error`
   → API call is failing
   
❌ `found: false` for enrollments
   → Enrollment userId doesn't match any user in database

---

## 🔍 How to Fix

### Problem 1: Empty Users Array from API

**Check:** Do students exist in your users database?

```bash
# In backend terminal, check db.js:
# Look for users array - should have entries like:
{
  userId: 'S101',
  name: 'John Smith',
  email: 's101@example.com',
  ...
}
```

**Solution:**
1. Verify users were created during signup
2. Check backend/db.js has student records
3. Make sure the user role is 'student'

---

### Problem 2: Enrollment userId Doesn't Match User userId

**Check:** Do the IDs match between enrollments and users tables?

```bash
# Example:
Users table:        { userId: 'S101', name: 'John Doe' }
Enrollments table:  { userId: 'Student101', ... }  ← Mismatch!
```

**Solution:**
1. Check backend/db.js for both tables
2. Verify userId format is consistent
3. Make sure when creating enrollment, you use correct userId from users table

---

### Problem 3: API Call is Failing

**Check:** Are you authenticated?

```bash
# In browser console:
localStorage.getItem('token')
# Should return a JWT token (not null)

localStorage.getItem('userId')
# Should return instructor ID
```

**Solution:**
1. Login again as instructor
2. Verify token is in localStorage
3. Check backend/src/routes/userRoutes.js has GET /users endpoint

---

## 🛠️ Step-by-Step Fix

### Fix 1: Verify Database Has Users

**File:** `backend/db.js`

Check the users array:
```javascript
const users = [
  {
    userId: 'S101',
    name: 'John Smith',           // ← Must have name
    email: 's101@example.com',
    role: 'student'               // ← Must be 'student'
  },
  {
    userId: 'S102',
    firstName: 'Jane',            // ← Or firstName + lastName
    lastName: 'Doe',
    email: 's102@example.com',
    role: 'student'
  }
];
```

**If missing:** Add student users to the database.

---

### Fix 2: Verify Enrollment userId Matches

**File:** `backend/db.js`

Check the enrollments array:
```javascript
const enrollments = [
  {
    id: 'E001',
    userId: 'S101',               // ← Must match a user in users array
    lessonId: 'L001',
    progress: 100,
    status: 'active',
    enrolledAt: '2026-01-10'
  }
];
```

**Make sure:**
- Every `enrollment.userId` exists in `users.userId`
- No typos or ID format mismatches

---

### Fix 3: Verify Users API Endpoint Works

**File:** `backend/src/routes/userRoutes.js`

Should have:
```javascript
router.get('/users', (req, res) => {
  // Get all users from database
  const users = db.read().users || [];
  res.json({ users });
});
```

**To test:**
```bash
# In browser console:
fetch('http://localhost:3002/api/users', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(r => r.json()).then(d => console.log(d))
```

Should return: `{ users: [...] }`

---

### Fix 4: Check Token Exists and Is Valid

**File:** `scripts/instructor-analytics.js` (already added debugging)

```javascript
const token = localStorage.getItem('token');
console.log('Token:', token ? 'EXISTS ✅' : 'MISSING ❌');
```

**If missing:**
1. Go to login.html
2. Login as instructor (I101)
3. Token will be stored in localStorage

---

## 📊 Verification Checklist

- [ ] Backend database has student users (users array)
- [ ] Student userId matches enrollment userId
- [ ] Token exists in localStorage
- [ ] Users API endpoint returns users
- [ ] Console shows "Loaded X users into lookup map" (X > 0)
- [ ] Console shows names in "📌 Enrollment" logs (found: true)
- [ ] Table displays actual names instead of "No Name"

---

## 🎯 Quick Fixes (Most Likely Solutions)

### If showing "No Name":

1. **Check database has users:**
   ```bash
   # backend/db.js - verify users array exists
   # Should have at least: 
   { userId: 'S101', name: 'John Doe', role: 'student' }
   ```

2. **Verify enrollment has userId:**
   ```bash
   # backend/db.js - check enrollments array
   # Should have: { userId: 'S101', ... }
   ```

3. **Hard refresh page:**
   ```bash
   Ctrl+F5  (Windows/Linux)
   Cmd+Shift+R  (Mac)
   ```

4. **Check console logs for errors:**
   ```bash
   F12 → Console tab
   Look for red error messages
   ```

---

## 📝 Example Working Setup

**Database (backend/db.js):**
```javascript
const users = [
  { userId: 'I101', name: 'Alice Instructor', role: 'instructor' },
  { userId: 'S101', name: 'Bob Student', role: 'student' },
  { userId: 'S102', name: 'Carol Student', role: 'student' }
];

const lessons = [
  { id: 'L101', title: 'Math 101', instructorId: 'I101' }
];

const enrollments = [
  { id: 'E001', userId: 'S101', lessonId: 'L101', progress: 100 },
  { id: 'E002', userId: 'S102', lessonId: 'L101', progress: 50 }
];
```

**Expected Console Output:**
```
📋 API Response: { totalUsers: 3, sampleUser: {userId: 'I101', ...} }
✓ Loaded 3 users into lookup map
🗂️ User Map Keys: ['I101', 'S101', 'S102']

🔍 Rendering progress for enrollments: {
  totalEnrollments: 2,
  userMapSize: 3
}

📌 Enrollment S101: { found: true, name: 'Bob Student', mapHas: true }
📌 Enrollment S102: { found: true, name: 'Carol Student', mapHas: true }
```

**Expected Table Output:**
```
| Student Name    | Status    | Date       |
|-----------------|-----------|------------|
| Bob Student     | ✓ Compl.. | 1/13/2026  |
| Carol Student   | ⧗ In Prog | 1/13/2026  |
```

---

## 🆘 If Still Not Working

1. **Post the console output** of these logs:
   - `📋 API Response:`
   - `✓ Loaded X users`
   - `🗂️ User Map Keys:`

2. **Check backend/db.js** - show me:
   - First 3 users from users array
   - First 3 enrollments from enrollments array

3. **Verify:**
   - Are you logged in as instructor?
   - Is backend server running (`npm start`)?
   - Is token visible in localStorage?

---

## 📞 Support

The debugging logs are now in place. When you reload the page, you'll see detailed information in the browser console explaining exactly why names aren't resolving. Share those logs and I can provide a targeted fix!
