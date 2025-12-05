// authController.js - Controller functions for authentication (signup and login)
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail, saveUser } = require('../../db');
const { JWT_SECRET } = require('../../config');

/**
 * Handles new user registration (default role: student).
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function signup(req, res) {
  try {
    // 1. Validate required fields (email, password)
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: 'Email and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid email format'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        ok: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // 3. Check for existing user (db.findUserByEmail)
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        ok: false,
        error: 'User with this email already exists'
      });
    }

    // 2. Hash the password (bcrypt.hash, salt rounds = 10)
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Save the new user (db.saveUser) with role from req.body or 'student' default
    const userData = {
      email,
      passwordHash,
      firstName: firstName || '',
      lastName: lastName || '',
      role: role || 'student' // Default to student if not specified
    };

    const newUser = await saveUser(userData);

    // 5. Return 201 Created status with the new user's ID
    return res.status(201).json({
      ok: true,
      message: 'User registered successfully',
      user: {
        userId: newUser.userId,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error during signup'
    });
  }
}

/**
 * Handles user login and generates a JWT on success.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function login(req, res) {
  try {
    // 1. Validate required fields (email, password)
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: 'Email and password are required'
      });
    }

    // 2. Find user by email (db.findUserByEmail). Return 401 if not found.
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid email or password'
      });
    }

    // 3. Compare password (bcrypt.compare). Return 401 if invalid.
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid email or password'
      });
    }

    // 4. Generate JWT (jsonwebtoken.sign) with payload: { id: user.userId, role: user.role }
    const tokenPayload = {
      id: user.userId,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: '24h' // Token expires in 24 hours
    });

    // 5. Return 200 OK with the token, userId, and role
    return res.status(200).json({
      ok: true,
      message: 'Login successful',
      token,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error during login'
    });
  }
}

/**
 * Handles user profile updates (e.g., reminder frequency preferences).
 * Requires authentication token.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateProfile(req, res) {
  try {
    // Get user ID from JWT token (set by authenticateToken middleware)
    const userId = req.user.id;
    
    // Get update data from request body
    const { reminderFrequency, firstName, lastName } = req.body;
    
    // Validate reminderFrequency if provided
    const validFrequencies = ['daily', 'weekly', 'twice-weekly', 'never'];
    if (reminderFrequency && !validFrequencies.includes(reminderFrequency)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid reminder frequency. Must be: daily, weekly, twice-weekly, or never'
      });
    }
    
    // Find the user
    const { getAllUsers } = require('../../db');
    const users = await getAllUsers();
    const user = users.find(u => u.userId === userId);
    
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found'
      });
    }
    
    // Update user fields
    if (reminderFrequency !== undefined) {
      user.reminderFrequency = reminderFrequency;
    }
    if (firstName !== undefined) {
      user.firstName = firstName;
    }
    if (lastName !== undefined) {
      user.lastName = lastName;
    }
    
    // Save updated user
    const storage = require('node-persist');
    await storage.init({
      dir: require('path').join(__dirname, '../../storage')
    });
    await storage.setItem('users', users);
    
    // Return success response
    return res.status(200).json({
      ok: true,
      message: 'Profile updated successfully',
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        reminderFrequency: user.reminderFrequency
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error during profile update'
    });
  }
}

/**
 * Get current user's profile information.
 * Requires authentication token.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getProfile(req, res) {
  try {
    // Get user ID from JWT token
    const userId = req.user.id;
    
    // Find the user
    const { getAllUsers } = require('../../db');
    const users = await getAllUsers();
    const user = users.find(u => u.userId === userId);
    
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found'
      });
    }
    
    // Return user profile (excluding password)
    return res.status(200).json({
      ok: true,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        reminderFrequency: user.reminderFrequency || 'weekly'
      }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error while fetching profile'
    });
  }
}

module.exports = { signup, login, updateProfile, getProfile };
