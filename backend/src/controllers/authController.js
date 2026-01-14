// authController.js - Controller functions for authentication (signup and login)
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail, saveUser, getAllUsers } = require('../../db');
const { JWT_SECRET } = require('../../config');
const { sendVerificationEmail, sendMockSMS, generateVerificationCode, isValidEmail } = require('../services/emailService');

/**
 * Handles new user registration (default role: student).
 * Sends verification codes via Email and Mock SMS.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function signup(req, res) {
  try {
    // 1. Validate required fields (email, password, phone)
    const { email, password, firstName, lastName, role, phone } = req.body;

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

    // Validate phone number if provided
    if (!phone || phone.trim().length < 10) {
      return res.status(400).json({
        ok: false,
        error: 'A valid phone number is required (at least 10 digits)'
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

    // Generate verification codes
    const verificationCodeEmail = generateVerificationCode();
    const verificationCodePhone = generateVerificationCode();

    // 4. Save the new user with verification fields
    const userData = {
      email,
      passwordHash,
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone.trim(),
      role: role || 'student',
      isEmailVerified: false,
      isPhoneVerified: false,
      verificationCodeEmail,
      verificationCodePhone,
      verificationCodeCreatedAt: new Date().toISOString()
    };

    const newUser = await saveUser(userData);

    // Send verification email
    await sendVerificationEmail(email, verificationCodeEmail, firstName || 'there');

    // Send Mock SMS (console log)
    sendMockSMS(phone.trim(), verificationCodePhone);

    // 5. Return 201 Created - redirect to verification page (NO token)
    return res.status(201).json({
      ok: true,
      message: 'Account created! Please verify your email or phone to continue.',
      redirect: '/verify-account.html',
      email: newUser.email,
      phone: newUser.phone
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
 * Legacy users (without verification fields) are allowed immediately.
 * New users must have EITHER email OR phone verified.
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

    // 4. Verification check with legacy user handling
    // Allow login IF:
    // - user.isEmailVerified === true OR
    // - user.isPhoneVerified === true OR
    // - user.isEmailVerified === undefined (legacy user - no verification fields)
    const isLegacyUser = user.isEmailVerified === undefined;
    const isEmailVerified = user.isEmailVerified === true;
    const isPhoneVerified = user.isPhoneVerified === true;

    if (!isLegacyUser && !isEmailVerified && !isPhoneVerified) {
      return res.status(403).json({
        ok: false,
        error: 'Please verify your email or phone to continue.',
        requiresVerification: true,
        email: user.email
      });
    }

    // 5. Generate JWT (jsonwebtoken.sign) with payload: { id: user.userId, role: user.role }
    const tokenPayload = {
      id: user.userId,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: '24h' // Token expires in 24 hours
    });

    // 6. Return 200 OK with the token, userId, and role
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

/**
 * Verify email or phone code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function verifyCode(req, res) {
  try {
    const { email, code, type } = req.body; // type: 'email' or 'phone'

    if (!email || !code || !type) {
      return res.status(400).json({
        ok: false,
        error: 'Email, code, and type are required'
      });
    }

    if (!['email', 'phone'].includes(type)) {
      return res.status(400).json({
        ok: false,
        error: 'Type must be "email" or "phone"'
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found'
      });
    }

    // Check code based on type
    const expectedCode = type === 'email' ? user.verificationCodeEmail : user.verificationCodePhone;
    
    if (code !== expectedCode) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid verification code'
      });
    }

    // Check if code is expired (15 minutes)
    if (user.verificationCodeCreatedAt) {
      const codeAge = Date.now() - new Date(user.verificationCodeCreatedAt).getTime();
      const fifteenMinutes = 15 * 60 * 1000;
      if (codeAge > fifteenMinutes) {
        return res.status(400).json({
          ok: false,
          error: 'Verification code has expired. Please request a new one.'
        });
      }
    }

    // Update user verification status
    const users = await getAllUsers();
    const userIndex = users.findIndex(u => u.email === email);
    
    if (type === 'email') {
      users[userIndex].isEmailVerified = true;
      users[userIndex].verificationCodeEmail = null;
    } else {
      users[userIndex].isPhoneVerified = true;
      users[userIndex].verificationCodePhone = null;
    }

    // Save updated users
    const storage = require('node-persist');
    await storage.init({
      dir: require('path').join(__dirname, '../../storage')
    });
    await storage.setItem('users', users);

    // Generate JWT for auto-login
    const tokenPayload = {
      id: user.userId,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: '24h'
    });

    return res.status(200).json({
      ok: true,
      message: `${type === 'email' ? 'Email' : 'Phone'} verified successfully!`,
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
    console.error('Verify code error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error during verification'
    });
  }
}

/**
 * Resend verification code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function resendCode(req, res) {
  try {
    const { email, type } = req.body; // type: 'email' or 'phone'

    if (!email || !type) {
      return res.status(400).json({
        ok: false,
        error: 'Email and type are required'
      });
    }

    if (!['email', 'phone'].includes(type)) {
      return res.status(400).json({
        ok: false,
        error: 'Type must be "email" or "phone"'
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found'
      });
    }

    // Generate new code
    const newCode = generateVerificationCode();

    // Update user with new code
    const users = await getAllUsers();
    const userIndex = users.findIndex(u => u.email === email);
    
    if (type === 'email') {
      users[userIndex].verificationCodeEmail = newCode;
      // Send verification email
      await sendVerificationEmail(email, newCode, user.firstName || 'there');
    } else {
      users[userIndex].verificationCodePhone = newCode;
      // Send Mock SMS
      sendMockSMS(user.phone, newCode);
    }
    
    users[userIndex].verificationCodeCreatedAt = new Date().toISOString();

    // Save updated users
    const storage = require('node-persist');
    await storage.init({
      dir: require('path').join(__dirname, '../../storage')
    });
    await storage.setItem('users', users);

    return res.status(200).json({
      ok: true,
      message: `New ${type === 'email' ? 'email' : 'SMS'} code sent!`
    });

  } catch (error) {
    console.error('Resend code error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error while resending code'
    });
  }
}

/**
 * Get verification status for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getVerificationStatus(req, res) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        ok: false,
        error: 'Email is required'
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found'
      });
    }

    return res.status(200).json({
      ok: true,
      isEmailVerified: user.isEmailVerified || false,
      isPhoneVerified: user.isPhoneVerified || false,
      phone: user.phone ? user.phone.slice(-4) : null // Last 4 digits only
    });

  } catch (error) {
    console.error('Get verification status error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
}

module.exports = { signup, login, updateProfile, getProfile, verifyCode, resendCode, getVerificationStatus };
