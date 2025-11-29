const API_BASE_URL = 'http://localhost:3002/api';
const UPLOADS_BASE_URL = 'http://localhost:3002'; // Already correctly set

let currentLesson = null;
let currentEnrollmentId = null;

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
            if (response.status === 401 || response.status === 403) {
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
    } else if (videoElement) {
        // If no video, hide the container or show placeholder
        videoElement.parentElement.style.display = 'none';
    }

    // Render resources
    renderResources(lesson.files);
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
            console.error('Failed to update progress:', response.status);
        }
    } catch (error) {
        console.error('Error updating video progress:', error);
    }
}

/**
 * Render downloadable resources
 */
function renderResources(files) {
    const resourcesList = document.getElementById('resources-list');
    if (!resourcesList) return;

    if (!files || files.length === 0) {
        resourcesList.innerHTML = '<li class="no-resources">No additional resources</li>';
        return;
    }

    resourcesList.innerHTML = '';
    files.forEach(file => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        
        let href = file.url || file.filename || '';
        if (!/^https?:\/\//.test(href)) {
            href = `${UPLOADS_BASE_URL}${href}`;
        }
        
        link.href = href;
        link.target = '_blank';
        link.download = file.originalname || file.filename || 'download';
        link.textContent = file.originalname || file.filename || 'Download Resource';
        
        li.appendChild(link);
        resourcesList.appendChild(li);
    });
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
    } catch (error) {
        console.error('Error loading progress:', error);
    }
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
});