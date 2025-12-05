// Instructor Chatbot - AI-like Pattern Matching Responses
// Provides instant support for instructors with intelligent responses

// Chatbot response patterns and replies tailored for instructors
const CHATBOT_RESPONSES = {
  greeting: {
    patterns: [/hi|hello|hey|greetings|good morning|good afternoon|good evening/i],
    responses: [
      "Hello! 👋 How can I assist you with your teaching today?",
      "Hi there! I'm here to help with lessons, attendance, analytics, and more. What do you need?",
      "Hey! Welcome back. What can I help you with today?"
    ]
  },
  lessons: {
    patterns: [/lesson|lessons|create|upload|video|content|course|material/i],
    responses: [
      "To create a new lesson, go to the 'Manage Lessons' page. You can upload videos, create quizzes, and organize your content there!",
      "Need help with lessons? Visit the Lessons section to create, edit, or delete lesson content. You can upload videos and add interactive quizzes.",
      "The Lessons page lets you manage all your teaching content. Upload videos, create quizzes, and organize lessons for your students!"
    ]
  },
  attendance: {
    patterns: [/attendance|present|absent|mark|track|roster|student list/i],
    responses: [
      "You can track attendance in the 'Track Attendance' section. Mark students present or absent, view attendance history, and generate reports!",
      "To manage attendance: Go to the Attendance page, select a lesson, and mark students as present or absent. View reports to track patterns.",
      "The Attendance page lets you mark daily attendance, view history, and generate reports. You can track student attendance patterns over time."
    ]
  },
  analytics: {
    patterns: [/analytics|stats|statistics|performance|progress|report|metrics|data/i],
    responses: [
      "View detailed analytics on the 'Analytics' page! Track student progress, lesson completion rates, time spent learning, and engagement metrics.",
      "Check the Analytics section for comprehensive data on student performance, digital attendance rates, and lesson completion statistics.",
      "The Analytics dashboard shows student progress, completion rates, time spent on lessons, and missed topics. Perfect for identifying students who need help!"
    ]
  },
  deleteLesson: {
    patterns: [/delete|remove|erase|get rid|lesson deletion/i],
    responses: [
      "To delete a lesson, go to 'Manage Lessons', find the lesson you want to remove, and click the delete button. Note: This action cannot be undone!",
      "You can delete lessons from the Lessons page. Click the delete/trash icon on any lesson. Be careful - deletion is permanent!",
      "Delete lessons from the 'Manage Lessons' section. Find the lesson and use the delete option. Remember, this will remove it for all students!"
    ]
  },
  users: {
    patterns: [/user|users|student|students|account|manage users|delete user|add student/i],
    responses: [
      "User management is available in the Admin Dashboard (if you have admin access). You can view, add, edit, or remove student and instructor accounts.",
      "To manage users, you need admin privileges. Contact your system administrator or use the Admin Dashboard to manage student and instructor accounts.",
      "Student and user management requires admin access. If you're an admin, visit the Admin Dashboard to add, edit, or remove users."
    ]
  },
  quiz: {
    patterns: [/quiz|quizzes|test|exam|question|assessment/i],
    responses: [
      "Create quizzes when editing or creating a lesson! You can add multiple-choice questions, set correct answers, and track student performance.",
      "Quizzes are part of lesson creation. Go to 'Manage Lessons', create or edit a lesson, and add quiz questions with answer options.",
      "Add interactive quizzes to your lessons from the Lessons page. Students complete quizzes after watching videos, and you can track their scores!"
    ]
  },
  enrollment: {
    patterns: [/enroll|enrollment|registered|who is enrolled|student list/i],
    responses: [
      "View student enrollments in the Analytics section. You can see which students are enrolled in each lesson and track their progress.",
      "Check the Analytics page to see enrollment data for your lessons. You'll find lists of enrolled students and their completion status.",
      "To see who's enrolled in your lessons, visit the Analytics dashboard. It shows enrollment counts and individual student progress."
    ]
  },
  technical: {
    patterns: [/error|bug|not working|broken|issue|problem|help|stuck|video.*not|upload.*fail/i],
    responses: [
      "Experiencing technical issues? Try these steps: 1) Refresh the page, 2) Clear browser cache, 3) Try a different browser. Still stuck? Contact support@orahschools.com",
      "For technical problems: Refresh your browser first. If issues persist, check your internet connection or try logging out and back in. Email support@orahschools.com for help.",
      "Having trouble? Quick fixes: refresh the page, clear cache, check file size limits for uploads. Contact support@orahschools.com with error details for persistent issues."
    ]
  },
  reminders: {
    patterns: [/reminder|reminders|notification|notifications|email|alert/i],
    responses: [
      "The system automatically sends reminders to students based on their preferences. They can customize reminder frequency in their dashboard settings.",
      "Student reminders are automated! Students receive emails based on their chosen frequency (daily, weekly, twice-weekly, or never).",
      "Reminder notifications are sent automatically to students who have incomplete lessons. Students manage their own reminder preferences in their dashboard."
    ]
  },
  dashboard: {
    patterns: [/dashboard|hub|home|main page|overview/i],
    responses: [
      "The Instructor Hub is your central dashboard! From here, you can access Lessons, Attendance, Analytics, and view Quick Stats.",
      "Your dashboard shows quick stats and provides access to all instructor tools. Use the feature cards to navigate to Lessons, Attendance, or Analytics.",
      "The Instructor Hub gives you an overview of your teaching metrics and quick access to all tools. Check Quick Stats for total lessons, active students, and more!"
    ]
  },
  support: {
    patterns: [/contact|support|help desk|admin|email|phone|reach/i],
    responses: [
      "Need personalized support? Contact our team at support@orahschools.com. For admin-level help, reach out to your system administrator!",
      "For technical or administrative support, email support@orahschools.com. We typically respond within 24 hours!",
      "You can reach support at support@orahschools.com for any questions or issues. Include details about your problem for faster assistance!"
    ]
  },
  thanks: {
    patterns: [/thank|thanks|appreciate|helpful|great|awesome/i],
    responses: [
      "You're welcome! Happy teaching! 📚",
      "Glad I could help! Keep up the great work with your students! 🌟",
      "Anytime! If you need anything else, just ask! 💪"
    ]
  },
  default: {
    patterns: [],
    responses: [
      "I'm not sure I understand. Could you rephrase that? I can help with lessons, attendance, analytics, quizzes, user management, and technical issues.",
      "Hmm, I didn't quite catch that. I can assist with lessons, attendance tracking, analytics, student management, and technical support. What would you like to know?",
      "I'm here to help with lessons, attendance, analytics, quizzes, enrollments, and technical issues. Could you clarify your question?"
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
  
  const sender = isUser ? 'You' : 'Instructor Assistant';
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
  document.addEventListener('DOMContentLoaded', initChatbot);
} else {
  initChatbot();
}
