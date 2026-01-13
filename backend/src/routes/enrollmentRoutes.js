// enrollmentRoutes.js - Express router for Enrollment API endpoints
const express = require('express');
const {
  enrollUser,
  listUserEnrollments,
  updateProgress,
  listLessonEnrollments,
  deleteEnrollment,
  requestRedo,
  grantRedo,
  getPendingRedoRequests
} = require('../controllers/enrollmentController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const { checkEnrollmentLock } = require('../middleware/lessonAccessMiddleware');

// Create router instance
const router = express.Router();

// POST / - Enroll a user in a lesson (protected: student only)
router.post('/', authenticateToken, authorizeRole('student'), enrollUser);

// GET /user/:userId - List all enrollments for a specific user (protected: requires self-authorization)
router.get('/user/:userId', authenticateToken, listUserEnrollments);

// GET /:enrollmentId - Get a single enrollment (protected: authenticated)
router.get('/:enrollmentId', authenticateToken, async (req, res, next) => {
  // Delegate to controller function (imported dynamically to avoid circular require issues)
  const controller = require('../controllers/enrollmentController');
  return controller.getEnrollmentById(req, res, next);
});

// PATCH /:enrollmentId/progress - Update enrollment progress and status (protected: requires ownership)
// Also enforce lesson deadline lock for students
router.patch('/:enrollmentId/progress', authenticateToken, checkEnrollmentLock, updateProgress);

// DELETE /:enrollmentId - Delete an enrollment (unenroll) (protected: requires ownership)
router.delete('/:enrollmentId', authenticateToken, deleteEnrollment);

// POST /:enrollmentId/request-redo - Student requests a redo (protected: student)
router.post('/:enrollmentId/request-redo', authenticateToken, authorizeRole('student'), requestRedo);

// POST /:enrollmentId/grant-redo - Instructor grants a redo (protected: instructor)
router.post('/:enrollmentId/grant-redo', authenticateToken, authorizeRole('instructor'), grantRedo);

// GET /pending-redo-requests - Instructor sees pending redo requests for their lessons
router.get('/pending-redo-requests', authenticateToken, authorizeRole('instructor'), async (req, res, next) => {
  const controller = require('../controllers/enrollmentController');
  return controller.getPendingRedoRequests(req, res, next);
});

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
