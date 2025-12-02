# Admin API Endpoints - Quick Reference

## ⚠️ Important Note

**The path `/api/admin` by itself does NOT exist!**

You will get `Cannot GET /api/admin` if you try to access it directly.

Instead, you must use the **specific endpoint paths** listed below.

---

## 🔐 Authentication Required

All admin endpoints require:
1. Valid JWT token in the `Authorization` header
2. Token must belong to a user with `role: "admin"`

**Header Format**:
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

---

## 📍 Available Admin Endpoints

### User Management

#### 1. Get All Users
```http
GET /api/admin/users
```
**Returns**: Array of all users without passwords

**Example**:
```bash
curl -X GET http://localhost:3002/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "ok": true,
  "users": [
    {
      "userId": "1764657008280icxbno6",
      "role": "admin",
      "email": "admin@test.com",
      "firstName": "Admin",
      "lastName": "User",
      "createdAt": 1764657008280
    }
  ]
}
```

---

#### 2. Delete User
```http
DELETE /api/admin/users/:userId
```
**Parameters**: 
- `userId` (path parameter) - The user ID to delete

**Example**:
```bash
curl -X DELETE http://localhost:3002/api/admin/users/1764161091491k0ke3dc \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "ok": true,
  "message": "User deleted successfully"
}
```

**Protection**: Cannot delete your own account (403 Forbidden)

---

#### 3. Update User Role
```http
PATCH /api/admin/users/:userId/role
```
**Parameters**: 
- `userId` (path parameter) - The user ID to update

**Body**:
```json
{
  "role": "student" | "instructor" | "admin"
}
```

**Example**:
```bash
curl -X PATCH http://localhost:3002/api/admin/users/1764161091491k0ke3dc/role \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"instructor"}'
```

**Response**:
```json
{
  "ok": true,
  "message": "User role updated successfully",
  "user": {
    "userId": "1764161091491k0ke3dc",
    "role": "instructor",
    "email": "student@test.com",
    ...
  }
}
```

**Protection**: Cannot change your own role (403 Forbidden)

---

### Data Access

#### 4. Get All Lessons (Including Drafts)
```http
GET /api/admin/lessons
```
**Returns**: All lessons (published + draft status)

**Example**:
```bash
curl -X GET http://localhost:3002/api/admin/lessons \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "ok": true,
  "lessons": [...],
  "total": 21
}
```

---

#### 5. Get All Enrollments
```http
GET /api/admin/enrollments
```
**Returns**: All enrollment records

**Example**:
```bash
curl -X GET http://localhost:3002/api/admin/enrollments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "ok": true,
  "enrollments": [...],
  "total": 42
}
```

---

#### 6. Get All Attendance Records
```http
GET /api/admin/attendance
```
**Returns**: All attendance records

**Example**:
```bash
curl -X GET http://localhost:3002/api/admin/attendance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "ok": true,
  "records": [...],
  "total": 0
}
```

---

## 🧪 Testing the API

### Method 1: Use the Test Page (Recommended)

1. Open `test-admin-api.html` in your browser
2. Login with admin credentials:
   - Email: `admin@test.com`
   - Password: `admin123`
3. Click the "Test" buttons to try each endpoint

### Method 2: Use cURL

1. **Get a token**:
```bash
TOKEN=$(curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo $TOKEN
```

2. **Test an endpoint**:
```bash
# Get all users
curl -X GET http://localhost:3002/api/admin/users \
  -H "Authorization: Bearer $TOKEN"

# Get all lessons
curl -X GET http://localhost:3002/api/admin/lessons \
  -H "Authorization: Bearer $TOKEN"
```

### Method 3: Use the Admin Dashboard

The admin dashboard at `admin-dashboard.html` uses all these endpoints automatically.

---

## ❌ Common Errors

### Error: Cannot GET /api/admin
**Problem**: Trying to access `/api/admin` directly  
**Solution**: Use a specific endpoint like `/api/admin/users`

### Error: 401 Unauthorized
**Problem**: No token provided or invalid token  
**Solution**: Include valid JWT token in Authorization header

### Error: 403 Forbidden
**Problem**: Token is valid but user is not an admin  
**Solution**: Login with admin account

### Error: 403 Forbidden (on delete/role update)
**Problem**: Trying to modify your own account  
**Solution**: This is intentional security - admins cannot delete themselves or change their own role

---

## 📋 Complete Endpoint Summary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/users` | List all users |
| DELETE | `/api/admin/users/:userId` | Delete a user |
| PATCH | `/api/admin/users/:userId/role` | Update user role |
| GET | `/api/admin/lessons` | List all lessons (incl. drafts) |
| GET | `/api/admin/enrollments` | List all enrollments |
| GET | `/api/admin/attendance` | List all attendance records |

**Note**: There is NO endpoint for just `/api/admin` - you must use the full paths above.

---

## 🚀 Quick Start

```bash
# 1. Login and save token
TOKEN=$(curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' | \
  jq -r '.token')

# 2. Get all users
curl -X GET http://localhost:3002/api/admin/users \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Get all lessons
curl -X GET http://localhost:3002/api/admin/lessons \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Get system stats
echo "Users:" && curl -s -X GET http://localhost:3002/api/admin/users \
  -H "Authorization: Bearer $TOKEN" | jq '.users | length'
  
echo "Lessons:" && curl -s -X GET http://localhost:3002/api/admin/lessons \
  -H "Authorization: Bearer $TOKEN" | jq '.lessons | length'
```

---

**Server**: http://localhost:3002  
**Documentation**: See ADMIN-DASHBOARD-COMPLETE.md for full details  
**Test Page**: test-admin-api.html
