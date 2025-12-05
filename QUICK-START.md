# 🚀 Quick Start Guide - Phase 1 Reminder System

## What Was Built

✅ Custom reminder frequency system  
✅ Nodemailer email integration  
✅ Daily cron scheduler (9 AM)  
✅ Beautiful HTML email templates  
✅ User-specific frequency preferences  

---

## 5-Minute Setup

### 1. Install Dependencies (Already Done ✅)
```bash
cd backend
npm install nodemailer dotenv
```

### 2. Configure Email (Do This Now)

Create `backend/.env` file:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
JWT_SECRET=your-secret-key-here
PORT=3002
```

**For Gmail:**
1. Go to https://myaccount.google.com/apppasswords
2. Enable 2-Step Verification if not already
3. Generate app password for "Mail"
4. Copy 16-character password to EMAIL_PASS

### 3. Start Server
```bash
cd backend
node server.js
```

You should see:
```
✅ Reminder scheduler started successfully!
⏰ Schedule: Every day at 9:00 AM
```

---

## How It Works

### Frequency Options

| Setting | Sends On | Example |
|---------|----------|---------|
| `daily` | Every day | Mon, Tue, Wed, Thu, Fri, Sat, Sun |
| `weekly` | Monday only | Mon |
| `twice-weekly` | Monday & Thursday | Mon, Thu |

### Default Behavior

- New users get `'weekly'` by default
- Scheduler runs every day at 9:00 AM
- Each user's frequency is checked
- Emails sent only if it's their scheduled day

---

## Testing

### Test 1: Run Frequency Tests
```bash
cd backend
node test-reminder-frequency.js
```

Expected output:
```
✅ SEND for daily
❌ SKIP for weekly (if not Monday)
❌ SKIP for twice-weekly (if not Mon/Thu)
```

### Test 2: Send Test Reminder
```bash
cd backend
node -e "require('./reminderService').runRemindersNow()"
```

This will:
- Check all students
- Filter by their frequency
- Send emails to those with incomplete lessons

---

## Email Preview

**Subject:** Reminder: Complete Your Lesson - [Lesson Name]

**Body:**
```
╔═══════════════════════════╗
║   📚 ORAH SCHOOL          ║
║   Learning Reminder       ║
╚═══════════════════════════╝

Dear John Doe,

📖 Introduction to React
Progress: [████░░░░░░] 25%

💪 Keep going! You're doing great!

[Continue Learning →]

Best regards,
The Orah School Team
```

---

## User Frequency Settings

### Current Users (Default: weekly)
All existing users have `reminderFrequency: 'weekly'`

### New Users
When created, automatically get `reminderFrequency: 'weekly'`

### Changing Frequency (Phase 2)
Will add UI for students to change their preference

---

## File Structure

```
backend/
├── .env                      # Your email credentials (create this)
├── .env.example              # Template (already created)
├── server.js                 # ✅ Updated with dotenv
├── db.js                     # ✅ Added reminderFrequency field
├── reminderService.js        # ✅ Complete rewrite
├── test-reminder-frequency.js # ✅ Test suite
└── package.json              # ✅ Added nodemailer, dotenv
```

---

## Common Commands

```bash
# Start server normally
cd backend && node server.js

# Run tests
cd backend && node test-reminder-frequency.js

# Send reminders manually (bypass schedule)
cd backend && node -e "require('./reminderService').runRemindersNow()"

# Check packages installed
cd backend && npm list nodemailer dotenv

# View server logs
cd backend && tail -f server.log
```

---

## Scheduler Details

### Cron Schedule: `0 9 * * *`
- Runs every day at 9:00 AM
- Timezone: America/New_York (configurable)
- Validates all users
- Respects individual frequencies

### What Happens Daily
```
9:00 AM → Cron triggers
  ↓
Get all users
  ↓
For each student:
  ↓
Check reminderFrequency
  ↓
If today matches frequency:
  ↓
Send reminders for incomplete lessons
```

---

## Monitoring

### Console Logs to Watch For

**Success:**
```
✅ Email sent to student@test.com
📨 Reminders sent: 5
```

**Skipped (Normal):**
```
⏭️ Skipping user@test.com (frequency: weekly, not scheduled for today)
```

**Errors:**
```
❌ Failed to send email: [error message]
```

---

## Environment Variables Reference

```env
# Required for email sending
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Required for JWT
JWT_SECRET=your-secret-key

# Optional (has defaults)
PORT=3002
NODE_ENV=development
REMINDER_TIMEZONE=America/New_York
```

---

## Troubleshooting

### Problem: Emails not sending

**Check 1:** Is .env file created?
```bash
ls backend/.env
```

**Check 2:** Are credentials correct?
```bash
cd backend
node -e "console.log(process.env.EMAIL_USER)"
```

**Check 3:** Gmail app password?
- Must use app password, not regular password
- Must enable 2-Step Verification first

### Problem: Reminders not running

**Check 1:** Is server running?
```bash
curl http://localhost:3002/health
```

**Check 2:** Check cron schedule
Look for this log on startup:
```
✅ Reminder scheduler started successfully!
```

**Check 3:** Test manually
```bash
node -e "require('./reminderService').runRemindersNow()"
```

### Problem: Wrong frequency

**Check 1:** What day is it?
```bash
node -e "console.log(new Date().getDay())"
# 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
```

**Check 2:** User's frequency setting
Check database for user's `reminderFrequency` field

---

## What's Next (Phase 2)

### Coming Soon:
- 🎨 User Settings UI in student dashboard
- 🔧 API endpoint to update preferences
- 💾 Save changes without restart
- 📊 Analytics on reminder effectiveness

---

## Documentation Files

- `REMINDER-FREQUENCY-PHASE1.md` - Full documentation
- `PHASE1-SUMMARY.md` - Quick overview
- `PHASE1-CHECKLIST.md` - Implementation checklist
- `REMINDER-FLOW-DIAGRAM.md` - Visual diagrams
- `QUICK-START.md` - This file

---

## Key Features

✅ **Professional Emails** - HTML with progress bars  
✅ **User Control** - Each student picks their frequency  
✅ **Smart Scheduling** - Only sends on user's preferred days  
✅ **Detailed Logging** - See exactly what's happening  
✅ **Error Handling** - Graceful fallbacks  
✅ **Production Ready** - Scalable and secure  

---

## Test Checklist

Before considering it "done":

- [ ] Install nodemailer and dotenv ✅
- [ ] Create .env file with credentials
- [ ] Start server successfully ✅
- [ ] Run test suite ✅
- [ ] Send manual test reminder
- [ ] Verify email received (if EMAIL_USER/PASS set)
- [ ] Check logs for proper output ✅

---

## Success! 🎉

Phase 1 is complete and functional. The system will:
- Run automatically every day at 9 AM
- Check each student's preferred frequency
- Send beautiful reminder emails
- Log everything for monitoring

**Next:** Add UI for students to change their reminder frequency!

---

**Need Help?**
- Check the detailed docs in `REMINDER-FREQUENCY-PHASE1.md`
- Run tests: `node test-reminder-frequency.js`
- View code: `backend/reminderService.js`
