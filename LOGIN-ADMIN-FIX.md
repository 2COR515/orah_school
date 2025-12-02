# Login Error Fix - Admin Role Support

## Issue
When logging in with admin credentials from `login.html`, users received the error:
```
Unknown user role. Please contact support.
```

## Root Causes

### 1. Missing Admin Role Handler
The `scripts/login.js` file only handled `student` and `instructor` roles but didn't include logic for the `admin` role.

### 2. localStorage Key Inconsistency  
- **Login was setting**: `localStorage.setItem('userRole', data.user.role)`
- **Dashboard was reading**: `localStorage.getItem('role')`

This mismatch caused the admin dashboard to not recognize the user's role.

## Fixes Applied

### Fix 1: Added Admin Role Redirection
**File**: `scripts/login.js`

```javascript
// Role-based redirection
if (data.user.role === 'student') {
  window.location.href = 'student-dashboard.html';
} else if (data.user.role === 'instructor') {
  window.location.href = 'instructor-hub.html';
} else if (data.user.role === 'admin') {
  window.location.href = 'admin-dashboard.html';  // ✅ ADDED
} else {
  errorBox.textContent = 'Unknown user role. Please contact support.';
}
```

### Fix 2: Standardized localStorage Key
**File**: `scripts/login.js`

Changed from:
```javascript
localStorage.setItem('userRole', data.user.role);  // ❌ BEFORE
```

To:
```javascript
localStorage.setItem('role', data.user.role);  // ✅ AFTER
```

This matches what `admin-dashboard.js` and other dashboard files expect.

## Testing

### Test Admin Login
1. Navigate to `login.html`
2. Enter credentials:
   - Email: `admin@test.com`
   - Password: `admin123`
3. Click "Login"
4. ✅ Should redirect to `admin-dashboard.html`

### Verify localStorage
After login, check browser console:
```javascript
localStorage.getItem('role')  // Should return: "admin"
localStorage.getItem('token')  // Should return: JWT token
localStorage.getItem('userId')  // Should return: user ID
```

## Related Files

- ✅ `scripts/login.js` - Fixed admin role handling
- ✅ `scripts/admin-dashboard.js` - Reads `localStorage.getItem('role')`
- ✅ `scripts/instructor-attendance.js` - Reads `localStorage.getItem('role')`

## Verification

```bash
# Test backend returns admin role correctly
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'

# Expected response includes:
# "role":"admin"
```

## Status
✅ **FIXED** - Admin users can now login successfully and are redirected to the admin dashboard.

---

**Date**: December 2, 2025  
**Issue**: Admin login error  
**Resolution**: Added admin role handler and fixed localStorage key consistency
