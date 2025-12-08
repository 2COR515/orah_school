// enrollmentRoutes.js - Express router for Enrollment API endpoints
const express = require('express');
const {
  enrollUser,
  listUserEnrollments,
  updateProgress,
  listLessonEnrollments,
  deleteEnrollment
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

// DELETE /:enrollmentId - Delete an enrollment (unenroll) (protected: requires ownership)
router.delete('/:enrollmentId', authenticateToken, deleteEnrollment);

// GET /lesson/:lessonId - List all enrollments for a specific lesson (protected: instructor only)
router.get('/lesson/:lessonId', authenticateToken, authorizeRole('instructor'), listLessonEnrollments);

// GET / - List all enrollments (protected: instructor or admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = require('../../db');
    const userRole = req.user.role;
    
    // Only allow instructors and admins to view all enrollments
    if (userRole !== 'instructor' && userRole !== 'admin') {
      return res.status(403).json({
        ok: false,
        error: 'Access denied. Instructors and admins only.'
      });
    }
    
    const enrollments = await db.listAllEnrollments();
    
    return res.status(200).json({
      ok: true,
      enrollments,
      total: enrollments.length
    });
  } catch (error) {
    console.error('Error fetching all enrollments:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
