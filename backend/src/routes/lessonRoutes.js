// lessonRoutes.js - Express router for Lesson API endpoints
const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  createLesson,
  listPublishedLessons,
  getLessonById,
  updateLesson,
  deleteLesson,
  addLessonResource
} = require('../controllers/lessonController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Create router instance
const router = express.Router();

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp + random string + original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Create multer middleware for lesson file uploads
// Accepts up to 5 files with field name 'lessonFiles'
const lessonUpload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit per file
  },
  fileFilter: function (req, file, cb) {
    // Accept videos, PDFs, and images
    const allowedMimes = [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only videos, PDFs, and images are allowed.'));
    }
  }
}).array('lessonFiles', 5);

// POST / - Create a new lesson with file uploads (protected: instructor only)
router.post('/', authenticateToken, authorizeRole('instructor'), lessonUpload, createLesson);

// GET / - List all published lessons (public access)
router.get('/', listPublishedLessons);

// GET /:id - Get a single lesson by ID (public access)
router.get('/:id', getLessonById);

// PATCH /:id - Update a lesson by ID (protected: instructor only)
router.patch('/:id', authenticateToken, authorizeRole('instructor'), updateLesson);

// DELETE /:id - Delete a lesson by ID (protected: instructor only)
router.delete('/:id', authenticateToken, authorizeRole('instructor'), deleteLesson);

// POST /:id/resources - Add resource to lesson (protected: instructor only)
router.post('/:id/resources', authenticateToken, authorizeRole('instructor'), addLessonResource);

module.exports = router;
