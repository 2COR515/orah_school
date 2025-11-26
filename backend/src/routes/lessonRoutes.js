// lessonRoutes.js - Express router for Lesson API endpoints
const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  createLesson,
  listPublishedLessons,
  getLessonById,
  updateLesson,
  deleteLesson
} = require('../controllers/lessonController');

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

// POST / - Create a new lesson with file uploads
router.post('/', lessonUpload, createLesson);

// GET / - List all published lessons
router.get('/', listPublishedLessons);

// GET /:id - Get a single lesson by ID
router.get('/:id', getLessonById);

// PATCH /:id - Update a lesson by ID
router.patch('/:id', updateLesson);

// DELETE /:id - Delete a lesson by ID
router.delete('/:id', deleteLesson);

module.exports = router;
