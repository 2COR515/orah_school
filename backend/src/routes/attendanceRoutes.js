// attendanceRoutes.js - Routes for attendance tracking
const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceStatistics
} = require('../controllers/attendanceController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// All attendance routes require authentication and instructor role

/**
 * POST /api/attendance
 * Mark attendance for multiple students
 * Body: { records: [{ studentId, lessonId, date, status }] }
 */
router.post('/', authenticateToken, authorizeRole('instructor'), markAttendance);

/**
 * GET /api/attendance
 * Get attendance records with optional filters
 * Query params: studentId, lessonId, date, status
 */
router.get('/', authenticateToken, authorizeRole('instructor'), getAttendance);

/**
 * PATCH /api/attendance/:id
 * Update an attendance record
 * Body: { status, date, etc. }
 */
router.patch('/:id', authenticateToken, authorizeRole('instructor'), updateAttendance);

/**
 * DELETE /api/attendance/:id
 * Delete an attendance record
 */
router.delete('/:id', authenticateToken, authorizeRole('instructor'), deleteAttendance);

/**
 * GET /api/attendance/stats/:lessonId
 * Get attendance statistics for a lesson
 * Query params: date (optional)
 */
router.get('/stats/:lessonId', authenticateToken, authorizeRole('instructor'), getAttendanceStatistics);

module.exports = router;
