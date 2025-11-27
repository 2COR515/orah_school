# Orah School Authentication System 🔐

## Overview
Complete JWT-based authentication system with role-based access control (RBAC) for the Orah School learning platform.

## System Architecture

### Backend (Node.js + Express)
- **Location**: `/backend`
- **Port**: 3001
- **Database**: lowdb (file-based JSON)
- **Auth Method**: JWT (JSON Web Tokens)
- **Token Expiry**: 24 hours

### Frontend (Vanilla JavaScript)
- **Storage**: localStorage
- **Framework**: None (pure JavaScript)
- **API Base**: `http://localhost:3001/api/`

## User Roles

### Student
- **Access**: Student dashboard, lesson viewing, enrollment
- **Pages**: `student-dashboard.html`, `lesson-player.html`
- **Features**:
  - View available lessons
  - Enroll in lessons
  - Track learning progress
  - Mark lessons as completed

### Instructor
- **Access**: Instructor dashboard, lesson upload
- **Pages**: `instructor-dashboard.html`, `upload.html`
- **Features**:
  - Upload lessons (video/PDF)
  - View upload history
  - Manage course content

## Authentication Flow

```
┌─────────────┐
│   Signup    │
│   (Role)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐         ┌──────────────┐
│    Login    │────────>│  JWT Token   │
└──────┬──────┘         └──────┬───────┘
       │                       │
       │                       ▼
       │              ┌────────────────┐
       │              │  localStorage  │
       │              └────────┬───────┘
       │                       │
       ▼                       ▼
┌──────────────────────────────────────┐
│         Role-Based Redirect          │
├──────────────────┬───────────────────┤
│     Student      │    Instructor     │
│   Dashboard      │    Dashboard      │
└──────────────────┴───────────────────┘
```

## API Endpoints

### Public (No Authentication)
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Authenticate user

### Protected (Requires JWT)
- `GET /api/lessons` - Get all lessons
- `GET /api/lessons/:id` - Get lesson details
- `POST /api/lessons` - Create lesson (instructor only)
- `GET /api/enrollments/user/:userId` - Get user enrollments
- `POST /api/enrollments` - Enroll in lesson (student only)
- `PATCH /api/enrollments/:id/progress` - Update progress

## File Structure

```
Orah-school/
├── backend/
│   ├── server.js                    # Express server
│   ├── config.js                    # JWT secret config
│   ├── db.js                        # Database setup
│   ├── orah-lowdb.json             # User data store
│   └── src/
│       ├── controllers/
│       │   ├── authController.js    # Signup/login logic
│       │   ├── enrollmentController.js
│       │   └── lessonController.js
│       ├── middleware/
│       │   └── authMiddleware.js    # JWT verification
│       └── routes/
│           ├── authRoutes.js        # Auth endpoints
│           ├── enrollmentRoutes.js
│           └── lessonRoutes.js
│
├── scripts/
│   ├── script.js                    # 🔑 Global auth utilities
│   ├── login.js                     # 🔑 Login page logic
│   ├── signup.js                    # 🔑 Student signup
│   ├── instructor-signup.js         # 🔑 Instructor signup
│   ├── student-dashboard.js         # 🔒 Protected (student)
│   ├── instructor-dashboard.js      # 🔒 Protected (instructor)
│   ├── upload.js                    # 🔒 Protected (instructor)
│   └── lesson-player.js             # 🔒 Protected (auth)
│
└── Documentation/
    ├── AUTH-COMPLETE.md             # Backend auth docs
    ├── FRONTEND-AUTH-COMPLETE.md    # Frontend auth docs
    └── FRONTEND-AUTH-TESTING.md     # Testing guide
```

## Quick Start

### 1. Start Backend Server
```bash
cd backend
npm install
npm start
```
Server runs on: `http://localhost:3001`

### 2. Open Frontend
Open `index.html` in a browser or use a local server:
```bash
# Option 1: Python
python3 -m http.server 8080

# Option 2: Node.js
npx http-server -p 8080

# Option 3: VS Code Live Server extension
```

### 3. Test Authentication
1. Navigate to signup page
2. Create student account
3. Login with credentials
4. Access student dashboard
5. Enroll in a lesson

## Security Features

### ✅ JWT Token Security
- Tokens expire after 24 hours
- Tokens include user ID and role
- Signed with secret key (HS256)

### ✅ Password Security
- Passwords hashed with bcrypt (10 rounds)
- Minimum 6 characters required
- Never stored in plain text

### ✅ Authorization
- Role-based access control
- Token verification on every protected endpoint
- Automatic logout on 401/403 errors

### ✅ Frontend Protection
- `requireAuth()` - Requires valid token
- `requireRole(role)` - Requires specific role
- `authorizedFetch()` - Automatic token inclusion

### ✅ XSS Prevention
- All user input escaped before rendering
- No direct innerHTML with user data
- Content Security Policy recommended

## localStorage Schema

```javascript
{
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userRole": "student",  // or "instructor"
  "userId": "1764163223947b2vxkwt",
  "userEmail": "student@test.com",
  "userName": "Test Student"
}
```

## Common Tasks

### Add Logout Button to Page
```html
<button onclick="logout()" class="btn">Logout</button>
```

### Make Authenticated API Call
```javascript
// Automatic token inclusion
const response = await authorizedFetch('http://localhost:3001/api/lessons');
const data = await response.json();
```

### Check User Role
```javascript
const role = getUserRole();
if (role === 'instructor') {
  // Show instructor features
}
```

### Get Current User
```javascript
const userId = getUserId();
const userName = localStorage.getItem('userName');
const userEmail = localStorage.getItem('userEmail');
```

## Testing

### Backend Tests
```bash
cd backend
npm test
```
✅ 18 tests should pass

### Frontend Manual Testing
Follow the comprehensive testing guide in `FRONTEND-AUTH-TESTING.md`

### Quick Test Accounts
Create via signup page or API:

**Student:**
- Email: student@test.com
- Password: password123

**Instructor:**
- Email: instructor@test.com
- Password: password123

## Troubleshooting

### "Authentication required" Error
- **Cause**: No token or invalid token
- **Solution**: Login again, check localStorage

### Redirected to Login Immediately
- **Cause**: Wrong role or no authentication
- **Solution**: Login with correct role account

### 401 Unauthorized
- **Cause**: Token expired or invalid
- **Solution**: Automatic logout will trigger, login again

### CORS Errors
- **Cause**: Backend CORS not configured
- **Solution**: Check backend has `cors` middleware enabled

### localStorage Not Working
- **Cause**: Browser privacy settings
- **Solution**: Check browser allows localStorage for localhost

## Environment Variables

### Backend (.env)
```env
JWT_SECRET=your-secret-key-here-change-in-production
PORT=3001
NODE_ENV=development
```

⚠️ **Important**: Change `JWT_SECRET` in production!

## Production Considerations

### Backend
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS
- [ ] Set secure cookie options
- [ ] Add rate limiting
- [ ] Implement refresh tokens
- [ ] Add email verification
- [ ] Set up proper logging
- [ ] Use production database (PostgreSQL/MongoDB)

### Frontend
- [ ] Move API base URL to config
- [ ] Add HTTPS enforcement
- [ ] Implement token refresh before expiry
- [ ] Add session timeout warnings
- [ ] Use httpOnly cookies instead of localStorage
- [ ] Add CSRF protection
- [ ] Implement Content Security Policy

## Feature Roadmap

### Phase 3 (Current)
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Frontend integration
- ✅ Student/Instructor workflows

### Phase 4 (Next)
- [ ] Logout buttons in UI
- [ ] Password reset flow
- [ ] Email verification
- [ ] User profile management
- [ ] Refresh token implementation

### Phase 5 (Future)
- [ ] Two-factor authentication
- [ ] OAuth integration (Google, GitHub)
- [ ] Session management dashboard
- [ ] Activity logging
- [ ] Admin panel

## Support

### Documentation
- `AUTH-COMPLETE.md` - Backend authentication details
- `FRONTEND-AUTH-COMPLETE.md` - Frontend integration details
- `FRONTEND-AUTH-TESTING.md` - Testing guide
- `INTEGRATION-COMPLETE.md` - API integration details

### Backend API Testing
Use Postman, Insomnia, or curl to test endpoints:
```bash
# Signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"password123","role":"student"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Protected Route (replace TOKEN with actual JWT)
curl http://localhost:3001/api/lessons \
  -H "Authorization: Bearer TOKEN"
```

## License
MIT

## Contributors
- Backend Auth: Phase 1 & 2 Complete
- Frontend Auth: Phase 3 Complete
- Testing: Comprehensive test suite available

---

**Status**: ✅ Production-Ready (Development)
**Last Updated**: January 2025
**Version**: 3.0 (Auth Complete)
