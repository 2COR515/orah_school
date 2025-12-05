// instructor-analytics.js - Analytics Dashboard Logic
const API_BASE_URL = 'http://localhost:3002/api';

let currentInstructorId = null;
let allLessons = [];
let allEnrollments = [];

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
        
        <button id="close-modal-btn" style="margin-top: 2rem; padding: 0.75rem 1.5rem; background: var(--color-primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">Close</button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    document.getElementById('close-modal-btn').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

/**
 * ✨ Load student progress tracking
 * Shows individual student performance with Topics Finished, Enrolled, Remaining, Missed, and Time Spent
 */
async function loadStudentProgressTracking() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('student-progress-list');
    const lessonFilter = document.getElementById('lesson-filter');
    
    if (!container) return;
    
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
            
            lessonFilter.onchange = () => renderStudentProgress(allEnrollments, container, lessonFilter.value);
        }
        
        // Render student progress
        renderStudentProgress(allEnrollments, container);
        
        console.log('✅ Student progress tracking loaded');
        
    } catch (error) {
        console.error('❌ Error loading student progress:', error);
        container.innerHTML = '<p style="color: #d32f2f;">Failed to load student progress data.</p>';
    }
}

/**
 * Render student progress with detailed metrics
 */
async function renderStudentProgress(enrollments, container, filterLessonId = null) {
    // Filter by lesson if specified
    let filteredEnrollments = enrollments;
    if (filterLessonId) {
        filteredEnrollments = enrollments.filter(e => e.lessonId === filterLessonId);
    }
    
    if (filteredEnrollments.length === 0) {
        container.innerHTML = '<p style="color: #666;">No student enrollments found.</p>';
        return;
    }
    
    // Group enrollments by student
    const studentMap = new Map();
    
    filteredEnrollments.forEach(enrollment => {
        if (!studentMap.has(enrollment.userId)) {
            studentMap.set(enrollment.userId, []);
        }
        studentMap.get(enrollment.userId).push(enrollment);
    });
    
    // Fetch user details
    const token = localStorage.getItem('token');
    const usersResponse = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    let users = [];
    if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        users = usersData.users || [];
    }
    
    // Render student cards
    container.innerHTML = '';
    
    for (const [userId, studentEnrollments] of studentMap) {
        const user = users.find(u => u.userId === userId);
        const studentName = user ? `${user.firstName} ${user.lastName}` : 'Unknown Student';
        const studentEmail = user ? user.email : '';
        
        // Calculate metrics
        const topicsEnrolled = studentEnrollments.length;
        const topicsFinished = studentEnrollments.filter(e => e.progress === 100).length;
        const topicsActive = studentEnrollments.filter(e => e.status === 'active' && e.progress < 100).length;
        const topicsMissed = studentEnrollments.filter(e => e.status === 'missed').length;
        const totalTimeSpent = studentEnrollments.reduce((sum, e) => sum + (e.timeSpentSeconds || 0), 0);
        const timeSpentMinutes = Math.floor(totalTimeSpent / 60);
        
        const card = document.createElement('div');
        card.style.cssText = `
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            transition: box-shadow 0.2s;
        `;
        card.onmouseenter = () => card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        card.onmouseleave = () => card.style.boxShadow = 'none';
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div>
                    <h4 style="margin: 0 0 0.25rem 0;">${escapeHtml(studentName)}</h4>
                    <p style="margin: 0; color: #666; font-size: 0.9rem;">${escapeHtml(studentEmail)}</p>
                </div>
                <div style="text-align: right; font-size: 0.9rem; color: #666;">
                    <div>⏱️ ${timeSpentMinutes} min</div>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem;">
                <div style="background: #e8f5e9; padding: 0.75rem; border-radius: 6px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #388e3c;">${topicsFinished}</div>
                    <div style="font-size: 0.8rem; color: #666;">Finished</div>
                </div>
                <div style="background: #e3f2fd; padding: 0.75rem; border-radius: 6px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #1976d2;">${topicsEnrolled}</div>
                    <div style="font-size: 0.8rem; color: #666;">Enrolled</div>
                </div>
                <div style="background: #fff3e0; padding: 0.75rem; border-radius: 6px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #f57c00;">${topicsActive}</div>
                    <div style="font-size: 0.8rem; color: #666;">In Progress</div>
                </div>
                <div style="background: #ffebee; padding: 0.75rem; border-radius: 6px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #d32f2f;">${topicsMissed}</div>
                    <div style="font-size: 0.8rem; color: #666;">Missed</div>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    }
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
