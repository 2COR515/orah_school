const express = require('express');
const router = express.Router();
const { searchCourses } = require('../controllers/courseController');

// GET /api/courses/search?q=term
router.get('/search', searchCourses);

module.exports = router;
