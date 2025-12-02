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
    const { title, instructorId, videoUrl, quiz } = req.body;

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

    // Validate videoUrl (optional, but if present must be a string)
    if (videoUrl !== undefined && typeof videoUrl !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'videoUrl must be a string if provided'
      });
    }

    // Validate quiz (optional, but if present must be an array of objects)
    let quizArray = [];
    if (quiz !== undefined) {
      try {
        // quiz may come as a JSON string from form-data
        quizArray = typeof quiz === 'string' ? JSON.parse(quiz) : quiz;
        if (!Array.isArray(quizArray)) throw new Error();
        for (const q of quizArray) {
          if (
            typeof q !== 'object' ||
            typeof q.question !== 'string' ||
            !Array.isArray(q.options) ||
            (typeof q.correctAnswer !== 'string' && typeof q.correctAnswer !== 'number')
          ) {
            return res.status(400).json({
              ok: false,
              error: 'Each quiz item must have question (string), options (array), and correctAnswer (string or index)'
            });
          }
        }
      } catch (e) {
        return res.status(400).json({
          ok: false,
          error: 'quiz must be a valid array of objects'
        });
      }
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
      status: req.body.status || 'draft', // Allow status to be set, default to 'draft'
      videoUrl: videoUrl || '',
      quiz: quizArray
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
 * Delete a lesson by ID (instructor only - must be lesson owner)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteLesson = async (req, res) => {
  try {
    // Extract lessonId from URL params
    const { id } = req.params;

    // Input validation
    if (!id) {
      return res.status(400).json({
        ok: false,
        error: 'Lesson ID is required'
      });
    }

    // 1. Authentication Check: Verify token exists (handled by authenticateToken middleware)
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required'
      });
    }

    // 2. Fetch the lesson to verify ownership
    const lesson = await getLesson(id);

    if (!lesson) {
      return res.status(404).json({
        ok: false,
        error: 'Lesson not found'
      });
    }

    // 3. Authorization Check: Verify the authenticated user is the lesson owner
    if (req.user.id !== lesson.instructorId) {
      return res.status(403).json({
        ok: false,
        error: 'Forbidden: You can only delete your own lessons'
      });
    }

    // 4. Deletion: Remove the lesson from database
    const deleted = await dbDeleteLesson(id);

    if (!deleted) {
      return res.status(500).json({
        ok: false,
        error: 'Failed to delete lesson from database'
      });
    }

    // 5. Response: Return success status
    return res.status(200).json({
      ok: true,
      message: 'Lesson deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting lesson:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Add resource to existing lesson (instructor only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addLessonResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { fileUrl, fileName } = req.body;
    
    if (!fileUrl || !fileName) {
      return res.status(400).json({
        ok: false,
        error: 'File URL and name are required'
      });
    }
    
    // Get the lesson
    const lesson = await getLesson(id);
    
    if (!lesson) {
      return res.status(404).json({
        ok: false,
        error: 'Lesson not found'
      });
    }
    
    // Verify ownership
    if (req.user.id !== lesson.instructorId) {
      return res.status(403).json({
        ok: false,
        error: 'You can only add resources to your own lessons'
      });
    }
    
    // Add the resource
    const newResource = {
      url: fileUrl,
      originalName: fileName,
      uploadedAt: new Date().toISOString()
    };
    
    lesson.files = lesson.files || [];
    lesson.files.push(newResource);
    
    // Update the lesson
    const updated = await dbUpdateLesson(id, lesson);
    
    return res.status(200).json({
      ok: true,
      message: 'Resource added successfully',
      lesson: updated
    });
  } catch (error) {
    console.error('Error adding resource:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

/**
 * List ALL lessons (admin only) - includes drafts and published
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const listAllLessonsAdmin = async (req, res) => {
  try {
    const lessons = await listLessons();
    
    return res.status(200).json({
      ok: true,
      lessons,
      total: lessons.length
    });
  } catch (error) {
    console.error('Error listing all lessons (admin):', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  createLesson,
  listPublishedLessons,
  listAllLessonsAdmin,
  getLessonById,
  updateLesson,
  deleteLesson,
  addLessonResource
};
