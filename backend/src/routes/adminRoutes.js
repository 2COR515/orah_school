// adminRoutes.js - Routes for admin user management
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const lessonController = require('../controllers/lessonController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// All admin routes require authentication and admin role

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
router.get('/users', authenticateToken, authorizeRole('admin'), userController.getAllUsers);

/**
 * DELETE /api/admin/users/:userId
 * Delete a user (admin only)
 */
router.delete('/users/:userId', authenticateToken, authorizeRole('admin'), userController.deleteUser);

/**
 * PATCH /api/admin/users/:userId/role
 * Update user role (admin only)
 * Body: { role: 'student' | 'instructor' | 'admin' }
 */
router.patch('/users/:userId/role', authenticateToken, authorizeRole('admin'), userController.updateUserRole);

/**
 * GET /api/admin/lessons
 * Get all lessons including drafts (admin only)
 */
router.get('/lessons', authenticateToken, authorizeRole('admin'), lessonController.listAllLessonsAdmin);

/**
 * GET /api/admin/enrollments
 * Get all enrollments (admin only)
 */
router.get('/enrollments', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const db = require('../../db');
        const enrollments = await db.listAllEnrollments();
        res.status(200).json({
            ok: true,
            enrollments,
            total: enrollments.length
        });
    } catch (error) {
        console.error('Error fetching enrollments:', error);
        res.status(500).json({
            ok: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/admin/attendance
 * Get all attendance records (admin only)
 */
router.get('/attendance', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const db = require('../../db');
        const records = await db.getAttendanceRecords();
        res.status(200).json({
            ok: true,
            records,
            total: records.length
        });
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({
            ok: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;
