// scripts/student-dashboard.js
// Handles student dashboard with backend integration

const API_BASE_URL = 'http://localhost:3001/api';
const CURRENT_USER_ID = 'S101'; // Hardcoded student ID

document.addEventListener('DOMContentLoaded', async () => {
  // Sidebar nav highlight
  document.querySelectorAll('.sidebar nav a').forEach(link => {
    link.addEventListener('click', e => {
      document.querySelectorAll('.sidebar nav a').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      e.preventDefault();
    });
  });

  // Load dashboard data
  await loadDashboard();
});

/**
 * Load all dashboard data: available lessons and user enrollments
 */
async function loadDashboard() {
  try {
    // Fetch both lessons and enrollments concurrently
    const [lessonsResponse, enrollmentsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/lessons`),
      fetch(`${API_BASE_URL}/enrollments/user/${CURRENT_USER_ID}`)
    ]);

    if (!lessonsResponse.ok) {
      throw new Error(`Failed to fetch lessons: ${lessonsResponse.status}`);
    }
    if (!enrollmentsResponse.ok) {
      throw new Error(`Failed to fetch enrollments: ${enrollmentsResponse.status}`);
    }

    const lessonsData = await lessonsResponse.json();
    const enrollmentsData = await enrollmentsResponse.json();

    const allLessons = lessonsData.lessons || [];
    const myEnrollments = enrollmentsData.enrollments || [];

    // Create a map of enrolled lesson IDs for quick lookup
    const enrolledLessonIds = new Set(myEnrollments.map(e => e.lessonId));
    
    // Create a map of enrollments by lesson ID
    const enrollmentsByLessonId = {};
    myEnrollments.forEach(enrollment => {
      enrollmentsByLessonId[enrollment.lessonId] = enrollment;
    });

    // Separate available lessons (not enrolled) from enrolled lessons
    const availableLessons = allLessons.filter(lesson => 
      lesson.status === 'published' && !enrolledLessonIds.has(lesson.id)
    );
    
    const enrolledLessons = allLessons.filter(lesson => 
      enrolledLessonIds.has(lesson.id)
    );

    // Render both sections
    renderAvailableLessons(availableLessons);
    renderMyLessons(enrolledLessons, enrollmentsByLessonId);
    updatePerformanceStats(myEnrollments);

  } catch (error) {
    console.error('Error loading dashboard:', error);
    showError('Failed to load dashboard data. Please try again later.');
  }
}

/**
 * Render available lessons (not yet enrolled)
 */
function renderAvailableLessons(lessons) {
  const container = document.getElementById('courses-overview');
  
  if (!container) {
    console.warn('courses-overview container not found');
    return;
  }

  // Clear existing content
  container.innerHTML = '<h2>Available Lessons</h2>';

  if (lessons.length === 0) {
    container.innerHTML += '<p style="color: #666;">No available lessons at this time.</p>';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'courses-grid';

  lessons.forEach(lesson => {
    const card = document.createElement('div');
    card.className = 'course-card';
    
    card.innerHTML = `
      <h3>${escapeHtml(lesson.title)}</h3>
      <p>${escapeHtml(lesson.description || 'No description available')}</p>
      <p><strong>Topic:</strong> ${escapeHtml(lesson.topic || 'N/A')}</p>
      <button class="enroll-btn" data-lesson-id="${lesson.id}">Enroll Now</button>
    `;

    // Add enroll button event listener
    const enrollBtn = card.querySelector('.enroll-btn');
    enrollBtn.addEventListener('click', () => enrollInLesson(lesson.id, lesson.title));

    grid.appendChild(card);
  });

  container.appendChild(grid);
}

/**
 * Render user's enrolled lessons with progress
 */
function renderMyLessons(lessons, enrollmentsByLessonId) {
  const container = document.getElementById('upcoming-lessons');
  
  if (!container) {
    console.warn('upcoming-lessons container not found');
    return;
  }

  // Clear existing content
  container.innerHTML = '<h2>My Lessons</h2>';

  if (lessons.length === 0) {
    container.innerHTML += '<p style="color: #666;">You are not enrolled in any lessons yet. Explore available lessons above!</p>';
    return;
  }

  const list = document.createElement('ul');
  list.className = 'lessons-list';

  lessons.forEach(lesson => {
    const enrollment = enrollmentsByLessonId[lesson.id];
    const progress = enrollment ? enrollment.progress : 0;
    const status = enrollment ? enrollment.status : 'active';

    const listItem = document.createElement('li');
    listItem.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0;">
        <div>
          <strong>${escapeHtml(lesson.title)}</strong>
          <br>
          <small>Status: ${escapeHtml(status)} | Progress: ${progress}%</small>
        </div>
        <a href="lesson-player.html?lessonId=${lesson.id}&enrollmentId=${enrollment.id}" 
           style="padding: 0.5rem 1rem; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">
          ${progress === 100 ? 'Review' : 'Continue'}
        </a>
      </div>
    `;

    list.appendChild(listItem);
  });

  container.appendChild(list);
}

/**
 * Update performance statistics
 */
function updatePerformanceStats(enrollments) {
  const performanceContainer = document.getElementById('performance');
  
  if (!performanceContainer) {
    return;
  }

  const completedCount = enrollments.filter(e => e.status === 'completed' || e.progress === 100).length;
  const totalCount = enrollments.length;
  const attendanceRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  performanceContainer.innerHTML = `
    <h2>Performance</h2>
    <div class="performance-cards">
      <div class="performance-card">Lessons Enrolled: ${totalCount}</div>
      <div class="performance-card">Lessons Completed: ${completedCount}</div>
      <div class="performance-card">Completion Rate: ${attendanceRate}%</div>
    </div>
  `;
}

/**
 * Enroll user in a lesson
 */
async function enrollInLesson(lessonId, lessonTitle) {
  try {
    const response = await fetch(`${API_BASE_URL}/enrollments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lessonId: lessonId,
        userId: CURRENT_USER_ID
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to enroll: ${response.status}`);
    }

    const data = await response.json();
    
    // Show success message
    showSuccess(`Successfully enrolled in "${lessonTitle}"!`);
    
    // Reload dashboard to reflect changes
    await loadDashboard();

  } catch (error) {
    console.error('Error enrolling in lesson:', error);
    showError(`Failed to enroll: ${error.message}`);
  }
}

/**
 * Utility: Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show error message
 */
function showError(message) {
  const existingMsg = document.getElementById('dashboard-message');
  if (existingMsg) {
    existingMsg.remove();
  }

  const msg = document.createElement('div');
  msg.id = 'dashboard-message';
  msg.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 1rem; background: #dc3545; color: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 1000;';
  msg.textContent = message;
  document.body.appendChild(msg);

  setTimeout(() => msg.remove(), 5000);
}

/**
 * Show success message
 */
function showSuccess(message) {
  const existingMsg = document.getElementById('dashboard-message');
  if (existingMsg) {
    existingMsg.remove();
  }

  const msg = document.createElement('div');
  msg.id = 'dashboard-message';
  msg.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 1rem; background: #28a745; color: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 1000;';
  msg.textContent = message;
  document.body.appendChild(msg);

  setTimeout(() => msg.remove(), 3000);
}