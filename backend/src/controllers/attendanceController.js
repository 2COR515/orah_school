// attendanceController.js - Controller functions for Attendance operations
const {
  saveAttendanceRecord,
  getAttendanceRecords,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  getAttendanceStats
} = require('../../db');

/**
 * Mark attendance for multiple students in a lesson
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const markAttendance = async (req, res) => {
  try {
    // Extract attendance records from request body
    const { records } = req.body;
    
    // Validate input
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'records array is required and must not be empty'
      });
    }
    
    // Verify user is an instructor
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({
        ok: false,
        error: 'Only instructors can mark attendance'
      });
    }
    
    const savedRecords = [];
    const errors = [];
    
    // Process each attendance record
    for (const record of records) {
      try {
        // Add instructor ID to record
        const recordWithInstructor = {
          ...record,
          markedBy: req.user.id
        };
        
        const savedRecord = await saveAttendanceRecord(recordWithInstructor);
        savedRecords.push(savedRecord);
      } catch (error) {
        errors.push({
          record,
          error: error.message
        });
      }
    }
    
    // Return response
    if (errors.length > 0 && savedRecords.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Failed to save any attendance records',
        details: errors
      });
    }
    
    return res.status(201).json({
      ok: true,
      message: `Successfully marked attendance for ${savedRecords.length} student(s)`,
      savedRecords,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error marking attendance:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get attendance records with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAttendance = async (req, res) => {
  try {
    // Extract query parameters
    const { studentId, lessonId, date, status } = req.query;
    
    // Verify user is an instructor
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({
        ok: false,
        error: 'Only instructors can view attendance records'
      });
    }
    
    // Build filter object
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (lessonId) filter.lessonId = lessonId;
    if (date) filter.date = date;
    if (status) filter.status = status;
    
    // Get records
    const records = await getAttendanceRecords(filter);
    
    return res.status(200).json({
      ok: true,
      count: records.length,
      records
    });
    
  } catch (error) {
    console.error('Error getting attendance:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Update an attendance record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Verify user is an instructor
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({
        ok: false,
        error: 'Only instructors can update attendance records'
      });
    }
    
    // Update record
    const updatedRecord = await updateAttendanceRecord(id, updates);
    
    if (!updatedRecord) {
      return res.status(404).json({
        ok: false,
        error: 'Attendance record not found'
      });
    }
    
    return res.status(200).json({
      ok: true,
      message: 'Attendance record updated successfully',
      record: updatedRecord
    });
    
  } catch (error) {
    console.error('Error updating attendance:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Internal server error'
    });
  }
};

/**
 * Delete an attendance record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify user is an instructor
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({
        ok: false,
        error: 'Only instructors can delete attendance records'
      });
    }
    
    // Delete record
    const deleted = await deleteAttendanceRecord(id);
    
    if (!deleted) {
      return res.status(404).json({
        ok: false,
        error: 'Attendance record not found'
      });
    }
    
    return res.status(200).json({
      ok: true,
      message: 'Attendance record deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get attendance statistics for a lesson
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAttendanceStatistics = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { date } = req.query;
    
    // Verify user is an instructor
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({
        ok: false,
        error: 'Only instructors can view attendance statistics'
      });
    }
    
    // Get statistics
    const stats = await getAttendanceStats(lessonId, date);
    
    return res.status(200).json({
      ok: true,
      lessonId,
      date: date || 'all dates',
      statistics: stats
    });
    
  } catch (error) {
    console.error('Error getting attendance statistics:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  markAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceStatistics
};
