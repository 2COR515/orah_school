// scripts/upload.js
// Upload lesson form with backend integration

const API_BASE_URL = 'http://localhost:3001/api';
const INSTRUCTOR_ID = 'INST001'; // Hardcoded instructor ID

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('upload-form');
  const historyList = document.getElementById('history-list');

  // Create message area
  const msg = document.createElement('div');
  msg.id = 'upload-msg';
  msg.style.margin = '0.75rem 0';
  msg.style.padding = '0.75rem';
  msg.style.borderRadius = '4px';
  form.parentNode.insertBefore(msg, form.nextSibling);

  // Load upload history on page load
  loadUploadHistory();

  // Form submission handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    msg.style.display = 'none';

    // Validate form inputs
    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const topic = form.topic.value;
    const fileInput = form.querySelector('input[name="uploaded_file"]');
    const files = fileInput && fileInput.files;

    if (!title) {
      showMessage('Please enter a lesson title.', 'error');
      return;
    }

    if (!description) {
      showMessage('Please enter a lesson description.', 'error');
      return;
    }

    if (!topic) {
      showMessage('Please select a topic.', 'error');
      return;
    }

    if (!files || files.length === 0) {
      showMessage('Please choose at least one file to upload.', 'error');
      return;
    }

    // Show uploading message
    showMessage('Uploading lesson...', 'info');

    // Prepare FormData
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('topic', topic);
    formData.append('instructorId', INSTRUCTOR_ID);
    formData.append('status', 'published'); // Default to published

    // Append all selected files
    for (let i = 0; i < files.length; i++) {
      formData.append('lessonFiles', files[i]);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/lessons`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Show success message
      showMessage('✓ Lesson uploaded successfully!', 'success');
      
      // Add to history
      addToHistory(data.lesson);
      
      // Reset form
      form.reset();

      // Redirect to instructor dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = 'instructor-dashboard.html';
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      showMessage(`Upload failed: ${error.message}`, 'error');
    }
  });

  /**
   * Show a message to the user
   */
  function showMessage(message, type) {
    msg.textContent = message;
    msg.style.display = 'block';
    
    if (type === 'error') {
      msg.style.backgroundColor = '#f8d7da';
      msg.style.color = '#721c24';
      msg.style.border = '1px solid #f5c6cb';
    } else if (type === 'success') {
      msg.style.backgroundColor = '#d4edda';
      msg.style.color = '#155724';
      msg.style.border = '1px solid #c3e6cb';
    } else if (type === 'info') {
      msg.style.backgroundColor = '#d1ecf1';
      msg.style.color = '#0c5460';
      msg.style.border = '1px solid #bee5eb';
    }
  }

  /**
   * Add a lesson to the upload history list
   */
  function addToHistory(lesson) {
    const listItem = document.createElement('li');
    listItem.style.padding = '0.5rem 0';
    listItem.style.borderBottom = '1px solid #eee';
    
    const fileCount = lesson.files ? lesson.files.length : 0;
    const filesText = fileCount === 1 ? '1 file' : `${fileCount} files`;
    
    listItem.innerHTML = `
      <strong>${escapeHtml(lesson.title)}</strong><br>
      <small style="color: #666;">
        Topic: ${escapeHtml(lesson.topic)} | ${filesText} | 
        ${new Date(lesson.createdAt).toLocaleString()}
      </small>
    `;
    
    historyList.prepend(listItem);
  }

  /**
   * Load upload history from the API
   */
  async function loadUploadHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons?instructorId=${INSTRUCTOR_ID}`);
      
      if (!response.ok) {
        console.warn('Failed to load upload history');
        return;
      }

      const data = await response.json();
      const lessons = data.lessons || [];

      // Clear existing history
      historyList.innerHTML = '';

      if (lessons.length === 0) {
        historyList.innerHTML = '<li style="color: #666;">No uploads yet.</li>';
        return;
      }

      // Display each lesson in the history
      lessons.forEach(lesson => {
        addToHistory(lesson);
      });

    } catch (error) {
      console.error('Error loading upload history:', error);
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
});
