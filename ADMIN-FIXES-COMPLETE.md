# Admin Dashboard Fixes - User Management & Stats

## Issues Fixed

### Issue 1: "User not found" when deleting/updating users
**Root Cause**: Database functions were looking for `user.id` but user objects have `userId` property.

**Files Fixed**:
1. `backend/db.js` - Fixed `deleteUser()` and `updateUserRole()` to use `u.userId` instead of `u.id`
2. `scripts/admin-dashboard.js` - Updated to use `user.userId` instead of `user.id` throughout

**Changes Made**:

```javascript
// backend/db.js - BEFORE
const index = users.findIndex(u => u.id === userId);

// backend/db.js - AFTER
const index = users.findIndex(u => u.userId === userId);
```

```javascript
// scripts/admin-dashboard.js - BEFORE
const isCurrentUser = user.id === currentUserId;
data-user-id="${user.id}"

// scripts/admin-dashboard.js - AFTER
const isCurrentUser = user.userId === currentUserId;
data-user-id="${user.userId}"
```

---

### Issue 2: "Failed to load lessons" in admin dashboard
**Root Cause**: Admin was calling public `/api/lessons` endpoint which only returns published lessons. Admins need to see ALL lessons including drafts.

**Files Modified**:
1. `backend/src/controllers/lessonController.js` - Added `listAllLessonsAdmin()` function
2. `backend/src/routes/adminRoutes.js` - Added `/api/admin/lessons` endpoint
3. `scripts/admin-dashboard.js` - Updated to use admin endpoint

**New Admin Endpoints Added**:

```javascript
// GET /api/admin/lessons - Returns ALL lessons (drafts + published)
router.get('/lessons', authenticateToken, authorizeRole('admin'), lessonController.listAllLessonsAdmin);

// GET /api/admin/enrollments - Returns ALL enrollments
router.get('/enrollments', authenticateToken, authorizeRole('admin'), ...);

// GET /api/admin/attendance - Returns ALL attendance records
router.get('/attendance', authenticateToken, authorizeRole('admin'), ...);
```

---

### Issue 3: System overview stats not updating in real-time
**Root Cause**: Frontend was calling public/incorrect endpoints that didn't have full data access.

**Fix**: Updated admin dashboard to use dedicated admin endpoints with authentication:

```javascript
// BEFORE
fetch(`${API_BASE_URL}/lessons`, ...)
fetch(`${API_BASE_URL}/enrollments`, ...)
fetch(`${API_BASE_URL}/attendance`, ...)

// AFTER
fetch(`${API_BASE_URL}/admin/lessons`, { headers: getAuthHeaders() })
fetch(`${API_BASE_URL}/admin/enrollments`, { headers: getAuthHeaders() })
fetch(`${API_BASE_URL}/admin/attendance`, { headers: getAuthHeaders() })
```

---

## API Endpoints Summary

### Admin User Management
```
GET    /api/admin/users              - List all users
DELETE /api/admin/users/:userId      - Delete a user  
PATCH  /api/admin/users/:userId/role - Update user role
```

### Admin Data Access (NEW)
```
GET /api/admin/lessons      - All lessons (published + draft)
GET /api/admin/enrollments  - All enrollments
GET /api/admin/attendance   - All attendance records
```

All endpoints require:
- Valid JWT token in Authorization header
- User role must be 'admin'

---

## Testing

### Test User Management

1. **Login as admin**:
   ```bash
   Email: admin@test.com
   Password: admin123
   ```

2. **Update a user role**:
   - Select a user from the table
   - Change role in dropdown
   - Click "Update Role"
   - ✅ Should show success toast
   - ✅ Role should update in table

3. **Delete a user**:
   - Click "Delete" on any user (except yourself)
   - Confirm deletion
   - ✅ Should show success toast
   - ✅ User should disappear from table

4. **Self-protection**:
   - Try to delete yourself
   - ✅ Button should be disabled
   - ✅ Badge says "You"

### Test Lesson Management

1. **View all lessons**:
   - ✅ Should see both published AND draft lessons
   - ✅ Each lesson shows status badge
   - ✅ Enrollment counts display

2. **Delete a lesson**:
   - Click "Delete" on any lesson
   - Confirm deletion
   - ✅ Should show success toast
   - ✅ Lesson should disappear

### Test System Stats

1. **View stats cards**:
   - ✅ Total Users shows actual count
   - ✅ Total Lessons shows actual count (including drafts)
   - ✅ Total Enrollments shows actual count
   - ✅ Total Attendance shows actual count

2. **Verify real-time updates**:
   - Delete a user
   - Click refresh button
   - ✅ Stats should update immediately

---

## Database User Schema

Users in the database have this structure:
```json
{
  "userId": "1764657008280icxbno6",
  "role": "admin",
  "email": "admin@test.com",
  "passwordHash": "$2b$10$...",
  "firstName": "Admin",
  "lastName": "User",
  "createdAt": 1764657008280
}
```

**Key Property**: `userId` (NOT `id`)

---

## Student Dashboard Note

The student dashboard stats (`enrolled-count`, `completed-count`, `completion-rate`) are calculated from enrollment data that's already loaded. These stats update automatically when:
- New enrollments are created
- Lesson progress is updated
- The page is refreshed

No additional fixes needed for student dashboard - it's working as designed with client-side calculations.

---

## Verification Commands

### Test Admin Endpoints
```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Get all users
curl -X GET http://localhost:3002/api/admin/users \
  -H "Authorization: Bearer $TOKEN"

# Get all lessons (including drafts)
curl -X GET http://localhost:3002/api/admin/lessons \
  -H "Authorization: Bearer $TOKEN"

# Get all enrollments
curl -X GET http://localhost:3002/api/admin/enrollments \
  -H "Authorization: Bearer $TOKEN"

# Get all attendance
curl -X GET http://localhost:3002/api/admin/attendance \
  -H "Authorization: Bearer $TOKEN"
```

---

## Status

✅ **ALL ISSUES FIXED**

- [x] User management "User not found" error resolved
- [x] Lesson management "Failed to load lessons" error resolved
- [x] System stats now showing real-time data
- [x] All admin endpoints working with authentication
- [x] Self-protection mechanisms working
- [x] Backend server restarted with updates

The admin dashboard is now fully functional!

---

**Date**: December 2, 2025  
**Server**: Running on port 3002  
**Test Account**: admin@test.com / admin123
