// backend/src/controllers/chatController.js
// Chat controller with Google Gemini AI integration

const { GoogleGenerativeAI } = require('@google/generative-ai');

// System prompts for different user roles
const SYSTEM_PROMPTS = {
  student: `You are an intelligent assistant for Orah School, a learning management system.
You are helping a STUDENT user. Your role is to:
- Help students understand their courses and progress
- Answer questions about lessons, enrollments, and completion status
- Provide guidance on how to use the student dashboard
- Explain reminder settings and time tracking
- Assist with technical issues related to video playback or lesson access
- Be encouraging and supportive of their learning journey

Keep responses concise, friendly, and focused on student needs.
If asked about instructor or admin features, politely explain those are not available to students.`,

  instructor: `You are an intelligent assistant for Orah School, a learning management system.
You are helping an INSTRUCTOR user. Your role is to:
- Assist with lesson creation, management, and deletion
- Help track student attendance and generate reports
- Explain analytics features and student performance metrics
- Guide on quiz creation and grading
- Answer questions about student enrollments and progress
- Provide technical support for content upload and management

Keep responses professional, clear, and focused on teaching tools.
If asked about admin-only features, explain that admin privileges are required.`,

  admin: `You are an intelligent assistant for Orah School, a learning management system.
You are helping an ADMIN user. Your role is to:
- Assist with user management (students, instructors, admins)
- Explain system-wide analytics and reporting
- Guide on platform configuration and settings
- Help with course and curriculum management
- Provide insights on system usage and performance
- Support with administrative tasks and troubleshooting

Keep responses comprehensive, technical when needed, and focused on administrative capabilities.`,

  default: `You are an intelligent assistant for Orah School, a learning management system.
Help users with general questions about the platform, courses, and learning resources.
Keep responses helpful, concise, and appropriate for an educational context.`
};

/**
 * Initialize Google Gemini AI client
 * @returns {Object|null} Initialized AI client or null if API key missing
 */
function initializeGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Debug: Log API key status (length only for security)
  console.log('🔑 API Key Status:', apiKey ? `Loaded (${apiKey.length} chars)` : 'NOT FOUND');
  
  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY not found in environment variables');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ Google Gemini AI initialized successfully');
    return genAI;
  } catch (error) {
    console.error('❌ Error initializing Gemini AI:', error);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return null;
  }
}

/**
 * Get system prompt based on user role
 * @param {string} userRole - User's role (student/instructor/admin)
 * @returns {string} Appropriate system prompt
 */
function getSystemPrompt(userRole) {
  const role = userRole?.toLowerCase() || 'default';
  return SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS.default;
}

/**
 * Handle chat query from user
 * POST /api/chat/query
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleChatQuery(req, res) {
  try {
    console.log('\n💬 Chat Query Received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request user (from token):', JSON.stringify(req.user, null, 2));

    // CRITICAL: Verify authentication
    if (!req.user) {
      console.error('❌ CRITICAL: Chat request without authentication');
      console.error('req.user is undefined - authenticateToken middleware may have failed');
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in to use the chatbot.',
        details: 'No user data found in request. Token may be missing or invalid.'
      });
    }

    // Verify user has required fields
    if (!req.user.id && !req.user.userId) {
      console.error('❌ CRITICAL: req.user exists but missing id field');
      console.error('req.user value:', JSON.stringify(req.user, null, 2));
      return res.status(401).json({
        success: false,
        error: 'Invalid user data. Please log in again.',
        details: 'User ID is missing from authentication token.'
      });
    }

    const userId = req.user.userId || req.user.id || 'unknown';
    const userName = req.user.name || 'User';

    // ROBUST ROLE CHECKING: Prioritize token data, fallback to body, then default
    let userRole = 'guest'; // Safe default
    
    // Priority 1: Use role from JWT token (most secure)
    if (req.user && req.user.role) {
      userRole = req.user.role;
      console.log('✅ Using role from JWT token:', userRole);
    }
    // Priority 2: Fallback to role from request body (less secure, validate it)
    else if (req.body && req.body.userRole) {
      userRole = req.body.userRole;
      console.warn('⚠️ Using role from request body (not from token):', userRole);
      console.warn('This should not happen in production - check authentication middleware');
    }
    // Priority 3: Default to 'guest' if neither exists
    else {
      console.error('⚠️ No role found in token or body, defaulting to "guest"');
      userRole = 'guest';
    }

    // Validate role is a known value
    const VALID_ROLES = ['student', 'instructor', 'admin', 'guest', 'default'];
    if (!VALID_ROLES.includes(userRole.toLowerCase())) {
      console.warn(`⚠️ Unknown role "${userRole}", defaulting to "default"`);
      userRole = 'default';
    }

    console.log(`📝 Final role being used: ${userRole}`);

    // Extract and validate message
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      console.error('❌ Invalid message in request body');
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }

    if (message.trim().length === 0) {
      console.error('❌ Empty message in request body');
      return res.status(400).json({
        success: false,
        error: 'Message cannot be empty'
      });
    }

    if (message.length > 1000) {
      console.error('❌ Message too long:', message.length, 'characters');
      return res.status(400).json({
        success: false,
        error: 'Message is too long (max 1000 characters)'
      });
    }

    console.log(`💬 Chat query from ${userName} (${userId}):`, message.substring(0, 50) + '...');

    // Initialize Gemini AI
    const genAI = initializeGeminiAI();
    
    if (!genAI) {
      console.warn('⚠️ Gemini AI not available, falling back to canned response');
      // Fallback to canned response if API key not configured
      const cannedResponse = getCannedResponse(message, userRole);
      return res.json({
        success: true,
        reply: cannedResponse,
        timestamp: new Date().toISOString(),
        userRole: userRole || 'unknown',
        isLLMActive: false
      });
    }

    // Get the Gemini model (using stable model with generous free tier)
    const modelName = 'gemini-1.5-flash';
    console.log(`🤖 Using Gemini model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Build the prompt with system instructions and user message
    const systemPrompt = getSystemPrompt(userRole);
    const fullPrompt = `${systemPrompt}\n\nUser Question: ${message}\n\nAssistant:`;

    console.log(`📤 Sending request to Gemini API...`);
    
    // Generate response
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const llmReply = response.text();

    console.log(`✅ LLM response generated (${llmReply.length} chars)`);

    return res.json({
      success: true,
      reply: llmReply,
      timestamp: new Date().toISOString(),
      userRole: userRole || 'unknown',
      isLLMActive: true
    });

  } catch (error) {
    // CRITICAL ERROR LOGGING - Catch any unexpected errors
    console.error('\n═══════════════════════════════════════════════════');
    console.error('❌ CRITICAL CHAT CONTROLLER CRASH');
    console.error('═══════════════════════════════════════════════════');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request URL:', req.originalUrl);
    console.error('Request method:', req.method);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    console.error('Request user:', JSON.stringify(req.user, null, 2));
    console.error('═══════════════════════════════════════════════════');
    
    // Check for specific error types
    if (error.message?.includes('API key not valid')) {
      console.error('🔴 AUTHENTICATION ERROR: Invalid API Key (401)');
    } else if (error.message?.includes('quota') || error.message?.includes('429')) {
      console.error('🔴 QUOTA ERROR: API quota exceeded (429)');
    } else if (error.message?.includes('PERMISSION_DENIED')) {
      console.error('🔴 PERMISSION ERROR: API key lacks required permissions');
    }
    console.error('═══════════════════════════════════════════════════\n');
    
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while processing your message',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

/**
 * Generate canned response for Phase 1 testing
 * @param {string} message - User's message
 * @param {string} userRole - User's role
 * @returns {string} Canned response
 */
function getCannedResponse(message, userRole) {
  const msg = message.toLowerCase();
  
  // Role-specific responses
  if (userRole === 'student') {
    if (msg.includes('course') || msg.includes('lesson')) {
      return "I can help you with your courses! You can view all your enrolled lessons and available courses on your dashboard. Would you like to know more about a specific topic?";
    }
    if (msg.includes('progress') || msg.includes('complete')) {
      return "Your progress is tracked automatically as you complete lessons. Check the stats at the top of your dashboard to see your completion status and time spent learning!";
    }
  }
  
  if (userRole === 'instructor') {
    if (msg.includes('lesson') || msg.includes('create')) {
      return "To create a new lesson, go to the 'Manage Lessons' page. You can upload videos, add quizzes, and organize your teaching content. Need help with a specific feature?";
    }
    if (msg.includes('attendance') || msg.includes('student')) {
      return "You can track student attendance from the Attendance page. Mark students present or absent, view history, and generate reports to identify patterns.";
    }
  }

  // Generic greeting
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return `Hello! I'm here to help you with Orah School. As a ${userRole || 'user'}, I can assist you with courses, progress tracking, and platform features. What would you like to know?`;
  }

  // Default response
  return `Thank you for your message! I'm currently in test mode. Soon I'll be powered by AI to provide more intelligent responses. For now, I can help with basic questions about courses, progress, ${userRole === 'instructor' ? 'lesson creation, attendance,' : ''} and platform features. What would you like to know?`;
}

module.exports = {
  handleChatQuery
};
