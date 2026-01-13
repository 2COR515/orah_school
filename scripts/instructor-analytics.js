// instructor-analytics.js - Analytics Dashboard Logic
const API_BASE_URL = 'http://localhost:3002/api';

let currentInstructorId = null;
let allLessons = [];
let allEnrollments = [];

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

    console.log('📋 API Response:', { totalUsers: users.length, sampleUser: users[0] });

    // Create lookup map: userId -> user object
    users.forEach(user => {
      const displayName = user.name || user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.userId;
      userMap.set(user.userId, {
        id: user.userId,
        name: displayName,
        email: user.email || `${user.userId}@example.com`,
        role: user.role || 'unknown',
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      });
    });

    console.log(`✓ Loaded ${userMap.size} users into lookup map`);
    console.log('🗂️ User Map Keys:', Array.from(userMap.keys()));
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

/**
 * Initialize the analytics dashboard
 */
async function initAnalyticsDashboard() {
    console.log('📊 Initializing Analytics Dashboard...');
    
    // Check authentication
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');
    
    if (!token || !userId) {
        window.location.href = 'login.html';
        return;
    }
    
    if (role !== 'instructor' && role !== 'admin') {
        alert('Access denied. This page is for instructors and admins only.');
        window.location.href = 'index.html';
        return;
    }
    
    currentInstructorId = userId;
    
    // Load all analytics data
    await loadAnalyticsDashboard();
    await loadLessonPerformanceTable();
    await loadStudentProgressTracking();
    await loadEngagementInsights();
    // Load pending redo requests widget
    await loadRedoRequests();
}

/**
 * ✨ Load dashboard summary from analytics API
 * Fetches aggregated metrics including Digital Attendance Rate
 */
async function loadAnalyticsDashboard() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load dashboard: ${response.status}`);
        }
        
        const data = await response.json();
        const summary = data.summary;
        
        console.log('📊 Dashboard Summary:', summary);
        
        // Update overview stats
        document.getElementById('total-lessons-count').textContent = summary.overview.totalLessons || 0;
        document.getElementById('total-enrollments-count').textContent = summary.enrollments.total || 0;
        document.getElementById('avg-completion-rate').textContent = summary.enrollments.averageCompletionRate || '0%';
        document.getElementById('active-students-count').textContent = summary.overview.activeStudents || 0;
        
        // ✨ Add Digital Attendance Rate to UI (if there's a placeholder)
        const attendanceRateEl = document.getElementById('digital-attendance-rate');
        if (attendanceRateEl) {
            attendanceRateEl.textContent = summary.attendance.digitalAttendanceRate || '0%';
        }
        
        console.log('✅ Dashboard summary loaded');
        
    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        showMessage('Failed to load dashboard summary', 'error');
    }
}

/**
 * ✨ Load lesson performance table
 * Displays each lesson with enrollment count, average progress, and Digital Attendance Rate
 */
async function loadLessonPerformanceTable() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('lesson-performance-list');
    
    if (!container) return;
    
    try {
        // Fetch instructor's lessons
        const lessonsResponse = await fetch(`${API_BASE_URL}/lessons`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!lessonsResponse.ok) {
            throw new Error('Failed to load lessons');
        }
        
        const lessonsData = await lessonsResponse.json();
        allLessons = lessonsData.lessons || [];
        
        // Filter to instructor's lessons only (if not admin)
        const role = localStorage.getItem('role');
        if (role === 'instructor') {
            allLessons = allLessons.filter(l => l.instructorId === currentInstructorId);
        }
        
        if (allLessons.length === 0) {
            container.innerHTML = '<p style="color: #666;">No lessons found.</p>';
            return;
        }
        
        // Fetch performance data for each lesson
        const performancePromises = allLessons.map(async (lesson) => {
            try {
                const perfResponse = await fetch(`${API_BASE_URL}/analytics/lesson/${lesson.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (perfResponse.ok) {
                    const perfData = await perfResponse.json();
                    return {
                        lesson,
                        performance: perfData.performance
                    };
                }
            } catch (error) {
                console.error(`Error loading performance for lesson ${lesson.id}:`, error);
            }
            return { lesson, performance: null };
        });
        
        const performanceData = await Promise.all(performancePromises);
        
        // Render performance table
        renderLessonPerformanceTable(performanceData, container);
        
        console.log('✅ Lesson performance table loaded');
        
    } catch (error) {
        console.error('❌ Error loading lesson performance:', error);
        container.innerHTML = '<p style="color: #d32f2f;">Failed to load lesson performance data.</p>';
    }
}

/**
 * Render lesson performance table with all metrics
 */
function renderLessonPerformanceTable(performanceData, container) {
    if (!performanceData || performanceData.length === 0) {
        container.innerHTML = '<p style="color: #666;">No performance data available.</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.style.cssText = 'width: 100%; border-collapse: collapse; margin-top: 1rem;';
    
    // Table header
    table.innerHTML = `
        <thead>
            <tr style="background: var(--color-bg-soft); text-align: left;">
                <th style="padding: 0.75rem; border-bottom: 2px solid #ddd;">Lesson Title</th>
                <th style="padding: 0.75rem; border-bottom: 2px solid #ddd;">Status</th>
                <th style="padding: 0.75rem; border-bottom: 2px solid #ddd;">Enrollments</th>
                <th style="padding: 0.75rem; border-bottom: 2px solid #ddd;">Avg Progress</th>
                <th style="padding: 0.75rem; border-bottom: 2px solid #ddd;">Completion Rate</th>
                <th style="padding: 0.75rem; border-bottom: 2px solid #ddd;">Attendance Rate</th>
                <th style="padding: 0.75rem; border-bottom: 2px solid #ddd;">Missed Topics</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;
    
    const tbody = table.querySelector('tbody');
    
    performanceData.forEach(({ lesson, performance }) => {
        const row = document.createElement('tr');
        row.style.cssText = 'border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s;';
        row.onmouseenter = () => row.style.background = '#f9f9f9';
        row.onmouseleave = () => row.style.background = 'white';
        row.onclick = () => showLessonDetails(lesson, performance);
        
        const statusBadge = lesson.status === 'published' 
            ? '<span style="background: #4caf50; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">Published</span>'
            : '<span style="background: #ff9800; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">Draft</span>';
        
        const enrollments = performance ? performance.enrollments.total : 0;
        const avgProgress = performance ? performance.enrollments.averageProgress : '0%';
        const completionRate = performance ? performance.enrollments.completionRate : '0%';
        const attendanceRate = performance ? performance.attendance.attendanceRate : 'N/A';
        const missedTopics = performance ? performance.enrollments.missed : 0;
        
        row.innerHTML = `
            <td style="padding: 0.75rem; font-weight: 500;">${escapeHtml(lesson.title)}</td>
            <td style="padding: 0.75rem;">${statusBadge}</td>
            <td style="padding: 0.75rem;">${enrollments}</td>
            <td style="padding: 0.75rem;">${avgProgress}</td>
            <td style="padding: 0.75rem;">${completionRate}</td>
            <td style="padding: 0.75rem; font-weight: 600;">${attendanceRate}</td>
            <td style="padding: 0.75rem; color: ${missedTopics > 0 ? '#d32f2f' : '#666'};">${missedTopics}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    container.innerHTML = '';
    container.appendChild(table);
}

/**
 * Load pending redo requests for instructor and render widget
 */
async function loadRedoRequests() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('redo-requests-list');
    if (!container) return;

    try {
        const resp = await fetch(`${API_BASE_URL}/enrollments/pending-redo-requests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!resp.ok) {
            container.innerHTML = '<p style="color:#666;">Failed to load redo requests.</p>';
            return;
        }

        const data = await resp.json();
        const requests = data.requests || [];

        if (requests.length === 0) {
            container.innerHTML = '<p style="color:#666;">No pending redo requests.</p>';
            return;
        }

        const list = document.createElement('ul');
        list.style.listStyle = 'none';
        list.style.padding = '0';
        list.style.margin = '0';

        requests.forEach(r => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.style.padding = '0.5rem 0';
            li.style.borderBottom = '1px solid #eee';

            const left = document.createElement('div');
            left.innerHTML = `<strong>${escapeHtml(r.studentName)}</strong><div style="font-size:0.9rem;color:#666;">${escapeHtml(r.lessonTitle)}</div>`;

            const btn = document.createElement('button');
            btn.className = 'btn-primary btn-sm';
            btn.textContent = 'Approve';
            btn.onclick = async () => {
                btn.disabled = true;
                btn.textContent = 'Processing...';
                try {
                    const grantResp = await fetch(`${API_BASE_URL}/enrollments/${r.enrollmentId}/grant-redo`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (!grantResp.ok) {
                        const body = await grantResp.json().catch(() => ({}));
                        showMessage(body.error || 'Failed to grant redo', 'error');
                        btn.disabled = false;
                        btn.textContent = 'Approve';
                        return;
                    }

                    showMessage('Redo granted', 'success');
                    li.remove();
                } catch (err) {
                    console.error('Approve redo error:', err);
                    showMessage('Failed to grant redo', 'error');
                    btn.disabled = false;
                    btn.textContent = 'Approve';
                }
            };

            li.appendChild(left);
            li.appendChild(btn);
            list.appendChild(li);
        });

        container.innerHTML = '';
        container.appendChild(list);

    } catch (err) {
        console.error('Error loading redo requests:', err);
        container.innerHTML = '<p style="color:#d32f2f;">Error loading redo requests.</p>';
    }
}

/**
 * Show detailed lesson analytics in a modal/expanded view
 */
function showLessonDetails(lesson, performance) {
    if (!performance) {
        alert('No performance data available for this lesson.');
        return;
    }
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 2rem;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    `;
    
    content.innerHTML = `
        <h2 style="margin: 0 0 1.5rem 0;">${escapeHtml(lesson.title)}</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div style="background: #e3f2fd; padding: 1rem; border-radius: 8px;">
                <div style="font-size: 2rem; font-weight: bold; color: #1976d2;">${performance.enrollments.total}</div>
                <div style="color: #666; font-size: 0.9rem;">Total Enrollments</div>
            </div>
            <div style="background: #e8f5e9; padding: 1rem; border-radius: 8px;">
                <div style="font-size: 2rem; font-weight: bold; color: #388e3c;">${performance.enrollments.averageProgress}</div>
                <div style="color: #666; font-size: 0.9rem;">Avg Progress</div>
            </div>
            <div style="background: #fff3e0; padding: 1rem; border-radius: 8px;">
                <div style="font-size: 2rem; font-weight: bold; color: #f57c00;">${performance.attendance.attendanceRate}</div>
                <div style="color: #666; font-size: 0.9rem;">Attendance Rate</div>
            </div>
            <div style="background: #fce4ec; padding: 1rem; border-radius: 8px;">
                <div style="font-size: 2rem; font-weight: bold; color: #c2185b;">${performance.enrollments.missed}</div>
                <div style="color: #666; font-size: 0.9rem;">Missed Topics</div>
            </div>
        </div>
        
        <h3 style="margin: 1.5rem 0 0.75rem 0;">Progress Distribution</h3>
        <div style="background: var(--color-bg-soft); padding: 1rem; border-radius: 8px;">
            <div style="margin-bottom: 0.5rem;">Not Started: <strong>${performance.distribution.notStarted}</strong></div>
            <div style="margin-bottom: 0.5rem;">In Progress: <strong>${performance.distribution.inProgress}</strong></div>
            <div style="margin-bottom: 0.5rem;">Completed: <strong>${performance.distribution.completed}</strong></div>
            <div>Missed: <strong style="color: #d32f2f;">${performance.distribution.missed}</strong></div>
        </div>
        
        <h3 style="margin: 1.5rem 0 0.75rem 0;">Engagement Metrics</h3>
        <div style="background: var(--color-bg-soft); padding: 1rem; border-radius: 8px;">
            <div style="margin-bottom: 0.5rem;">Total Time Spent: <strong>${performance.engagement.totalTimeSpentMinutes} minutes</strong></div>
            <div style="margin-bottom: 0.5rem;">Avg Time per Student: <strong>${performance.engagement.averageTimeSpentMinutes} minutes</strong></div>
        </div>
        
        <h3 style="margin: 1.5rem 0 0.75rem 0;">Recent Activity (Last 7 Days)</h3>
        <div style="background: var(--color-bg-soft); padding: 1rem; border-radius: 8px;">
            <div style="margin-bottom: 0.5rem;">New Enrollments: <strong>${performance.recentActivity.enrollmentsLast7Days}</strong></div>
            <div>Completions: <strong>${performance.recentActivity.completionsLast7Days}</strong></div>
        </div>
        
        <h3 style="margin: 1.5rem 0 0.75rem 0;">Lesson Roster</h3>
        <div id="lesson-stats-lists" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem;"></div>

        <button id="close-modal-btn" style="margin-top: 2rem; padding: 0.75rem 1.5rem; background: var(--color-primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">Close</button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    document.getElementById('close-modal-btn').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };

    // Fetch lesson stats and render completed/missed/active lists
    (async () => {
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${API_BASE_URL}/lessons/${lesson.id}/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!resp.ok) {
                console.warn('Failed to load lesson stats:', resp.status);
                return;
            }

            const data = await resp.json();
            const stats = data.stats || { completed: [], missed: [], active: [] };
            const container = document.getElementById('lesson-stats-lists');
            if (!container) return;

            function makeList(title, items) {
                const box = document.createElement('div');
                box.style.background = 'var(--color-bg-soft)';
                box.style.padding = '1rem';
                box.style.borderRadius = '8px';
                box.style.maxHeight = '40vh';
                box.style.overflow = 'auto';
                box.innerHTML = `<h4 style="margin-top:0;">${escapeHtml(title)} (${items.length})</h4>`;

                if (items.length === 0) {
                    box.innerHTML += '<p style="color:#666;">None</p>';
                    return box;
                }

                const ul = document.createElement('ul');
                ul.style.listStyle = 'none';
                ul.style.padding = '0';
                items.forEach(it => {
                    const li = document.createElement('li');
                    li.style.padding = '0.5rem 0';
                    li.style.borderBottom = '1px solid #eee';
                    li.textContent = it.studentName || it.userId || 'Unknown';
                    ul.appendChild(li);
                });
                box.appendChild(ul);
                return box;
            }

            container.innerHTML = '';
            container.appendChild(makeList('Completed', stats.completed));
            container.appendChild(makeList('Missed', stats.missed));
            container.appendChild(makeList('Active', stats.active));

        } catch (err) {
            console.error('Error fetching lesson stats:', err);
        }
    })();
}

/**
 * ✨ Load student progress tracking
 * Shows individual student performance in a spreadsheet-style data table
 */
async function loadStudentProgressTracking() {
    const token = localStorage.getItem('token');
    const tableBody = document.getElementById('progress-table-body');
    const lessonFilter = document.getElementById('lesson-filter');
    const downloadBtn = document.getElementById('download-csv-btn');
    
    if (!tableBody) return;
    
    try {
        // Fetch all enrollments
        const enrollmentsResponse = await fetch(`${API_BASE_URL}/enrollments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!enrollmentsResponse.ok) {
            throw new Error('Failed to load enrollments');
        }
        
        const enrollmentsData = await enrollmentsResponse.json();
        allEnrollments = enrollmentsData.enrollments || [];
        
        // Filter to instructor's lessons only
        const role = localStorage.getItem('role');
        if (role === 'instructor') {
            const instructorLessonIds = new Set(allLessons.map(l => l.id));
            allEnrollments = allEnrollments.filter(e => instructorLessonIds.has(e.lessonId));
        }
        
        // Populate lesson filter dropdown
        if (lessonFilter && allLessons.length > 0) {
            lessonFilter.innerHTML = '<option value="">All Lessons</option>';
            allLessons.forEach(lesson => {
                const option = document.createElement('option');
                option.value = lesson.id;
                option.textContent = lesson.title;
                lessonFilter.appendChild(option);
            });
            
            lessonFilter.onchange = () => renderStudentProgress(allEnrollments, tableBody, lessonFilter.value);
        }
        
        // Attach CSV download button
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => downloadCSV(allEnrollments, lessonFilter.value));
        }
        
        // Render student progress
        renderStudentProgress(allEnrollments, tableBody);
        
        console.log('✅ Student progress tracking loaded');
        
    } catch (error) {
        console.error('❌ Error loading student progress:', error);
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #d32f2f; padding: 2rem;">Failed to load student progress data.</td></tr>';
    }
}

/**
 * Render student progress in a spreadsheet-style table
 * ✨ Flattens completed/missed/active arrays into one sorted list with proper names
 */
async function renderStudentProgress(enrollments, tableBody, filterLessonId = null) {
    // Filter by lesson if specified
    let filteredEnrollments = enrollments;
    if (filterLessonId) {
        filteredEnrollments = enrollments.filter(e => e.lessonId === filterLessonId);
    }
    
    if (filteredEnrollments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999; padding: 2rem;">No student enrollments found.</td></tr>';
        return;
    }
    
    // ✨ Use central user map utility for consistent name lookup
    const userMap = await fetchUserMap();
    
    console.log('🔍 Rendering progress for enrollments:', {
      totalEnrollments: filteredEnrollments.length,
      sampleEnrollment: filteredEnrollments[0],
      userMapSize: userMap.size
    });
    
    // Flatten enrollments into a single array with status and date info
    const progressRows = filteredEnrollments.map(enrollment => {
        // Determine status
        let status = 'In Progress';
        let statusClass = 'in-progress';
        let dateDisplay = new Date(enrollment.enrolledAt).toLocaleDateString();
        
        if (enrollment.progress === 100) {
            status = 'Completed';
            statusClass = 'completed';
            dateDisplay = enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString() : dateDisplay;
        } else if (enrollment.status === 'missed') {
            status = 'Missed';
            statusClass = 'missed';
        }
        
        // Get student name from user map
        const user = userMap.get(enrollment.userId);
        const studentName = user ? user.name : 'No Name';
        
        console.log(`📌 Enrollment ${enrollment.userId}:`, { 
          found: !!user, 
          name: studentName,
          mapHas: userMap.has(enrollment.userId)
        });
        
        return {
            enrollment,
            studentName,
            status,
            statusClass,
            date: dateDisplay,
            userId: enrollment.userId,
            lessonId: enrollment.lessonId
        };
    });
    
    // Sort by student name
    progressRows.sort((a, b) => a.studentName.localeCompare(b.studentName));
    
    // Clear table and render rows
    tableBody.innerHTML = '';
    
    progressRows.forEach(row => {
        const tr = document.createElement('tr');
        
        // Name cell
        const nameCell = document.createElement('td');
        nameCell.textContent = row.studentName;
        
        // Status cell with badge
        const statusCell = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `status-badge ${row.statusClass}`;
        badge.textContent = row.status;
        statusCell.appendChild(badge);
        
        // Date cell
        const dateCell = document.createElement('td');
        dateCell.textContent = row.date;
        
        // Action cell
        const actionCell = document.createElement('td');
        
        // Show action button only for Missed or In Progress with redoRequested=true
        if (row.status === 'Missed' || (row.status === 'In Progress' && row.enrollment.redoRequested)) {
            const approveBtn = document.createElement('button');
            approveBtn.className = 'btn-redo';
            approveBtn.textContent = 'Approve Redo';
            approveBtn.addEventListener('click', () => handleApproveRedo(row.enrollment));
            actionCell.appendChild(approveBtn);
        }
        
        tr.appendChild(nameCell);
        tr.appendChild(statusCell);
        tr.appendChild(dateCell);
        tr.appendChild(actionCell);
        
        tableBody.appendChild(tr);
    });
    
    // Store current rows for CSV export
    window.currentProgressRows = progressRows;
}

/**
 * Handle approval of redo request
 */
async function handleApproveRedo(enrollment) {
    if (!confirm(`Approve redo for this student?`)) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/enrollments/${enrollment.id}/grant-redo`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to grant redo');
        }
        
        alert('✅ Redo granted! Student can now retake the lesson.');
        
        // Reload the progress tracking
        await loadStudentProgressTracking();
        
    } catch (error) {
        console.error('❌ Error granting redo:', error);
        alert(`❌ Error: ${error.message}`);
    }
}

/**
 * Download current progress table as CSV
 */
function downloadCSV(enrollments, filterLessonId = null) {
    if (!window.currentProgressRows || window.currentProgressRows.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Filter by lesson if needed
    let rows = window.currentProgressRows;
    if (filterLessonId) {
        rows = rows.filter(r => r.lessonId === filterLessonId);
    }
    
    if (rows.length === 0) {
        alert('No data to export for selected lesson');
        return;
    }
    
    // Build CSV
    const headers = ['Name', 'Status', 'Date'];
    const csvContent = [
        headers.join(','),
        ...rows.map(row => [
            `"${row.studentName.replace(/"/g, '""')}"`,  // Escape quotes
            `"${row.status}"`,
            `"${row.date}"`
        ].join(','))
    ].join('\n');
    
    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `class_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ CSV downloaded successfully');
}

/**
 * Load engagement insights (popular lessons, recent activity, trends)
 */
async function loadEngagementInsights() {
    // Popular Lessons (by enrollment count)
    const popularLessonsEl = document.getElementById('popular-lessons');
    if (popularLessonsEl && allEnrollments.length > 0) {
        const lessonEnrollmentCounts = {};
        allEnrollments.forEach(e => {
            lessonEnrollmentCounts[e.lessonId] = (lessonEnrollmentCounts[e.lessonId] || 0) + 1;
        });
        
        const sortedLessons = Object.entries(lessonEnrollmentCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        popularLessonsEl.innerHTML = sortedLessons.map(([lessonId, count]) => {
            const lesson = allLessons.find(l => l.id === lessonId);
            const title = lesson ? lesson.title : 'Unknown Lesson';
            return `<div style="margin-bottom: 0.5rem;">📚 ${escapeHtml(title)} <strong>(${count} enrollments)</strong></div>`;
        }).join('') || '<p>No data available</p>';
    }
    
    // Recent Activity
    const recentActivityEl = document.getElementById('recent-activity');
    if (recentActivityEl && allEnrollments.length > 0) {
        const now = Date.now();
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        
        const recentEnrollments = allEnrollments.filter(e => e.enrolledAt > sevenDaysAgo);
        const recentCompletions = allEnrollments.filter(e => e.completedAt && e.completedAt > sevenDaysAgo);
        
        recentActivityEl.innerHTML = `
            <div style="margin-bottom: 0.5rem;">📈 <strong>${recentEnrollments.length}</strong> new enrollments</div>
            <div>✅ <strong>${recentCompletions.length}</strong> lessons completed</div>
        `;
    }
    
    // Completion Trends
    const completionTrendsEl = document.getElementById('completion-trends');
    if (completionTrendsEl && allEnrollments.length > 0) {
        const totalEnrollments = allEnrollments.length;
        const completedEnrollments = allEnrollments.filter(e => e.progress === 100).length;
        const overallCompletionRate = Math.round((completedEnrollments / totalEnrollments) * 100);
        
        completionTrendsEl.innerHTML = `
            <div style="margin-bottom: 0.5rem;">Overall Completion Rate: <strong>${overallCompletionRate}%</strong></div>
            <div style="background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden;">
                <div style="background: linear-gradient(to right, #4caf50, #8bc34a); height: 100%; width: ${overallCompletionRate}%;"></div>
            </div>
        `;
    }
}

/**
 * Show message to user
 */
function showMessage(message, type = 'info') {
    const colors = {
        info: '#2196F3',
        success: '#4CAF50',
        error: '#f44336'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 1rem;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 4000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    initAnalyticsDashboard();
    
    // Back to hub button
    const backBtn = document.getElementById('back-to-hub-btn');
    if (backBtn) {
        backBtn.onclick = () => window.location.href = 'instructor-hub.html';
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.clear();
            window.location.href = 'login.html';
        };
    }
});
