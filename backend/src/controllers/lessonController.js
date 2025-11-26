// lessonController.js - Controller functions for Lesson operations
const { addLesson, getLesson, updateLesson: dbUpdateLesson, deleteLesson: dbDeleteLesson, listLessons } = require('../../db');

/**
 * Create a new lesson
 * @param {Object} req - Express request object (supports multipart/form-data)
 * @param {Object} res - Express response object
 */
const createLesson = async (req, res) => {
  try {
    // Extract required fields from form data
    const { title, instructorId } = req.body;
    
    // Extract optional fields from form data
    const { description, topic, durationMinutes } = req.body;
    
    // Input validation
    if (!title) {
      return res.status(400).json({ 
        ok: false, 
        error: 'title is required' 
      });
    }
    
    if (!instructorId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'instructorId is required' 
      });
    }
    
    // Process uploaded files
    const uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Determine file type based on mimetype
        let fileType = 'other';
        if (file.mimetype.startsWith('video/')) {
          fileType = 'video';
        } else if (file.mimetype === 'application/pdf') {
          fileType = 'pdf';
        } else if (file.mimetype.startsWith('image/')) {
          fileType = 'image';
        }
        
        // Map file metadata to Lesson Data Model structure
        uploadedFiles.push({
          type: fileType,
          url: `/uploads/${file.filename}`,
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });
      });
    }
    
    // Prepare lesson data
    const lessonData = {
      title,
      instructorId,
      description: description || '',
      topic: topic || '',
      durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
      files: uploadedFiles,
      status: 'draft'
    };
    
    // Call addLesson to store the lesson
    const createdLesson = await addLesson(lessonData);
    
    // Send success response with 201 status
    return res.status(201).json({
      ok: true,
      lesson: createdLesson
    });
    
  } catch (error) {
    // Handle server errors
    console.error('Error creating lesson:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

/**
 * List all published lessons with optional filtering and pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const listPublishedLessons = async (req, res) => {
  try {
    // Fetch all lessons from database
    let lessons = await listLessons();
    
    // Filter to only published lessons
    lessons = lessons.filter(lesson => lesson.status === 'published');
    
    // Apply optional topic filter
    const { topic, limit, offset } = req.query;
    if (topic) {
      lessons = lessons.filter(lesson => lesson.topic === topic);
    }
    
    // Store total before pagination
    const total = lessons.length;
    
    // Apply pagination
    const parsedOffset = parseInt(offset) || 0;
    const parsedLimit = parseInt(limit) || lessons.length;
    lessons = lessons.slice(parsedOffset, parsedOffset + parsedLimit);
    
    // Send success response
    return res.status(200).json({
      ok: true,
      lessons,
      total
    });
    
  } catch (error) {
    // Handle server errors
    console.error('Error listing published lessons:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get a lesson by ID with authorization check
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getLessonById = async (req, res) => {
  try {
    const { id } = req.params;
    const { instructorId } = req.query;
    
    // Fetch lesson from database
    const lesson = await getLesson(id);
    
    // Check if lesson exists
    if (!lesson) {
      return res.status(404).json({
        ok: false,
        error: 'Lesson not found'
      });
    }
    
    // Authorization check: published OR owner
    const isPublished = lesson.status === 'published';
    const isOwner = instructorId && lesson.instructorId === instructorId;
    
    if (!isPublished && !isOwner) {
      return res.status(404).json({
        ok: false,
        error: 'Lesson not found'
      });
    }
    
    // Send success response
    return res.status(200).json({
      ok: true,
      lesson
    });
    
  } catch (error) {
    // Handle server errors
    console.error('Error getting lesson by ID:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Update a lesson by ID (owner only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { instructorId, title, description, topic, status, files, durationMinutes } = req.body;
    
    // Fetch existing lesson
    const existingLesson = await getLesson(id);
    
    // Check if lesson exists
    if (!existingLesson) {
      return res.status(404).json({
        ok: false,
        error: 'Lesson not found'
      });
    }
    
    // Authorization check: must be owner
    if (!instructorId || existingLesson.instructorId !== instructorId) {
      return res.status(403).json({
        ok: false,
        error: 'Forbidden: You are not the owner of this lesson'
      });
    }
    
    // Prepare update data (only include fields present in req.body)
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (topic !== undefined) updateData.topic = topic;
    if (status !== undefined) updateData.status = status;
    if (files !== undefined) updateData.files = files;
    if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes;
    
    // Update lesson in database
    const updatedLesson = await dbUpdateLesson(id, updateData);
    
    // Send success response
    return res.status(200).json({
      ok: true,
      lesson: updatedLesson
    });
    
  } catch (error) {
    // Handle server errors
    console.error('Error updating lesson:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Delete a lesson by ID (owner only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { instructorId } = req.body;
    
    // Fetch existing lesson
    const existingLesson = await getLesson(id);
    
    // Check if lesson exists
    if (!existingLesson) {
      return res.status(404).json({
        ok: false,
        error: 'Lesson not found'
      });
    }
    
    // Authorization check: must be owner
    if (!instructorId || existingLesson.instructorId !== instructorId) {
      return res.status(403).json({
        ok: false,
        error: 'Forbidden: You are not the owner of this lesson'
      });
    }
    
    // Delete lesson from database
    await dbDeleteLesson(id);
    
    // Send success response
    return res.status(200).json({
      ok: true,
      message: 'Lesson deleted successfully'
    });
    
  } catch (error) {
    // Handle server errors
    console.error('Error deleting lesson:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  createLesson,
  listPublishedLessons,
  getLessonById,
  updateLesson,
  deleteLesson
};
