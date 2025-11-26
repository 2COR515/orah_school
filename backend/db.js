// db.js - node-persist database utility for Lesson CRUD operations
const storage = require('node-persist');
const path = require('path');

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

module.exports = {
  initDb,
  addLesson,
  getLesson,
  updateLesson,
  deleteLesson,
  listLessons
};
