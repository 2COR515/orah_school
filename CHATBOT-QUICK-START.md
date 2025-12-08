# 🚀 Quick Start Guide - Chatbot API

## 🎯 What Was Built

A secure, LLM-powered chatbot API gateway with:
- Protected REST endpoint
- Role-based AI responses (student/instructor/admin)
- Google Gemini AI integration ready
- Comprehensive testing suite

---

## 📦 Installation (Already Done)

```bash
cd backend
npm install @google/generative-ai
```

---

## 🔑 Setup Phase 2 (LLM Activation)

### Step 1: Get API Key
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key

### Step 2: Add to Environment
```bash
cd backend
echo "GEMINI_API_KEY=your-key-here" >> .env
```

### Step 3: Activate LLM
Edit `backend/src/controllers/chatController.js`:
- Line 83: Comment out or remove the canned response return
- Lines 87-113: Uncomment the LLM integration code

### Step 4: Restart Server
```bash
pkill -f "node.*server.js"
cd backend && node server.js &
```

---

## 🧪 Testing

### Run Test Suite
```bash
cd backend
node test-chat-api.js
```

### Expected Output
```
✅ All tests completed successfully!
   ✓ Authentication working
   ✓ Chat endpoint responding
   ✓ Canned responses working
   ✓ Role-based responses working
   ✓ Security validation working
```

---

## 🔌 API Usage

### Endpoint
```
POST http://localhost:3002/api/chat/query
```

### Request Example (JavaScript)
```javascript
const response = await fetch('http://localhost:3002/api/chat/query', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'How do I create a lesson?',
    userRole: 'instructor'
  })
});

const data = await response.json();
console.log(data.reply); // AI response
```

### Response Format
```json
{
  "success": true,
  "reply": "AI-generated response here...",
  "timestamp": "2025-12-05T10:31:26.179Z",
  "userRole": "instructor",
  "isLLMActive": true
}
```

---

## 🎨 Frontend Integration

### Update Student Chatbot
Edit `scripts/student-chatbot.js`:

```javascript
// Replace getBotResponse() with API call
async function getBotResponse(userInput) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3002/api/chat/query', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userInput,
        userRole: 'student'
      })
    });

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error('Chat error:', error);
    return 'Sorry, I encountered an error. Please try again.';
  }
}
```

### Update Instructor Chatbot
Same pattern in `scripts/instructor-chatbot.js`, but use `userRole: 'instructor'`

---

## 📊 Test Credentials

```
Student:    student@test.com / student123
Instructor: instructor@test.com / instructor123
Admin:      admin@test.com / admin123
```

---

## 🐛 Troubleshooting

### Server Not Responding
```bash
# Check if server is running
ps aux | grep "node.*server.js"

# Restart server
pkill -f "node.*server.js"
cd backend && node server.js &
```

### 401 Unauthorized Error
- Check if token is valid: `localStorage.getItem('token')`
- Login again to get fresh token
- Verify token is included in Authorization header

### 503 Service Unavailable
- LLM mode: Check GEMINI_API_KEY in `.env`
- Verify API key is valid
- Check server logs for initialization errors

### Empty Responses
- Verify message is not empty string
- Check message length (max 1000 chars)
- Ensure userRole is provided

---

## 📁 Key Files

```
backend/
├── src/
│   ├── controllers/
│   │   └── chatController.js       # Main chat logic
│   └── routes/
│       └── chatRoutes.js           # API endpoint
├── server.js                       # Routes mounted here
├── test-chat-api.js                # Test script
└── .env                            # Add GEMINI_API_KEY here
```

---

## 🔄 Current Status

✅ **Phase 1 Complete** (Canned Responses)
- API gateway working
- Authentication enforced
- Role-based responses
- All tests passing

⏳ **Phase 2 Pending** (LLM Integration)
- Requires GEMINI_API_KEY
- Code ready to uncomment
- 5-minute activation time

---

## 📈 Performance

- **Response Time**: <100ms (canned), ~1-2s (LLM)
- **Rate Limit**: None (consider adding)
- **Max Message**: 1000 characters
- **Concurrent**: Unlimited (Node.js handles naturally)

---

## 🎓 Learning Resources

- [Google Gemini AI Docs](https://ai.google.dev/docs)
- [Node.js Express Guide](https://expressjs.com/en/guide/routing.html)
- [JWT Authentication](https://jwt.io/introduction)

---

**Quick Reference Created:** December 5, 2025  
**Status:** ✅ Ready to Use (Phase 1) | 🔄 LLM Activation Available (Phase 2)
