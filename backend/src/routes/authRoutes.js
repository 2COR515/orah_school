// authRoutes.js - Routes for authentication (signup and login)
const router = require('express').Router();
const authController = require('../controllers/authController');

// POST /api/auth/signup - Register a new user
router.post('/signup', authController.signup);

// POST /api/auth/login - Authenticate user and get JWT token
router.post('/login', authController.login);

module.exports = router;
