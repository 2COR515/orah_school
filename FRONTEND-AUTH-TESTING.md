# Frontend Authentication Testing Guide

## Prerequisites
- Backend server running on `http://localhost:3001`
- Backend JWT authentication system active (Phase 1 & 2 complete)
- Database initialized with lowdb

## Test Scenarios

### 1. Student Registration & Login Flow

**Step 1: Register Student**
1. Navigate to `signup.html`
2. Fill in form:
   - Name: "Test Student"
   - Email: "student@test.com"
   - Password: "password123"
   - Confirm: "password123"
3. Click "Sign Up"
4. ✅ Should see: "Account created successfully! Redirecting to login..."
5. ✅ Should redirect to `login.html` after 1.5 seconds

**Step 2: Login as Student**
1. On `login.html`, enter:
   - Email: "student@test.com"
   - Password: "password123"
2. Click "Log In"
3. ✅ Should see: "Login successful! Redirecting..."
4. ✅ Should redirect to `student-dashboard.html`
5. ✅ Should see student name and email in header
6. ✅ Should see available lessons
7. ✅ Should see "My Lessons" section (empty initially)

**Step 3: Test Protected Pages**
1. Try to access `instructor-dashboard.html`
2. ✅ Should be immediately redirected to `login.html`
3. Try to access `upload.html`
4. ✅ Should be immediately redirected to `login.html`

**Step 4: Enroll in Lesson**
1. On student dashboard, click "Enroll Now" on any lesson
2. ✅ Should see: "Successfully enrolled in [lesson name]!"
3. ✅ Dashboard should refresh
4. ✅ Lesson should appear in "My Lessons" section with "Continue" button

**Step 5: View Lesson**
1. Click "Continue" on enrolled lesson
2. ✅ Should navigate to `lesson-player.html`
3. ✅ Should display lesson video/content
4. ✅ Should show lesson title and description
5. Click "Mark as Completed"
6. ✅ Should see: "Lesson marked as completed! 🎉"
7. ✅ Button should change to "Completed ✓" and become disabled

**Step 6: Logout (Manual)**
1. Open browser console
2. Run: `logout()`
3. ✅ Should clear localStorage
4. ✅ Should redirect to `login.html`
5. Try to access `student-dashboard.html`
6. ✅ Should be redirected to `login.html`

---

### 2. Instructor Registration & Login Flow

**Step 1: Register Instructor**
1. Navigate to `instructor-signup.html`
2. Fill in form:
   - Name: "Test Instructor"
   - Email: "instructor@test.com"
   - Password: "password123"
   - Confirm: "password123"
   - Bio: "Experienced teacher"
   - Website: "https://example.com" (optional)
3. Click "Apply to teach"
4. ✅ Should see: "Instructor account created successfully! Redirecting to login..."
5. ✅ Should redirect to `login.html` after 1.5 seconds

**Step 2: Login as Instructor**
1. On `login.html`, enter:
   - Email: "instructor@test.com"
   - Password: "password123"
2. Click "Log In"
3. ✅ Should see: "Login successful! Redirecting..."
4. ✅ Should redirect to `instructor-dashboard.html`
5. ✅ Should see instructor name and email in header

**Step 3: Test Protected Pages**
1. Try to access `student-dashboard.html`
2. ✅ Should be immediately redirected to `login.html`

**Step 4: Upload Lesson**
1. Navigate to `upload.html`
2. ✅ Should have access (instructor role)
3. Fill in form:
   - Title: "Test Lesson"
   - Description: "This is a test lesson"
   - Topic: Select any topic
   - File: Upload a video file (.mp4)
4. Click "Upload Lesson"
5. ✅ Should see: "Uploading lesson..."
6. ✅ Should see: "✓ Lesson uploaded successfully!"
7. ✅ Should redirect to `instructor-dashboard.html` after 2 seconds

**Step 5: View Upload History**
1. On `upload.html`, scroll to upload history section
2. ✅ Should see recently uploaded lesson
3. ✅ Should display: title, topic, file count, timestamp

---

### 3. Error Handling Tests

**Test 1: Invalid Credentials**
1. On `login.html`, enter:
   - Email: "wrong@test.com"
   - Password: "wrongpassword"
2. Click "Log In"
3. ✅ Should see error: "Invalid credentials" or similar
4. ✅ Should NOT redirect
5. ✅ Login button should be re-enabled

**Test 2: Duplicate Email**
1. Try to sign up with existing email
2. ✅ Should see error: "Email already in use" or similar

**Test 3: Password Mismatch**
1. On signup, enter different passwords
2. ✅ Should see: "Passwords do not match"

**Test 4: Short Password**
1. On signup, enter password with < 6 characters
2. ✅ Should see: "Password must be at least 6 characters"

**Test 5: Network Error (Backend Down)**
1. Stop backend server
2. Try to login
3. ✅ Should see: "Network error. Please check your connection and try again."
4. ✅ Should not crash or hang

**Test 6: Token Expiration (Manual)**
1. Login successfully
2. Open browser console
3. Run: `localStorage.setItem('authToken', 'invalid-token')`
4. Try to access any protected page or API
5. ✅ Should trigger 401 error
6. ✅ Should automatically logout
7. ✅ Should redirect to `login.html`

---

### 4. Security Tests

**Test 1: Direct URL Access (Not Logged In)**
1. Clear localStorage: `localStorage.clear()`
2. Try to access these URLs directly:
   - `student-dashboard.html`
   - `instructor-dashboard.html`
   - `upload.html`
   - `lesson-player.html`
3. ✅ All should redirect to `login.html`

**Test 2: Wrong Role Access**
1. Login as student
2. Try to access `instructor-dashboard.html`
3. ✅ Should redirect to `login.html`
4. Try to access `upload.html`
5. ✅ Should redirect to `login.html`

**Test 3: Manual Token Manipulation**
1. Login successfully
2. Open browser console
3. Run: `localStorage.setItem('userRole', 'instructor')`
4. Try to access instructor pages
5. ✅ Backend should still reject (token has correct role)
6. ✅ Should get 403 Forbidden
7. ✅ Should auto-logout

---

### 5. localStorage Verification

**After Successful Login, Check localStorage:**
```javascript
console.log('Token:', localStorage.getItem('authToken'));
console.log('Role:', localStorage.getItem('userRole'));
console.log('User ID:', localStorage.getItem('userId'));
console.log('Email:', localStorage.getItem('userEmail'));
console.log('Name:', localStorage.getItem('userName'));
```

✅ All values should be present and correct

**After Logout, Check localStorage:**
```javascript
console.log('Token:', localStorage.getItem('authToken'));
console.log('Role:', localStorage.getItem('userRole'));
```

✅ All auth-related values should be `null`

---

### 6. API Integration Tests

**Test 1: Authorized Fetch**
1. Login as student
2. Open console
3. Run:
```javascript
authorizedFetch('http://localhost:3001/api/lessons')
  .then(r => r.json())
  .then(data => console.log(data));
```
4. ✅ Should return lessons data
5. ✅ Should NOT trigger logout

**Test 2: Unauthorized Request**
1. Clear token: `localStorage.removeItem('authToken')`
2. Run same fetch
3. ✅ Should throw error
4. ✅ Should redirect to `login.html`

**Test 3: Progress Update**
1. Login as student and enroll in lesson
2. Open lesson player
3. Click "Mark as Completed"
4. ✅ Should send PATCH request with JWT token
5. ✅ Should update progress to 100%
6. ✅ Should display success message

---

## Browser DevTools Inspection

### Network Tab
During API calls, verify:
- ✅ Request headers include: `Authorization: Bearer <token>`
- ✅ Token is not visible in URL or request body
- ✅ 401/403 responses trigger logout

### Application Tab (localStorage)
After login, verify:
- ✅ `authToken` is a long JWT string (3 parts separated by dots)
- ✅ `userRole` matches login type (student/instructor)
- ✅ `userId` is a unique identifier
- ✅ `userEmail` matches login email
- ✅ `userName` matches signup name

### Console Tab
Should NOT see:
- ❌ Uncaught errors
- ❌ Failed promises
- ❌ CORS errors (if backend properly configured)

Should see:
- ✅ "Login submitted" (during login)
- ✅ "Signup submitted" (during signup)
- ✅ Success messages for enrollments/uploads

---

## Automated Testing Commands

### Backend Tests (should already pass)
```bash
cd backend
npm test
```
✅ All 18 tests should pass

### Manual Frontend Flow
1. Start backend: `cd backend && npm start`
2. Open browser to `index.html`
3. Follow test scenarios above
4. Check browser console for errors

---

## Common Issues & Solutions

### Issue: "Authentication required" error immediately after login
**Solution**: Check that `setAuthData()` is being called correctly in `login.js`

### Issue: Redirected to login when role should allow access
**Solution**: Check `localStorage.getItem('userRole')` matches expected value

### Issue: Token expiration too fast
**Solution**: Backend token expiry is set to 24 hours. Check server logs.

### Issue: CORS errors
**Solution**: Ensure backend has CORS middleware enabled for `http://localhost`

### Issue: localStorage not persisting
**Solution**: Check browser privacy settings allow localStorage

### Issue: Upload fails with 401
**Solution**: Verify manual token inclusion in `upload.js` for FormData

---

## Success Criteria

### All Tests Pass
- ✅ Student can register, login, enroll, view lessons
- ✅ Instructor can register, login, upload lessons
- ✅ Role-based access control works correctly
- ✅ Token expiration triggers logout
- ✅ Invalid credentials show error messages
- ✅ All API calls include JWT token
- ✅ No console errors during normal flow

### Security Verified
- ✅ Cannot access protected pages without authentication
- ✅ Cannot access wrong-role pages
- ✅ Token manipulation doesn't bypass backend security
- ✅ Logout clears all sensitive data

---

**Test Status**: Ready for testing
**Last Updated**: January 2025
