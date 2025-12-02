// admin-dashboard.js - Admin dashboard client-side logic
const API_BASE_URL = 'http://localhost:3002/api';

// Helper function to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Check if user is admin
function checkAdminRole() {
    const userRole = localStorage.getItem('role');
    if (userRole !== 'admin') {
        showToast('Access denied. Admin role required.', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return false;
    }
    return true;
}

/**
 * Load system overview statistics
 */
async function loadSystemStats() {
    try {
        // Fetch all data from admin endpoints
        const [usersRes, lessonsRes, enrollmentsRes, attendanceRes] = await Promise.all([
            fetch(`${API_BASE_URL}/admin/users`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE_URL}/admin/lessons`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE_URL}/admin/enrollments`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE_URL}/admin/attendance`, { headers: getAuthHeaders() })
        ]);

        const usersData = await usersRes.json();
        const lessonsData = await lessonsRes.json();
        const enrollmentsData = await enrollmentsRes.json();
        const attendanceData = await attendanceRes.json();

        // Update stats
        document.getElementById('total-users').textContent = usersData.users?.length || 0;
        document.getElementById('total-lessons').textContent = lessonsData.lessons?.length || 0;
        document.getElementById('total-enrollments').textContent = enrollmentsData.enrollments?.length || 0;
        document.getElementById('total-attendance').textContent = attendanceData.records?.length || 0;

    } catch (error) {
        console.error('Error loading stats:', error);
        showToast('Failed to load system statistics', 'error');
    }
}

/**
 * Load and display all users
 */
async function loadUsers() {
    try {
        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = '<tr><td colspan="5" class="loading">Loading users...</td></tr>';

        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load users');
        }

        tbody.innerHTML = '';

        if (!data.users || data.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty">No users found</td></tr>';
            return;
        }

        const currentUserId = localStorage.getItem('userId');

        data.users.forEach(user => {
            const isCurrentUser = user.userId === currentUserId;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="user-name">
                        ${user.firstName || 'N/A'} ${user.lastName || ''}
                        ${isCurrentUser ? '<span class="badge badge-info">You</span>' : ''}
                    </div>
                </td>
                <td>${user.email}</td>
                <td>
                    <select class="role-select" data-user-id="${user.userId}" ${isCurrentUser ? 'disabled' : ''}>
                        <option value="student" ${user.role === 'student' ? 'selected' : ''}>Student</option>
                        <option value="instructor" ${user.role === 'instructor' ? 'selected' : ''}>Instructor</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td class="action-buttons">
                    <button class="btn-update-role btn-primary" data-user-id="${user.userId}" ${isCurrentUser ? 'disabled' : ''}>
                        Update Role
                    </button>
                    <button class="btn-delete-user btn-danger" data-user-id="${user.userId}" ${isCurrentUser ? 'disabled' : ''}>
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Attach event listeners
        attachUserActionListeners();

    } catch (error) {
        console.error('Error loading users:', error);
        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = '<tr><td colspan="5" class="error">Failed to load users</td></tr>';
        showToast('Failed to load users', 'error');
    }
}

/**
 * Attach event listeners to user action buttons
 */
function attachUserActionListeners() {
    // Update role buttons
    document.querySelectorAll('.btn-update-role').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const userId = e.target.dataset.userId;
            const select = document.querySelector(`.role-select[data-user-id="${userId}"]`);
            const newRole = select.value;

            if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
                await updateUserRole(userId, newRole);
            }
        });
    });

    // Delete buttons
    document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const userId = e.target.dataset.userId;

            if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                await deleteUser(userId);
            }
        });
    });
}

/**
 * Update user role
 */
async function updateUserRole(userId, newRole) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ role: newRole })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update role');
        }

        showToast('User role updated successfully', 'success');
        await loadUsers(); // Reload the table
        await loadSystemStats(); // Update stats

    } catch (error) {
        console.error('Error updating role:', error);
        showToast(error.message, 'error');
    }
}

/**
 * Delete user
 */
async function deleteUser(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete user');
        }

        showToast('User deleted successfully', 'success');
        await loadUsers(); // Reload the table
        await loadSystemStats(); // Update stats

    } catch (error) {
        console.error('Error deleting user:', error);
        showToast(error.message, 'error');
    }
}

/**
 * Load and display all lessons
 */
async function loadLessons() {
    try {
        const tbody = document.getElementById('lessons-tbody');
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading lessons...</td></tr>';

        const response = await fetch(`${API_BASE_URL}/admin/lessons`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load lessons');
        }

        // Get enrollment counts
        const enrollmentsRes = await fetch(`${API_BASE_URL}/admin/enrollments`, { headers: getAuthHeaders() });
        const enrollmentsData = await enrollmentsRes.json();
        const enrollmentCounts = {};
        
        if (enrollmentsData.enrollments) {
            enrollmentsData.enrollments.forEach(e => {
                enrollmentCounts[e.lessonId] = (enrollmentCounts[e.lessonId] || 0) + 1;
            });
        }

        tbody.innerHTML = '';

        if (!data.lessons || data.lessons.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty">No lessons found</td></tr>';
            return;
        }

        data.lessons.forEach(lesson => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="lesson-title">${lesson.title}</div>
                    ${lesson.topic ? `<div class="lesson-topic">${lesson.topic}</div>` : ''}
                </td>
                <td>${lesson.instructorId ? lesson.instructorId.substring(0, 8) + '...' : 'N/A'}</td>
                <td><span class="badge badge-${lesson.status === 'published' ? 'success' : 'warning'}">${lesson.status || 'draft'}</span></td>
                <td>${enrollmentCounts[lesson.id] || 0}</td>
                <td>${new Date(lesson.createdAt).toLocaleDateString()}</td>
                <td class="action-buttons">
                    <button class="btn-view-lesson btn-secondary" data-lesson-id="${lesson.id}">
                        View
                    </button>
                    <button class="btn-delete-lesson btn-danger" data-lesson-id="${lesson.id}">
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Attach event listeners
        attachLessonActionListeners();

    } catch (error) {
        console.error('Error loading lessons:', error);
        const tbody = document.getElementById('lessons-tbody');
        tbody.innerHTML = '<tr><td colspan="6" class="error">Failed to load lessons</td></tr>';
        showToast('Failed to load lessons', 'error');
    }
}

/**
 * Attach event listeners to lesson action buttons
 */
function attachLessonActionListeners() {
    // View buttons
    document.querySelectorAll('.btn-view-lesson').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const lessonId = e.target.dataset.lessonId;
            window.open(`lesson-player.html?id=${lessonId}`, '_blank');
        });
    });

    // Delete buttons
    document.querySelectorAll('.btn-delete-lesson').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const lessonId = e.target.dataset.lessonId;

            if (confirm('Are you sure you want to delete this lesson? This will also delete all related enrollments and progress data.')) {
                await deleteLesson(lessonId);
            }
        });
    });
}

/**
 * Delete lesson
 */
async function deleteLesson(lessonId) {
    try {
        const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete lesson');
        }

        showToast('Lesson deleted successfully', 'success');
        await loadLessons(); // Reload the table
        await loadSystemStats(); // Update stats

    } catch (error) {
        console.error('Error deleting lesson:', error);
        showToast(error.message, 'error');
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 5000);
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Check admin access
    if (!checkAdminRole()) {
        return;
    }
    
    // Load initial data
    loadSystemStats();
    loadUsers();
    loadLessons();

    // Navigation buttons
    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = 'instructor-hub.html';
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.clear();
            window.location.href = 'login.html';
        }
    });

    // Refresh buttons
    document.getElementById('refresh-users-btn').addEventListener('click', () => {
        loadUsers();
        showToast('Users refreshed', 'success');
    });

    document.getElementById('refresh-lessons-btn').addEventListener('click', () => {
        loadLessons();
        showToast('Lessons refreshed', 'success');
    });
});
