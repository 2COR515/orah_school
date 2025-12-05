// analyticsRoutes.js - Routes for analytics and performance data
const router = require('express').Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

/**
 * GET /api/analytics/dashboard
 * Get comprehensive dashboard summary with aggregated analytics
 * Available to: Instructors and Admins
 */
router.get(
  '/dashboard',
  authenticateToken,
  authorizeRole('instructor', 'admin'),
  analyticsController.getDashboardSummary
);

/**
 * GET /api/analytics/lesson/:lessonId
 * Get detailed performance analytics for a specific lesson
 * Available to: Instructors (lesson owner) and Admins
 */
router.get(
  '/lesson/:lessonId',
  authenticateToken,
  authorizeRole('instructor', 'admin'),
  analyticsController.getLessonPerformance
);

/**
 * GET /api/analytics/student/:studentId
 * Get analytics for a specific student
 * Available to: Instructors and Admins
 */
router.get(
  '/student/:studentId',
  authenticateToken,
  authorizeRole('instructor', 'admin'),
  analyticsController.getStudentAnalytics
);

/**
 * GET /api/analytics/instructor/:instructorId
 * Get analytics for a specific instructor (all their lessons)
 * Available to: Admins and self (instructor viewing their own)
 */
router.get(
  '/instructor/:instructorId',
  authenticateToken,
  authorizeRole('instructor', 'admin'),
  analyticsController.getInstructorAnalytics
);

module.exports = router;
