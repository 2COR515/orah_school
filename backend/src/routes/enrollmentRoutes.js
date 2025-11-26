// enrollmentRoutes.js - Express router for Enrollment API endpoints
const express = require('express');
const {
  enrollUser,
  listUserEnrollments,
  updateProgress,
  listLessonEnrollments
} = require('../controllers/enrollmentController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Create router instance
const router = express.Router();

// POST / - Enroll a user in a lesson (protected: student only)
router.post('/', authenticateToken, authorizeRole('student'), enrollUser);

// GET /user/:userId - List all enrollments for a specific user (protected: requires self-authorization)
router.get('/user/:userId', authenticateToken, listUserEnrollments);

// PATCH /:enrollmentId/progress - Update enrollment progress and status (protected: requires ownership)
router.patch('/:enrollmentId/progress', authenticateToken, updateProgress);

// GET /lesson/:lessonId - List all enrollments for a specific lesson (protected: instructor only)
router.get('/lesson/:lessonId', authenticateToken, authorizeRole('instructor'), listLessonEnrollments);

module.exports = router;
