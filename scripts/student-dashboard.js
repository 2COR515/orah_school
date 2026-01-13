// scripts/student-dashboard.js
// Student dashboard with lesson fetching and enrollment filtering

const API_BASE_URL = 'http://localhost:3002/api';

// Get current user ID from localStorage (set during login)
const CURRENT_USER_ID = localStorage.getItem('userId') || 'S101';

document.addEventListener('DOMContentLoaded', async () => {
  // Personalize greeting with user's first name
  await personalizeGreeting();
  
  // Load dashboard data
  await loadDashboard();
  
  // Auto-refresh stats every 10 seconds
  setInterval(async () => {
    console.log('⏰ Auto-refresh: Updating dashboard...');
    await loadDashboard();
  }, 10000);
});

// Refresh dashboard when page becomes visible (returning from lesson player)
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden) {
    console.log('👁️ Page visible - refreshing dashboard stats...');
    await loadDashboard();
  }
});

// Also refresh when window regains focus
window.addEventListener('focus', async () => {
  console.log('🎯 Window focused - refreshing dashboard stats...');
  await loadDashboard();
});

/**
 * Personalize greeting with student's first name
 * Fetches user profile and updates welcome message
 */
async function personalizeGreeting() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('⚠️ No token available for greeting personalization');
      return;
    }
    
    // Fetch user profile
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      console.warn('⚠️ Could not fetch user profile for greeting:', response.status);
      return;
    }
    
    const data = await response.json();
    const user = data.user || data;
    
    // Get full name from various possible fields
    const fullName = user.name || user.fullName || 
                     (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null) ||
                     'Student';
    
    // Extract first name (first word of full name)
    const firstName = fullName.split(' ')[0];
    
    // Update the welcome message
    const welcomeElement = document.getElementById('welcome-message');
    if (welcomeElement) {
      welcomeElement.textContent = `Welcome, ${firstName}`;
      console.log(`👋 Personalized greeting: Welcome, ${firstName}`);
    }
  } catch (error) {
    console.error('❌ Error personalizing greeting:', error);
    // Continue without personalization - use default fallback
  }
}

/**
 * Load all dashboard data: lessons and enrollments
 */
async function loadDashboard() {
  console.log('🔄 Loading dashboard data...');
  const token = localStorage.getItem('token');
  
  // Check if token exists
  if (!token) {
    console.error('❌ No token found');
    alert('Please log in to continue');
    window.location.href = 'login.html';
    return;
  }
  
  console.log('🔑 Using token:', token.substring(0, 20) + '...');
  console.log('👤 Fetching data for user:', CURRENT_USER_ID);
  
  try {
    // Fetch lessons and enrollments in parallel with authentication
    const [lessonsResponse, enrollmentsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/lessons`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(err => {
        console.error('❌ Lessons fetch error:', err);
        return { ok: false };
      }),
      fetch(`${API_BASE_URL}/enrollments/user/${CURRENT_USER_ID}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(err => {
        console.error('❌ Enrollments fetch error:', err);
        return { ok: false };
      })
    ]);
    
    // Check for auth errors (403)
    if (lessonsResponse.status === 403 || enrollmentsResponse.status === 403) {
      console.error('❌ Authentication failed (403 Forbidden)');
      const errorData = await (enrollmentsResponse.status === 403 ? enrollmentsResponse : lessonsResponse).json();
      console.error('Error details:', errorData);
      alert('Your session has expired. Please log in again.');
      localStorage.clear();
      window.location.href = 'login.html';
      return;
    }
    
    // Check for other auth errors (401)
    if (lessonsResponse.status === 401 || enrollmentsResponse.status === 401) {
      console.error('❌ Authentication required (401 Unauthorized)');
      alert('Please log in to continue');
      localStorage.clear();
      window.location.href = 'login.html';
      return;
    }

    let allLessons = [];
    let myEnrollments = [];

    // Parse lessons response
    if (lessonsResponse.ok) {
      const lessonsData = await lessonsResponse.json();
      allLessons = lessonsData.lessons || [];
    }

    // Parse enrollments response
    if (enrollmentsResponse.ok) {
      const enrollmentsData = await enrollmentsResponse.json();
      myEnrollments = enrollmentsData.enrollments || [];
    }

    // Create enrollment lookup map
    const enrolledLessonIds = new Set(myEnrollments.map(e => e.lessonId));
    const enrollmentsByLessonId = {};
    myEnrollments.forEach(enrollment => {
      enrollmentsByLessonId[enrollment.lessonId] = enrollment;
    });

    // Separate enrolled and available lessons
    const enrolledLessons = allLessons.filter(lesson => 
      enrolledLessonIds.has(lesson.id)
    );
    const availableLessons = allLessons.filter(lesson => 
      lesson.status === 'published' && !enrolledLessonIds.has(lesson.id)
    );

    // Render sections
    renderMyLessons(enrolledLessons, enrollmentsByLessonId);
    renderAvailableLessons(availableLessons);
    updatePerformanceStats(myEnrollments);
    
    // Check for reminders (incomplete lessons older than 2 days)
    checkAndShowReminders(myEnrollments, allLessons);

  } catch (error) {
    console.error('Dashboard error:', error);
    showError('Failed to load dashboard. Please refresh the page.');
  }
}

/**
 * Render enrolled lessons
 */
function renderMyLessons(lessons, enrollmentsByLessonId) {
  const container = document.getElementById('upcoming-lessons') ||
                    document.getElementById('my-lessons-list') ||
                    createSection('My Enrolled Lessons', 'my-lessons-container');

  // CRITICAL FIX: Clear the container's current contents to prevent duplicates
  if (container) {
    container.innerHTML = '';
  }
  
  container.innerHTML = '<h2>My Enrolled Lessons</h2>';

  if (lessons.length === 0) {
    container.innerHTML += '<p style="color: #666;">You are not enrolled in any lessons yet. Browse available lessons below!</p>';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'orah-grid';
  grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;';

  lessons.forEach(lesson => {
    console.log(lesson); // Debug: inspect lesson object structure

    const lessonId = lesson.id || lesson._id;
    const enrollment = enrollmentsByLessonId[lessonId];
    const progress = enrollment ? enrollment.progress : 0;

    const card = document.createElement('div');
    card.className = 'orah-card orah-lesson-card';
    card.style.cssText = 'background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; flex-direction: column;';
    card.innerHTML = `
      <div class="orah-card-body" style="flex-grow: 1;">
        <div class="orah-card-name" style="font-size: 1.25rem; font-weight: 600; color: #3B0270; margin-bottom: 0.5rem;">${escapeHtml(lesson.title)}</div>
        <p class="course-description text-clamp-3" style="color: #666; margin-bottom: 0.5rem; margin-top: 0;">${escapeHtml(lesson.description || 'No description')}</p>
        <button class="read-more-trigger" style="margin-bottom: 0.75rem;">Read More</button>
        <div style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">
          Progress: ${progress}%
        </div>
      </div>
      <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
        <a href="lesson-player.html?id=${lessonId}&enrollmentId=${enrollment ? enrollment.id : ''}"
           style="flex: 1; padding: 0.75rem; background: #6F00FF; color: white; text-decoration: none; display: block; text-align: center; border-radius: 4px; font-weight: 600;">
          ${progress === 100 ? 'Review Lesson' : 'Watch Now →'}
        </a>
        <button class="unenroll-btn" data-enrollment-id="${enrollment ? enrollment.id : ''}" data-lesson-title="${escapeHtml(lesson.title)}"
                style="padding: 0.75rem 1rem; background: #ff3b3b; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; transition: background 0.2s;"
                onmouseover="this.style.background='#cc0000'" onmouseout="this.style.background='#ff3b3b'">
          Unenroll
        </button>
      </div>
    `;
    
    // Add event listener for unenroll button
    const unenrollBtn = card.querySelector('.unenroll-btn');
    if (unenrollBtn) {
      unenrollBtn.addEventListener('click', () => {
        const enrollmentId = unenrollBtn.getAttribute('data-enrollment-id');
        const lessonTitle = unenrollBtn.getAttribute('data-lesson-title');
        handleUnenrollment(enrollmentId, lessonTitle);
      });
    }
    
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

/**
 * Render available lessons (not enrolled)
 */
function renderAvailableLessons(lessons) {
  const container = document.getElementById('courses-overview') ||
                    document.getElementById('available-lessons-list') ||
                    createSection('Available Lessons', 'available-lessons-container');

  // CRITICAL FIX: Clear the container's current contents to prevent duplicates
  if (container) {
    container.innerHTML = '';
  }
  
  container.innerHTML = '<h2>Available Lessons</h2>';

  if (lessons.length === 0) {
    container.innerHTML += '<p style="color: #666;">No new lessons available at this time.</p>';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'orah-grid';
  grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;';

  lessons.forEach(lesson => {
    const lessonId = lesson.id || lesson._id;
    const card = document.createElement('div');
    card.className = 'orah-card orah-lesson-card';
    card.style.cssText = 'background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; flex-direction: column;';
    card.innerHTML = `
      <div class="orah-card-body" style="flex-grow: 1;">
        <div class="orah-card-name" style="font-size: 1.25rem; font-weight: 600; color: #3B0270; margin-bottom: 0.5rem;">${escapeHtml(lesson.title)}</div>
        <p class="course-description text-clamp-3" style="color: #666; margin-bottom: 0.5rem; margin-top: 0;">${escapeHtml(lesson.description || 'No description')}</p>
        <button class="read-more-trigger" style="margin-bottom: 0.75rem;">Read More</button>
        <div style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">
          Topic: ${escapeHtml(lesson.topic || 'General')}
        </div>
      </div>
      <button 
         class="orah-btn orah-btn-accent enroll-btn"
         data-lesson-id="${lessonId}"
         style="margin-top: 1rem; padding: 0.75rem; background: #6F00FF; color: white; border: none; border-radius: 4px; font-weight: 600; text-align: center; cursor: pointer;">
        Enroll Now
      </button>
    `;
    
    // Add click event listener for enrollment
    const enrollBtn = card.querySelector('.enroll-btn');
    enrollBtn.addEventListener('click', () => handleEnrollment(lessonId));
    
    grid.appendChild(card);
  });

  container.appendChild(grid);
}



/**
 * Update performance stats
 */
function updatePerformanceStats(enrollments) {
  console.log('Updating performance stats with', enrollments.length, 'enrollments');
  
  const completedCount = enrollments.filter(e => e.progress === 100).length;
  const totalCount = enrollments.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  console.log(`Stats: Enrolled=${totalCount}, Completed=${completedCount}, Rate=${completionRate}%`);

  const enrolledSpan = document.getElementById('enrolled-count');
  const completedSpan = document.getElementById('completed-count');
  const rateSpan = document.getElementById('completion-rate');

  if (enrolledSpan) {
    enrolledSpan.textContent = totalCount;
    console.log('Updated enrolled-count to', totalCount);
  } else {
    console.warn('enrolled-count element not found');
  }
  
  if (completedSpan) {
    completedSpan.textContent = completedCount;
    console.log('Updated completed-count to', completedCount);
  } else {
    console.warn('completed-count element not found');
  }
  
  if (rateSpan) {
    rateSpan.textContent = `${completionRate}%`;
    console.log('Updated completion-rate to', completionRate + '%');
  } else {
    console.warn('completion-rate element not found');
  }
}

/**
 * Handle enrollment and redirect to lesson player
 */
async function handleEnrollment(lessonId) {
  try {
    const response = await fetch(`${API_BASE_URL}/enrollments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lessonId: lessonId,
        userId: CURRENT_USER_ID
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Enrollment failed');
    }

    const data = await response.json();
    
    // Verify we got an enrollment ID
    if (!data.enrollment || !data.enrollment.id) {
      throw new Error('Enrollment succeeded but no enrollment ID was returned');
    }
    
    const enrollmentId = data.enrollment.id;
    
    // Refresh the dashboard to show the updated enrollment list and stats
    // This happens in the background before redirect
    await loadDashboard();
    
    // Show success message
    showSuccess('Successfully enrolled! Redirecting to lesson player...');
    
    // Small delay to allow user to see the updated dashboard
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Redirect to lesson player with both lessonId and enrollmentId
    window.location.href = `lesson-player.html?id=${lessonId}&enrollmentId=${enrollmentId}`;

  } catch (error) {
    console.error('Enrollment error:', error);
    showError(`Failed to enroll: ${error.message}`);
  }
}

/**
 * Enroll in a lesson (legacy function for backward compatibility)
 */
async function enrollInLesson(lessonId, lessonTitle) {
  try {
    const response = await fetch(`${API_BASE_URL}/enrollments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lessonId: lessonId,
        userId: CURRENT_USER_ID
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Enrollment failed');
    }

    showSuccess(`Successfully enrolled in "${lessonTitle}"!`);
    await loadDashboard(); // Reload to show updated state

  } catch (error) {
    console.error('Enrollment error:', error);
    showError(`Failed to enroll: ${error.message}`);
  }
}

/**
 * Handle unenrollment from a lesson
 * @param {string} enrollmentId - The enrollment ID to delete
 * @param {string} lessonTitle - The lesson title for confirmation message
 */
async function handleUnenrollment(enrollmentId, lessonTitle) {
  try {
    // Confirm with user before deleting
    const confirmed = confirm(`Are you sure you want to unenroll from "${lessonTitle}"?\n\nYour progress will be lost.`);
    
    if (!confirmed) {
      console.log('Unenrollment cancelled by user');
      return;
    }

    console.log(`🗑️ Unenrolling from lesson: ${lessonTitle} (enrollment ID: ${enrollmentId})`);

    const response = await fetch(`${API_BASE_URL}/enrollments/${enrollmentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Enrollment not found or already deleted');
      } else if (response.status === 403) {
        throw new Error('You do not have permission to delete this enrollment');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Unenrollment failed');
      }
    }

    console.log('✅ Successfully unenrolled');
    showSuccess(`Successfully unenrolled from "${lessonTitle}"`);
    
    // Reload dashboard to reflect changes
    await loadDashboard();

  } catch (error) {
    console.error('❌ Unenrollment error:', error);
    showError(`Failed to unenroll: ${error.message}`);
  }
}

/**
 * Create a section if it doesn't exist
 */
function createSection(title, id) {
  // CRITICAL FIX: Check if section already exists before creating
  let section = document.getElementById(id);
  if (section) {
    return section;
  }
  
  const main = document.querySelector('.student-main') || 
               document.querySelector('.dashboard-main') || 
               document.body;
  
  section = document.createElement('section');
  section.id = id;
  section.className = 'dashboard-section';
  main.appendChild(section);
  return section;
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
  showToast(message, '#ff3b3b');
}

/**
 * Show success message
 */
function showSuccess(message) {
  showToast(message, '#28a745');
}

/**
 * Show toast notification
 */
function showToast(message, bgColor) {
  const existing = document.getElementById('dashboard-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'dashboard-toast';
  toast.style.cssText = `
    position: fixed; 
    top: 20px; 
    right: 20px; 
    background: ${bgColor}; 
    color: white; 
    padding: 1rem 1.5rem; 
    border-radius: 8px; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
    z-index: 10000;
    font-size: 1rem;
    max-width: 350px;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 4000);
}

/**
 * Check for incomplete lessons and show reminder notification
 */
function checkAndShowReminders(enrollments, allLessons) {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
  
  // Find incomplete lessons older than 2 days
  const incompleteLessons = enrollments.filter(enrollment => {
    const enrolledDate = new Date(enrollment.enrolledAt);
    return enrollment.progress < 100 && enrolledDate < twoDaysAgo;
  });
  
  if (incompleteLessons.length === 0) return;
  
  // Get lesson titles
  const lessonMap = {};
  allLessons.forEach(lesson => {
    lessonMap[lesson.id] = lesson.title;
  });
  
  // Show reminder notification
  showReminderNotification(incompleteLessons, lessonMap);
}

/**
 * Show reminder notification popup
 */
function showReminderNotification(incompleteLessons, lessonMap) {
  // Check if notification was dismissed today
  const dismissedDate = localStorage.getItem('reminderDismissedDate');
  const today = new Date().toDateString();
  
  if (dismissedDate === today) {
    return; // Don't show again today
  }
  
  const overlay = document.createElement('div');
  overlay.id = 'reminder-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
  `;
  
  const notification = document.createElement('div');
  notification.style.cssText = `
    background: white;
    border-radius: 16px;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(111, 0, 255, 0.25);
    animation: slideIn 0.3s ease;
    position: relative;
  `;
  
  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideIn {
      from { transform: translateY(-30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  // Build lesson list
  let lessonListHTML = incompleteLessons.slice(0, 3).map(enrollment => {
    const title = lessonMap[enrollment.lessonId] || 'Unknown Lesson';
    const progress = enrollment.progress;
    const progressColor = progress >= 50 ? '#ffc107' : '#6c757d';
    
    return `
      <div style="margin: 1rem 0; padding: 1rem; background: #f9f6ff; border-radius: 8px; border-left: 4px solid #6F00FF;">
        <div style="font-weight: 600; color: #3B0270; margin-bottom: 0.5rem;">${escapeHtml(title)}</div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="flex: 1; height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden;">
            <div style="width: ${progress}%; height: 100%; background: ${progressColor};"></div>
          </div>
          <span style="font-size: 0.85rem; color: #666; font-weight: 600;">${progress}%</span>
        </div>
      </div>
    `;
  }).join('');
  
  if (incompleteLessons.length > 3) {
    lessonListHTML += `<div style="text-align: center; color: #666; font-size: 0.9rem; margin-top: 0.5rem;">...and ${incompleteLessons.length - 3} more</div>`;
  }
  
  notification.innerHTML = `
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #6F00FF 0%, #3B0270 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </div>
      <h2 style="color: #3B0270; margin: 0; font-size: 1.5rem;">Lesson Reminder 📚</h2>
      <p style="color: #666; margin: 0.5rem 0 0;">You have ${incompleteLessons.length} incomplete ${incompleteLessons.length === 1 ? 'lesson' : 'lessons'}. Let's get back on track!</p>
    </div>
    
    ${lessonListHTML}
    
    <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
      <button id="reminder-dismiss-btn" style="flex: 1; padding: 0.75rem; background: #e0e0e0; color: #333; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
        Remind Me Later
      </button>
      <button id="reminder-view-btn" style="flex: 1; padding: 0.75rem; background: linear-gradient(135deg, #6F00FF 0%, #3B0270 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: transform 0.2s;">
        View Lessons
      </button>
    </div>
  `;
  
  overlay.appendChild(notification);
  document.body.appendChild(overlay);
  
  // Add button hover effects
  const dismissBtn = notification.querySelector('#reminder-dismiss-btn');
  const viewBtn = notification.querySelector('#reminder-view-btn');
  
  dismissBtn.onmouseover = () => dismissBtn.style.background = '#d0d0d0';
  dismissBtn.onmouseout = () => dismissBtn.style.background = '#e0e0e0';
  
  viewBtn.onmouseover = () => viewBtn.style.transform = 'scale(1.02)';
  viewBtn.onmouseout = () => viewBtn.style.transform = 'scale(1)';
  
  // Dismiss button
  dismissBtn.addEventListener('click', () => {
    localStorage.setItem('reminderDismissedDate', today);
    overlay.remove();
  });
  
  // View lessons button - scroll to my lessons section
  viewBtn.addEventListener('click', () => {
    overlay.remove();
    const myLessonsSection = document.getElementById('my-lessons-container') || 
                            document.getElementById('upcoming-lessons');
    if (myLessonsSection) {
      myLessonsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      localStorage.setItem('reminderDismissedDate', today);
      overlay.remove();
    }
  });
}

// ==================== REMINDER PREFERENCES ====================

/**
 * Load user's current reminder preference setting
 */
async function loadReminderPreference() {
  console.log('📧 Loading reminder preference...');
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.warn('⚠️  No auth token found');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to load profile: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.ok && data.user) {
      const frequency = data.user.reminderFrequency || 'weekly';
      const selectElement = document.getElementById('frequency-select');
      
      if (selectElement) {
        selectElement.value = frequency;
        console.log(`✅ Current reminder frequency: ${frequency}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error loading reminder preference:', error);
  }
}

/**
 * Save user's reminder preference
 */
async function saveReminderPreference() {
  console.log('💾 Saving reminder preference...');
  const token = localStorage.getItem('token');
  const selectElement = document.getElementById('frequency-select');
  const messageBox = document.getElementById('frequency-message');
  const saveButton = document.getElementById('save-frequency-btn');
  
  if (!token) {
    showMessage('Please log in to save preferences', 'error');
    return;
  }
  
  if (!selectElement) {
    console.error('❌ Frequency select element not found');
    return;
  }
  
  const newFrequency = selectElement.value;
  
  // Disable button while saving
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reminderFrequency: newFrequency
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.ok) {
      console.log(`✅ Reminder frequency updated to: ${newFrequency}`);
      showMessage('✅ Preferences saved successfully!', 'success');
    } else {
      throw new Error(data.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Error saving reminder preference:', error);
    showMessage(`❌ Failed to save: ${error.message}`, 'error');
  } finally {
    // Re-enable button
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = 'Save Preferences';
    }
  }
}

/**
 * Show success or error message
 * @param {string} message - Message text
 * @param {string} type - 'success' or 'error'
 */
function showMessage(message, type) {
  const messageBox = document.getElementById('frequency-message');
  
  if (!messageBox) return;
  
  messageBox.textContent = message;
  messageBox.className = `message-box ${type}`;
  messageBox.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    messageBox.style.display = 'none';
  }, 5000);
}

/**
 * Initialize reminder preferences on page load
 */
async function initReminderPreferences() {
  console.log('🎛️ Initializing reminder preferences...');
  
  // Load current setting
  await loadReminderPreference();
  
  // Attach event listener to save button
  const saveButton = document.getElementById('save-frequency-btn');
  if (saveButton) {
    saveButton.addEventListener('click', saveReminderPreference);
    console.log('✅ Save button listener attached');
  } else {
    console.warn('⚠️  Save button not found');
  }
}

// Initialize reminder preferences when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReminderPreferences);
} else {
  // DOM already loaded
  initReminderPreferences();
}

/**
 * Global event handler for all "Read More / Read Less" buttons
 * Uses event delegation to handle dynamically loaded content
 */
function handleReadMoreTrigger(e) {
  if (!e.target.classList.contains('read-more-trigger')) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const btn = e.target;
  const desc = btn.previousElementSibling;
  
  if (!desc || !desc.classList.contains('course-description')) return;
  
  const isExpanded = desc.classList.contains('text-clamp-expanded');
  
  if (isExpanded) {
    desc.classList.remove('text-clamp-expanded');
    btn.textContent = 'Read More';
    console.log('✅ Description collapsed');
  } else {
    desc.classList.add('text-clamp-expanded');
    btn.textContent = 'Read Less';
    console.log('✅ Description expanded');
  }
}

// Attach global listener for all Read More buttons
document.body.addEventListener('click', handleReadMoreTrigger);
console.log('🎯 Global "Read More / Read Less" listener attached');