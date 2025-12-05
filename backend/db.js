// db.js - node-persist database utility for Lesson CRUD operations
const storage = require('node-persist');
const path = require('path');
const bcrypt = require('bcrypt'); // Added for password hashing utility

let initialized = false;

/**
 * Initialize node-persist storage in ./storage directory
 */
async function initDb() {
  if (initialized) return;
  await storage.init({
    dir: path.join(__dirname, 'storage'),
    stringify: JSON.stringify,
    parse: JSON.parse,
    encoding: 'utf8',
    logging: false,
    ttl: false,
    forgiveParseErrors: false
  });
  
  // Ensure lessons array exists
  const lessons = await storage.getItem('lessons');
  if (!lessons) {
    await storage.setItem('lessons', []);
  }
  
  // Ensure enrollments array exists
  const enrollments = await storage.getItem('enrollments');
  if (!enrollments) {
    await storage.setItem('enrollments', []);
  }
  
  // Ensure users array exists
  const users = await storage.getItem('users');
  if (!users) {
    await storage.setItem('users', []);
  }
  
  // Ensure attendance array exists
  const attendance = await storage.getItem('attendance');
  if (!attendance) {
    await storage.setItem('attendance', []);
  }
  
  initialized = true;
}

/**
 * Add a new lesson to storage
 * @param {Object} lessonData - Lesson data object with instructorId, title, description, topic, status, files, durationMinutes
 * @returns {Promise<Object>} The created lesson with id, createdAt, and updatedAt
 */
async function addLesson(lessonData) {
  await initDb();
  
  const now = Date.now();
  const id = now + Math.random().toString(36).substring(2, 9);
  
  const lesson = {
    id,
    instructorId: lessonData.instructorId || '',
    title: lessonData.title || '',
    description: lessonData.description || '',
    topic: lessonData.topic || '',
    status: lessonData.status || 'draft',
    files: lessonData.files || [],
    videoUrl: lessonData.videoUrl || '',
    quiz: lessonData.quiz || [],
    durationMinutes: lessonData.durationMinutes || null,
    createdAt: now,
    updatedAt: now
  };
  
  const lessons = await storage.getItem('lessons') || [];
  lessons.push(lesson);
  await storage.setItem('lessons', lessons);
  
  return lesson;
}

/**
 * Get a single lesson by id
 * @param {string} id - Lesson id
 * @returns {Promise<Object|null>} The lesson object or null if not found
 */
async function getLesson(id) {
  await initDb();
  
  const lessons = await storage.getItem('lessons') || [];
  return lessons.find(l => l.id === id) || null;
}

/**
 * Update a lesson by id
 * @param {string} id - Lesson id
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object|null>} The updated lesson or null if not found
 */
async function updateLesson(id, updateData) {
  await initDb();
  
  const lessons = await storage.getItem('lessons') || [];
  const index = lessons.findIndex(l => l.id === id);
  
  if (index === -1) return null;
  
  // Merge updates, preserving id, createdAt, and updating updatedAt
  const updated = {
    ...lessons[index],
    ...updateData,
    id: lessons[index].id,
    createdAt: lessons[index].createdAt,
    updatedAt: Date.now()
  };
  
  lessons[index] = updated;
  await storage.setItem('lessons', lessons);
  
  return updated;
}

/**
 * Delete a lesson by id
 * @param {string} id - Lesson id
 * @returns {Promise<boolean>} true if deleted, false if not found
 */
async function deleteLesson(id) {
  await initDb();
  
  const lessons = await storage.getItem('lessons') || [];
  const index = lessons.findIndex(l => l.id === id);
  
  if (index === -1) return false;
  
  lessons.splice(index, 1);
  await storage.setItem('lessons', lessons);
  
  return true;
}

/**
 * List all lessons
 * @returns {Promise<Array>} Array of all lesson objects
 */
async function listLessons() {
  await initDb();
  
  const lessons = await storage.getItem('lessons') || [];
  return lessons;
}

// ==================== ENROLLMENT CRUD FUNCTIONS ====================

/**
 * Add a new enrollment to storage
 * Ensures a user can only enroll once per lesson
 * @param {Object} enrollmentData - Enrollment data object with lessonId, userId
 * @returns {Promise<Object|null>} The created enrollment or null if already enrolled
 */
async function addEnrollment(enrollmentData) {
  await initDb();
  
  const { lessonId, userId } = enrollmentData;
  
  // Check for existing enrollment (unique constraint)
  const enrollments = await storage.getItem('enrollments') || [];
  const existingEnrollment = enrollments.find(
    e => e.lessonId === lessonId && e.userId === userId
  );
  
  if (existingEnrollment) {
    return null; // User already enrolled in this lesson
  }
  
  const now = Date.now();
  const id = now + Math.random().toString(36).substring(2, 9);
  
  const enrollment = {
    id,
    lessonId,
    userId,
    enrolledAt: now,
    enrollmentDate: new Date().toISOString(), // ISO date for deadline tracking
    lastAccessDate: new Date().toISOString(), // Track last interaction
    status: 'active', // active | missed | completed
    progress: 0,
    timeSpentSeconds: 0 // Track time spent on lesson
  };
  
  enrollments.push(enrollment);
  await storage.setItem('enrollments', enrollments);
  
  return enrollment;
}

/**
 * Get a single enrollment by ID
 * @param {string} id - Enrollment id
 * @returns {Promise<Object|null>} The enrollment object or null if not found
 */
async function getEnrollment(id) {
  await initDb();
  
  const enrollments = await storage.getItem('enrollments') || [];
  return enrollments.find(e => e.id === id) || null;
}

/**
 * Get a single enrollment by lessonId and userId
 * @param {string} lessonId - Lesson id
 * @param {string} userId - User id
 * @returns {Promise<Object|null>} The enrollment object or null if not found
 */
async function getEnrollmentByLessonAndUser(lessonId, userId) {
  await initDb();
  
  const enrollments = await storage.getItem('enrollments') || [];
  return enrollments.find(e => e.lessonId === lessonId && e.userId === userId) || null;
}

/**
 * List all enrollments for a specific lesson
 * @param {string} lessonId - Lesson id
 * @returns {Promise<Array>} Array of enrollment objects
 */
async function listEnrollmentsByLesson(lessonId) {
  await initDb();
  
  const enrollments = await storage.getItem('enrollments') || [];
  return enrollments.filter(e => e.lessonId === lessonId);
}

/**
 * List all enrollments for a specific user
 * @param {string} userId - User id
 * @returns {Promise<Array>} Array of enrollment objects
 */
async function listEnrollmentsByUser(userId) {
  await initDb();
  
  const enrollments = await storage.getItem('enrollments') || [];
  return enrollments.filter(e => e.userId === userId);
}

/**
 * Update an enrollment by id
 * @param {string} id - Enrollment id
 * @param {Object} updateData - Fields to update (primarily progress and status)
 * @returns {Promise<Object|null>} The updated enrollment or null if not found
 */
async function updateEnrollment(id, updateData) {
  await initDb();
  
  const enrollments = await storage.getItem('enrollments') || [];
  const index = enrollments.findIndex(e => e.id === id);
  
  if (index === -1) return null;
  
  // Merge updates, preserving id, lessonId, userId, and enrolledAt
  const updated = {
    ...enrollments[index],
    ...updateData,
    id: enrollments[index].id,
    lessonId: enrollments[index].lessonId,
    userId: enrollments[index].userId,
    enrolledAt: enrollments[index].enrolledAt
  };
  
  enrollments[index] = updated;
  await storage.setItem('enrollments', enrollments);
  
  return updated;
}

/**
 * List all enrollments (raw access for cron jobs)
 * @returns {Promise<Array>} Array of all enrollment objects
 */
async function listAllEnrollments() {
  await initDb();
  
  const enrollments = await storage.getItem('enrollments') || [];
  return enrollments;
}

// ==================== USER CRUD FUNCTIONS ====================

/**
 * Finds a user record based on email address.
 * @param {string} email - The user's email address.
 * @returns {Promise<Object|undefined>} The user object or undefined if not found.
 */
async function findUserByEmail(email) {
  await initDb();
  
  const users = await storage.getItem('users') || [];
  return users.find(u => u.email === email);
}

/**
 * Saves a new user record. Assigns a unique ID and a default role.
 * @param {Object} user - User data including email and passwordHash.
 * @returns {Promise<Object>} The newly created user object.
 */
async function saveUser(user) {
  await initDb();
  
  const users = await storage.getItem('users') || [];
  
  // Check if user already exists
  const existingUser = await findUserByEmail(user.email);
  if (existingUser) {
    throw new Error('User with this email already exists.');
  }

  const newUser = {
    userId: Date.now().toString() + Math.random().toString(36).substring(2, 9), // Simple unique ID
    role: user.role || 'student', // Default to student
    reminderFrequency: user.reminderFrequency || 'weekly', // Default reminder frequency
    ...user
  };
  
  users.push(newUser);
  await storage.setItem('users', users);
  return newUser;
}

// ==================== ATTENDANCE OPERATIONS ====================

/**
 * Save an attendance record to storage
 * @param {Object} record - Attendance record with studentId, lessonId, date, status
 * @returns {Promise<Object>} The created attendance record with id
 */
async function saveAttendanceRecord(record) {
  await initDb();
  
  const { studentId, lessonId, date, status } = record;
  
  // Validate required fields
  if (!studentId || !lessonId || !date || !status) {
    throw new Error('Missing required fields: studentId, lessonId, date, status');
  }
  
  // Validate status
  if (!['present', 'absent'].includes(status)) {
    throw new Error('Status must be either "present" or "absent"');
  }
  
  const now = Date.now();
  const id = now + Math.random().toString(36).substring(2, 9);
  
  const attendanceRecord = {
    id,
    studentId,
    lessonId,
    date, // ISO date string (YYYY-MM-DD)
    status, // 'present' or 'absent'
    markedAt: now,
    markedBy: record.markedBy || null // instructorId who marked attendance
  };
  
  const attendanceRecords = await storage.getItem('attendance') || [];
  attendanceRecords.push(attendanceRecord);
  await storage.setItem('attendance', attendanceRecords);
  
  return attendanceRecord;
}

/**
 * Get attendance records with optional filters
 * @param {Object} filter - Filter object with optional studentId, lessonId, date
 * @returns {Promise<Array>} Array of attendance records matching the filter
 */
async function getAttendanceRecords(filter = {}) {
  await initDb();
  
  let records = await storage.getItem('attendance') || [];
  
  // Apply filters
  if (filter.studentId) {
    records = records.filter(r => r.studentId === filter.studentId);
  }
  
  if (filter.lessonId) {
    records = records.filter(r => r.lessonId === filter.lessonId);
  }
  
  if (filter.date) {
    records = records.filter(r => r.date === filter.date);
  }
  
  if (filter.status) {
    records = records.filter(r => r.status === filter.status);
  }
  
  if (filter.markedBy) {
    records = records.filter(r => r.markedBy === filter.markedBy);
  }
  
  return records;
}

/**
 * Update an attendance record
 * @param {string} id - Attendance record ID
 * @param {Object} updates - Fields to update (status, date, etc.)
 * @returns {Promise<Object|null>} Updated record or null if not found
 */
async function updateAttendanceRecord(id, updates) {
  await initDb();
  
  const records = await storage.getItem('attendance') || [];
  const index = records.findIndex(r => r.id === id);
  
  if (index === -1) {
    return null;
  }
  
  // Validate status if being updated
  if (updates.status && !['present', 'absent'].includes(updates.status)) {
    throw new Error('Status must be either "present" or "absent"');
  }
  
  records[index] = {
    ...records[index],
    ...updates,
    updatedAt: Date.now()
  };
  
  await storage.setItem('attendance', records);
  return records[index];
}

/**
 * Delete an attendance record
 * @param {string} id - Attendance record ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteAttendanceRecord(id) {
  await initDb();
  
  const records = await storage.getItem('attendance') || [];
  const index = records.findIndex(r => r.id === id);
  
  if (index === -1) {
    return false;
  }
  
  records.splice(index, 1);
  await storage.setItem('attendance', records);
  return true;
}

/**
 * Get attendance statistics for a lesson
 * @param {string} lessonId - Lesson ID
 * @param {string} date - Optional date filter (YYYY-MM-DD)
 * @returns {Promise<Object>} Statistics object with present/absent counts
 */
async function getAttendanceStats(lessonId, date = null) {
  await initDb();
  
  let records = await getAttendanceRecords({ lessonId });
  
  if (date) {
    records = records.filter(r => r.date === date);
  }
  
  const stats = {
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    attendanceRate: 0
  };
  
  if (stats.total > 0) {
    stats.attendanceRate = Math.round((stats.present / stats.total) * 100);
  }
  
  return stats;
}

// ========================================
// ADMIN USER MANAGEMENT
// ========================================

/**
 * Get all users (admin function)
 * @returns {Array} Array of all users
 */
async function getAllUsers() {
  const users = await storage.getItem('users') || [];
  return users;
}

/**
 * Delete a user by ID (admin function)
 * @param {string} userId - User ID to delete
 * @returns {boolean} True if deleted, false if not found
 */
async function deleteUser(userId) {
  const users = await storage.getItem('users') || [];
  const index = users.findIndex(u => u.userId === userId);
  
  if (index === -1) {
    return false;
  }
  
  users.splice(index, 1);
  await storage.setItem('users', users);
  return true;
}

/**
 * Update user role (admin function)
 * @param {string} userId - User ID to update
 * @param {string} newRole - New role (student, instructor, admin)
 * @returns {Object|null} Updated user without password, or null if not found
 */
async function updateUserRole(userId, newRole) {
  const users = await storage.getItem('users') || [];
  const user = users.find(u => u.userId === userId);
  
  if (!user) {
    return null;
  }
  
  user.role = newRole;
  await storage.setItem('users', users);
  
  const { password, passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

module.exports = {
  initDb,
  // Lesson CRUD
  addLesson,
  getLesson,
  updateLesson,
  deleteLesson,
  listLessons,
  // Enrollment CRUD
  addEnrollment,
  getEnrollment,
  getEnrollmentByLessonAndUser,
  listEnrollmentsByLesson,
  listEnrollmentsByUser,
  updateEnrollment,
  listAllEnrollments,
  // User CRUD
  findUserByEmail,
  saveUser,
  getAllUsers,
  deleteUser,
  updateUserRole,
  // Attendance CRUD
  saveAttendanceRecord,
  getAttendanceRecords,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  getAttendanceStats
};
