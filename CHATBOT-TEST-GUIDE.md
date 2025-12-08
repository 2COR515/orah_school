# 🚀 Student Chatbot Testing Guide - Updated Dec 5, 2025

## Current Status
✅ **Backend Server**: Running on port 3002
✅ **Student Chatbot**: Fixed with clean implementation
✅ **Test File**: Created at `test-student-chatbot.html`

## Quick Test (2 minutes)

### Option 1: Using Test File (Recommended) ⭐

1. **Open the test file**:
   ```bash
   # Open in your browser
   xdg-open /home/trevor/Documents/PROJECT/Orah-school/test-student-chatbot.html
   # OR just drag the file into your browser
   ```

2. **Check the results**:
   - ✅ All checks should be **green** (passing)
   - Click "Test Button Click" to verify the button works
   - Click "Test API Call" to verify backend connection
   - Click the floating 💬 button to open the chatbot

3. **Try the chatbot**:
   - Type: "What courses am I enrolled in?"
   - Press Enter or click Send
   - You should see the AI response!

### Option 2: Using Student Dashboard

1. **Open student dashboard**:
   ```bash
   xdg-open /home/trevor/Documents/PROJECT/Orah-school/student-dashboard.html
   ```

2. **Login** (if not already logged in):
   - Email: `student@test.com`
   - Password: `student123`

3. **Test the chatbot**:
   - Look for the 💬 button in bottom-right corner
   - Click it - chatbot should slide up
   - Type a message and test!

## Verification Checklist

Run through these to confirm everything works:

- [ ] Button appears in bottom-right corner
- [ ] Button has hover effect (scales up slightly)
- [ ] Clicking button opens chatbot window
- [ ] Chatbot window slides up smoothly
- [ ] Input field gets focus automatically
- [ ] Can type messages
- [ ] Can send messages (Enter key or Send button)
- [ ] See "Typing..." indicator
- [ ] Receive AI-powered responses
- [ ] Close button (×) works
- [ ] Can reopen chatbot after closing

## Troubleshooting

### If chatbot button doesn't appear:
1. Check browser console (F12) for errors
2. Verify script is loading: Look for `scripts/student-chatbot.js` in Network tab
3. Clear browser cache: `Ctrl + Shift + Delete`

### If button doesn't respond to clicks:
1. Open browser console (F12)
2. Type: `document.getElementById('student-chatbot-btn')`
3. Should show the button element
4. Check that it's visible: `offsetParent` should not be null

### If API calls fail:
1. Verify server is running:
   ```bash
   curl http://localhost:3002/api/health
   ```
2. Check you're logged in (token in localStorage)
3. Look at backend terminal for errors

### If you get "session expired" message:
1. You need to login again
2. Token might have expired (24 hour validity)
3. Use the student dashboard login page

## What Was Fixed

The previous version had **excessive debugging code** that was interfering with initialization. The new version:

- ✅ Uses clean, simple initialization pattern
- ✅ Same pattern as working instructor chatbot
- ✅ No complex retry mechanisms
- ✅ Clean event listener attachment
- ✅ Proper DOM ready checking

## Files Changed

1. **scripts/student-chatbot.js** - Completely rewritten (300 lines → 192 lines)
2. **test-student-chatbot.html** - New test file with diagnostics

## Expected Behavior

### When you click the button:
1. Chatbot container gets `active` class
2. Container becomes visible (`display: flex`)
3. Slides up animation plays
4. Input field receives focus
5. You can start typing immediately

### When you send a message:
1. Your message appears on the right (blue background)
2. "Typing..." indicator appears
3. Backend calls Google Gemini AI
4. AI response appears on the left (white background)
5. Input clears, ready for next message

## Next Steps

After confirming it works:
1. Test with different types of questions
2. Try the instructor chatbot to compare
3. Test error handling (try when logged out)
4. Consider adding more features (voice input, file upload, etc.)

---

**Need Help?**
- Check browser console (F12) for errors
- Check backend terminal for API errors
- Review `STUDENT-CHATBOT-FINAL-FIX.md` for technical details
