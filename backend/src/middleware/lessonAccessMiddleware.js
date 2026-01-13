const { getEnrollment, getLesson } = require('../../db');

/**
 * Middleware to block access to enrollment actions when a lesson is locked by deadline.
 * Expects :enrollmentId in req.params and req.user to be set.
 */
async function checkEnrollmentLock(req, res, next) {
  try {
    const { enrollmentId } = req.params;
    if (!enrollmentId) return res.status(400).json({ ok: false, error: 'enrollmentId is required' });

    const enrollment = await getEnrollment(enrollmentId);
    if (!enrollment) return res.status(404).json({ ok: false, error: 'Enrollment not found' });

    const lesson = await getLesson(enrollment.lessonId);
    if (!lesson) return res.status(404).json({ ok: false, error: 'Lesson not found' });

    // Only enforce for students on their own enrollments
    if (req.user && req.user.role === 'student' && req.user.id === enrollment.userId) {
      if (lesson.deadline) {
        const now = new Date();
        const deadline = new Date(lesson.deadline);
        if (now > deadline && !enrollment.redoGranted) {
          return res.status(403).json({ ok: false, code: 'LESSON_LOCKED', error: 'Lesson is locked due to missed deadline' });
        }
      }
    }

    // otherwise allow
    return next();
  } catch (err) {
    console.error('Error in checkEnrollmentLock middleware:', err);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}

module.exports = {
  checkEnrollmentLock
};
