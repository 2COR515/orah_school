// enrollmentRoutes.js - Express router for Enrollment API endpoints
const express = require('express');
const {
  enrollUser,
  listUserEnrollments,
  updateProgress,
  listLessonEnrollments
} = require('../controllers/enrollmentController');

// Create router instance
const router = express.Router();

// POST / - Enroll a user in a lesson
router.post('/', enrollUser);

// GET /user/:userId - List all enrollments for a specific user
router.get('/user/:userId', listUserEnrollments);

// PATCH /:enrollmentId/progress - Update enrollment progress and status
router.patch('/:enrollmentId/progress', updateProgress);

// GET /lesson/:lessonId - List all enrollments for a specific lesson (Instructor only)
router.get('/lesson/:lessonId', listLessonEnrollments);

module.exports = router;
