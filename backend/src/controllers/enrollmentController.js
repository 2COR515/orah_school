// enrollmentController.js - Controller functions for Enrollment operations
const {
  addEnrollment,
  getEnrollment,
  getEnrollmentByLessonAndUser,
  listEnrollmentsByLesson,
  listEnrollmentsByUser,
  updateEnrollment,
  deleteEnrollment: deleteEnrollmentDb
} = require('../../db');

/**
 * Enroll a user in a lesson
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const enrollUser = async (req, res) => {
  try {
    // Extract required fields
    const { lessonId, userId } = req.body;
    
    // Input validation
    if (!lessonId) {
      return res.status(400).json({
        ok: false,
        error: 'lessonId is required'
      });
    }
    
    if (!userId) {
      return res.status(400).json({
        ok: false,
        error: 'userId is required'
      });
    }
    
    // Self-authorization check: user can only enroll themselves
    if (req.user && req.user.id !== userId) {
      return res.status(403).json({
        ok: false,
        error: 'You can only enroll yourself'
      });
    }
    
    // Attempt to create enrollment
    const enrollment = await addEnrollment({ lessonId, userId });
    
    // Check for duplicate enrollment
    if (enrollment === null) {
      return res.status(409).json({
        ok: false,
        error: 'User is already enrolled in this lesson'
      });
    }
    
    // Send success response with 201 status
    return res.status(201).json({
      ok: true,
      enrollment
    });
    
  } catch (error) {
    // Handle server errors
    console.error('Error enrolling user:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

/**
 * List all enrollments for a specific user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const listUserEnrollments = async (req, res) => {
  try {
    // Extract userId from URL params
    const { userId } = req.params;
    
    // Input validation
    if (!userId) {
      return res.status(400).json({
        ok: false,
        error: 'userId parameter is required'
      });
    }
    
    // Self-authorization check: user can only view their own enrollments
    if (req.user && req.user.id !== userId) {
      return res.status(403).json({
        ok: false,
        error: 'You can only view your own enrollments'
      });
    }
    
    // Fetch enrollments for the user
    const enrollments = await listEnrollmentsByUser(userId);
    
    // Send success response
    return res.status(200).json({
      ok: true,
      enrollments,
      total: enrollments.length
    });
    
  } catch (error) {
    // Handle server errors
    console.error('Error listing user enrollments:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Update enrollment progress and status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProgress = async (req, res) => {
  try {
    // Extract enrollmentId from URL params
    const { enrollmentId } = req.params;
    
    // Extract progress, status, and optional time tracking fields from body
    let { progress, status, timeSpentSeconds, lastAccessDate } = req.body;
    
    // Input validation for enrollmentId
    if (!enrollmentId) {
      return res.status(400).json({
        ok: false,
        error: 'enrollmentId parameter is required'
      });
    }
    
    // Ownership check: verify the enrollment belongs to the authenticated user
    const existingEnrollment = await getEnrollment(enrollmentId);
    
    if (!existingEnrollment) {
      return res.status(404).json({
        ok: false,
        error: 'Enrollment not found'
      });
    }
    
    if (req.user && req.user.id !== existingEnrollment.userId) {
      return res.status(403).json({
        ok: false,
        error: 'You can only update your own enrollments'
      });
    }
    
    // Prepare update data
    const updateData = {};
    
    // Input validation for progress (if provided)
    if (progress !== undefined && progress !== null) {
      // Convert progress to number and validate range
      progress = Number(progress);
      
      if (isNaN(progress)) {
        return res.status(400).json({
          ok: false,
          error: 'progress must be a valid number'
        });
      }
      
      if (progress < 0 || progress > 100) {
        return res.status(400).json({
          ok: false,
          error: 'progress must be between 0 and 100'
        });
      }
      
      updateData.progress = progress;
      
      // Automatic status update: if progress reaches 100, mark as completed
      if (progress === 100) {
        updateData.status = 'completed';
      } else if (status) {
        // Allow manual status override if provided (and not 100% progress)
        updateData.status = status;
      }
    } else if (status) {
      // Allow status update without progress change
      updateData.status = status;
    }
    
    // ✨ Add time spent tracking if provided
    // Frontend sends session time, backend accumulates it with existing total
    if (timeSpentSeconds !== undefined && timeSpentSeconds !== null) {
      const currentTotal = existingEnrollment.timeSpentSeconds || 0;
      const sessionTime = Number(timeSpentSeconds);
      
      // Add session time to existing total
      updateData.timeSpentSeconds = currentTotal + sessionTime;
      console.log(`⏱️ Time spent: +${sessionTime}s → Total: ${updateData.timeSpentSeconds}s`);
    }
    
    // ✨ Update last access date if provided
    if (lastAccessDate) {
      updateData.lastAccessDate = lastAccessDate;
    }
    
    // Validate that at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'At least one field (progress, status, timeSpentSeconds, or lastAccessDate) must be provided'
      });
    }
    
    // Update enrollment in database
    const updatedEnrollment = await updateEnrollment(enrollmentId, updateData);
    
    // Check if enrollment exists
    if (!updatedEnrollment) {
      return res.status(404).json({
        ok: false,
        error: 'Enrollment not found'
      });
    }
    
    // Send success response
    return res.status(200).json({
      ok: true,
      enrollment: updatedEnrollment
    });
    
  } catch (error) {
    // Handle server errors
    console.error('Error updating enrollment progress:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

/**
 * List all enrollments for a specific lesson (Instructor/Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const listLessonEnrollments = async (req, res) => {
  try {
    // Extract lessonId from URL params
    const { lessonId } = req.params;
    
    // Input validation for lessonId
    if (!lessonId) {
      return res.status(400).json({
        ok: false,
        error: 'lessonId parameter is required'
      });
    }
    
    // Authorization is handled by middleware (authorizeRole('instructor'))
    
    // Fetch enrollments for the lesson
    const enrollments = await listEnrollmentsByLesson(lessonId);
    
    // Send success response
    return res.status(200).json({
      ok: true,
      enrollments,
      total: enrollments.length
    });
    
  } catch (error) {
    // Handle server errors
    console.error('Error listing lesson enrollments:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Delete an enrollment (unenroll a student from a lesson)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    
    console.log(`🗑️ Delete enrollment request for ID: ${enrollmentId}`);
    console.log('Authenticated user:', req.user);
    
    // Input validation
    if (!enrollmentId) {
      return res.status(400).json({
        ok: false,
        error: 'enrollmentId parameter is required'
      });
    }
    
    // Fetch the enrollment to verify ownership
    const enrollment = await getEnrollment(enrollmentId);
    
    if (!enrollment) {
      return res.status(404).json({
        ok: false,
        error: 'Enrollment not found'
      });
    }
    
    // CRITICAL: Self-authorization check
    // User can only delete their own enrollment
    if (req.user && req.user.id !== enrollment.userId) {
      console.error(`❌ Authorization failed: User ${req.user.id} tried to delete enrollment owned by ${enrollment.userId}`);
      return res.status(403).json({
        ok: false,
        error: 'You can only delete your own enrollments'
      });
    }
    
    console.log(`✅ Authorization passed: User ${req.user.id} owns enrollment ${enrollmentId}`);
    
    // Delete the enrollment
    const deleted = await deleteEnrollmentDb(enrollmentId);
    
    if (!deleted) {
      return res.status(404).json({
        ok: false,
        error: 'Enrollment not found or already deleted'
      });
    }
    
    console.log(`✅ Successfully deleted enrollment ${enrollmentId}`);
    
    // Return 204 No Content on successful deletion
    return res.status(204).send();
    
  } catch (error) {
    console.error('❌ Error deleting enrollment:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  enrollUser,
  listUserEnrollments,
  updateProgress,
  listLessonEnrollments,
  deleteEnrollment
};
