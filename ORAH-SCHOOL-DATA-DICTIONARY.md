# 📊 Orah School - Data Dictionary

## Project Information
**Project Name:** Orah School Learning Management System  
**Database Type:** JSON-based (node-persist)  
**Date:** December 17, 2025  
**Version:** 1.0

---

## 1. USERS Table

### Description
Stores all user information including students, instructors, and administrators.

| Field Name | Data Type | Size | Constraints | Description | Primary Key | Foreign Key | Example |
|------------|-----------|------|-------------|-------------|-------------|-------------|---------|
| userId | VARCHAR | 50 | NOT NULL, UNIQUE | Unique identifier for user. Format: S-XXXX (Student), I-XXXX (Instructor), A-XXXX (Admin) | ✅ PRIMARY KEY | - | S-9876 |
| email | VARCHAR | 100 | NOT NULL, UNIQUE | User's email address (used for login) | - | - | john.doe@school.edu |
| password | VARCHAR | 255 | NOT NULL | Hashed password (bcrypt) | - | - | $2b$10$hash... |
| firstName | VARCHAR | 50 | NOT NULL | User's first name | - | - | John |
| lastName | VARCHAR | 50 | NOT NULL | User's last name | - | - | Doe |
| name | VARCHAR | 100 | NULLABLE | Full display name (computed or stored) | - | - | John Doe |
| username | VARCHAR | 50 | NULLABLE | Optional username | - | - | johndoe |
| role | ENUM | 20 | NOT NULL, DEFAULT='student' | User role: 'student', 'instructor', 'admin' | - | - | student |
| createdAt | TIMESTAMP | - | NOT NULL, DEFAULT=NOW() | Account creation timestamp | - | - | 1702800000000 |
| reminderFrequency | ENUM | 20 | DEFAULT='weekly' | Reminder email frequency: 'daily', 'weekly', 'twice-weekly' | - | - | weekly |
| bio | TEXT | 500 | NULLABLE | Instructor biography (instructors only) | - | - | Experienced educator... |
| website | VARCHAR | 200 | NULLABLE | Instructor website (instructors only) | - | - | https://example.com |

### Constraints & Relationships
- **Primary Key:** userId
- **Unique Keys:** email, userId
- **Check Constraints:**
  - role IN ('student', 'instructor', 'admin')
  - reminderFrequency IN ('daily', 'weekly', 'twice-weekly')
  - email must contain '@' symbol
- **Indexes:** email (for login queries)

---

## 2. LESSONS Table

### Description
Stores lesson/course information created by instructors.

| Field Name | Data Type | Size | Constraints | Description | Primary Key | Foreign Key | Example |
|------------|-----------|------|-------------|-------------|-------------|-------------|---------|
| id | VARCHAR | 50 | NOT NULL, UNIQUE | Unique lesson identifier | ✅ PRIMARY KEY | - | lesson_1702800000 |
| title | VARCHAR | 200 | NOT NULL | Lesson title | - | - | Introduction to JavaScript |
| description | TEXT | 1000 | NOT NULL | Detailed lesson description | - | - | Learn the basics of... |
| topic | VARCHAR | 100 | NULLABLE | Subject/topic category | - | - | Programming |
| videoUrl | VARCHAR | 500 | NOT NULL | URL to video content | - | - | https://vimeo.com/123 |
| thumbnailUrl | VARCHAR | 500 | NULLABLE | Path to thumbnail image | - | - | /uploads/thumbnails/123.jpg |
| resourceZipUrl | VARCHAR | 500 | NULLABLE | Path to downloadable resource ZIP | - | - | /uploads/resources/123.zip |
| instructorId | VARCHAR | 50 | NOT NULL | ID of instructor who created lesson | - | ✅ FOREIGN KEY → users(userId) | I-3421 |
| status | ENUM | 20 | NOT NULL, DEFAULT='published' | Lesson status: 'draft', 'published', 'archived' | - | - | published |
| quiz | JSON | - | NULLABLE | Quiz questions in JSON format | - | - | {"questions": [...]} |
| createdAt | TIMESTAMP | - | NOT NULL, DEFAULT=NOW() | Lesson creation timestamp | - | - | 1702800000000 |
| updatedAt | TIMESTAMP | - | NULLABLE | Last update timestamp | - | - | 1702900000000 |
| deadline | TIMESTAMP | - | NULLABLE | Optional deadline for completion | - | - | 1703000000000 |

### Constraints & Relationships
- **Primary Key:** id
- **Foreign Keys:**
  - instructorId → users(userId) ON DELETE CASCADE
- **Check Constraints:**
  - status IN ('draft', 'published', 'archived')
  - videoUrl must start with 'http://' or 'https://'
- **Indexes:** instructorId, status, createdAt

---

## 3. ENROLLMENTS Table

### Description
Tracks student enrollments in lessons with progress and completion data.

| Field Name | Data Type | Size | Constraints | Description | Primary Key | Foreign Key | Example |
|------------|-----------|------|-------------|-------------|-------------|-------------|---------|
| id | VARCHAR | 50 | NOT NULL, UNIQUE | Unique enrollment identifier | ✅ PRIMARY KEY | - | enroll_1702800000 |
| userId | VARCHAR | 50 | NOT NULL | Student ID (references users) | - | ✅ FOREIGN KEY → users(userId) | S-9876 |
| lessonId | VARCHAR | 50 | NOT NULL | Lesson ID (references lessons) | - | ✅ FOREIGN KEY → lessons(id) | lesson_1702800000 |
| enrolledAt | TIMESTAMP | - | NOT NULL, DEFAULT=NOW() | Enrollment timestamp | - | - | 1702800000000 |
| progress | INT | - | NOT NULL, DEFAULT=0 | Completion progress (0-100) | - | - | 65 |
| status | ENUM | 20 | NOT NULL, DEFAULT='active' | Enrollment status: 'active', 'completed', 'missed' | - | - | active |
| completedAt | TIMESTAMP | - | NULLABLE | Completion timestamp (when progress=100) | - | - | 1702900000000 |
| lastAccessDate | TIMESTAMP | - | NULLABLE | Last time student accessed lesson | - | - | 1702850000000 |
| timeSpentSeconds | INT | - | DEFAULT=0 | Total time spent on lesson (seconds) | - | - | 1800 |
| quizScore | DECIMAL | 5,2 | NULLABLE | Quiz score percentage (0.00-100.00) | - | - | 85.50 |
| deadlineDate | TIMESTAMP | - | NULLABLE | Deadline for this enrollment | - | - | 1703000000000 |
| deadlineWarningDate | TIMESTAMP | - | NULLABLE | Date when warning email was sent | - | - | 1702950000000 |

### Constraints & Relationships
- **Primary Key:** id
- **Foreign Keys:**
  - userId → users(userId) ON DELETE CASCADE
  - lessonId → lessons(id) ON DELETE CASCADE
- **Check Constraints:**
  - progress BETWEEN 0 AND 100
  - status IN ('active', 'completed', 'missed')
  - quizScore BETWEEN 0.00 AND 100.00
  - timeSpentSeconds >= 0
- **Unique Composite Key:** (userId, lessonId) - Student can only enroll once per lesson
- **Indexes:** userId, lessonId, status, enrolledAt

---

## 4. ATTENDANCE Table

### Description
Records student attendance for lessons with digital tracking.

| Field Name | Data Type | Size | Constraints | Description | Primary Key | Foreign Key | Example |
|------------|-----------|------|-------------|-------------|-------------|-------------|---------|
| id | VARCHAR | 50 | NOT NULL, UNIQUE | Unique attendance record identifier | ✅ PRIMARY KEY | - | attend_1702800000 |
| studentId | VARCHAR | 50 | NOT NULL | Student ID (references users) | - | ✅ FOREIGN KEY → users(userId) | S-9876 |
| lessonId | VARCHAR | 50 | NOT NULL | Lesson ID (references lessons) | - | ✅ FOREIGN KEY → lessons(id) | lesson_1702800000 |
| date | DATE | - | NOT NULL | Attendance date (YYYY-MM-DD) | - | - | 2025-12-17 |
| status | ENUM | 20 | NOT NULL | Attendance status: 'present', 'absent' | - | - | present |
| markedBy | VARCHAR | 50 | NOT NULL | Instructor ID who marked attendance | - | ✅ FOREIGN KEY → users(userId) | I-3421 |
| markedAt | TIMESTAMP | - | NOT NULL, DEFAULT=NOW() | Timestamp when attendance was marked | - | - | 1702800000000 |
| notes | TEXT | 500 | NULLABLE | Optional notes about attendance | - | - | Late arrival |

### Constraints & Relationships
- **Primary Key:** id
- **Foreign Keys:**
  - studentId → users(userId) ON DELETE CASCADE
  - lessonId → lessons(id) ON DELETE CASCADE
  - markedBy → users(userId) ON DELETE SET NULL
- **Check Constraints:**
  - status IN ('present', 'absent')
  - date format: YYYY-MM-DD
- **Unique Composite Key:** (studentId, lessonId, date) - One attendance record per student per lesson per day
- **Indexes:** studentId, lessonId, date, markedBy

---

## 5. CHAT_MESSAGES Table (Optional - if implementing persistent chat)

### Description
Stores chatbot conversation history for users.

| Field Name | Data Type | Size | Constraints | Description | Primary Key | Foreign Key | Example |
|------------|-----------|------|-------------|-------------|-------------|-------------|---------|
| id | VARCHAR | 50 | NOT NULL, UNIQUE | Unique message identifier | ✅ PRIMARY KEY | - | msg_1702800000 |
| userId | VARCHAR | 50 | NOT NULL | User ID (references users) | - | ✅ FOREIGN KEY → users(userId) | S-9876 |
| role | ENUM | 20 | NOT NULL | Message sender: 'user', 'assistant' | - | - | user |
| message | TEXT | 2000 | NOT NULL | Message content | - | - | How do I enroll? |
| timestamp | TIMESTAMP | - | NOT NULL, DEFAULT=NOW() | Message timestamp | - | - | 1702800000000 |
| sessionId | VARCHAR | 50 | NULLABLE | Chat session identifier | - | - | session_1702800000 |

### Constraints & Relationships
- **Primary Key:** id
- **Foreign Keys:**
  - userId → users(userId) ON DELETE CASCADE
- **Check Constraints:**
  - role IN ('user', 'assistant')
- **Indexes:** userId, sessionId, timestamp

---

## Data Relationships Diagram

```
┌─────────────────┐
│     USERS       │
│  (userId PK)    │
└────────┬────────┘
         │
         ├─────────────────────────────┐
         │                             │
         │ FK: instructorId            │ FK: userId
         ▼                             ▼
┌─────────────────┐           ┌─────────────────┐
│    LESSONS      │           │  ENROLLMENTS    │
│   (id PK)       │◄──────────│   (id PK)       │
└────────┬────────┘ FK: lessonId └───────────────┘
         │
         │ FK: lessonId
         ▼
┌─────────────────┐
│   ATTENDANCE    │
│   (id PK)       │
└─────────────────┘
```

---

## Key Relationships Summary

### One-to-Many Relationships:
1. **users → lessons**
   - One instructor can create many lessons
   - FK: lessons.instructorId → users.userId

2. **users → enrollments**
   - One student can have many enrollments
   - FK: enrollments.userId → users.userId

3. **lessons → enrollments**
   - One lesson can have many enrollments
   - FK: enrollments.lessonId → lessons.id

4. **lessons → attendance**
   - One lesson can have many attendance records
   - FK: attendance.lessonId → lessons.id

5. **users → attendance** (as student)
   - One student can have many attendance records
   - FK: attendance.studentId → users.userId

6. **users → attendance** (as instructor)
   - One instructor can mark many attendance records
   - FK: attendance.markedBy → users.userId

### Many-to-Many Relationships:
1. **users ↔ lessons** (through enrollments)
   - Many students can enroll in many lessons
   - Junction table: enrollments

---

## Data Integrity Rules

### Referential Integrity:
1. **ON DELETE CASCADE:**
   - Deleting a user deletes all their enrollments
   - Deleting a user deletes all their attendance records
   - Deleting a lesson deletes all enrollments
   - Deleting a lesson deletes all attendance records

2. **ON DELETE SET NULL:**
   - Deleting an instructor (markedBy) sets attendance.markedBy to NULL

### Business Rules:
1. Students cannot enroll twice in the same lesson
2. Attendance can only be marked by instructors
3. Progress must be between 0-100
4. Quiz scores must be between 0-100
5. Status automatically changes to 'missed' after deadline + 3 days
6. Completion timestamp set when progress reaches 100
7. User IDs follow convention: S-XXXX, I-XXXX, A-XXXX

---

## Sample Data

### Users Table:
```
userId  | email                | firstName | lastName | role       | createdAt
--------|---------------------|-----------|----------|------------|-------------
S-9876  | john@school.edu     | John      | Doe      | student    | 1702800000000
I-3421  | jane@school.edu     | Jane      | Smith    | instructor | 1702700000000
A-7890  | admin@school.edu    | Admin     | User     | admin      | 1702600000000
```

### Lessons Table:
```
id              | title                    | instructorId | status    | createdAt
----------------|--------------------------|--------------|-----------|-------------
lesson_001      | Intro to JavaScript      | I-3421       | published | 1702800000000
lesson_002      | Advanced Python          | I-3421       | published | 1702900000000
```

### Enrollments Table:
```
id              | userId  | lessonId    | progress | status | enrolledAt
----------------|---------|-------------|----------|--------|-------------
enroll_001      | S-9876  | lesson_001  | 65       | active | 1702800000000
enroll_002      | S-9876  | lesson_002  | 100      | completed | 1702850000000
```

### Attendance Table:
```
id              | studentId | lessonId    | date       | status  | markedBy
----------------|-----------|-------------|------------|---------|----------
attend_001      | S-9876    | lesson_001  | 2025-12-17 | present | I-3421
attend_002      | S-9876    | lesson_002  | 2025-12-17 | absent  | I-3421
```

---

## Data Dictionary Notes

### Data Type Conventions:
- **VARCHAR:** Variable-length text
- **TEXT:** Long-form text (descriptions, notes)
- **INT:** Integer numbers
- **DECIMAL:** Decimal numbers (precision, scale)
- **TIMESTAMP:** Unix timestamp (milliseconds since epoch)
- **DATE:** Date only (YYYY-MM-DD)
- **ENUM:** Predefined set of values
- **JSON:** Structured JSON data
- **BOOLEAN:** True/False values

### Naming Conventions:
- Table names: Plural, UPPERCASE (documentation), camelCase (code)
- Field names: camelCase
- Primary keys: id or tableName_id
- Foreign keys: referencedTable_id or referencedTableId
- Timestamps: createdAt, updatedAt, completedAt, etc.

### Security Considerations:
- Passwords hashed with bcrypt (never stored plain text)
- JWT tokens for authentication (not stored in database)
- Email addresses validated for format
- Role-based access control enforced at application layer

---

**Document Version:** 1.0  
**Last Updated:** December 17, 2025  
**Prepared By:** IT Systems Analyst  
**Project:** Orah School Learning Management System
