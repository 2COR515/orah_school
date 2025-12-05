// Student Chatbot - AI-like Pattern Matching Responses
// Provides instant support for students with intelligent responses

// Chatbot response patterns and replies
const CHATBOT_RESPONSES = {
  greeting: {
    patterns: [/hi|hello|hey|greetings|good morning|good afternoon|good evening/i],
    responses: [
      "Hello! 👋 How can I assist you today?",
      "Hi there! I'm here to help. What do you need?",
      "Hey! Welcome back. What can I do for you?"
    ]
  },
  courses: {
    patterns: [/course|courses|lesson|lessons|class|classes|enroll|available/i],
    responses: [
      "You can view all your courses in the dashboard above. Check 'Enrolled Lessons' for your current courses and 'Available Lessons' for new ones to join!",
      "To see your courses, scroll up to the dashboard. Your enrolled courses show your progress, and you can browse available courses to enroll in.",
      "Your courses are displayed in the dashboard sections above. Enrolled courses show your completion status, and you can explore new courses in the 'Available Lessons' section."
    ]
  },
  progress: {
    patterns: [/progress|completion|complete|finish|status|how am i doing|my performance/i],
    responses: [
      "Check your progress stats at the top of the dashboard! You can see completed lessons, enrollment status, and time spent learning.",
      "Your progress is tracked in real-time. Look at the stats cards at the top to see your completed lessons, enrolled courses, and study time.",
      "To view your progress, check the dashboard header showing your completed lessons, current enrollments, and total learning time!"
    ]
  },
  technical: {
    patterns: [/video|play|error|bug|not working|broken|issue|problem|help|stuck/i],
    responses: [
      "If you're experiencing technical issues, try refreshing the page first. If the problem persists, contact support@orahschools.com with details.",
      "For technical problems: 1) Refresh your browser, 2) Clear cache, 3) Try a different browser. Still stuck? Email support@orahschools.com",
      "Having trouble? Quick fixes: refresh the page, check your internet connection, or try logging out and back in. Contact support@orahschools.com for persistent issues."
    ]
  },
  time: {
    patterns: [/time|hours|minutes|spent|study time|how long/i],
    responses: [
      "Your total study time is displayed in the stats at the top of the dashboard. It's automatically tracked as you watch lessons!",
      "Study time is tracked automatically when you watch lessons. Check the 'Time Spent' stat card at the top to see your total learning hours.",
      "We track your learning time automatically! Your total study time is shown in the dashboard stats, updated in real-time as you learn."
    ]
  },
  reminders: {
    patterns: [/reminder|reminders|notification|notifications|email|alert/i],
    responses: [
      "You can customize your reminder frequency in the 'Reminder Settings' section above. Choose daily, weekly, or never!",
      "To manage reminders, scroll to the 'Reminder Settings' section on your dashboard. You can set the frequency that works best for you.",
      "Reminder preferences are in the 'Reminder Settings' section. Choose how often you'd like to receive email reminders about your courses!"
    ]
  },
  enrollment: {
    patterns: [/enroll|join|sign up|register|start|begin/i],
    responses: [
      "To enroll in a course, scroll to 'Available Lessons' and click 'Enroll Now' on any course you'd like to join!",
      "You can enroll in new courses from the 'Available Lessons' section. Just click 'Enroll Now' on any course that interests you.",
      "Ready to start learning? Check out the 'Available Lessons' section and click 'Enroll Now' on courses you want to take!"
    ]
  },
  support: {
    patterns: [/contact|support|help desk|email|phone|reach/i],
    responses: [
      "Need personalized help? Contact our support team at support@orahschools.com. We typically respond within 24 hours!",
      "For direct support, email us at support@orahschools.com. Our team is here to help with any questions or concerns!",
      "You can reach our support team at support@orahschools.com for personalized assistance. We're here to help!"
    ]
  },
  thanks: {
    patterns: [/thank|thanks|appreciate|helpful|great/i],
    responses: [
      "You're welcome! Happy learning! 😊",
      "Glad I could help! Keep up the great work! 🌟",
      "Anytime! If you need anything else, just ask! 💪"
    ]
  },
  default: {
    patterns: [],
    responses: [
      "I'm not sure I understand. Could you rephrase that? Or try asking about courses, progress, reminders, or technical issues.",
      "Hmm, I didn't quite catch that. I can help with courses, progress tracking, reminders, enrollments, and technical support. What would you like to know?",
      "I'm here to help with courses, progress, reminders, and technical issues. Could you clarify your question?"
    ]
  }
};

// XSS Prevention - Escape HTML in user input
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Get chatbot response based on user input
function getBotResponse(userInput) {
  const input = userInput.toLowerCase().trim();

  // Check each pattern category
  for (const category in CHATBOT_RESPONSES) {
    if (category === 'default') continue;
    
    const { patterns, responses } = CHATBOT_RESPONSES[category];
    for (const pattern of patterns) {
      if (pattern.test(input)) {
        // Return random response from category
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
  }

  // Return default response if no pattern matches
  const defaultResponses = CHATBOT_RESPONSES.default.responses;
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Add message to chat
function addMessage(message, isUser = false) {
  const messagesContainer = document.getElementById('chatbot-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = isUser ? 'user-message' : 'bot-message';
  
  const sender = isUser ? 'You' : 'Orah Assistant';
  const escapedMessage = escapeHtml(message);
  
  messageDiv.innerHTML = `<strong>${sender}:</strong> ${escapedMessage}`;
  messagesContainer.appendChild(messageDiv);
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send message handler
function sendMessage() {
  const inputField = document.getElementById('chatbot-input');
  const userMessage = inputField.value.trim();

  if (!userMessage) return;

  // Add user message
  addMessage(userMessage, true);

  // Clear input
  inputField.value = '';

  // Get and add bot response after short delay (simulate thinking)
  setTimeout(() => {
    const botResponse = getBotResponse(userMessage);
    addMessage(botResponse, false);
  }, 500);
}

// Initialize chatbot functionality
function initChatbot() {
  const chatbotContainer = document.getElementById('chatbot-container');
  const chatbotBtn = document.getElementById('student-chatbot-btn');
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
  document.addEventListener('DOMContentLoaded', initChatbot);
} else {
  initChatbot();
}
