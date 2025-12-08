// backend/src/routes/chatRoutes.js
// Secure chat routes for LLM-powered chatbot

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * POST /api/chat/query
 * Secure endpoint for chatbot queries
 * Requires authentication token
 * 
 * Request body:
 * - message: string (user's chat message)
 * - userRole: string (student/instructor/admin)
 * 
 * Response:
 * - reply: string (chatbot's response)
 * - timestamp: string (ISO timestamp)
 */
router.post('/query', authenticateToken, chatController.handleChatQuery);

module.exports = router;
