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
    status: 'active',
    progress: 0
  };
  
  enrollments.push(enrollment);
  await storage.setItem('enrollments', enrollments);
  
  return enrollment;
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
    ...user
  };
  
  users.push(newUser);
  await storage.setItem('users', users);
  return newUser;
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
  getEnrollmentByLessonAndUser,
  listEnrollmentsByLesson,
  listEnrollmentsByUser,
  updateEnrollment,
  listAllEnrollments,
  // User CRUD
  findUserByEmail,
  saveUser
};
