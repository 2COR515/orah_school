const API_BASE_URL = 'http://localhost:3002/api';
const UPLOADS_BASE_URL = 'http://localhost:3002'; // Already correctly set

let currentLesson = null;
let currentEnrollmentId = null;

// ✨ Time Spent Tracking Variables
let timeSpentOnLesson = 0; // Total time spent in THIS SESSION (seconds)
let lastSentTime = 0; // Last time value sent to backend
let startTime = null; // Timestamp when video starts playing
let timeTrackingInterval = null; // Interval for periodic updates

/**
 * Look up enrollment for current user and lesson
 */
async function lookupEnrollment(lessonId) {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
        showError('Cannot load enrollment: User not authenticated.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/enrollments/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch enrollments');
        }

        const data = await response.json();
        const enrollment = (data.enrollments || []).find(e => e.lessonId === lessonId);

        if (enrollment) {
            currentEnrollmentId = enrollment.id;
            await loadProgress(currentEnrollmentId);
        } else {
            showError('You are not enrolled in this lesson. Please enroll from the dashboard.');
        }
    } catch (error) {
        console.error('Lookup enrollment error:', error);
        showError('Failed to load enrollment data.');
    }
}

/**
 * Load lesson details from API (MODIFIED)
 */
async function loadLesson(lessonId) {
    // ... existing token check ...
    const token = localStorage.getItem('token');
    if (!token) {
        showError('You must be logged in to view lessons.');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }

    try {
        // ... existing fetch lesson logic ...
        const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            // Handle locked lesson response specially
            if (response.status === 403) {
                try {
                    const body = await response.json();
                    if (body && body.code === 'LESSON_LOCKED') {
                        // Show locked overlay and stop
                        showLockedOverlay();
                        return;
                    }
                } catch (e) {
                    // fallthrough to generic error
                }
            }

            if (response.status === 401) {
                throw new Error('Unauthorized. Please log in again.');
            }

            throw new Error(`Failed to load lesson: ${response.status}`);
        }

        const data = await response.json();
        currentLesson = data.lesson;

        if (!currentLesson) {
            throw new Error('Lesson not found');
        }

        // Render lesson content
        renderLesson(currentLesson);
        
        // Load quiz if available
        if (currentLesson.quiz && Array.isArray(currentLesson.quiz) && currentLesson.quiz.length > 0) {
            renderQuiz(currentLesson.quiz);
        }
        
        // Get enrollment ID from URL parameter or fetch it
        const urlParams = new URLSearchParams(window.location.search);
        const enrollmentIdFromUrl = urlParams.get('enrollmentId');
        
        if (enrollmentIdFromUrl) {
            currentEnrollmentId = enrollmentIdFromUrl;
            await loadProgress(currentEnrollmentId);
        } else {
            // Fallback: Look up enrollment by user and lesson
            await lookupEnrollment(lessonId);
        }

    } catch (error) {
        console.error('Load lesson error:', error);
        showError(`Failed to load lesson: ${error.message}`);
        setTimeout(() => {
            window.location.href = 'student-dashboard.html';
        }, 3000);
    }
}

/**
 * Render lesson details in the UI
 */
function renderLesson(lesson) {
    // Update title and description
    document.getElementById('lesson-title').textContent = lesson.title;
    document.getElementById('lesson-description').textContent = lesson.description || 'No description available.';

    // Setup video player
    const videoElement = document.getElementById('lesson-video');
    if (videoElement && lesson.videoUrl) {
        let videoSrc = lesson.videoUrl;
        
        // Handle relative URLs returned by the server (e.g., /uploads/file.mp4)
        if (!/^https?:\/\//.test(videoSrc)) {
            videoSrc = `${UPLOADS_BASE_URL}${videoSrc}`;
        }
        
        videoElement.innerHTML = ''; // Clear existing sources
        const source = document.createElement('source');
        source.src = videoSrc;
        
        // Try to determine type from extension, default to mp4
        let type = 'video/mp4';
        if (videoSrc.endsWith('.mkv')) type = 'video/x-matroska';
        else if (videoSrc.endsWith('.webm')) type = 'video/webm';
        
        source.type = type;
        
        // Add error handler for video loading failures
        source.onerror = function() {
            console.error('Video failed to load from:', videoSrc);
            console.error('Constructed URL:', source.src);
            
            // Replace video player with error message
            const videoContainer = videoElement.parentElement;
            videoContainer.innerHTML = `
                <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 2rem; text-align: center; color: #856404;">
                    <h3 style="margin: 0 0 1rem 0;">⚠️ Video Not Found</h3>
                    <p style="margin: 0 0 0.5rem 0;">The video file could not be loaded from the expected location.</p>
                    <p style="margin: 0; font-size: 0.9rem; font-family: monospace; color: #666;">Path: ${videoSrc}</p>
                    <p style="margin: 1rem 0 0 0; font-weight: 600;">Please contact your instructor to resolve this issue.</p>
                </div>
            `;
        };
        
        // Also add error handler to the video element itself
        videoElement.onerror = function() {
            console.error('Video element error for:', videoSrc);
        };
        
        videoElement.appendChild(source);
        videoElement.load();
        videoElement.parentElement.style.display = 'block';

        // Setup video progress tracking
        setupVideoProgressTracking(videoElement);
        
        // ✨ Setup time spent tracking
        setupTimeSpentTracking(videoElement);
    } else if (videoElement) {
        // If no video, hide the container or show placeholder
        videoElement.parentElement.style.display = 'none';
    }

    // Render resources (from files array and resourceZipUrl)
    renderResources(lesson.files, lesson.resourceZipUrl);
}

/**
 * Setup video progress tracking with timeupdate event
 */
function setupVideoProgressTracking(videoElement) {
    if (!currentEnrollmentId) {
        console.warn('No enrollment ID available for progress tracking');
        return;
    }

    let lastProgressSent = 0;
    const progressThresholds = [25, 50, 75, 100];

    videoElement.addEventListener('timeupdate', async () => {
        if (!videoElement.duration || videoElement.duration === 0) return;

        // Calculate current progress percentage
        const currentProgress = Math.floor((videoElement.currentTime / videoElement.duration) * 100);

        // Find the highest threshold that has been reached
        let newProgressMilestone = 0;
        for (const threshold of progressThresholds) {
            if (currentProgress >= threshold && threshold > lastProgressSent) {
                newProgressMilestone = threshold;
            }
        }

        // Update progress if a new milestone is reached
        if (newProgressMilestone > lastProgressSent) {
            await updateVideoProgress(newProgressMilestone);
            lastProgressSent = newProgressMilestone;
        }
    });
}

/**
 * Update video watch progress via API
 */
async function updateVideoProgress(progress) {
    const token = localStorage.getItem('token');
    if (!token || !currentEnrollmentId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/enrollments/${currentEnrollmentId}/progress`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ progress })
        });

        if (response.ok) {
            console.log(`Progress updated to ${progress}%`);
            
            // Update UI progress indicator
            const progressText = document.getElementById('progress-text');
            if (progressText) {
                if (progress >= 100) {
                    progressText.textContent = 'Completed ✓';
                    showSuccess('Lesson completed! 🎉');
                } else {
                    progressText.textContent = `In Progress (${progress}%)`;
                }
            }
        } else {
            if (response.status === 403) {
                try {
                    const body = await response.json();
                    if (body && body.code === 'LESSON_LOCKED') {
                        showLockedOverlay();
                        // Pause video if playing
                        const video = document.getElementById('lesson-video');
                        if (video && !video.paused) video.pause();
                        return;
                    }
                } catch (e) {
                    // ignore
                }
            }

            console.error('Failed to update progress:', response.status);
        }
    } catch (error) {
        console.error('Error updating video progress:', error);
    }
}

/**
 * ✨ Setup time spent tracking on video element
 * Tracks actual viewing time and sends updates to the backend
 */
function setupTimeSpentTracking(videoElement) {
    if (!currentEnrollmentId) {
        console.warn('No enrollment ID available for time tracking');
        return;
    }

    // Event listener: Video starts playing
    videoElement.addEventListener('play', () => {
        console.log('▶️ Video playing - Starting time tracking');
        startTime = Date.now();
        
        // Start periodic updates every 30 seconds while playing
        if (timeTrackingInterval) {
            clearInterval(timeTrackingInterval);
        }
        
        timeTrackingInterval = setInterval(() => {
            if (!videoElement.paused && startTime) {
                const duration = Math.floor((Date.now() - startTime) / 1000);
                timeSpentOnLesson += duration;
                startTime = Date.now(); // Reset for next interval
                console.log(`⏱️ Time spent update: ${timeSpentOnLesson}s total`);
            }
        }, 30000); // Update every 30 seconds
    });

    // Event listener: Video pauses
    videoElement.addEventListener('pause', () => {
        if (startTime) {
            const duration = Math.floor((Date.now() - startTime) / 1000);
            timeSpentOnLesson += duration;
            console.log(`⏸️ Video paused - Session duration: ${duration}s, Total: ${timeSpentOnLesson}s`);
            startTime = null;
        }
        
        // Clear the interval when paused
        if (timeTrackingInterval) {
            clearInterval(timeTrackingInterval);
            timeTrackingInterval = null;
        }
        
        // Send update to backend
        updateTimeSpent();
    });

    // Event listener: Video ends
    videoElement.addEventListener('ended', () => {
        if (startTime) {
            const duration = Math.floor((Date.now() - startTime) / 1000);
            timeSpentOnLesson += duration;
            console.log(`🏁 Video ended - Total time: ${timeSpentOnLesson}s`);
            startTime = null;
        }
        
        if (timeTrackingInterval) {
            clearInterval(timeTrackingInterval);
            timeTrackingInterval = null;
        }
        
        // Send final update
        updateTimeSpent();
    });

    // Event listener: Video seeking (skipping)
    videoElement.addEventListener('seeking', () => {
        // Reset startTime to prevent counting skipped time
        if (startTime && !videoElement.paused) {
            const duration = Math.floor((Date.now() - startTime) / 1000);
            timeSpentOnLesson += duration;
            startTime = Date.now(); // Reset
        }
    });
}

/**
 * ✨ Update time spent on the backend
 * Sends only the NEW time since last update (incremental)
 */
async function updateTimeSpent() {
    const token = localStorage.getItem('token');
    if (!token || !currentEnrollmentId) return;
    
    // Calculate increment since last sent
    const increment = timeSpentOnLesson - lastSentTime;
    
    if (increment <= 0) return; // Nothing new to send

    try {
        const response = await fetch(`${API_BASE_URL}/enrollments/${currentEnrollmentId}/progress`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                timeSpentSeconds: increment, // Send only the increment
                lastAccessDate: new Date().toISOString()
            })
        });

        if (response.ok) {
            lastSentTime = timeSpentOnLesson; // Update last sent marker
            console.log(`✅ Time increment sent: +${increment}s (Session total: ${timeSpentOnLesson}s)`);
        } else {
            console.error('Failed to update time spent:', response.status);
        }
    } catch (error) {
        console.error('Error updating time spent:', error);
    }
}

/**
 * ✨ Send final time update before page unload
 * Ensures the last viewing session is recorded
 */
function sendFinalTimeUpdate() {
    // If video is currently playing, capture remaining time
    if (startTime) {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        timeSpentOnLesson += duration;
        startTime = null;
    }

    // Clear interval
    if (timeTrackingInterval) {
        clearInterval(timeTrackingInterval);
        timeTrackingInterval = null;
    }

    // Calculate final increment
    const finalIncrement = timeSpentOnLesson - lastSentTime;

    // Send synchronous request using sendBeacon (more reliable for page unload)
    if (finalIncrement > 0 && currentEnrollmentId) {
        const token = localStorage.getItem('token');
        if (token) {
            const url = `${API_BASE_URL}/enrollments/${currentEnrollmentId}/progress`;
            const data = JSON.stringify({
                timeSpentSeconds: finalIncrement, // Send only unsent time
                lastAccessDate: new Date().toISOString()
            });

            // Try sendBeacon first (preferred for unload events)
            const blob = new Blob([data], { type: 'application/json' });
            const sent = navigator.sendBeacon(url, blob);
            
            if (sent) {
                console.log(`📤 Final increment sent via beacon: +${finalIncrement}s (Session: ${timeSpentOnLesson}s)`);
            } else {
                // Fallback to synchronous fetch
                console.log(`📤 Sending final increment via fetch: +${finalIncrement}s`);
                fetch(url, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: data,
                    keepalive: true // Allows request to complete even if page closes
                }).catch(err => console.error('Final update failed:', err));
            }
        }
    }
}

/**
 * Render downloadable resources
 * @param {Array} files - Array of file objects (legacy)
 * @param {String} resourceZipUrl - URL to resource ZIP file
 */
function renderResources(files, resourceZipUrl) {
    const resourcesList = document.getElementById('resources-list');
    if (!resourcesList) return;

    // Check if we have any resources to display
    const hasFiles = files && files.length > 0;
    const hasResourceZip = resourceZipUrl && resourceZipUrl.trim() !== '';

    if (!hasFiles && !hasResourceZip) {
        resourcesList.innerHTML = '<li class="text-tertiary">No additional resources available.</li>';
        return;
    }

    resourcesList.innerHTML = '';

    // Add resource ZIP file if available
    if (hasResourceZip) {
        const li = document.createElement('li');
        li.style.marginBottom = '1rem';
        li.style.padding = '1rem';
        li.style.background = 'var(--color-bg-secondary)';
        li.style.border = '1px solid var(--color-border-primary)';
        li.style.borderRadius = 'var(--radius-md)';
        
        const link = document.createElement('a');
        
        let href = resourceZipUrl;
        if (!/^https?:\/\//.test(href)) {
            href = `${UPLOADS_BASE_URL}${href}`;
        }
        
        link.href = href;
        link.target = '_blank';
        link.download = 'lesson-resources.zip';
        link.className = 'btn-primary btn-sm';
        link.style.textDecoration = 'none';
        link.style.display = 'inline-flex';
        link.style.alignItems = 'center';
        link.style.gap = '0.5rem';
        link.innerHTML = '<span>📦</span><span>Download Lesson Resources (ZIP)</span>';
        
        li.appendChild(link);
        resourcesList.appendChild(li);
    }

    // Add individual files if available (legacy support)
    if (hasFiles) {
        files.forEach(file => {
            const li = document.createElement('li');
            li.style.marginBottom = '0.75rem';
            li.style.padding = '0.75rem';
            li.style.background = 'var(--color-bg-secondary)';
            li.style.border = '1px solid var(--color-border-primary)';
            li.style.borderRadius = 'var(--radius-md)';
            
            const link = document.createElement('a');
            
            let href = file.url || file.filename || '';
            if (!/^https?:\/\//.test(href)) {
                href = `${UPLOADS_BASE_URL}${href}`;
            }
            
            link.href = href;
            link.target = '_blank';
            link.download = file.originalname || file.filename || 'download';
            link.className = 'btn-secondary btn-sm';
            link.style.textDecoration = 'none';
            link.style.display = 'inline-flex';
            link.style.alignItems = 'center';
            link.style.gap = '0.5rem';
            link.innerHTML = `<span>📄</span><span>${file.originalname || file.filename || 'Download Resource'}</span>`;
            
            li.appendChild(link);
            resourcesList.appendChild(li);
        });
    }
}

/**
 * Load progress for current enrollment
 */
async function loadProgress(enrollmentId) {
    if (!enrollmentId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/enrollments/${enrollmentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const enrollment = data.enrollment;
            
            if (enrollment) {
                const progressText = document.getElementById('progress-text');
                if (progressText) {
                    const progress = enrollment.progress || 0;
                    if (progress >= 100) {
                        progressText.textContent = 'Completed ✓';
                    } else if (progress > 0) {
                        progressText.textContent = `In Progress (${progress}%)`;
                    } else {
                        progressText.textContent = 'Not Started';
                    }
                }
            }
        }
        else if (response.status === 403) {
            try {
                const body = await response.json();
                if (body && body.code === 'LESSON_LOCKED') {
                    showLockedOverlay();
                }
            } catch (e) {
                // ignore
            }
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

/**
 * Show a locked UI overlay over the lesson area and provide a "Request Redo" button
 */
function showLockedOverlay() {
    // Hide video player and show a friendly locked message
    const videoContainer = document.getElementById('lesson-video')?.parentElement;
    if (videoContainer) videoContainer.style.display = 'none';

    // If overlay already exists, do nothing
    if (document.getElementById('lesson-lock-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'lesson-lock-overlay';
    overlay.style.cssText = `
        position: relative;
        margin: 1rem 0;
        padding: 2rem;
        background: linear-gradient(135deg,#fff,#f8f9fa);
        border: 1px solid #e9ecef;
        border-radius: 8px;
        text-align: center;
    `;

    overlay.innerHTML = `
        <h3 style="margin-top:0;">🔒 Lesson Locked</h3>
        <p>You missed the deadline for this lesson. If you need another attempt, request a redo from your instructor.</p>
    `;

    const btn = document.createElement('button');
    btn.className = 'btn-primary';
    btn.textContent = 'Request Redo';
    btn.style.marginTop = '1rem';
    btn.onclick = async () => {
        if (!currentEnrollmentId) return showError('No enrollment found to request redo.');
        const token = localStorage.getItem('token');
        if (!token) return showError('You must be logged in to request a redo.');

        btn.disabled = true;
        btn.textContent = 'Sending...';

        try {
            const resp = await fetch(`${API_BASE_URL}/enrollments/${currentEnrollmentId}/request-redo`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });

            if (resp.ok) {
                btn.textContent = 'Request Sent';
                showSuccess('Redo request sent to your instructor.');
            } else {
                btn.disabled = false;
                btn.textContent = 'Request Redo';
                const body = await resp.json().catch(() => ({}));
                showError(body && body.error ? body.error : 'Failed to send redo request');
            }
        } catch (err) {
            console.error('Request redo error:', err);
            btn.disabled = false;
            btn.textContent = 'Request Redo';
            showError('Failed to send redo request');
        }
    };

    overlay.appendChild(btn);

    const container = document.getElementById('lesson-main') || document.body;
    container.insertBefore(overlay, container.firstChild);
}

/**
 * Render quiz questions
 */
function renderQuiz(quiz) {
    const quizSection = document.getElementById('lesson-quiz');
    const questionsContainer = document.getElementById('quiz-questions-container');
    
    if (!quizSection || !questionsContainer || !quiz || quiz.length === 0) {
        if (quizSection) quizSection.style.display = 'none';
        return;
    }

    quizSection.style.display = 'block';
    questionsContainer.innerHTML = '';

    quiz.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'quiz-question';
        questionDiv.innerHTML = `
            <h4>Question ${index + 1}: ${escapeHtml(question.question)}</h4>
            <div class="quiz-options">
                ${question.options.map((option, optIndex) => `
                    <label class="quiz-option">
                        <input type="radio" name="question-${index}" value="${optIndex}" />
                        <span>${escapeHtml(option)}</span>
                    </label>
                `).join('')}
            </div>
        `;
        questionsContainer.appendChild(questionDiv);
    });

    // Setup quiz submission
    const submitBtn = document.getElementById('submit-quiz-btn');
    if (submitBtn) {
        submitBtn.onclick = () => submitQuiz(quiz);
    }
}

/**
 * Submit quiz and show results
 */
function submitQuiz(quiz) {
    let score = 0;
    const results = [];

    quiz.forEach((question, index) => {
        const selected = document.querySelector(`input[name="question-${index}"]:checked`);
        const selectedValue = selected ? parseInt(selected.value) : -1;
        const correct = selectedValue === question.correctAnswer;
        
        if (correct) score++;
        
        results.push({
            question: question.question,
            correct,
            userAnswer: selectedValue >= 0 ? question.options[selectedValue] : 'No answer',
            correctAnswer: question.options[question.correctAnswer]
        });
    });

    const percentage = Math.round((score / quiz.length) * 100);
    displayQuizResults(results, score, quiz.length, percentage);
}

/**
 * Display quiz results
 */
function displayQuizResults(results, score, total, percentage) {
    const resultsDiv = document.getElementById('quiz-results');
    if (!resultsDiv) return;

    let html = `
        <h3>Quiz Results: ${score}/${total} (${percentage}%)</h3>
        <div class="results-summary ${percentage >= 70 ? 'pass' : 'fail'}">
            ${percentage >= 70 ? '✓ Passed!' : '✗ Keep studying!'}
        </div>
    `;

    results.forEach((result, index) => {
        html += `
            <div class="result-item ${result.correct ? 'correct' : 'incorrect'}">
                <p><strong>Q${index + 1}:</strong> ${escapeHtml(result.question)}</p>
                <p>Your answer: ${escapeHtml(result.userAnswer)} ${result.correct ? '✓' : '✗'}</p>
                ${!result.correct ? `<p>Correct answer: ${escapeHtml(result.correctAnswer)}</p>` : ''}
            </div>
        `;
    });

    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
}

/**
 * Mark lesson as completed
 */
async function markAsCompleted() {
    if (!currentEnrollmentId) {
        showError('Cannot mark as completed: No enrollment found.');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        showError('You must be logged in.');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/enrollments/${currentEnrollmentId}/progress`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ progress: 100 })
        });

        if (!response.ok) {
            throw new Error('Failed to update progress');
        }

        showSuccess('Lesson marked as completed! 🎉');
        setTimeout(() => window.location.href = 'student-dashboard.html', 2000);

    } catch (error) {
        console.error('Mark completed error:', error);
        showError('Failed to mark as completed. Please try again.');
    }
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
 * Show info message
 */
function showInfo(message) {
    showToast(message, '#0dcaf0');
}

/**
 * Show toast notification
 */
function showToast(message, bgColor) {
    const existing = document.getElementById('player-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'player-toast';
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
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const lessonId = urlParams.get('lessonId') || urlParams.get('id');
    
    if (!lessonId) {
        showError('No lesson ID provided. Redirecting to dashboard...');
        setTimeout(() => window.location.href = 'student-dashboard.html', 2000);
        return;
    }

    // Load the lesson
    await loadLesson(lessonId);

    // Setup mark completed button
    const completeBtn = document.getElementById('mark-completed-btn');
    if (completeBtn) {
        completeBtn.addEventListener('click', markAsCompleted);
    }
    
    // Setup prev/next lesson buttons
    setupLessonNavigation(lessonId);
    
    // ✨ Setup beforeunload event to capture final time spent
    window.addEventListener('beforeunload', sendFinalTimeUpdate);
    
    // ✨ Also capture time when navigating away (SPA-style navigation)
    window.addEventListener('pagehide', sendFinalTimeUpdate);
});

/**
 * Setup lesson navigation (prev/next buttons)
 */
async function setupLessonNavigation(currentLessonId) {
    const prevBtn = document.getElementById('prev-lesson-btn');
    const nextBtn = document.getElementById('next-lesson-btn');
    
    if (!prevBtn || !nextBtn) {
        console.warn('Navigation buttons not found');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }
        
        // Fetch user's enrollments to get all available lessons
        const enrollmentsResponse = await fetch(`${API_BASE_URL}/enrollments/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!enrollmentsResponse.ok) {
            throw new Error('Failed to fetch enrollments');
        }
        
        const enrollmentsData = await enrollmentsResponse.json();
        const enrollments = enrollmentsData.enrollments || [];
        
        // Get lesson IDs sorted by enrollment date
        const lessonIds = enrollments
            .sort((a, b) => new Date(a.enrolledAt) - new Date(b.enrolledAt))
            .map(e => e.lessonId);
        
        const currentIndex = lessonIds.indexOf(currentLessonId);
        
        if (currentIndex === -1) {
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }
        
        // Setup previous button
        if (currentIndex > 0) {
            const prevLessonId = lessonIds[currentIndex - 1];
            prevBtn.disabled = false;
            prevBtn.onclick = () => {
                // Save current progress before navigating
                sendFinalTimeUpdate();
                window.location.href = `lesson-player.html?lessonId=${prevLessonId}`;
            };
        } else {
            prevBtn.disabled = true;
            prevBtn.style.opacity = '0.5';
            prevBtn.style.cursor = 'not-allowed';
        }
        
        // Setup next button
        if (currentIndex < lessonIds.length - 1) {
            const nextLessonId = lessonIds[currentIndex + 1];
            nextBtn.disabled = false;
            nextBtn.onclick = () => {
                // Save current progress before navigating
                sendFinalTimeUpdate();
                window.location.href = `lesson-player.html?lessonId=${nextLessonId}`;
            };
        } else {
            nextBtn.disabled = true;
            nextBtn.style.opacity = '0.5';
            nextBtn.style.cursor = 'not-allowed';
        }
        
    } catch (error) {
        console.error('Error setting up lesson navigation:', error);
        prevBtn.disabled = true;
        nextBtn.disabled = true;
    }
}