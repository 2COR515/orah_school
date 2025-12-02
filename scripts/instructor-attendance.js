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

  // Set today's date as default
  const dateInput = document.getElementById('attendance-date');
  dateInput.valueAsDate = new Date();

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
  document.getElementById('back-to-hub-btn').addEventListener('click', () => {
    window.location.href = 'instructor-hub.html';
  });

  // Logout button
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
  });

  // Lesson selection
  document.getElementById('lesson-select').addEventListener('change', handleLessonChange);

  // Save attendance button
  document.getElementById('save-attendance-btn').addEventListener('click', saveAttendance);

  // Generate report button
  document.getElementById('generate-report-btn').addEventListener('click', generateReport);
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
 */
async function fetchStudentDetails(enrollments) {
  studentsData = {};

  // Get unique student IDs
  const studentIds = [...new Set(enrollments.map(e => e.userId))];

  // For now, we'll use the userId as the display name
  // In a real system, you'd fetch from a users API endpoint
  studentIds.forEach(id => {
    studentsData[id] = {
      id: id,
      name: `Student ${id.substring(0, 8)}`, // Use first 8 chars of ID
      email: `student-${id.substring(0, 8)}@example.com`
    };
  });
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

    // Render report
    renderReport({
      totalRecords,
      presentCount,
      absentCount,
      attendanceRate,
      period: reportPeriod,
      lessonId: reportLessonId
    });

  } catch (error) {
    console.error('Error generating report:', error);
    reportContainer.innerHTML = '<p style="text-align: center; color: #ff3b3b; padding: 2rem;">Error generating report. Please try again.</p>';
  }
}

/**
 * Render the attendance report
 */
function renderReport(stats) {
  const reportContainer = document.getElementById('attendance-report');
  
  const periodText = {
    'week': 'Last Week',
    'month': 'Last Month',
    'all': 'All Time'
  }[stats.period] || stats.period;

  const reportHTML = `
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
