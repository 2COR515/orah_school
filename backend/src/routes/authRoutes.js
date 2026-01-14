// authRoutes.js - Routes for authentication (signup and login) and profile management
const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// POST /api/auth/signup - Register a new user
router.post('/signup', authController.signup);

// POST /api/auth/login - Authenticate user and get JWT token
router.post('/login', authController.login);

// POST /api/auth/verify - Verify email or phone code
router.post('/verify', authController.verifyCode);

// POST /api/auth/resend-code - Resend verification code
router.post('/resend-code', authController.resendCode);

// GET /api/auth/verification-status - Get user's verification status
router.get('/verification-status', authController.getVerificationStatus);

// GET /api/auth/profile - Get current user's profile (requires authentication)
router.get('/profile', authenticateToken, authController.getProfile);

// PATCH /api/auth/profile - Update user profile (requires authentication)
router.patch('/profile', authenticateToken, authController.updateProfile);

module.exports = router;
