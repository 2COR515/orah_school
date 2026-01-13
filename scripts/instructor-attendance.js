// instructor-attendance.js
// Handles attendance marking interface for instructors

const API_BASE_URL = 'http://localhost:3002/api';
const token = localStorage.getItem('token');
const instructorId = localStorage.getItem('userId');
const userRole = localStorage.getItem('role');

// Global state
let currentLessonId = null;
let currentEnrollments = [];
let studentsData = {};

// ========================================
// CENTRAL USER DATA SERVICE (Shared Utility)
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
// INITIALIZATION
// ========================================

/**
 * Initialize the page on load
 */
async function init() {
  // Check authentication
  if (!token || userRole !== 'instructor') {
    alert('Unauthorized access. Redirecting to login.');
    window.location.href = 'login.html';
    return;
  }

  // Set today's date as default if the date input exists (backwards compatibility)
  const dateInput = document.getElementById('attendance-date');
  if (dateInput) dateInput.valueAsDate = new Date();

  // Set up event listeners
  setupEventListeners();

  // Load instructor's lessons
  await loadInstructorLessons();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Back to Hub button
  const backBtn = document.getElementById('back-to-hub-btn');
  if (backBtn) backBtn.addEventListener('click', () => { window.location.href = 'instructor-hub.html'; });

  // Logout button
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
  });

  // Lesson selection
  const lessonSelectEl = document.getElementById('lesson-select');
  if (lessonSelectEl) lessonSelectEl.addEventListener('change', async (e) => {
    // Only call legacy roster loading if the roster container exists
    if (document.getElementById('student-roster')) {
      await handleLessonChange(e);
    }
    // Also fetch and render progress stats into the new view
    if (e.target && e.target.value) {
      fetchAndRenderLessonStats(e.target.value);
    } else {
      clearAttendanceStatsView();
    }
  });

  // Save attendance button (only if present)
  const saveBtn = document.getElementById('save-attendance-btn');
  if (saveBtn) saveBtn.addEventListener('click', saveAttendance);

  // Generate report button
  const genBtn = document.getElementById('generate-report-btn');
  if (genBtn) genBtn.addEventListener('click', generateReport);
}

/**
 * Clear the attendance stats view
 */
function clearAttendanceStatsView() {
  const container = document.getElementById('attendance-stats-view');
  if (!container) return;
  container.innerHTML = '<p class="text-secondary" style="padding:2rem; text-align:center;">Select a lesson to view progress</p>';
}

/**
 * Fetch lesson stats from API and render into the attendance-stats-view
 */
async function fetchAndRenderLessonStats(lessonId) {
  const container = document.getElementById('attendance-stats-view');
  if (!container) return;
  container.innerHTML = '<p style="text-align:center; color:#999; padding:2rem;">Loading progress...</p>';

  try {
    const resp = await fetch(`${API_BASE_URL}/lessons/${lessonId}/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!resp.ok) {
      container.innerHTML = '<p style="text-align:center; color:#ff6b6b; padding:2rem;">Failed to load stats</p>';
      return;
    }

    const data = await resp.json();
    const stats = data.stats || { completed: [], missed: [], active: [] };
    renderAttendanceStats(stats);
  } catch (err) {
    console.error('Error fetching lesson stats:', err);
    container.innerHTML = '<p style="text-align:center; color:#ff6b6b; padding:2rem;">Error loading stats</p>';
  }
}

/**
 * Render attendance/progress stats into the 3-column grid
 */
function renderAttendanceStats(stats) {
  const container = document.getElementById('attendance-stats-view');
  if (!container) return;

  const completed = stats.completed || [];
  const missed = stats.missed || [];
  const active = stats.active || [];

  container.innerHTML = `
    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
      <div class="stat-column" style="border-top: 4px solid var(--color-success);">
        <h4 style="margin:0 0 0.5rem 0;">✅ Completed (${completed.length})</h4>
        <div class="stat-list" style="max-height:360px; overflow:auto; padding-right:0.5rem;"></div>
      </div>
      <div class="stat-column" style="border-top: 4px solid var(--color-error);">
        <h4 style="margin:0 0 0.5rem 0;">❌ Missed (${missed.length})</h4>
        <div class="stat-list" style="max-height:360px; overflow:auto; padding-right:0.5rem;"></div>
      </div>
      <div class="stat-column" style="border-top: 4px solid var(--color-info);">
        <h4 style="margin:0 0 0.5rem 0;">⏳ In Progress (${active.length})</h4>
        <div class="stat-list" style="max-height:360px; overflow:auto; padding-right:0.5rem;"></div>
      </div>
    </div>
  `;

  const lists = container.querySelectorAll('.stat-list');

  function populate(listEl, items) {
    if (!items || items.length === 0) {
      listEl.innerHTML = '<p style="color:#888; font-style:italic; padding:1rem;">No students</p>';
      return;
    }

    const frag = document.createDocumentFragment();
    items.forEach(it => {
      const div = document.createElement('div');
      div.className = 'student-item';
      div.style.padding = '0.5rem 0';
      div.style.borderBottom = '1px dashed rgba(255,255,255,0.03)';
      const name = document.createElement('div');
      name.style.fontWeight = '600';
      name.textContent = it.studentName || it.userId || 'Unknown';

      const meta = document.createElement('div');
      meta.style.fontSize = '0.85rem';
      meta.style.color = '#999';
      meta.textContent = it.enrolledAt ? new Date(it.enrolledAt).toLocaleDateString() : '';

      div.appendChild(name);
      div.appendChild(meta);
      frag.appendChild(div);
    });

    listEl.innerHTML = '';
    listEl.appendChild(frag);
  }

  populate(lists[0], completed);
  populate(lists[1], missed);
  populate(lists[2], active);
}

// ========================================
// LESSON LOADING
// ========================================

/**
 * Load instructor's lessons into the dropdown
 */
async function loadInstructorLessons() {
  try {
    const response = await fetch(`${API_BASE_URL}/lessons`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load lessons');
    }

    const data = await response.json();
    const myLessons = (data.lessons || []).filter(l => l.instructorId === instructorId);

    // Populate lesson selectors
    populateLessonDropdown('lesson-select', myLessons, '-- Select a lesson --');
    populateLessonDropdown('report-lesson', myLessons, 'All Lessons');

    console.log(`✓ Loaded ${myLessons.length} lessons`);
  } catch (error) {
    console.error('Error loading lessons:', error);
    showMessage('Failed to load lessons. Please refresh the page.', 'error');
  }
}

/**
 * Populate a lesson dropdown with options
 */
function populateLessonDropdown(elementId, lessons, defaultText) {
  const select = document.getElementById(elementId);
  select.innerHTML = `<option value="">${defaultText}</option>`;

  lessons.forEach(lesson => {
    const option = document.createElement('option');
    option.value = lesson.id;
    option.textContent = lesson.title;
    select.appendChild(option);
  });
}

// ========================================
// STUDENT ROSTER LOADING
// ========================================

/**
 * Handle lesson selection change
 */
async function handleLessonChange(e) {
  const lessonId = e.target.value;
  currentLessonId = lessonId;

  if (!lessonId) {
    clearStudentRoster();
    return;
  }

  await loadStudentRoster(lessonId);
}

/**
 * Load student roster for the selected lesson
 */
async function loadStudentRoster(lessonId) {
  const rosterContainer = document.getElementById('student-roster');
  rosterContainer.innerHTML = '<p style="text-align: center; color: #666;">Loading students...</p>';

  try {
    // Fetch enrollments for this lesson
    const response = await fetch(`${API_BASE_URL}/enrollments/lesson/${lessonId}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load enrollments');
    }

    const data = await response.json();
    currentEnrollments = data.enrollments || [];

    console.log(`✓ Loaded ${currentEnrollments.length} enrollments for lesson ${lessonId}`);

    // Fetch student details for each enrollment
    await fetchStudentDetails(currentEnrollments);

    // Render the roster
    renderStudentRoster();

  } catch (error) {
    console.error('Error loading student roster:', error);
    rosterContainer.innerHTML = '<p style="text-align: center; color: #ff3b3b;">Error loading students. Please try again.</p>';
  }
}

/**
 * Fetch student details for display names
 * ✨ Now uses the central fetchUserMap() utility for consistent name display
 */
async function fetchStudentDetails(enrollments) {
  studentsData = {};

  try {
    // ✨ Use central user map utility for consistent name lookup
    const userMap = await fetchUserMap();

    if (userMap.size === 0) {
      console.warn('⚠️ User map is empty, using IDs only');
      // Fallback to using IDs
      const studentIds = [...new Set(enrollments.map(e => e.userId))];
      studentIds.forEach(id => {
        studentsData[id] = {
          id: id,
          name: id,
          email: `${id}@example.com`
        };
      });
      return;
    }

    // Convert Map to studentsData object for backward compatibility
    userMap.forEach((user, userId) => {
      studentsData[userId] = {
        id: user.id,
        name: user.name,
        email: user.email
      };
    });

    console.log(`✓ Loaded ${Object.keys(studentsData).length} user details`);
  } catch (error) {
    console.error('❌ Error fetching student details:', error);
    // Fallback to using IDs
    const studentIds = [...new Set(enrollments.map(e => e.userId))];
    studentIds.forEach(id => {
      studentsData[id] = {
        id: id,
        name: id,
        email: `${id}@example.com`
      };
    });
  }
}

/**
 * Render the student roster table
 */
function renderStudentRoster() {
  const rosterContainer = document.getElementById('student-roster');

  if (currentEnrollments.length === 0) {
    rosterContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No students enrolled in this lesson</p>';
    return;
  }

  // Create table HTML
  let tableHTML = `
    <table class="attendance-table" style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
      <thead>
        <tr style="background: var(--color-bg-soft); border-bottom: 2px solid var(--color-border);">
          <th style="text-align: left; padding: 1rem; font-weight: 600;">Student ID</th>
          <th style="text-align: center; padding: 1rem; font-weight: 600;">Present</th>
          <th style="text-align: center; padding: 1rem; font-weight: 600;">Absent</th>
        </tr>
      </thead>
      <tbody>
  `;

  currentEnrollments.forEach((enrollment, index) => {
    const student = studentsData[enrollment.userId] || { name: enrollment.userId };
    const rowBg = index % 2 === 0 ? 'white' : 'var(--color-bg-soft)';
    
    tableHTML += `
      <tr style="background: ${rowBg}; border-bottom: 1px solid var(--color-border);" data-student-id="${enrollment.userId}" data-enrollment-id="${enrollment.id}">
        <td style="padding: 1rem;">
          <div style="font-weight: 600;">${student.name}</div>
          <div style="font-size: 0.875rem; color: #666; margin-top: 0.25rem;">${enrollment.userId}</div>
        </td>
        <td style="text-align: center; padding: 1rem;">
          <input type="radio" 
                 name="attendance-${enrollment.id}" 
                 value="present" 
                 checked 
                 style="width: 20px; height: 20px; cursor: pointer;" />
        </td>
        <td style="text-align: center; padding: 1rem;">
          <input type="radio" 
                 name="attendance-${enrollment.id}" 
                 value="absent" 
                 style="width: 20px; height: 20px; cursor: pointer;" />
        </td>
      </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
    <div style="margin-top: 1rem; padding: 1rem; background: var(--color-bg-soft); border-radius: 8px;">
      <strong>Total Students:</strong> ${currentEnrollments.length}
    </div>
  `;

  rosterContainer.innerHTML = tableHTML;
}

/**
 * Clear the student roster
 */
function clearStudentRoster() {
  const rosterContainer = document.getElementById('student-roster');
  rosterContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Select a lesson to view enrolled students</p>';
  currentEnrollments = [];
  studentsData = {};
}

// ========================================
// ATTENDANCE SAVING
// ========================================

/**
 * Save attendance records for all students
 */
async function saveAttendance() {
  if (!currentLessonId) {
    showMessage('Please select a lesson first', 'error');
    return;
  }

  if (currentEnrollments.length === 0) {
    showMessage('No students to mark attendance for', 'error');
    return;
  }

  const date = document.getElementById('attendance-date').value;
  if (!date) {
    showMessage('Please select a date', 'error');
    return;
  }

  // Collect attendance records
  const attendanceRecords = [];

  currentEnrollments.forEach(enrollment => {
    const radioGroup = document.getElementsByName(`attendance-${enrollment.id}`);
    let status = 'present'; // default

    for (const radio of radioGroup) {
      if (radio.checked) {
        status = radio.value;
        break;
      }
    }

    attendanceRecords.push({
      studentId: enrollment.userId,
      lessonId: currentLessonId,
      date: date,
      status: status
    });
  });

  console.log('Saving attendance records:', attendanceRecords);

  try {
    const response = await fetch(`${API_BASE_URL}/attendance`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ records: attendanceRecords })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save attendance');
    }

    const data = await response.json();
    console.log('✓ Attendance saved:', data);

    showMessage(`✓ Attendance saved successfully! (${attendanceRecords.length} records)`, 'success');

  } catch (error) {
    console.error('Error saving attendance:', error);
    showMessage(`Error: ${error.message}`, 'error');
  }
}

// ========================================
// ATTENDANCE REPORTS
// ========================================

/**
 * Generate attendance report
 */
async function generateReport() {
  const reportLessonId = document.getElementById('report-lesson').value;
  const reportPeriod = document.getElementById('report-period').value;
  const reportContainer = document.getElementById('attendance-report');

  reportContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Generating report...</p>';

  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (reportLessonId) {
      params.append('lessonId', reportLessonId);
    }
    
    // Calculate date range based on period
    const today = new Date();
    let startDate = new Date();
    
    switch (reportPeriod) {
      case 'week':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'all':
        startDate = null; // No date filter
        break;
    }

    // Fetch attendance records
    const response = await fetch(`${API_BASE_URL}/attendance?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch attendance records');
    }

    const data = await response.json();
    let records = data.records || [];

    // Filter by date range if needed
    if (startDate) {
      records = records.filter(r => new Date(r.date) >= startDate);
    }

    // Calculate statistics
    const totalRecords = records.length;
    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : 0;

    // Fetch student details for name display
    await fetchStudentDetailsForReport(records);

    // Render report
    renderReport({
      totalRecords,
      presentCount,
      absentCount,
      attendanceRate,
      period: reportPeriod,
      lessonId: reportLessonId,
      records: records
    });

  } catch (error) {
    console.error('Error generating report:', error);
    reportContainer.innerHTML = '<p style="text-align: center; color: #ff3b3b; padding: 2rem;">Error generating report. Please try again.</p>';
  }
}

/**
 * Fetch student details specifically for report display
 * ✨ Now uses the central fetchUserMap() utility for consistent name display
 */
async function fetchStudentDetailsForReport(records) {
  try {
    // ✨ Use central user map utility for consistent name lookup
    const userMap = await fetchUserMap();

    // Convert Map to studentsData object for backward compatibility
    userMap.forEach((user, userId) => {
      studentsData[userId] = {
        id: user.id,
        name: user.name,
        email: user.email
      };
    });

    console.log(`✓ Loaded ${Object.keys(studentsData).length} user details for report`);
  } catch (error) {
    console.warn('⚠️ Could not fetch user details for report:', error);
  }
}

/**
 * Render the attendance report with individual student records
 */
function renderReport(stats) {
  const reportContainer = document.getElementById('attendance-report');
  
  const periodText = {
    'week': 'Last Week',
    'month': 'Last Month',
    'all': 'All Time'
  }[stats.period] || stats.period;

  let reportHTML = `
    <div style="background: white; padding: 2rem; border-radius: 12px; border: 1px solid var(--color-border);">
      <h3 style="margin-top: 0; color: var(--color-text-dark);">Attendance Summary - ${periodText}</h3>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
        <div style="text-align: center; padding: 1rem; background: var(--color-bg-soft); border-radius: 8px;">
          <div style="font-size: 2rem; font-weight: 900; color: var(--color-primary);">${stats.attendanceRate}%</div>
          <div style="color: #666; font-size: 0.875rem; margin-top: 0.5rem;">Attendance Rate</div>
        </div>
        
        <div style="text-align: center; padding: 1rem; background: var(--color-bg-soft); border-radius: 8px;">
          <div style="font-size: 2rem; font-weight: 900; color: var(--color-success);">${stats.presentCount}</div>
          <div style="color: #666; font-size: 0.875rem; margin-top: 0.5rem;">Present</div>
        </div>
        
        <div style="text-align: center; padding: 1rem; background: var(--color-bg-soft); border-radius: 8px;">
          <div style="font-size: 2rem; font-weight: 900; color: #dc3545;">${stats.absentCount}</div>
          <div style="color: #666; font-size: 0.875rem; margin-top: 0.5rem;">Absent</div>
        </div>
        
        <div style="text-align: center; padding: 1rem; background: var(--color-bg-soft); border-radius: 8px;">
          <div style="font-size: 2rem; font-weight: 900; color: var(--color-text-dark);">${stats.totalRecords}</div>
          <div style="color: #666; font-size: 0.875rem; margin-top: 0.5rem;">Total Records</div>
        </div>
      </div>
  `;

  // Add individual attendance records with visual highlights
  if (stats.records && stats.records.length > 0) {
    reportHTML += `
      <div style="margin-top: 2rem;">
        <h4 style="color: var(--color-text-dark); margin-bottom: 1rem;">Individual Records</h4>
        <div style="max-height: 400px; overflow-y: auto; border: 1px solid var(--color-border); border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead style="position: sticky; top: 0; background: var(--color-bg-soft); z-index: 1;">
              <tr>
                <th style="text-align: left; padding: 0.75rem; border-bottom: 2px solid var(--color-border);">Student</th>
                <th style="text-align: center; padding: 0.75rem; border-bottom: 2px solid var(--color-border);">Date</th>
                <th style="text-align: center; padding: 0.75rem; border-bottom: 2px solid var(--color-border);">Status</th>
              </tr>
            </thead>
            <tbody>
    `;

    stats.records.forEach((record, index) => {
      const student = studentsData[record.studentId] || { name: record.studentId, id: record.studentId };
      const formattedDate = new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const isAbsent = record.status === 'absent';
      
      // Visual highlighting for absent records
      const rowStyle = isAbsent 
        ? 'background: #ffe6e6; border-left: 4px solid #dc3545;'
        : index % 2 === 0 ? 'background: white;' : 'background: #fafafa;';
      
      const statusBadge = isAbsent
        ? '<span style="background: #dc3545; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">❌ Absent</span>'
        : '<span style="background: #28a745; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">✓ Present</span>';
      
      const alertText = isAbsent ? `<div style="color: #dc3545; font-size: 0.85rem; margin-top: 0.25rem; font-style: italic;">${student.name} missed this class</div>` : '';

      reportHTML += `
        <tr style="${rowStyle} transition: background 0.2s;">
          <td style="padding: 0.75rem; border-bottom: 1px solid #f0f0f0;">
            <div style="font-weight: 600;">${student.name}</div>
            <div style="font-size: 0.85rem; color: #666;">${student.id}</div>
            ${alertText}
          </td>
          <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #f0f0f0;">${formattedDate}</td>
          <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #f0f0f0;">${statusBadge}</td>
        </tr>
      `;
    });

    reportHTML += `
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  reportHTML += `
      ${stats.totalRecords === 0 ? '<p style="margin-top: 1.5rem; color: #666; font-style: italic; text-align: center;">No attendance records found for this period.</p>' : ''}
    </div>
  `;

  reportContainer.innerHTML = reportHTML;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Show a message to the user
 */
function showMessage(message, type = 'success') {
  const msgSpan = document.getElementById('attendance-msg');
  msgSpan.textContent = message;
  msgSpan.style.color = type === 'error' ? '#ff3b3b' : 'var(--color-success)';
  
  // Clear message after 5 seconds
  setTimeout(() => {
    msgSpan.textContent = '';
  }, 5000);
}

// ========================================
// INITIALIZE ON PAGE LOAD
// ========================================

document.addEventListener('DOMContentLoaded', init);
