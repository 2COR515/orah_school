// scripts/lesson-player.js
// Handles lesson player with backend integration

const API_BASE_URL = 'http://localhost:3001/api';
const UPLOADS_BASE_URL = 'http://localhost:3001/uploads';

let currentLesson = null;
let currentEnrollmentId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Get lesson ID and enrollment ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const lessonId = urlParams.get('lessonId');
  currentEnrollmentId = urlParams.get('enrollmentId');

  if (!lessonId) {
    showError('No lesson ID provided. Redirecting to dashboard...');
    setTimeout(() => {
      window.location.href = 'student-dashboard.html';
    }, 2000);
    return;
  }

  if (!currentEnrollmentId) {
    showError('No enrollment ID provided. Some features may not work.');
  }

  // Load lesson details
  await loadLesson(lessonId);

  // Setup button event listeners
  setupEventListeners();
});

/**
 * Load lesson details from the API
 */
async function loadLesson(lessonId) {
  try {
    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch lesson: ${response.status}`);
    }

    const data = await response.json();
    currentLesson = data.lesson;

    // Render lesson content
    renderLesson(currentLesson);

  } catch (error) {
    console.error('Error loading lesson:', error);
    showError(`Failed to load lesson: ${error.message}`);
  }
}

/**
 * Render lesson content on the page
 */
function renderLesson(lesson) {
  // Update lesson title and description
  const titleElement = document.querySelector('.lp-lesson-title');
  const descElement = document.querySelector('.lp-lesson-desc');

  if (titleElement) {
    titleElement.textContent = lesson.title;
  }
  if (descElement) {
    descElement.textContent = lesson.description || 'No description available';
  }

  // Update lesson content (video/PDF player)
  const videoPlayer = document.querySelector('.lp-video-player');
  
  if (videoPlayer && lesson.files && lesson.files.length > 0) {
    videoPlayer.innerHTML = '';

    // Find the first video or PDF file
    const videoFile = lesson.files.find(file => 
      file.mimetype && file.mimetype.startsWith('video/')
    );
    const pdfFile = lesson.files.find(file => 
      file.mimetype && file.mimetype === 'application/pdf'
    );

    if (videoFile) {
      // Render video player
      const video = document.createElement('video');
      video.controls = true;
      video.style.width = '100%';
      video.style.maxHeight = '600px';
      
      const source = document.createElement('source');
      source.src = `${UPLOADS_BASE_URL}/${videoFile.filename}`;
      source.type = videoFile.mimetype;
      
      video.appendChild(source);
      video.innerHTML += 'Your browser does not support the video tag.';
      videoPlayer.appendChild(video);
    } else if (pdfFile) {
      // Render PDF viewer
      const iframe = document.createElement('iframe');
      iframe.src = `${UPLOADS_BASE_URL}/${pdfFile.filename}`;
      iframe.style.width = '100%';
      iframe.style.height = '600px';
      iframe.style.border = 'none';
      videoPlayer.appendChild(iframe);
    } else {
      videoPlayer.innerHTML = '<p>No video or PDF content available for this lesson.</p>';
    }
  }

  // Render resources (downloadable files)
  renderResources(lesson.files);
}

/**
 * Render downloadable resources
 */
function renderResources(files) {
  const resourcesSection = document.querySelector('.lp-resources ul');
  
  if (!resourcesSection || !files || files.length === 0) {
    return;
  }

  resourcesSection.innerHTML = '';

  files.forEach(file => {
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    link.href = `${UPLOADS_BASE_URL}/${file.filename}`;
    link.target = '_blank';
    link.download = file.originalname;
    link.textContent = file.originalname || file.filename;
    
    listItem.appendChild(link);
    resourcesSection.appendChild(listItem);
  });
}

/**
 * Setup event listeners for buttons
 */
function setupEventListeners() {
  // Mark as Completed button
  const completeBtn = document.getElementById('mark-completed-btn');
  if (completeBtn) {
    completeBtn.addEventListener('click', markAsCompleted);
  }

  // Previous/Next lesson buttons (stubs for now)
  const prevBtn = document.getElementById('prev-lesson-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      showInfo('Previous lesson navigation coming soon!');
    });
  }

  const nextBtn = document.getElementById('next-lesson-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      showInfo('Next lesson navigation coming soon!');
    });
  }
}

/**
 * Mark the current lesson as completed (100% progress)
 */
async function markAsCompleted() {
  if (!currentEnrollmentId) {
    showError('Cannot mark as completed: No enrollment ID found.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/enrollments/${currentEnrollmentId}/progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        progress: 100
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update progress: ${response.status}`);
    }

    const data = await response.json();
    
    // Show success message
    showSuccess('Lesson marked as completed! 🎉');
    
    // Update button text
    const completeBtn = document.getElementById('mark-completed-btn');
    if (completeBtn) {
      completeBtn.textContent = 'Completed ✓';
      completeBtn.disabled = true;
      completeBtn.style.opacity = '0.6';
    }

  } catch (error) {
    console.error('Error marking lesson as completed:', error);
    showError(`Failed to mark as completed: ${error.message}`);
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
  showMessage(message, '#dc3545');
}

/**
 * Show success message
 */
function showSuccess(message) {
  showMessage(message, '#28a745');
}

/**
 * Show info message
 */
function showInfo(message) {
  showMessage(message, '#17a2b8');
}

/**
 * Show a notification message
 */
function showMessage(message, backgroundColor) {
  const existingMsg = document.getElementById('player-message');
  if (existingMsg) {
    existingMsg.remove();
  }

  const msg = document.createElement('div');
  msg.id = 'player-message';
  msg.style.cssText = `position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem; background: ${backgroundColor}; color: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 1000; font-size: 14px;`;
  msg.textContent = message;
  document.body.appendChild(msg);

  setTimeout(() => msg.remove(), 4000);
}
