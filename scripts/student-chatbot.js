/**
 * Student Chatbot - Rule-Based Assistant
 * 100% Client-Side Pattern Matching System
 * 
 * This module handles all student chatbot interactions including:
 * - Message sending and receiving
 * - Rule-based pattern matching responses
 * - Chat UI management
 * - NO API calls - fully self-contained
 */
(function() {
  'use strict';

  console.log('📱 Student Chatbot Script Loaded (Rule-Based)');
  console.log('Current page:', window.location.pathname);
  console.log('DOM State:', document.readyState);

  /**
   * Predefined chatbot responses for common student queries
   */
  const CHATBOT_RESPONSES = {
    greeting: [
      "Hi! I'm here to help you with your learning at Orah School. What would you like to know?",
      "Hello! How can I assist you with your courses today?",
      "Hey there! I'm your Orah School assistant. What can I help you with?"
    ],
    
    enrollment: [
      "To enroll in a course: Go to the 'Available Courses' section on your dashboard, find a course you're interested in, and click 'Enroll'. You'll be able to start learning right away!",
      "Enrolling is easy! Browse available courses, click on one that interests you, and hit the 'Enroll' button. Your progress will be tracked automatically."
    ],
    
    progress: [
      "You can check your progress by viewing your dashboard. It shows your completion percentage for each enrolled course, time spent learning, and upcoming deadlines.",
      "Your learning progress is tracked automatically! Check the stats at the top of your dashboard to see your overall completion rate and courses in progress."
    ],
    
    lessons: [
      "To access your lessons: Click on 'My Courses' to see all enrolled courses, then select a course to view its lessons. Click 'Start Lesson' to begin learning!",
      "Your lessons are in the 'My Courses' section. Each course has multiple lessons you can complete at your own pace."
    ],
    
    reminders: [
      "You can set up study reminders! Go to your account settings and choose how often you'd like to receive reminder emails: daily, twice weekly, or weekly.",
      "Reminder emails help you stay on track! Set your preference in the settings to get notifications about your incomplete courses."
    ],
    
    completion: [
      "When you complete a lesson, your progress automatically updates. Complete all lessons in a course to mark it as 100% complete and earn your completion certificate!",
      "Progress is saved as you go. Watch the entire video lesson and complete any quizzes to mark that lesson as done."
    ],
    
    technical: [
      "If you're having technical issues: Try refreshing the page, clearing your browser cache, or using a different browser. If problems persist, contact support@orahschools.com",
      "For video playback issues: Check your internet connection, try a different browser, or reduce video quality. Still having trouble? Email support@orahschools.com"
    ],
    
    help: [
      "I can help you with:\n• Enrolling in courses\n• Tracking your progress\n• Accessing lessons\n• Setting up reminders\n• Understanding completion requirements\n• Technical issues\n\nWhat would you like to know?",
      "Need help with something? I can assist with course enrollment, progress tracking, lessons, reminders, and more. Just ask!"
    ],
    
    default: [
      "I'm here to help with your learning! You can ask me about enrolling in courses, tracking progress, accessing lessons, or setting reminders.",
      "That's a great question! For detailed information, you might want to check the FAQ section or contact our support team at support@orahschools.com",
      "I'm still learning! For specific questions, try browsing our help documentation or reach out to support@orahschools.com"
    ]
  };

  /**
   * Pattern matching rules for identifying user intent
   */
  const PATTERNS = {
    greeting: /(^|\s)(hi|hello|hey|greetings|good morning|good afternoon|good evening)/i,
    enrollment: /(enroll|join|sign up|register|add|take course)/i,
    progress: /(progress|track|completion|how far|percentage|stats|status)/i,
    lessons: /(lesson|course|module|video|watch|learn|study|access)/i,
    reminders: /(reminder|notify|notification|alert|email)/i,
    completion: /(complete|finish|done|certificate|graduation)/i,
    technical: /(error|bug|broken|not working|issue|problem|help|fix|crash)/i,
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

  /**
   * Escape HTML to prevent XSS attacks
   * @param {string} text - Text to escape
   * @returns {string} Escaped HTML string
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Add message to chat interface
   * @param {string} message - Message text to display
   * @param {boolean} isUser - True if message is from user, false if from bot
   */
  function addMessage(message, isUser = false) {
    const messagesContainer = document.getElementById('chatbot-messages');
    if (!messagesContainer) {
      console.error('❌ Messages container not found');
      return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'user-message' : 'bot-message';
    
    const sender = isUser ? 'You' : 'Orah Assistant';
    const escapedMessage = escapeHtml(message);
    
    messageDiv.innerHTML = `<strong>${sender}:</strong> ${escapedMessage}`;
    messagesContainer.appendChild(messageDiv);
    
    // Auto-scroll to show latest message
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    console.log(`💬 Message added (${isUser ? 'User' : 'Bot'}):`, message.substring(0, 50));
  }

  /**
   * Show typing indicator in chat
   * @returns {HTMLElement|null} The typing indicator element
   */
  function addTypingIndicator() {
    const messagesContainer = document.getElementById('chatbot-messages');
    if (!messagesContainer) return null;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'bot-message typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = '<strong>Orah Assistant:</strong> <span class="typing-dots">Typing<span>.</span><span>.</span><span>.</span></span>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    console.log('⏳ Typing indicator shown');
    return typingDiv;
  }

  /**
   * Remove typing indicator from chat
   */
  function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
      console.log('✅ Typing indicator removed');
    }
  }

  /**
   * Handle sending user message and getting bot response
   * Now using rule-based pattern matching - instant responses!
   */
  function sendMessage() {
    const inputField = document.getElementById('chatbot-input');
    if (!inputField) {
      console.error('❌ Input field not found');
      return;
    }

    const userMessage = inputField.value.trim();

    if (!userMessage) {
      console.log('⚠️ Empty message, skipping');
      return;
    }

    console.log('📤 Sending message:', userMessage);

    // Display user message
    addMessage(userMessage, true);

    // Clear input field
    inputField.value = '';

    // Show typing indicator briefly for natural feel
    addTypingIndicator();

    // Get instant rule-based response after brief delay (natural typing effect)
    setTimeout(() => {
      // Get bot response using pattern matching
      const botResponse = getBotResponse(userMessage);
      
      // Remove typing indicator
      removeTypingIndicator();
      
      // Display bot response
      addMessage(botResponse, false);
    }, 600); // 600ms delay for natural conversation feel
  }

  /**
   * Initialize student chatbot functionality
   * Sets up event listeners and prepares the chat interface
   */
  function initStudentChatbot() {
    // Prevent double initialization
    if (window.__studentChatbotInitialized) {
      console.log('⚠️ Student chatbot already initialized, skipping...');
      return;
    }
    
    console.log('🚀 Initializing Student Chatbot...');
    
    // Get all required DOM elements
    const chatbotContainer = document.getElementById('chatbot-container');
    const chatbotBtn = document.getElementById('student-chatbot-btn');
    const closeBtn = document.getElementById('chatbot-close-btn');
    const sendBtn = document.getElementById('chatbot-send-btn');
    const inputField = document.getElementById('chatbot-input');
    const messagesContainer = document.getElementById('chatbot-messages');

    // Log element existence for debugging
    console.log('Element Check:');
    console.log('  chatbot-container:', chatbotContainer ? '✅ Found' : '❌ Missing');
    console.log('  student-chatbot-btn:', chatbotBtn ? '✅ Found' : '❌ Missing');
    console.log('  chatbot-close-btn:', closeBtn ? '✅ Found' : '❌ Missing');
    console.log('  chatbot-send-btn:', sendBtn ? '✅ Found' : '❌ Missing');
    console.log('  chatbot-input:', inputField ? '✅ Found' : '❌ Missing');
    console.log('  chatbot-messages:', messagesContainer ? '✅ Found' : '❌ Missing');

    // Validate critical elements exist
    if (!chatbotBtn) {
      console.error('❌ CRITICAL: Chatbot button (#student-chatbot-btn) not found!');
      console.log('Available elements with "chatbot" in ID:');
      document.querySelectorAll('[id*="chatbot"]').forEach(el => {
        console.log('  -', el.id, el.tagName, el.className);
      });
      return;
    }

    if (!chatbotContainer) {
      console.error('❌ CRITICAL: Chatbot container (#chatbot-container) not found!');
      return;
    }

    console.log('✅ All required elements found');

    /**
     * Toggle chatbot visibility
     * Opens or closes the chat window
     */
    function toggleChatbot() {
      const wasOpen = chatbotContainer.classList.contains('open');
      chatbotContainer.classList.toggle('open');
      const isOpen = chatbotContainer.classList.contains('open');
      
      console.log(`🔄 Chatbot toggled: ${wasOpen ? 'OPEN' : 'CLOSED'} → ${isOpen ? 'OPEN' : 'CLOSED'}`);
      console.log('Container classes:', chatbotContainer.className);
      console.log('Display style:', window.getComputedStyle(chatbotContainer).display);
      
      // Focus input field when chat opens
      if (isOpen && inputField) {
        setTimeout(() => {
          inputField.focus();
          console.log('⌨️ Input field focused');
        }, 100);
      }
    }

    // Attach event listeners
    if (chatbotBtn) {
      chatbotBtn.addEventListener('click', () => {
        console.log('🖱️ Chatbot button clicked!');
        toggleChatbot();
      });
      console.log('✅ Chatbot button event listener attached');
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        console.log('❌ Close button clicked');
        toggleChatbot();
      });
      console.log('✅ Close button event listener attached');
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        console.log('📨 Send button clicked');
        sendMessage();
      });
      console.log('✅ Send button event listener attached');
    }

    if (inputField) {
      // Send message on Enter key press
      inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          console.log('⏎ Enter key pressed');
          sendMessage();
        }
      });
      console.log('✅ Input field enter key listener attached');
    }

    // Mark as initialized to prevent duplicate initialization
    window.__studentChatbotInitialized = true;
    
    console.log('🎉 Student Chatbot Initialization Complete!');
    console.log('💡 Click the floating 💬 button to open the chat');
  }

  // Initialize when DOM is ready
  console.log('🔍 Checking initialization timing...');

  if (document.readyState === 'loading') {
    console.log('⏳ DOM is still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('✅ DOMContentLoaded fired');
      initStudentChatbot();
    });
  } else {
    console.log('✅ DOM already loaded, initializing immediately');
    initStudentChatbot();
  }

  // Fallback initialization after delay
  setTimeout(() => {
    if (!window.__studentChatbotInitialized) {
      console.log('⏰ Fallback: Attempting delayed initialization...');
      initStudentChatbot();
    } else {
      console.log('✅ Chatbot already initialized');
    }
  }, 1000);

})();
