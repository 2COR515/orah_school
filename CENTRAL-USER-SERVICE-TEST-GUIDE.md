# Central User Data Service - Quick Test Guide

## 🎯 Quick Verification (5 Minutes)

### Test 1: Analytics Dashboard (2 min)

1. **Navigate:** Login → Analytics page
2. **Check:** Student Progress Tracking section
3. **Expected:** 
   - ✅ Real names displayed (e.g., "James Smith")
   - ✅ No "Unknown Student" text
   - ✅ Email addresses shown

**Console Check:**
```
✓ Loaded 25 users into lookup map
✅ Student progress tracking loaded
```

---

### Test 2: Attendance Roster (2 min)

1. **Navigate:** Login → Attendance page
2. **Action:** Select any lesson from dropdown
3. **Expected:**
   ```
   Student ID        Present   Absent
   ───────────────────────────────────
   James Smith         ●         ○
   S-9876
   
   Sarah Johnson       ○         ●
   S-3421
   ```

**Console Check:**
```
✓ Loaded X user details
✓ Loaded X enrollments for lesson [id]
```

---

### Test 3: Attendance Reports (1 min)

1. **Action:** Click "Generate Report" on Attendance page
2. **Select:** Any time period
3. **Expected:**
   - ✅ Individual Records table shows names
   - ✅ Absent records have red background
   - ✅ Alert text: "[Name] missed this class"

---

## 🐛 Troubleshooting

### Problem: Still seeing "Unknown Student"

**Check:**
1. Open DevTools → Console
2. Look for errors in network tab
3. Verify `/api/users` returns 200 status

**Quick Fix:**
```javascript
// Run in browser console:
fetch('http://localhost:3002/api/users', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
.then(r => r.json())
.then(d => console.log('Users:', d.users.length));
```

### Problem: Page not loading

**Check:**
1. Backend server running? (`node server.js`)
2. Token valid? (Check localStorage)
3. Role correct? (instructor/admin)

---

## ✅ Success Criteria

All tests pass if you see:
- [x] Real student names everywhere
- [x] No "Unknown Student" text
- [x] Names formatted consistently
- [x] Console shows user map loaded
- [x] No errors in console

---

## 📊 Visual Examples

### Before:
```
┌──────────────────────────┐
│ Unknown Student          │
│ Topics Enrolled: 3       │
└──────────────────────────┘
```

### After:
```
┌──────────────────────────┐
│ James Smith              │
│ james@school.edu         │
│ Topics Enrolled: 3       │
└──────────────────────────┘
```

---

*Quick test completed in under 5 minutes*  
*For detailed testing, see: CENTRAL-USER-SERVICE-COMPLETE.md*
