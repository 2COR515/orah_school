// scripts/instructor-dashboard.js
// Instructor dashboard with student enrollment tracking

const API_BASE_URL = 'http://localhost:3002/api';

// ========================================
// CENTRAL USER DATA SERVICE
// ========================================

/**
 * Fetch all users and create a lookup map (userId -> user object)
 * This is a reusable utility for displaying user names across the application
 * @returns {Promise<Map>} Map with userId as key and user object as value
 */
async function fetchUserMap() {
  const userMap = new Map();
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ No authentication token found');
      return userMap;
    }

    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`⚠️ Failed to fetch users: ${response.status} ${response.statusText}`);
      return userMap;
    }

    const data = await response.json();
    const users = data.users || [];

    // Create lookup map: userId -> user object
    users.forEach(user => {
      userMap.set(user.userId, {
        id: user.userId,
        name: user.name || user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.userId,
        email: user.email || `${user.userId}@example.com`,
        role: user.role || 'unknown',
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      });
    });

    console.log(`✓ Loaded ${userMap.size} users into lookup map`);
    return userMap;

  } catch (error) {
    console.error('❌ Error fetching user map:', error);
    return userMap; // Return empty map on error
  }
}

/**
 * Get user display name from the user map
 * @param {Map} userMap - The user lookup map
 * @param {string} userId - The user ID to lookup
 * @param {string} fallback - Fallback text if user not found
 * @returns {string} User's display name or fallback
 */
function getUserDisplayName(userMap, userId, fallback = 'Unknown User') {
  const user = userMap.get(userId);
  return user ? user.name : fallback;
}

// ========================================
// DASHBOARD INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize dashboard
  await loadInstructorDashboard();
  
  // Setup event listeners
  setupEventListeners();

  // Setup Create Lesson form interactions
  setupCreateLessonForm();
});

/**
 * Load instructor dashboard data
 */
async function loadInstructorDashboard() {
  try {
    // Fetch all enrollments to show student activity
    const enrollmentsResponse = await fetch(`${API_BASE_URL}/enrollments`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!enrollmentsResponse.ok) {
      throw new Error('Failed to fetch enrollment data');
    }
    
    const enrollmentsData = await enrollmentsResponse.json();
    const enrollments = enrollmentsData.enrollments || [];
    
    // Render student enrollment table
    renderStudentEnrollments(enrollments);
    
    // Load and render instructor's lessons
    await loadMyLessons();
    
  } catch (error) {
    console.error('Dashboard load error:', error);
    showError('Failed to load instructor dashboard.');
  }
}

/**
 * Load instructor's lessons
 */
async function loadMyLessons() {
  try {
    const instructorId = localStorage.getItem('userId');
    const lessonsListEl = document.getElementById('lessons-list');
    const loadingMsgEl = document.getElementById('lessons-loading-msg');
    
    if (!lessonsListEl) {
      console.warn('lessons-list element not found on this page');
      return;
    }
    
    console.log('🔄 Loading instructor lessons...');
    
    // Fetch all lessons
    const response = await fetch(`${API_BASE_URL}/lessons`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch lessons');
    }
    
    const data = await response.json();
    const allLessons = data.lessons || [];
    
    // Filter to show only this instructor's lessons
    const myLessons = allLessons.filter(lesson => lesson.instructorId === instructorId);
    
    console.log(`✅ Loaded ${myLessons.length} lesson(s)`);
    
    // Hide loading message
    if (loadingMsgEl) loadingMsgEl.style.display = 'none';
    
    // Render lessons
    renderInstructorLessons(myLessons, lessonsListEl);
    
  } catch (error) {
    console.error('❌ Error loading lessons:', error);
    const loadingMsgEl = document.getElementById('lessons-loading-msg');
    if (loadingMsgEl) {
      loadingMsgEl.textContent = 'Failed to load lessons. Please refresh.';
      loadingMsgEl.style.color = '#ff3b3b';
    }
  }
}

/**
 * Render student enrollment table
 */
function renderStudentEnrollments(enrollments) {
  // Find or create enrollment tracking section
  let trackingSection = document.getElementById('enrollment-tracking-section');
  
  if (!trackingSection) {
    const main = document.querySelector('.dashboard-main') || document.querySelector('.container main') || document.querySelector('main');
    if (!main) {
      console.warn('No main container found for enrollment tracking section');
      return;
    }
    trackingSection = document.createElement('section');
    trackingSection.id = 'enrollment-tracking-section';
    trackingSection.className = 'card mb-8';
    main.appendChild(trackingSection);
  }
  
  trackingSection.innerHTML = `
    <div class="card-header">
      <h2>Student Enrollment Tracking</h2>
    </div>
    <div class="card-body">
      <p class="text-secondary mb-4">Monitor student progress across all lessons</p>
      ${enrollments.length === 0 ? '<p class="text-secondary text-center py-8">No student enrollments yet.</p>' : '<div id="enrollment-table-container"></div>'}
    </div>
  `;
  
  if (enrollments.length === 0) {
    return;
  }
  
  // Create table
  const container = document.getElementById('enrollment-table-container');
  const table = document.createElement('table');
  table.style.cssText = `
    width: 100%;
    border-collapse: collapse;
    background: var(--color-bg-secondary);
    border-radius: var(--radius-md);
    overflow: hidden;
  `;
  
  // Table header
  table.innerHTML = `
    <thead style="background: var(--color-brand-purple); color: var(--color-text-primary);">
      <tr>
        <th style="padding: 1rem; text-align: left; font-weight: 600;">Student ID</th>
        <th style="padding: 1rem; text-align: left; font-weight: 600;">Lesson ID</th>
        <th style="padding: 1rem; text-align: center; font-weight: 600;">Progress</th>
        <th style="padding: 1rem; text-align: center; font-weight: 600;">Status</th>
        <th style="padding: 1rem; text-align: left; font-weight: 600;">Enrolled Date</th>
      </tr>
    </thead>
    <tbody id="enrollment-table-body"></tbody>
  `;
  
  container.appendChild(table);
  
  // Populate table body
  const tbody = document.getElementById('enrollment-table-body');
  
  enrollments.forEach((enrollment, index) => {
    const row = document.createElement('tr');
    row.style.cssText = `
      border-bottom: 1px solid var(--color-border-primary);
      transition: background 0.2s;
    `;
    row.onmouseover = () => row.style.background = 'var(--color-bg-tertiary)';
    row.onmouseout = () => row.style.background = index % 2 === 0 ? 'var(--color-bg-secondary)' : 'var(--color-bg-primary)';
    
    const enrolledDate = new Date(enrollment.enrolledAt).toLocaleDateString();
    const progressColor = enrollment.progress === 100 ? 'var(--color-success)' : 
                         enrollment.progress >= 50 ? 'var(--color-warning)' : 'var(--color-text-secondary)';
    const statusBadge = enrollment.status === 'completed' ? 
      '<span class="badge-success">Completed</span>' :
      '<span class="badge-brand">Active</span>';
    
    row.innerHTML = `
      <td style="padding: 1rem; color: var(--color-text-primary);">${escapeHtml(enrollment.userId)}</td>
      <td style="padding: 1rem; color: var(--color-text-primary);">${escapeHtml(enrollment.lessonId)}</td>
      <td style="padding: 1rem; text-align: center;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          <div style="width: 80px; height: 8px; background: var(--color-bg-tertiary); border-radius: var(--radius-full); overflow: hidden;">
            <div style="width: ${enrollment.progress}%; height: 100%; background: ${progressColor}; transition: width 0.3s;"></div>
          </div>
          <span style="font-weight: 600; color: ${progressColor};">${enrollment.progress}%</span>
        </div>
      </td>
      <td style="padding: 1rem; text-align: center;">${statusBadge}</td>
      <td style="padding: 1rem; color: var(--color-text-primary);">${enrolledDate}</td>
    `;
    
    tbody.appendChild(row);
  });
  
  // Add summary statistics
  const completedCount = enrollments.filter(e => e.progress === 100).length;
  const activeCount = enrollments.filter(e => e.status === 'active' && e.progress < 100).length;
  const totalEnrollments = enrollments.length;
  
  const statsDiv = document.createElement('div');
  statsDiv.className = 'grid grid-cols-1 md:grid-cols-3 gap-4 mt-6';
  statsDiv.innerHTML = `
    <div class="text-center p-4 rounded-lg card-brand">
      <div class="text-3xl font-bold text-brand mb-1">${totalEnrollments}</div>
      <div class="text-sm text-secondary">Total Enrollments</div>
    </div>
    <div class="text-center p-4 rounded-lg" style="background: var(--color-success); color: white;">
      <div class="text-3xl font-bold mb-1">${completedCount}</div>
      <div class="text-sm" style="opacity: 0.9;">Completed</div>
    </div>
    <div class="text-center p-4 rounded-lg" style="background: var(--color-warning); color: var(--color-bg-primary);">
      <div class="text-3xl font-bold mb-1">${activeCount}</div>
      <div class="text-sm" style="opacity: 0.9;">In Progress</div>
    </div>
  `;
  
  container.appendChild(statsDiv);
}

/**
 * Setup event listeners for dashboard
 */
function setupEventListeners() {
  // Chatbot handler
  const chatbotBtn = document.getElementById('instructor-chatbot-btn') || 
                     document.querySelector('.chatbot-btn');
  if (chatbotBtn) {
    chatbotBtn.addEventListener('click', () => {
      alert('Instructor support coming soon! Email admin@orahschools.com for assistance.');
    });
  }
  
  // Logout handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      window.location.href = 'login.html';
    });
  }
}

/**
 * Utility: Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
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
  const existing = document.getElementById('instructor-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'instructor-toast';
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

// =================== Create Lesson: UI + Logic ===================

function setupCreateLessonForm() {
  const form = document.getElementById('create-lesson-form');
  const addQuestionBtn = document.getElementById('add-question-btn');
  const questionsContainer = document.getElementById('quiz-questions');

  if (!form || !addQuestionBtn || !questionsContainer) return;

  // Ensure at least one question block exists
  if (questionsContainer.children.length === 0) {
    addQuestionBlock(questionsContainer);
  }

  addQuestionBtn.addEventListener('click', () => addQuestionBlock(questionsContainer));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const msgEl = document.getElementById('create-lesson-msg');
    const submitBtn = document.getElementById('submit-lesson-btn');
    const titleInput = document.getElementById('lesson-title');
    const descInput = document.getElementById('lesson-description');
    const videoInput = document.getElementById('video-upload');
    const progress = document.getElementById('upload-progress');
    const progressBar = progress ? progress.querySelector('.progress-bar') : null;

    const token = localStorage.getItem('token');
    const instructorId = localStorage.getItem('userId');

    if (!token) {
      alert('You must be logged in.');
      window.location.href = 'login.html';
      return;
    }
    if (!instructorId) {
      showError('Missing instructor ID.');
      return;
    }

    const title = (titleInput?.value || '').trim();
    const description = (descInput?.value || '').trim();
    if (!title || !description) {
      showError('Please provide a title and description.');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
      }
      if (msgEl) msgEl.textContent = '';

      // 1) Upload video first (optional)
      let videoUrl = '';
      const file = videoInput?.files && videoInput.files[0] ? videoInput.files[0] : null;
      if (file) {
        if (progressBar) progressBar.style.width = '10%';
        console.log('🎥 Uploading video:', file.name);
        videoUrl = await uploadVideoFile(file, token, progressBar);
        console.log('✅ Video uploaded:', videoUrl);
        if (progressBar) progressBar.style.width = '25%';
      }

      // 2) Upload resource file (if provided)
      const resourceInput = document.getElementById('resource-upload');
      
      let resourceZipUrl = null;
      
      if (resourceInput?.files && resourceInput.files[0]) {
        const resourceFile = resourceInput.files[0];
        console.log('📦 Uploading resource file:', resourceFile.name);
        if (progressBar) progressBar.style.width = '30%';
        try {
          resourceZipUrl = await uploadFile(resourceFile, token, 'resource');
          console.log('✅ Resource uploaded:', resourceZipUrl);
        } catch (err) {
          console.warn('⚠️ Resource upload failed:', err.message);
          // Continue without resource
        }
      }

      // 3) Collect quiz data
      if (progressBar) progressBar.style.width = '60%';
      const quiz = collectQuizData();

      // 4) Create lesson
      if (progressBar) progressBar.style.width = '80%';
      console.log('📝 Creating lesson with data:', { title, description, videoUrl, resourceZipUrl, quizQuestions: quiz.length });
      const res = await fetch(`${API_BASE_URL}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          instructorId,
          status: 'published',
          videoUrl,
          resourceZipUrl,    // Include resource ZIP URL
          quiz
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Failed to create lesson (${res.status})`);
      }

      showSuccess('Lesson created successfully.');
      if (msgEl) {
        msgEl.style.color = '#2d7a2d';
        msgEl.textContent = 'Lesson created successfully.';
      }
      form.reset();
      if (progressBar) progressBar.style.width = '0%';
      questionsContainer.innerHTML = '';
      addQuestionBlock(questionsContainer);
    } catch (err) {
      console.error('Create lesson error:', err);
      showError(err.message || 'Failed to create lesson.');
      if (msgEl) {
        msgEl.style.color = '#a70000';
        msgEl.textContent = err.message || 'Failed to create lesson.';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Lesson';
      }
    }
  });
}

/**
 * Upload a file (video, thumbnail, or resource)
 * @param {File} file - File to upload
 * @param {string} token - Authentication token
 * @param {string} type - File type ('video', 'thumbnail', 'resource')
 * @returns {Promise<string>} URL of uploaded file
 */
async function uploadFile(file, token, type = 'video') {
  const formData = new FormData();
  formData.append('uploaded_file', file);

  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  const data = await res.json();
  
  if (!res.ok || !data.ok || !data.file || !data.file.url) {
    throw new Error(data.error || `${type} upload failed.`);
  }
  
  return data.file.url;
}

async function uploadVideoFile(file, token, progressBar) {
  // Simulated progress while uploading (fetch doesn't provide upload progress)
  let intervalId = null;
  const bump = () => {
    if (!progressBar) return;
    const current = parseInt(progressBar.style.width || '0', 10);
    const next = Math.min(current + Math.floor(Math.random() * 8) + 3, 90);
    progressBar.style.width = `${next}%`;
  };
  if (progressBar) {
    progressBar.style.width = '15%';
    intervalId = setInterval(bump, 300);
  }

  try {
    const url = await uploadFile(file, token, 'video');
    if (progressBar) progressBar.style.width = '100%';
    return url;
  } finally {
    if (intervalId) clearInterval(intervalId);
  }
}

function addQuestionBlock(container) {
  const index = container.children.length + 1;

  const wrapper = document.createElement('fieldset');
  wrapper.className = 'quiz-question';
  wrapper.style.border = '1px solid #E9B3FB';
  wrapper.style.borderRadius = '8px';
  wrapper.style.padding = '1rem';

  const legendContainer = document.createElement('div');
  legendContainer.style.display = 'flex';
  legendContainer.style.justifyContent = 'space-between';
  legendContainer.style.alignItems = 'center';
  legendContainer.style.marginBottom = '0.5rem';
  
  const legend = document.createElement('legend');
  legend.textContent = `Question ${index}`;
  legend.style.padding = '0 0.5rem';
  legend.style.color = '#3B0270';
  legend.style.fontWeight = '600';
  
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn-ghost btn-sm';
  removeBtn.textContent = '✕ Remove';
  removeBtn.style.color = '#a70000';
  removeBtn.style.fontSize = '0.875rem';
  removeBtn.onclick = () => {
    if (confirm('Remove this question?')) {
      wrapper.remove();
      // Renumber remaining questions
      updateQuestionNumbers(container);
    }
  };
  
  legendContainer.appendChild(legend);
  legendContainer.appendChild(removeBtn);
  wrapper.appendChild(legendContainer);

  // Question text
  const qLabel = document.createElement('label');
  qLabel.textContent = 'Question';
  qLabel.style.display = 'block';
  qLabel.style.marginBottom = '0.35rem';
  const qInput = document.createElement('input');
  qInput.type = 'text';
  qInput.className = 'quiz-question-text';
  qInput.placeholder = 'Enter the question';
  qInput.style.width = '100%';
  qInput.style.padding = '0.6rem';
  qInput.style.borderRadius = '6px';
  qInput.style.border = '1px solid #E9B3FB';
  qLabel.appendChild(qInput);
  wrapper.appendChild(qLabel);

  // Options (4)
  const opts = document.createElement('div');
  opts.className = 'quiz-options';
  opts.style.display = 'grid';
  opts.style.gridTemplateColumns = '1fr 1fr';
  opts.style.gap = '0.5rem 1rem';

  for (let i = 0; i < 4; i++) {
    const oLabel = document.createElement('label');
    oLabel.textContent = `Option ${i + 1}`;
    oLabel.style.display = 'block';
    const oInput = document.createElement('input');
    oInput.type = 'text';
    oInput.className = 'quiz-option';
    oInput.placeholder = `Option ${i + 1}`;
    oInput.style.width = '100%';
    oInput.style.padding = '0.5rem';
    oInput.style.borderRadius = '6px';
    oInput.style.border = '1px solid #E9B3FB';
    oLabel.appendChild(oInput);
    opts.appendChild(oLabel);
  }
  wrapper.appendChild(opts);

  // Correct answer selector
  const selLabel = document.createElement('label');
  selLabel.textContent = 'Correct Answer';
  selLabel.style.display = 'block';
  selLabel.style.marginTop = '0.5rem';
  const select = document.createElement('select');
  select.className = 'quiz-correct';
  select.style.padding = '0.5rem';
  select.style.borderRadius = '6px';
  select.style.border = '1px solid #E9B3FB';
  for (let i = 0; i < 4; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `Option ${i + 1}`;
    select.appendChild(opt);
  }
  selLabel.appendChild(select);
  wrapper.appendChild(selLabel);

  container.appendChild(wrapper);
}

function updateQuestionNumbers(container) {
  const questions = container.querySelectorAll('.quiz-question');
  questions.forEach((question, index) => {
    const legend = question.querySelector('legend');
    if (legend) {
      legend.textContent = `Question ${index + 1}`;
    }
  });
}

function collectQuizData() {
  const blocks = document.querySelectorAll('.quiz-question');
  const quiz = [];
  blocks.forEach((block) => {
    const q = block.querySelector('.quiz-question-text')?.value?.trim() || '';
    const opts = Array.from(block.querySelectorAll('.quiz-option')).map(i => (i.value || '').trim());
    const correctIndex = parseInt(block.querySelector('.quiz-correct')?.value || '0', 10);

    if (q && opts.filter(Boolean).length === 4) {
      quiz.push({
        question: q,
        options: opts,
        correctAnswer: correctIndex
      });
    }
  });
  return quiz;
}

// =================== Lesson Management: Display & Delete ===================

/**
 * Render instructor's lessons with delete buttons
 */
function renderInstructorLessons(lessons, container) {
  if (!container) return;
  
  container.innerHTML = '';
  
  if (lessons.length === 0) {
    container.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">You haven\'t created any lessons yet. Use the form above to create your first lesson!</p>';
    return;
  }
  
  lessons.forEach(lesson => {
    const card = document.createElement('div');
    card.className = 'lesson-card';
    card.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: transform 0.2s, box-shadow 0.2s;
    `;
    
    card.innerHTML = `
      <h3 style="margin: 0; color: #3B0270; font-size: 1.25rem;">${escapeHtml(lesson.title)}</h3>
      <p class="course-description text-clamp-3" style="margin: 0; color: #666; font-size: 0.9rem; flex-grow: 1;">${escapeHtml(lesson.description || 'No description')}</p>
      <button class="read-more-trigger" style="margin-top: 0.5rem; margin-bottom: 0.75rem;">Read More</button>
      <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.85rem; color: #888;">
        <span>Topic: ${escapeHtml(lesson.topic || 'General')}</span>
        <span>Status: <strong>${lesson.status === 'published' ? '✅ Published' : '📝 Draft'}</strong></span>
        <span>Created: ${lesson.createdAt ? new Date(lesson.createdAt).toLocaleDateString() : 'Unknown'}</span>
      </div>
      <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
        <button class="edit-lesson-btn" data-lesson-id="${lesson.id}"
                style="flex: 1; padding: 0.75rem; background: #6F00FF; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; transition: background 0.2s;"
                onmouseover="this.style.background='#5500CC'" onmouseout="this.style.background='#6F00FF'">
          Edit
        </button>
        <button class="delete-lesson-btn" data-lesson-id="${lesson.id}" data-lesson-title="${escapeHtml(lesson.title)}"
                style="padding: 0.75rem 1rem; background: #ff3b3b; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; transition: background 0.2s;"
                onmouseover="this.style.background='#cc0000'" onmouseout="this.style.background='#ff3b3b'">
          Delete
        </button>
      </div>
    `;
    
    // Add hover effect
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });
    
    // Add delete button event listener
    const deleteBtn = card.querySelector('.delete-lesson-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        const lessonId = deleteBtn.getAttribute('data-lesson-id');
        const lessonTitle = deleteBtn.getAttribute('data-lesson-title');
        handleDeleteLesson(lessonId, lessonTitle);
      });
    }
    
    // Add edit button event listener (placeholder)
    const editBtn = card.querySelector('.edit-lesson-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        const lessonId = editBtn.getAttribute('data-lesson-id');
        showError('Edit functionality coming soon!');
        // TODO: Implement edit functionality
      });
    }
    
    container.appendChild(card);
  });
}

/**
 * Handle lesson deletion
 * @param {string} lessonId - The lesson ID to delete
 * @param {string} lessonTitle - The lesson title for confirmation message
 */
async function handleDeleteLesson(lessonId, lessonTitle) {
  try {
    // Confirm with user before deleting
    const confirmed = confirm(
      `⚠️ Are you sure you want to delete "${lessonTitle}"?\n\n` +
      `This will:\n` +
      `• Permanently delete the lesson\n` +
      `• Remove ALL student enrollments for this lesson\n` +
      `• This action CANNOT be undone\n\n` +
      `Type the lesson title to confirm deletion.`
    );
    
    if (!confirmed) {
      console.log('Lesson deletion cancelled by user');
      return;
    }

    console.log(`🗑️ Deleting lesson: ${lessonTitle} (ID: ${lessonId})`);

    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Lesson not found or already deleted');
      } else if (response.status === 403) {
        throw new Error('You do not have permission to delete this lesson');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Lesson deletion failed');
      }
    }

    console.log('✅ Successfully deleted lesson');
    showSuccess(`Successfully deleted lesson "${lessonTitle}" and all related enrollments`);
    
    // Reload dashboard to reflect changes
    await loadInstructorDashboard();

  } catch (error) {
    console.error('❌ Lesson deletion error:', error);
    showError(`Failed to delete lesson: ${error.message}`);
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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