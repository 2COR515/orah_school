// Instructor Chatbot - Rule-Based Assistant
// 100% Client-Side Pattern Matching System
// NO API calls - fully self-contained

/**
 * Predefined chatbot responses for common instructor queries
 */
const CHATBOT_RESPONSES = {
  greeting: [
    "Hi! I'm here to help you manage your courses and students at Orah School. What would you like to know?",
    "Hello! How can I assist you with teaching today?",
    "Hey there! I'm your Orah School instructor assistant. What can I help you with?"
  ],
  
  lessons: [
    "To create a lesson: Go to 'My Lessons' and click 'Create New Lesson'. Add a title, description, video URL (YouTube/Vimeo), and set a duration. Your lesson will be available to enrolled students immediately!",
    "Managing lessons is easy! In the 'My Lessons' section, you can create, edit, or delete lessons. Each lesson can include video content, descriptions, and estimated completion time."
  ],
  
  students: [
    "To view your students: Go to the 'Students' section to see all enrolled learners. You can track their progress, completion rates, and engagement with your courses.",
    "Student management tools let you see who's enrolled in your courses, monitor their progress, and identify students who may need additional support."
  ],
  
  analytics: [
    "Your analytics dashboard shows: total enrolled students, lessons completed, average engagement metrics, and course performance trends. Access it from the 'Analytics' tab!",
    "Track your teaching impact with real-time analytics! See student enrollment trends, lesson completion rates, and overall course performance metrics."
  ],
  
  attendance: [
    "Attendance tracking helps you monitor student engagement. View attendance records to see which students are actively participating in your courses and completing lessons regularly.",
    "Check the 'Attendance' section to see student activity patterns, identify inactive students, and track overall course engagement over time."
  ],
  
  course: [
    "Courses contain multiple lessons organized by topic. Create a course structure, add individual lessons, and students can enroll to access all content at their own pace.",
    "To organize content effectively: Group related lessons into courses, set clear learning objectives, and provide estimated completion times for each lesson."
  ],
  
  reminders: [
    "Students can set up their own reminder preferences! They'll receive email notifications based on their chosen frequency (daily, twice weekly, or weekly) to stay engaged with courses.",
    "Reminder system helps with student retention. Students who set reminders are more likely to complete courses and stay engaged with learning materials."
  ],
  
  technical: [
    "If you're experiencing technical issues: Try refreshing the page, clearing browser cache, or using a different browser. For persistent problems, contact support@orahschools.com",
    "For video upload issues: Make sure you're using valid YouTube or Vimeo URLs. Direct video uploads aren't supported yet - use video hosting platforms instead."
  ],
  
  help: [
    "I can help you with:\n• Creating and managing lessons\n• Tracking student progress\n• Viewing analytics\n• Monitoring attendance\n• Organizing courses\n• Understanding reminders\n• Technical issues\n\nWhat would you like to know?",
    "Need help with something? I can assist with lesson creation, student management, analytics, attendance tracking, and more. Just ask!"
  ],
  
  default: [
    "I'm here to help with your teaching! You can ask me about creating lessons, managing students, viewing analytics, or tracking attendance.",
    "That's a great question! For detailed information, you might want to check the instructor guide or contact our support team at support@orahschools.com",
    "I'm still learning! For specific questions, try browsing our instructor documentation or reach out to support@orahschools.com"
  ]
};

/**
 * Pattern matching rules for identifying instructor intent
 */
const PATTERNS = {
  greeting: /(^|\s)(hi|hello|hey|greetings|good morning|good afternoon|good evening)/i,
  lessons: /(lesson|create|video|upload|content|add lesson|new lesson|edit lesson)/i,
  students: /(student|learner|enrolled|enrollment|who.*taking|view student)/i,
  analytics: /(analytics|stats|statistics|metrics|performance|report|dashboard|data)/i,
  attendance: /(attendance|present|absent|participation|engagement|active|inactive)/i,
  course: /(course|curriculum|organize|structure|module|program)/i,
  reminders: /(reminder|notify|notification|alert|email)/i,
  technical: /(error|bug|broken|not working|issue|problem|help|fix|crash|upload issue)/i,
  help: /(help|what can you|what do you|how does|guide|assist|support)/i
};

/**
 * Get chatbot response based on pattern matching
 * @param {string} userInput - User's message
 * @returns {string} Bot response text
 */
function getBotResponse(userInput) {
  const input = userInput.toLowerCase().trim();
  
  // Check each pattern and return appropriate response
  for (const [category, pattern] of Object.entries(PATTERNS)) {
    if (pattern.test(input)) {
      const responses = CHATBOT_RESPONSES[category];
      // Return random response from category
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
  
  // Default response if no pattern matches
  const defaultResponses = CHATBOT_RESPONSES.default;
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// XSS Prevention - Escape HTML in user input
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Add message to chat
function addMessage(message, isUser = false) {
  const messagesContainer = document.getElementById('chatbot-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = isUser ? 'user-message' : 'bot-message';
  
  const sender = isUser ? 'You' : 'Instructor Assistant';
  const escapedMessage = escapeHtml(message);
  
  messageDiv.innerHTML = `<strong>${sender}:</strong> ${escapedMessage}`;
  messagesContainer.appendChild(messageDiv);
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Add typing indicator to chat
 * @returns {HTMLElement} Typing indicator element
 */
function addTypingIndicator() {
  const messagesContainer = document.getElementById('chatbot-messages');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'bot-message typing-indicator';
  typingDiv.id = 'typing-indicator';
  typingDiv.innerHTML = '<strong>Instructor Assistant:</strong> <span class="typing-dots">Typing<span>.</span><span>.</span><span>.</span></span>';
  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  return typingDiv;
}

/**
 * Remove typing indicator from chat
 */
function removeTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Send message handler (synchronous rule-based responses)
function sendMessage() {
  const inputField = document.getElementById('chatbot-input');
  const userMessage = inputField.value.trim();

  if (!userMessage) return;

  // Add user message
  addMessage(userMessage, true);

  // Clear input
  inputField.value = '';

  // Show typing indicator briefly for natural feel
  addTypingIndicator();

  // Get instant rule-based response after brief delay (natural typing effect)
  setTimeout(() => {
    // Get bot response using pattern matching
    const botResponse = getBotResponse(userMessage);
    
    // Remove typing indicator
    removeTypingIndicator();
    
    // Add bot response
    addMessage(botResponse, false);
  }, 600); // 600ms delay for natural conversation feel
}

// Initialize instructor chatbot functionality
function initInstructorChatbot() {
  const chatbotContainer = document.getElementById('chatbot-container');
  const chatbotBtn = document.getElementById('instructor-chatbot-btn');
  const closeBtn = document.getElementById('chatbot-close-btn');
  const sendBtn = document.getElementById('chatbot-send-btn');
  const inputField = document.getElementById('chatbot-input');

  // Toggle chatbot visibility
  function toggleChatbot() {
    chatbotContainer.classList.toggle('active');
    
    // Focus input when opened
    if (chatbotContainer.classList.contains('active')) {
      setTimeout(() => inputField.focus(), 100);
    }
  }

  // Event Listeners
  if (chatbotBtn) {
    chatbotBtn.addEventListener('click', toggleChatbot);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', toggleChatbot);
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }

  if (inputField) {
    // Send message on Enter key
    inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInstructorChatbot);
} else {
  initInstructorChatbot();
}
