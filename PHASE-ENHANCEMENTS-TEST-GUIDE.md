# Quick Test Guide - Phase Enhancements

## Prerequisites
- Backend server running on `http://localhost:3002`
- At least one instructor account created
- At least one student enrolled in a lesson

---

## Test 1: Lesson Upload with Thumbnail & Resources (5 min)

### Steps:
1. **Login as Instructor**
   ```
   Navigate to: http://localhost:3002/login.html
   Use instructor credentials
   ```

2. **Go to Lessons Page**
   ```
   Click "My Lessons" or navigate to: instructor-lessons.html
   ```

3. **Create New Lesson**
   - Click "Create New Lesson" button
   - Fill in:
     - Title: "Test Lesson with Files"
     - Description: "Testing file uploads"
     - Video URL: Any valid URL
   - **Select a thumbnail image** (JPG/PNG from your computer)
   - **Select a resource ZIP file** (any .zip file)
   - Click "Create Lesson"

4. **Verify in Console**
   Open browser DevTools (F12) and check Console for:
   ```
   📸 Thumbnail selected: [filename.jpg]
   📦 Resource ZIP selected: [filename.zip]
   ```

5. **Check API Request**
   In DevTools Network tab, find the `POST /api/lessons` request and verify the payload includes:
   ```json
   {
     "title": "Test Lesson with Files",
     "thumbnailUrl": "/uploads/thumbnails/[id].[ext]",
     "resourceZipUrl": "/uploads/resources/[id].zip",
     ...
   }
   ```

### Expected Result:
✅ Lesson created successfully  
✅ Console shows file selection messages  
✅ API request includes `thumbnailUrl` and `resourceZipUrl` fields  
✅ Simulated URLs follow pattern: `/uploads/[type]/[id].[ext]`

---

## Test 2: Convention-Based User IDs (3 min)

### Steps:
1. **Create New Student Account**
   ```
   Navigate to: http://localhost:3002/signup.html
   Fill in:
   - Name: "Test Student"
   - Email: "teststudent@example.com"
   - Password: "password123"
   - Role: Student
   - School Code: "ORAH2024"
   Submit form
   ```

2. **Check User ID Format**
   After signup, check localStorage:
   ```javascript
   // In browser console:
   localStorage.getItem('userId')
   ```
   
   Or check the signup response in DevTools Network tab.

3. **Verify ID Format**
   Should see: `S-XXXX` (e.g., `S-9876`, `S-3421`, etc.)
   
   **Format breakdown:**
   - First character: `S` (Student), `I` (Instructor), or `A` (Admin)
   - Separator: `-`
   - Last 4 digits: Last 4 digits of timestamp

4. **Repeat for Instructor**
   ```
   Create instructor account
   Expected ID: I-XXXX (e.g., I-4567)
   ```

### Expected Result:
✅ New student ID format: `S-XXXX`  
✅ New instructor ID format: `I-XXXX`  
✅ IDs are 6 characters total (role + dash + 4 digits)  
✅ Old users still have their original long IDs

---

## Test 3: Attendance Display with Names (5 min)

### Steps:
1. **Login as Instructor**
   ```
   Navigate to: http://localhost:3002/login.html
   ```

2. **Go to Attendance Page**
   ```
   Click "Attendance" from instructor hub
   Or navigate to: instructor-attendance.html
   ```

3. **Select a Lesson**
   - Use the dropdown to select a lesson that has enrolled students
   - Wait for student roster to load

4. **Verify Student Display**
   Check that the roster shows:
   ```
   ┌─────────────────────────────┐
   │ James Smith          ●   ○  │
   │ S-9876                      │
   └─────────────────────────────┘
   ```
   
   Each row should display:
   - **Line 1:** Student's actual name (bold)
   - **Line 2:** User ID (smaller, gray)
   - **Columns:** Present and Absent radio buttons

5. **Mark Some Students Absent**
   - Select "Absent" for 1-2 students
   - Click "Save Attendance"

### Expected Result:
✅ Student names displayed (not just IDs)  
✅ Format: Name on top, ID below  
✅ Attendance saved successfully  
✅ Success message appears

---

## Test 4: Visual Highlights in Reports (7 min)

### Steps:
1. **Still on Attendance Page**
   Ensure you've marked attendance for at least one lesson with some absent students.

2. **Generate Report**
   Scroll to "Attendance Reports" section:
   - Select lesson: Choose a specific lesson (or "All Lessons")
   - Select period: "Last Week" or "All Time"
   - Click "Generate Report"

3. **Verify Summary Statistics**
   Should see 4 cards showing:
   - Attendance Rate (percentage)
   - Present count
   - Absent count
   - Total records

4. **Scroll to Individual Records**
   Below statistics, should see a table with columns:
   - Student
   - Date
   - Status

5. **Check Visual Highlights**
   For **Absent** records, verify:
   - ❌ Red/pink background color (#ffe6e6)
   - 🔴 Red left border (4px solid)
   - ❌ Red badge saying "❌ Absent"
   - 📝 Alert text: "[Student Name] missed this class"

   For **Present** records, verify:
   - ✅ White or light gray background
   - ✅ Green badge saying "✓ Present"
   - No alert text

### Expected Result:
✅ Report displays summary statistics  
✅ Individual records table visible  
✅ Absent records have RED background and border  
✅ Alert text shows: "[Name] missed this class"  
✅ Present records have GREEN badge  
✅ Student names displayed (not just IDs)

---

## Visual Examples

### Attendance Roster (Test 3):
```
╔═══════════════════════════════════════════════════════════╗
║ Student ID                     Present    Absent          ║
╠═══════════════════════════════════════════════════════════╣
║ James Smith                       ●         ○             ║
║ S-9876                                                    ║
╟───────────────────────────────────────────────────────────╢
║ Sarah Johnson                     ○         ●             ║
║ S-3421                                                    ║
╟───────────────────────────────────────────────────────────╢
║ Michael Chen                      ●         ○             ║
║ S-7832                                                    ║
╚═══════════════════════════════════════════════════════════╝
```

### Attendance Report (Test 4):
```
╔═══════════════════════════════════════════════════════════╗
║ Attendance Summary - Last Week                            ║
╠═══════════════════════════════════════════════════════════╣
║  85.7%      12         2          14                      ║
║  Rate     Present   Absent      Total                     ║
╠═══════════════════════════════════════════════════════════╣
║ Individual Records:                                       ║
╟───────────────────────────────────────────────────────────╢
║ ┌─ James Smith ──────────────── Mar 15, 2024 ─┐          ║
║ │  S-9876                                      │ RED BG   ║
║ │  James Smith missed this class               │          ║
║ │  Status: ❌ Absent                            │          ║
║ └──────────────────────────────────────────────┘          ║
╟───────────────────────────────────────────────────────────╢
║ ┌─ Sarah Johnson ─────────────── Mar 15, 2024 ─┐         ║
║ │  S-3421                                      │ WHITE    ║
║ │  Status: ✓ Present                           │          ║
║ └──────────────────────────────────────────────┘          ║
╚═══════════════════════════════════════════════════════════╝
```

---

## Troubleshooting

### Issue: Student names not showing (Test 3)
**Possible causes:**
1. No users in database → Create test users
2. API `/api/users` endpoint not working → Check backend logs
3. Authorization issue → Verify JWT token in localStorage

**Fix:**
```javascript
// Check in browser console:
fetch('http://localhost:3002/api/users', {
  headers: { 
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}).then(r => r.json()).then(console.log)
```

### Issue: No attendance records in report (Test 4)
**Possible causes:**
1. No attendance marked yet → Complete Test 3 first
2. Date filter too restrictive → Try "All Time" period
3. Wrong lesson selected → Try "All Lessons"

**Fix:**
- Mark attendance for at least 2-3 students (Test 3)
- Use "All Time" period filter
- Select "All Lessons" or specific lesson with attendance data

### Issue: Old user IDs still showing (Test 2)
**Expected behavior:**
- Old users created before this update will keep their original IDs
- Only NEW users created after the update will have convention-based IDs

**This is intentional** - no migration was performed to avoid breaking existing references.

### Issue: Files not actually uploading (Test 1)
**Expected behavior:**
- This is a **simulated upload** implementation
- Files are selected but not sent to server
- Only URLs are generated and stored

**To enable real uploads:**
```bash
npm install multer
```
Then implement multipart/form-data handling in backend (see PHASE-ENHANCEMENTS-COMPLETE.md for details).

---

## Success Criteria Checklist

### Phase 1: Lesson Uploads
- [ ] Thumbnail file input visible on lesson creation form
- [ ] Resource ZIP file input visible on lesson creation form
- [ ] Console logs show file selections
- [ ] API request includes `thumbnailUrl` and `resourceZipUrl`
- [ ] Lesson created successfully with simulated URLs

### Phase 2A: User IDs
- [ ] New student has ID format: `S-XXXX`
- [ ] New instructor has ID format: `I-XXXX`
- [ ] IDs are exactly 6 characters (e.g., `S-9876`)
- [ ] Old users still have their original IDs (no breaks)

### Phase 2B: Attendance Display
- [ ] Student roster shows real names (not just IDs)
- [ ] Format: Name above, ID below
- [ ] Attendance report displays individual records
- [ ] Absent records have RED background
- [ ] Alert text visible: "[Name] missed this class"
- [ ] Present records have GREEN badge
- [ ] Student names appear in report table

---

## API Endpoint Reference

### Used in Tests:
```
POST   /api/lessons           - Create lesson (accepts thumbnailUrl, resourceZipUrl)
POST   /api/users             - Create user (generates convention-based ID)
GET    /api/users             - Fetch all users (for name lookup)
POST   /api/attendance        - Save attendance records
GET    /api/attendance        - Fetch attendance records (supports lessonId filter)
```

### Authorization:
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## Testing Timeline

**Estimated Total Time:** 20-25 minutes

- Test 1 (Lesson Uploads): 5 minutes
- Test 2 (User IDs): 3 minutes
- Test 3 (Attendance Names): 5 minutes
- Test 4 (Visual Highlights): 7 minutes
- Buffer for issues: 5 minutes

---

## Additional Manual Tests (Optional)

### Test 5: Multiple File Types
- Try uploading different image formats (JPG, PNG, GIF)
- Try uploading different file sizes
- Verify console logs show correct file names

### Test 6: Form Validation
- Try submitting lesson form without files (should work - optional)
- Try submitting with only thumbnail (should work)
- Try submitting with only resource ZIP (should work)

### Test 7: Mixed User ID Formats
- Create old user (before update) and new user (after update)
- Enroll both in same lesson
- Verify attendance roster shows both correctly
- Verify report handles mixed ID formats

### Test 8: Large Dataset
- Create 10+ students
- Enroll all in same lesson
- Mark attendance with mix of present/absent
- Generate report and verify scrollable table works
- Check performance of user fetching

---

*Last Updated: [Current Date]*  
*Test Coverage: All Phase 1 & Phase 2 features*  
*Recommended Browser: Chrome/Firefox (latest versions)*
