const { listLessons } = require('../../db');

/**
 * GET /api/courses/search?q=term
 * Search lessons (treated as courses) by title or description using case-insensitive regex.
 * Returns up to 5 results.
 */
const searchCourses = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();

    if (!q) {
      return res.json({ ok: true, courses: [] });
    }

    // Escape regex special chars
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
    const re = new RegExp(escapeRegExp(q), 'i');

    const lessons = await listLessons();

    const matches = (lessons || []).filter(l => {
      return re.test(l.title || '') || re.test(l.description || '');
    }).slice(0, 5).map(l => ({
      id: l.id,
      title: l.title,
      description: l.description || '',
      topic: l.topic || '',
      url: `/lesson.html?id=${l.id}`
    }));

    return res.json({ ok: true, courses: matches });
  } catch (error) {
    console.error('Error in searchCourses:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
};

module.exports = { searchCourses };
