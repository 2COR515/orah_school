// scripts/instructor-dashboard.js
// Instructor dashboard with student enrollment tracking

const API_BASE_URL = 'http://localhost:3002/api';

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
    const response = await fetch(`${API_BASE_URL}/enrollments`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch enrollment data');
    }
    
    const data = await response.json();
    const enrollments = data.enrollments || [];
    
    // Render student enrollment table
    renderStudentEnrollments(enrollments);
    
  } catch (error) {
    console.error('Dashboard load error:', error);
    showError('Failed to load instructor dashboard.');
  }
}

/**
 * Render student enrollment table
 */
function renderStudentEnrollments(enrollments) {
  // Find or create enrollment tracking section
  let trackingSection = document.getElementById('enrollment-tracking-section');
  
  if (!trackingSection) {
    const main = document.querySelector('.dashboard-main');
    trackingSection = document.createElement('section');
    trackingSection.id = 'enrollment-tracking-section';
    trackingSection.className = 'dashboard-card';
    trackingSection.style.cssText = 'grid-column: 1 / -1; margin-top: 2rem;';
    if (main) main.appendChild(trackingSection);
  }
  
  trackingSection.innerHTML = `
    <h2>Student Enrollment Tracking</h2>
    <p style="color: #666; margin-bottom: 1rem;">Monitor student progress across all lessons</p>
  `;
  
  if (enrollments.length === 0) {
    trackingSection.innerHTML += '<p style="color: #999;">No student enrollments yet.</p>';
    return;
  }
  
  // Create table
  const table = document.createElement('table');
  table.style.cssText = `
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  `;
  
  // Table header
  table.innerHTML = `
    <thead style="background: linear-gradient(135deg, #6F00FF 0%, #3B0270 100%); color: white;">
      <tr>
        <th style="padding: 1rem; text-align: left;">Student ID</th>
        <th style="padding: 1rem; text-align: left;">Lesson ID</th>
        <th style="padding: 1rem; text-align: center;">Progress</th>
        <th style="padding: 1rem; text-align: center;">Status</th>
        <th style="padding: 1rem; text-align: left;">Enrolled Date</th>
      </tr>
    </thead>
    <tbody id="enrollment-table-body"></tbody>
  `;
  
  trackingSection.appendChild(table);
  
  // Populate table body
  const tbody = document.getElementById('enrollment-table-body');
  
  enrollments.forEach((enrollment, index) => {
    const row = document.createElement('tr');
    row.style.cssText = `
      border-bottom: 1px solid #f0f0f0;
      transition: background 0.2s;
    `;
    row.onmouseover = () => row.style.background = '#f9f6ff';
    row.onmouseout = () => row.style.background = index % 2 === 0 ? 'white' : '#fafafa';
    
    const enrolledDate = new Date(enrollment.enrolledAt).toLocaleDateString();
    const progressColor = enrollment.progress === 100 ? '#28a745' : 
                         enrollment.progress >= 50 ? '#ffc107' : '#6c757d';
    const statusBadge = enrollment.status === 'completed' ? 
      '<span style="background: #28a745; color: white; padding: 0.25em 0.75em; border-radius: 12px; font-size: 0.85rem;">Completed</span>' :
      '<span style="background: #6F00FF; color: white; padding: 0.25em 0.75em; border-radius: 12px; font-size: 0.85rem;">Active</span>';
    
    row.innerHTML = `
      <td style="padding: 1rem;">${escapeHtml(enrollment.userId)}</td>
      <td style="padding: 1rem;">${escapeHtml(enrollment.lessonId)}</td>
      <td style="padding: 1rem; text-align: center;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          <div style="width: 80px; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
            <div style="width: ${enrollment.progress}%; height: 100%; background: ${progressColor}; transition: width 0.3s;"></div>
          </div>
          <span style="font-weight: 600; color: ${progressColor};">${enrollment.progress}%</span>
        </div>
      </td>
      <td style="padding: 1rem; text-align: center;">${statusBadge}</td>
      <td style="padding: 1rem;">${enrolledDate}</td>
    `;
    
    tbody.appendChild(row);
  });
  
  // Add summary statistics
  const completedCount = enrollments.filter(e => e.progress === 100).length;
  const activeCount = enrollments.filter(e => e.status === 'active' && e.progress < 100).length;
  const totalEnrollments = enrollments.length;
  
  const statsDiv = document.createElement('div');
  statsDiv.style.cssText = 'display: flex; gap: 2rem; margin-top: 1.5rem; flex-wrap: wrap;';
  statsDiv.innerHTML = `
    <div style="flex: 1; min-width: 150px; padding: 1rem; background: linear-gradient(135deg, #6F00FF 0%, #3B0270 100%); color: white; border-radius: 8px; text-align: center;">
      <div style="font-size: 2rem; font-weight: 700;">${totalEnrollments}</div>
      <div style="font-size: 0.9rem; opacity: 0.9;">Total Enrollments</div>
    </div>
    <div style="flex: 1; min-width: 150px; padding: 1rem; background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%); color: white; border-radius: 8px; text-align: center;">
      <div style="font-size: 2rem; font-weight: 700;">${completedCount}</div>
      <div style="font-size: 0.9rem; opacity: 0.9;">Completed</div>
    </div>
    <div style="flex: 1; min-width: 150px; padding: 1rem; background: linear-gradient(135deg, #E9B3FB 0%, #D896F5 100%); color: #3B0270; border-radius: 8px; text-align: center;">
      <div style="font-size: 2rem; font-weight: 700;">${activeCount}</div>
      <div style="font-size: 0.9rem; opacity: 0.9;">In Progress</div>
    </div>
  `;
  
  trackingSection.appendChild(statsDiv);
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
        videoUrl = await uploadVideoFile(file, token, progressBar);
      }

      // 2) Collect quiz data
      const quiz = collectQuizData();

      // 3) Create lesson
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
    const formData = new FormData();
    formData.append('uploaded_file', file);

    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok || !data.ok || !data.file || !data.file.url) {
      throw new Error(data.error || 'Video upload failed.');
    }
    if (progressBar) progressBar.style.width = '100%';
    return data.file.url;
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

  const legend = document.createElement('legend');
  legend.textContent = `Question ${index}`;
  legend.style.padding = '0 0.5rem';
  legend.style.color = '#3B0270';
  wrapper.appendChild(legend);

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
