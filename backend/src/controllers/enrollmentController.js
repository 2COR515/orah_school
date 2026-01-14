// enrollmentController.js - Controller functions for Enrollment operations
const {
  addEnrollment,
  getEnrollment,
  getEnrollmentByLessonAndUser,
  listEnrollmentsByLesson,
  listEnrollmentsByUser,
  updateEnrollment,
  deleteEnrollment: deleteEnrollmentDb,
  // attendance helpers
  saveAttendanceRecord,
  getAttendanceRecords,
  listAllEnrollments,
  getAllUsers,
  getLesson
} = require('../../db');

// Import notification services
const { 
  sendEnrollmentConfirmation, 
  sendInstructorEnrollmentAlert,
  sendEnrollmentSMS,
  isValidEmail 
} = require('../services/emailService');

/**
 * Helper: Get user by ID from all users
 */
async function getUserById(userId) {
  const users = await getAllUsers();
  return users.find(u => u.userId === userId);
}

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

    // ========== SEND ENROLLMENT NOTIFICATIONS ==========
    // Run notifications in background (don't block response)
    sendEnrollmentNotifications(enrollment, lessonId, userId).catch(err => {
      console.error('Error sending enrollment notifications:', err);
    });
    
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
 * Send enrollment notifications to both student and instructor
 * Runs asynchronously in background
 */
async function sendEnrollmentNotifications(enrollment, lessonId, userId) {
  try {
    console.log('\n📨 Sending enrollment notifications...');
    
    // 1. Get lesson details
    const lesson = await getLesson(lessonId);
    if (!lesson) {
      console.log('⚠️  Lesson not found, skipping notifications');
      return;
    }
    
    // 2. Get student details
    const student = await getUserById(userId);
    if (!student) {
      console.log('⚠️  Student not found, skipping notifications');
      return;
    }
    
    // 3. Get instructor details
    const instructor = await getUserById(lesson.instructorId);
    if (!instructor) {
      console.log('⚠️  Instructor not found, skipping instructor notification');
    }
    
    const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email;
    const instructorName = instructor ? `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || instructor.email : 'Instructor';
    
    // 4. Send student enrollment confirmation (Email + SMS)
    if (isValidEmail(student.email)) {
      await sendEnrollmentConfirmation(student.email, {
        studentName,
        lessonTitle: lesson.title,
        instructorName,
        instructorEmail: instructor?.email || 'Not available',
        instructorPhone: instructor?.phone || 'Not available',
        deadline: lesson.deadline,
        enrolledAt: enrollment.enrolledAt
      });
    } else {
      console.log(`⚠️  Student email invalid, skipping email: ${student.email}`);
    }
    
    // Send SMS to student (Mock)
    if (student.phone) {
      sendEnrollmentSMS(student.phone, {
        lessonTitle: lesson.title,
        instructorName,
        instructorPhone: instructor?.phone,
        deadline: lesson.deadline
      });
    }
    
    // 5. Send instructor enrollment alert
    if (instructor && isValidEmail(instructor.email)) {
      await sendInstructorEnrollmentAlert(instructor.email, {
        instructorName,
        studentName,
        studentEmail: student.email,
        lessonTitle: lesson.title,
        enrolledAt: enrollment.enrolledAt,
        deadline: lesson.deadline
      });
    } else if (instructor) {
      console.log(`⚠️  Instructor email invalid, skipping: ${instructor.email}`);
    }
    
    console.log('✅ Enrollment notifications sent successfully!\n');
    
  } catch (error) {
    console.error('❌ Error in sendEnrollmentNotifications:', error.message);
  }
}

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
 * Get a single enrollment by ID
 */
const getEnrollmentById = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    if (!enrollmentId) return res.status(400).json({ ok: false, error: 'enrollmentId is required' });

    const enrollment = await getEnrollment(enrollmentId);
    if (!enrollment) return res.status(404).json({ ok: false, error: 'Enrollment not found' });

    // Authorization: student may view own enrollment; instructors/admins may view others
    if (req.user && req.user.role === 'student' && req.user.id !== enrollment.userId) {
      return res.status(403).json({ ok: false, error: 'You can only view your own enrollment' });
    }

    return res.status(200).json({ ok: true, enrollment });
  } catch (err) {
    console.error('Error getting enrollment:', err);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
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
    // Auto-Attendance: if progress reached 100 and enrollment is now completed, create attendance record
    try {
      const reachedComplete = (updateData.progress === 100) || (updatedEnrollment.progress === 100);
      const isCompleted = updatedEnrollment.status === 'completed';

      if (reachedComplete && isCompleted) {
        // Prevent duplicate attendance records for same day
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const existing = await getAttendanceRecords({ studentId: existingEnrollment.userId, lessonId: existingEnrollment.lessonId, date: today }).catch(() => []);
        if (!existing || existing.length === 0) {
          await saveAttendanceRecord({
            studentId: existingEnrollment.userId,
            lessonId: existingEnrollment.lessonId,
            date: today,
            status: 'present',
            markedBy: req.user ? req.user.id : null
          }).catch(err => console.error('Error saving auto-attendance:', err));
        }

        // Auto-Relock: if redoGranted was true before completion, reset it to false
        if (existingEnrollment.redoGranted) {
          try {
            await updateEnrollment(enrollmentId, { redoGranted: false });
            console.log(`Auto-relocked enrollment ${enrollmentId} (redoGranted -> false)`);
          } catch (err) {
            console.error('Error auto-resetting redoGranted:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error in post-progress hooks:', err);
    }

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
 * Student requests a redo for their enrollment. Marks redoRequested = true
 */
const requestRedo = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    if (!enrollmentId) {
      return res.status(400).json({ ok: false, error: 'enrollmentId parameter is required' });
    }

    const enrollment = await getEnrollment(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ ok: false, error: 'Enrollment not found' });
    }

    // Only the enrolled student may request a redo
    if (!req.user || req.user.id !== enrollment.userId) {
      return res.status(403).json({ ok: false, error: 'You can only request a redo for your own enrollment' });
    }

    const updated = await updateEnrollment(enrollmentId, { redoRequested: true });
    return res.status(200).json({ ok: true, enrollment: updated });
  } catch (err) {
    console.error('Error requesting redo:', err);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
};

/**
 * Instructor grants a redo for a given enrollment. Sets redoGranted = true and clears redoRequested
 */
const grantRedo = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    if (!enrollmentId) {
      return res.status(400).json({ ok: false, error: 'enrollmentId parameter is required' });
    }

    const enrollment = await getEnrollment(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ ok: false, error: 'Enrollment not found' });
    }

    const lesson = await getLesson(enrollment.lessonId);
    if (!lesson) {
      return res.status(404).json({ ok: false, error: 'Lesson not found' });
    }

    // Only the lesson instructor or admin may grant a redo
    if (!req.user || (req.user.id !== lesson.instructorId && req.user.role !== 'admin')) {
      return res.status(403).json({ ok: false, error: 'Only the lesson instructor or an admin may grant a redo' });
    }

    const updated = await updateEnrollment(enrollmentId, { redoGranted: true, redoRequested: false });
    return res.status(200).json({ ok: true, enrollment: updated });
  } catch (err) {
    console.error('Error granting redo:', err);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
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

/**
 * Get pending redo requests for the current instructor
 */
const getPendingRedoRequests = async (req, res) => {
  try {
    // Ensure authenticated instructor
    if (!req.user) return res.status(401).json({ ok: false, error: 'Authentication required' });
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Access denied' });
    }

    const all = await listAllEnrollments();
    const users = await getAllUsers();

    const pending = [];

    for (const e of all) {
      if (!e.redoRequested) continue;

      // Fetch lesson to verify instructor owns it
      const lesson = await getLesson(e.lessonId).catch(() => null);
      if (!lesson) continue;
      if (lesson.instructorId !== req.user.id && req.user.role !== 'admin') continue;

      const student = (users || []).find(u => u.userId === e.userId) || null;
      const studentName = student ? ((student.firstName || '') + ' ' + (student.lastName || '')).trim() || student.name || student.userId : e.userId;

      pending.push({
        enrollmentId: e.id,
        studentName,
        lessonTitle: lesson.title || 'Untitled Lesson'
      });
    }

    return res.status(200).json({ ok: true, requests: pending });
  } catch (err) {
    console.error('Error getting pending redo requests:', err);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
};

module.exports = {
  enrollUser,
  listUserEnrollments,
  getEnrollmentById,
  updateProgress,
  listLessonEnrollments,
  deleteEnrollment,
  requestRedo,
  grantRedo
  ,
  getPendingRedoRequests
};
