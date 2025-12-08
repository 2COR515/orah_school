# 🔐 Token Authentication Fix - December 5, 2025

## Problem Identified

**Error**: `403 Forbidden - Invalid or expired token`

**Root Cause**: The authentication token in localStorage is either:
1. **Expired** (tokens expire after 24 hours)
2. **Invalid format**
3. **Missing** from localStorage

The student dashboard was making API requests to `/api/enrollments/user/S101` with an expired/invalid token, causing the server to reject the request with a 403 error.

---

## ✅ Changes Applied

### 1. Enhanced Token Validation (`student-dashboard.html`)

Added comprehensive token checking on page load:
- ✅ Verifies token exists
- ✅ Decodes JWT payload
- ✅ Checks expiration time
- ✅ Shows time remaining
- ✅ Auto-redirects to login if expired
- ✅ Warns if token expires soon (< 5 minutes)

### 2. Better Error Handling (`scripts/student-dashboard.js`)

Enhanced API error detection:
- ✅ Checks for 403 Forbidden errors
- ✅ Checks for 401 Unauthorized errors
- ✅ Logs detailed error information
- ✅ Auto-redirects to login on auth failure
- ✅ Clears localStorage on auth errors

### 3. Quick Login Tool (`quick-login.html`)

Created a convenient login page for testing:
- ✅ Pre-filled student credentials
- ✅ Shows current token and expiration
- ✅ One-click login
- ✅ Quick role switching (Student/Instructor)
- ✅ Auto-redirects to appropriate dashboard

---

## 🧪 How to Fix Your Issue

### Option 1: Use Quick Login (Fastest)

1. **Open the quick login page**:
   ```bash
   xdg-open /home/trevor/Documents/PROJECT/Orah-school/quick-login.html
   ```

2. **Click "Login & Get Token"** (credentials are pre-filled)
   - Email: `student@test.com`
   - Password: `student123`

3. **Wait for redirect** to student dashboard (automatic after 2 seconds)

### Option 2: Use Main Login Page

1. **Open login page**:
   ```bash
   xdg-open /home/trevor/Documents/PROJECT/Orah-school/login.html
   ```

2. **Enter credentials**:
   - Email: `student@test.com`
   - Password: `student123`

3. **Click Login**

### Option 3: Manual Token Check (Advanced)

1. **Open student dashboard**
2. **Press F12** to open DevTools
3. **Go to Console tab**
4. **Look for token validation messages**:
   ```
   🔐 Checking authentication...
   Token exists: true
   User ID: S101
   Role: student
   Token payload: {...}
   Token expires: Dec 5, 2025, 5:30 PM
   Time left: 45 minutes
   ✅ Token is valid
   ```

If you see:
```
❌ Token expired - redirecting to login
```

Then you need to log in again!

---

## 🔍 What the Console Shows Now

### On Page Load:
```
🔐 Checking authentication...
Token exists: true
User ID: S101
Role: student
Token payload: {id: "...", role: "student", iat: ..., exp: ...}
Token expires: Dec 5, 2025, 5:30 PM
Time left: 45 minutes
✅ Token is valid
```

### If Token Expired:
```
🔐 Checking authentication...
Token exists: true
User ID: S101
Role: student
Token payload: {...}
Token expires: Dec 5, 2025, 3:00 PM
Time left: -30 minutes
❌ Token expired - redirecting to login
```

### On Dashboard Load:
```
🔄 Loading dashboard data...
🔑 Using token: eyJhbGciOiJIUzI1NiI...
👤 Fetching data for user: S101
```

### If Auth Fails:
```
❌ Authentication failed (403 Forbidden)
Error details: {ok: false, error: "Invalid or expired token"}
```

---

## 📊 Token Lifecycle

```
Login
  ↓
Token Generated (24 hour validity)
  ↓
Token Stored in localStorage
  ↓
[23 hours, 55 minutes pass]
  ↓
⚠️ Warning: Token expires soon (< 5 minutes)
  ↓
[5 minutes pass]
  ↓
❌ Token Expired
  ↓
Auto-redirect to Login
```

---

## 🔧 Files Modified

1. ✅ `/student-dashboard.html`
   - Added token validation on page load
   - Decodes JWT and checks expiration
   - Auto-redirects if expired

2. ✅ `/scripts/student-dashboard.js`
   - Enhanced error handling for 403/401
   - Better logging for debugging
   - Auto-redirect on auth failure

3. ✅ `/quick-login.html` (NEW)
   - Fast login for testing
   - Shows current token status
   - Quick role switching

---

## 🎯 Testing Steps

### Step 1: Check Current Token
1. Open DevTools Console (F12)
2. Type: `localStorage.getItem('token')`
3. If `null` → You need to login
4. If you see a long string → Decode it:
   ```javascript
   const token = localStorage.getItem('token');
   const payload = JSON.parse(atob(token.split('.')[1]));
   const exp = new Date(payload.exp * 1000);
   console.log('Expires:', exp);
   console.log('Expired?', exp < new Date());
   ```

### Step 2: Get Fresh Token
- Use `quick-login.html` for fastest method
- OR use regular `login.html`

### Step 3: Verify Dashboard Works
1. Open `student-dashboard.html`
2. Check console for:
   ```
   ✅ Token is valid
   🔄 Loading dashboard data...
   ```
3. Should see your enrolled lessons and stats

---

## 🆘 Troubleshooting

### Issue: "Invalid or expired token"
**Solution**: Login again using `quick-login.html`

### Issue: Console shows "Token expired"
**Solution**: The page should auto-redirect to login. If not, manually open `login.html`

### Issue: Dashboard redirects to login immediately
**Solution**: This is expected behavior if token is invalid. Just login again.

### Issue: Still getting 403 errors after fresh login
**Possible causes**:
1. Server not running → Check backend terminal
2. Wrong user ID → Check `localStorage.getItem('userId')`
3. API endpoint issue → Check backend logs

### Issue: Token expires too quickly during development
**Solution** (for development only):
Edit `backend/config.js` and increase `JWT_EXPIRY`:
```javascript
module.exports = {
  JWT_EXPIRY: '7d', // 7 days instead of 24h
  // ...
};
```

---

## 🎉 Success Criteria

✅ No "Invalid or expired token" errors
✅ Dashboard loads without redirecting to login
✅ Can see enrolled lessons
✅ Stats display correctly
✅ Chatbot works
✅ Console shows "✅ Token is valid"

---

## 📝 Testing Credentials

**Student**:
- Email: `student@test.com`
- Password: `student123`

**Instructor**:
- Email: `instructor@test.com`
- Password: `instructor123`

**Admin**:
- Email: `admin@test.com`
- Password: `admin123`

---

## 🔑 Quick Console Commands

**Check if logged in**:
```javascript
!!localStorage.getItem('token')
```

**Check token expiration**:
```javascript
const token = localStorage.getItem('token');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const exp = new Date(payload.exp * 1000);
  console.log('Expires:', exp.toLocaleString());
  console.log('Time left:', Math.floor((exp - Date.now()) / 60000), 'minutes');
}
```

**Clear auth and restart**:
```javascript
localStorage.clear();
window.location.href = 'login.html';
```

---

**Status**: ✅ Ready to Test
**Next Step**: Open `quick-login.html` and get a fresh token!
