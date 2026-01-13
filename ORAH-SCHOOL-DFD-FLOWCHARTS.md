# 📊 Orah School - Data Flow Diagrams & Flowcharts

## Project Information
**Project Name:** Orah School Learning Management System  
**System Focus:** Registrar's Office - Course Registration & Fee Payment  
**Date:** December 17, 2025  
**Version:** 1.0

---

## 1. Level 0 Context Diagram (System Overview)

### Description
The Level 0 Context Diagram shows the Orah School Management System as a single process with external entities and major data flows.

### Mermaid.js Code:

```mermaid
graph TB
    %% External Entities
    Student([Student])
    Instructor([Instructor])
    Admin([Admin/Registrar])
    EmailSystem([Email System])
    PaymentGateway([Payment Gateway])
    
    %% Main System Process
    OrahSchool[("Orah School<br/>Management System<br/>(0)")]
    
    %% Student Data Flows
    Student -->|"Registration Request"| OrahSchool
    Student -->|"Course Enrollment Request"| OrahSchool
    Student -->|"Fee Payment"| OrahSchool
    Student -->|"Progress Updates"| OrahSchool
    OrahSchool -->|"Enrollment Confirmation"| Student
    OrahSchool -->|"Course Materials"| Student
    OrahSchool -->|"Grade Report"| Student
    OrahSchool -->|"Payment Receipt"| Student
    
    %% Instructor Data Flows
    Instructor -->|"Course Content"| OrahSchool
    Instructor -->|"Attendance Records"| OrahSchool
    Instructor -->|"Grade Submissions"| OrahSchool
    OrahSchool -->|"Enrollment Lists"| Instructor
    OrahSchool -->|"Analytics Reports"| Instructor
    
    %% Admin/Registrar Data Flows
    Admin -->|"User Management"| OrahSchool
    Admin -->|"Course Approval"| OrahSchool
    Admin -->|"System Configuration"| OrahSchool
    OrahSchool -->|"System Reports"| Admin
    OrahSchool -->|"User Statistics"| Admin
    
    %% Email System Data Flows
    OrahSchool -->|"Reminder Emails"| EmailSystem
    OrahSchool -->|"Notifications"| EmailSystem
    EmailSystem -->|"Delivery Status"| OrahSchool
    
    %% Payment Gateway Data Flows
    OrahSchool -->|"Payment Request"| PaymentGateway
    PaymentGateway -->|"Payment Confirmation"| OrahSchool
    
    %% Styling
    classDef entityStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef systemStyle fill:#fff9c4,stroke:#f57f17,stroke-width:3px
    
    class Student,Instructor,Admin,EmailSystem,PaymentGateway entityStyle
    class OrahSchool systemStyle
```

### External Entities:
1. **Student** - Enrolls in courses, makes payments, views progress
2. **Instructor** - Creates courses, marks attendance, submits grades
3. **Admin/Registrar** - Manages users, approves courses, configures system
4. **Email System** - Sends reminders and notifications
5. **Payment Gateway** - Processes fee payments

---

## 2. Level 1 DFD (Course Registration & Fee Payment Focus)

### Description
The Level 1 DFD expands the Orah School System into major subsystems, focusing on Course Registration and Fee Payment processes within the Registrar's Office.

### Mermaid.js Code:

```mermaid
graph TB
    %% External Entities
    Student([Student])
    Instructor([Instructor])
    Registrar([Registrar/Admin])
    PaymentGateway([Payment Gateway])
    EmailSystem([Email System])
    
    %% Main Processes
    P1["1.0<br/>Course<br/>Registration"]
    P2["2.0<br/>Fee<br/>Payment<br/>Processing"]
    P3["3.0<br/>Enrollment<br/>Verification"]
    P4["4.0<br/>Notification<br/>Management"]
    P5["5.0<br/>Report<br/>Generation"]
    
    %% Data Stores
    DS1[("D1: Users<br/>Database")]
    DS2[("D2: Courses<br/>Database")]
    DS3[("D3: Enrollments<br/>Database")]
    DS4[("D4: Payments<br/>Database")]
    DS5[("D5: Attendance<br/>Database")]
    
    %% Student to Course Registration
    Student -->|"1. Registration Form<br/>(Name, Email, Password)"| P1
    Student -->|"2. Course Selection<br/>(CourseID, StudentID)"| P1
    
    %% Course Registration Process
    P1 -->|"3. User Credentials"| DS1
    DS1 -->|"4. Validation Result"| P1
    P1 -->|"5. Course Query"| DS2
    DS2 -->|"6. Available Courses"| P1
    P1 -->|"7. Enrollment Record<br/>(StudentID, CourseID, Date)"| DS3
    P1 -->|"8. Registration Confirmation"| Student
    P1 -->|"9. Enrollment Data"| P3
    
    %% Fee Payment Process
    Student -->|"10. Payment Information<br/>(Amount, CourseID)"| P2
    P2 -->|"11. Enrollment Details"| DS3
    DS3 -->|"12. Course Fee Info"| P2
    P2 -->|"13. Payment Request"| PaymentGateway
    PaymentGateway -->|"14. Payment Status"| P2
    P2 -->|"15. Transaction Record<br/>(PaymentID, Amount, Status)"| DS4
    P2 -->|"16. Payment Receipt"| Student
    P2 -->|"17. Payment Confirmation"| P3
    
    %% Enrollment Verification
    P3 -->|"18. Verify Enrollment<br/>& Payment Status"| DS3
    P3 -->|"19. Check Payment"| DS4
    DS4 -->|"20. Payment Status"| P3
    P3 -->|"21. Enrollment Approval"| DS3
    P3 -->|"22. Notify Instructor"| P4
    
    %% Notification Management
    P4 -->|"23. Enrollment Notification"| EmailSystem
    EmailSystem -->|"24. Confirmation Email"| Student
    EmailSystem -->|"25. Enrollment Alert"| Instructor
    P4 -->|"26. Notification Log"| DS3
    
    %% Report Generation
    Registrar -->|"27. Report Request"| P5
    P5 -->|"28. User Data Query"| DS1
    P5 -->|"29. Enrollment Query"| DS3
    P5 -->|"30. Payment Query"| DS4
    DS1 -->|"31. User Statistics"| P5
    DS3 -->|"32. Enrollment Data"| P5
    DS4 -->|"33. Payment Data"| P5
    P5 -->|"34. Registration Report<br/>Payment Report"| Registrar
    
    %% Instructor Access
    Instructor -->|"35. View Enrollments"| DS3
    DS3 -->|"36. Student List"| Instructor
    Instructor -->|"37. Attendance Data"| DS5
    DS5 -->|"38. Attendance Report"| Instructor
    
    %% Styling
    classDef entityStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef processStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef datastoreStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    
    class Student,Instructor,Registrar,PaymentGateway,EmailSystem entityStyle
    class P1,P2,P3,P4,P5 processStyle
    class DS1,DS2,DS3,DS4,DS5 datastoreStyle
```

### Process Descriptions:

#### 1.0 Course Registration
- **Input:** Registration form, course selection
- **Output:** Enrollment confirmation, enrollment record
- **Description:** Validates student credentials, checks course availability, creates enrollment record

#### 2.0 Fee Payment Processing
- **Input:** Payment information, course details
- **Output:** Payment receipt, transaction record
- **Description:** Processes course fee payments through payment gateway, records transactions

#### 3.0 Enrollment Verification
- **Input:** Enrollment data, payment confirmation
- **Output:** Enrollment approval, instructor notification
- **Description:** Verifies enrollment and payment status, approves final enrollment

#### 4.0 Notification Management
- **Input:** Enrollment approval, payment confirmation
- **Output:** Confirmation emails, enrollment alerts
- **Description:** Sends email notifications to students and instructors

#### 5.0 Report Generation
- **Input:** Report request from registrar
- **Output:** Registration reports, payment reports
- **Description:** Generates statistical and financial reports for administration

---

## 3. Level 2 DFD - Course Registration (Detailed Breakdown)

### Description
Further breakdown of the Course Registration process (Process 1.0).

### Mermaid.js Code:

```mermaid
graph TB
    %% External Entity
    Student([Student])
    
    %% Sub-processes
    P11["1.1<br/>Validate<br/>User<br/>Credentials"]
    P12["1.2<br/>Check<br/>Course<br/>Availability"]
    P13["1.3<br/>Check<br/>Prerequisites"]
    P14["1.4<br/>Create<br/>Enrollment<br/>Record"]
    P15["1.5<br/>Send<br/>Confirmation"]
    
    %% Data Stores
    DS1[("D1: Users")]
    DS2[("D2: Courses")]
    DS3[("D3: Enrollments")]
    
    %% Data Flows
    Student -->|"Registration Form"| P11
    P11 -->|"Credentials"| DS1
    DS1 -->|"User Record"| P11
    P11 -->|"Validated User"| P12
    
    P12 -->|"Course Query"| DS2
    DS2 -->|"Course Details"| P12
    P12 -->|"Available Course"| P13
    
    P13 -->|"Check Enrollments"| DS3
    DS3 -->|"Student History"| P13
    P13 -->|"Prerequisites Met"| P14
    
    P14 -->|"New Enrollment"| DS3
    DS3 -->|"Enrollment ID"| P14
    P14 -->|"Enrollment Data"| P15
    
    P15 -->|"Confirmation"| Student
    
    %% Styling
    classDef entityStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef processStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef datastoreStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    
    class Student entityStyle
    class P11,P12,P13,P14,P15 processStyle
    class DS1,DS2,DS3 datastoreStyle
```

---

## 4. Flowchart: Login Validation with Retry Logic

### Description
Flowchart showing the login validation process with a retry mechanism after 3 failed attempts.

### Mermaid.js Code:

```mermaid
flowchart TD
    Start([Start Login Process])
    Input[/"Enter Email & Password"/]
    InitCounter["Initialize:<br/>attemptCount = 0<br/>maxAttempts = 3"]
    
    CheckEmpty{"Email or Password<br/>Empty?"}
    EmptyError["Display Error:<br/>'Please fill all fields'"]
    
    IncrementCounter["attemptCount = attemptCount + 1"]
    
    ValidateCredentials["Send credentials to<br/>POST /api/auth/login"]
    
    CheckResponse{"Authentication<br/>Successful?"}
    
    StoreToken["Store JWT Token<br/>& User Data in<br/>localStorage"]
    
    GetRole["Get User Role<br/>from Response"]
    
    CheckRole{"User Role?"}
    
    StudentDash["Redirect to<br/>student-dashboard.html"]
    InstructorDash["Redirect to<br/>instructor-hub.html"]
    AdminDash["Redirect to<br/>admin-dashboard.html"]
    
    CheckAttempts{"attemptCount >= 3?"}
    
    InvalidError["Display Error:<br/>'Invalid email or password'<br/>Show Attempts Remaining"]
    
    LockoutError["Display Error:<br/>'Account locked after 3<br/>failed attempts'<br/>Show 'Please try again in 15 minutes'"]
    
    LockAccount["Temporarily Lock Account<br/>lockUntil = currentTime + 15 min"]
    
    ShowRetry["Show 'Try Again' Button<br/>Display attempts: (3 - attemptCount)"]
    
    End([End])
    
    %% Main Flow
    Start --> Input
    Input --> InitCounter
    InitCounter --> CheckEmpty
    
    CheckEmpty -->|Yes| EmptyError
    EmptyError --> Input
    
    CheckEmpty -->|No| IncrementCounter
    IncrementCounter --> ValidateCredentials
    
    ValidateCredentials --> CheckResponse
    
    CheckResponse -->|Success| StoreToken
    StoreToken --> GetRole
    GetRole --> CheckRole
    
    CheckRole -->|"role='student'"| StudentDash
    CheckRole -->|"role='instructor'"| InstructorDash
    CheckRole -->|"role='admin'"| AdminDash
    
    StudentDash --> End
    InstructorDash --> End
    AdminDash --> End
    
    %% Failed Authentication
    CheckResponse -->|Failed| CheckAttempts
    
    CheckAttempts -->|No<br/>(attempts < 3)| InvalidError
    InvalidError --> ShowRetry
    ShowRetry --> Input
    
    CheckAttempts -->|Yes<br/>(attempts >= 3)| LockAccount
    LockAccount --> LockoutError
    LockoutError --> End
    
    %% Styling
    classDef startEndStyle fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px
    classDef processStyle fill:#bbdefb,stroke:#1565c0,stroke-width:2px
    classDef decisionStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef errorStyle fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef successStyle fill:#c8e6c9,stroke:#388e3c,stroke-width:2px
    
    class Start,End startEndStyle
    class Input,InitCounter,IncrementCounter,ValidateCredentials,StoreToken,GetRole,LockAccount processStyle
    class CheckEmpty,CheckResponse,CheckRole,CheckAttempts decisionStyle
    class EmptyError,InvalidError,LockoutError errorStyle
    class StudentDash,InstructorDash,AdminDash,ShowRetry successStyle
```

### Pseudocode for Login Validation:

```javascript
// Initialize variables
let attemptCount = 0;
const maxAttempts = 3;
const lockoutDuration = 15 * 60 * 1000; // 15 minutes in milliseconds

function handleLogin() {
    // Get input values
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    // Check for empty fields
    if (!email || !password) {
        displayError('Please fill all fields');
        return;
    }
    
    // Increment attempt counter
    attemptCount++;
    
    // Validate credentials with backend
    fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok && data.token) {
            // Success: Store token and redirect
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.user.userId);
            localStorage.setItem('role', data.user.role);
            
            // Role-based redirection
            if (data.user.role === 'student') {
                window.location.href = 'student-dashboard.html';
            } else if (data.user.role === 'instructor') {
                window.location.href = 'instructor-hub.html';
            } else if (data.user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            }
        } else {
            // Failed authentication
            if (attemptCount >= maxAttempts) {
                // Lock account
                const lockUntil = Date.now() + lockoutDuration;
                localStorage.setItem('lockUntil', lockUntil);
                displayError('Account locked after 3 failed attempts. Please try again in 15 minutes.');
                disableLoginForm();
            } else {
                // Show remaining attempts
                const remainingAttempts = maxAttempts - attemptCount;
                displayError(`Invalid email or password. ${remainingAttempts} attempt(s) remaining.`);
            }
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        displayError('Network error. Please try again.');
    });
}
```

---

## 5. Flowchart: Course Enrollment Process

### Mermaid.js Code:

```mermaid
flowchart TD
    Start([Student Initiates<br/>Course Enrollment])
    
    CheckAuth{"User<br/>Authenticated?"}
    RedirectLogin["Redirect to<br/>login.html"]
    
    DisplayCourses["Display Available<br/>Courses List"]
    
    SelectCourse[/"Student Selects<br/>Course"/]
    
    CheckEnrolled{"Already<br/>Enrolled in<br/>Course?"}
    
    ErrorAlready["Show Error:<br/>'You are already<br/>enrolled in this course'"]
    
    CheckPrereq{"Prerequisites<br/>Met?"}
    
    ErrorPrereq["Show Error:<br/>'Prerequisites not met'"]
    
    CheckCapacity{"Course Has<br/>Available Slots?"}
    
    ErrorFull["Show Error:<br/>'Course is full'"]
    
    ShowPayment["Display Payment<br/>Information<br/>(Course Fee)"]
    
    ConfirmEnroll{"Student<br/>Confirms<br/>Enrollment?"}
    
    CreateEnrollment["POST /api/enrollments<br/>Create Enrollment Record"]
    
    CheckSuccess{"Enrollment<br/>Created?"}
    
    ProcessPayment["Redirect to<br/>Payment Processing"]
    
    SendEmail["Send Confirmation<br/>Email to Student"]
    
    NotifyInstructor["Notify Instructor<br/>of New Enrollment"]
    
    UpdateDashboard["Update Student<br/>Dashboard with<br/>New Course"]
    
    ShowSuccess["Show Success:<br/>'Successfully enrolled<br/>in course'"]
    
    ErrorCreate["Show Error:<br/>'Failed to create<br/>enrollment'"]
    
    Cancel["Cancel Enrollment"]
    
    End([End])
    
    %% Flow
    Start --> CheckAuth
    CheckAuth -->|No| RedirectLogin
    RedirectLogin --> End
    
    CheckAuth -->|Yes| DisplayCourses
    DisplayCourses --> SelectCourse
    
    SelectCourse --> CheckEnrolled
    CheckEnrolled -->|Yes| ErrorAlready
    ErrorAlready --> DisplayCourses
    
    CheckEnrolled -->|No| CheckPrereq
    CheckPrereq -->|No| ErrorPrereq
    ErrorPrereq --> DisplayCourses
    
    CheckPrereq -->|Yes| CheckCapacity
    CheckCapacity -->|No| ErrorFull
    ErrorFull --> DisplayCourses
    
    CheckCapacity -->|Yes| ShowPayment
    ShowPayment --> ConfirmEnroll
    
    ConfirmEnroll -->|No| Cancel
    Cancel --> End
    
    ConfirmEnroll -->|Yes| CreateEnrollment
    CreateEnrollment --> CheckSuccess
    
    CheckSuccess -->|Success| ProcessPayment
    ProcessPayment --> SendEmail
    SendEmail --> NotifyInstructor
    NotifyInstructor --> UpdateDashboard
    UpdateDashboard --> ShowSuccess
    ShowSuccess --> End
    
    CheckSuccess -->|Failed| ErrorCreate
    ErrorCreate --> DisplayCourses
    
    %% Styling
    classDef startEndStyle fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px
    classDef processStyle fill:#bbdefb,stroke:#1565c0,stroke-width:2px
    classDef decisionStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef errorStyle fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef successStyle fill:#c8e6c9,stroke:#388e3c,stroke-width:2px
    
    class Start,End startEndStyle
    class DisplayCourses,SelectCourse,ShowPayment,CreateEnrollment,ProcessPayment,SendEmail,NotifyInstructor,UpdateDashboard,Cancel processStyle
    class CheckAuth,CheckEnrolled,CheckPrereq,CheckCapacity,ConfirmEnroll,CheckSuccess decisionStyle
    class RedirectLogin,ErrorAlready,ErrorPrereq,ErrorFull,ErrorCreate errorStyle
    class ShowSuccess successStyle
```

---

## 6. Flowchart: Fee Payment Processing

### Mermaid.js Code:

```mermaid
flowchart TD
    Start([Start Payment<br/>Process])
    
    GetEnrollment["Retrieve Enrollment<br/>Details"]
    
    DisplayFee["Display Course Fee<br/>& Payment Methods"]
    
    SelectMethod[/"Student Selects<br/>Payment Method"/]
    
    CheckMethod{"Payment<br/>Method?"}
    
    CreditCard["Process Credit Card<br/>Payment"]
    DebitCard["Process Debit Card<br/>Payment"]
    BankTransfer["Process Bank<br/>Transfer"]
    
    ValidatePayment["Validate Payment<br/>Information"]
    
    CheckValid{"Payment Info<br/>Valid?"}
    
    ErrorInvalid["Show Error:<br/>'Invalid payment<br/>information'"]
    
    SendToGateway["Send Payment Request<br/>to Payment Gateway"]
    
    WaitResponse["Wait for Gateway<br/>Response"]
    
    CheckStatus{"Payment<br/>Status?"}
    
    CreateTransaction["Create Transaction<br/>Record in Database"]
    
    UpdateEnrollment["Update Enrollment<br/>Status to 'Paid'"]
    
    GenerateReceipt["Generate Payment<br/>Receipt"]
    
    SendConfirmation["Send Confirmation<br/>Email with Receipt"]
    
    ShowSuccess["Display Success:<br/>'Payment Successful'<br/>Show Receipt"]
    
    LogFailure["Log Payment<br/>Failure"]
    
    ShowError["Display Error:<br/>'Payment Failed'<br/>Show Retry Option"]
    
    RetryPayment{"Retry<br/>Payment?"}
    
    End([End])
    
    %% Flow
    Start --> GetEnrollment
    GetEnrollment --> DisplayFee
    DisplayFee --> SelectMethod
    SelectMethod --> CheckMethod
    
    CheckMethod -->|Credit Card| CreditCard
    CheckMethod -->|Debit Card| DebitCard
    CheckMethod -->|Bank Transfer| BankTransfer
    
    CreditCard --> ValidatePayment
    DebitCard --> ValidatePayment
    BankTransfer --> ValidatePayment
    
    ValidatePayment --> CheckValid
    
    CheckValid -->|No| ErrorInvalid
    ErrorInvalid --> SelectMethod
    
    CheckValid -->|Yes| SendToGateway
    SendToGateway --> WaitResponse
    WaitResponse --> CheckStatus
    
    CheckStatus -->|Success| CreateTransaction
    CreateTransaction --> UpdateEnrollment
    UpdateEnrollment --> GenerateReceipt
    GenerateReceipt --> SendConfirmation
    SendConfirmation --> ShowSuccess
    ShowSuccess --> End
    
    CheckStatus -->|Failed| LogFailure
    LogFailure --> ShowError
    ShowError --> RetryPayment
    
    RetryPayment -->|Yes| SelectMethod
    RetryPayment -->|No| End
    
    %% Styling
    classDef startEndStyle fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px
    classDef processStyle fill:#bbdefb,stroke:#1565c0,stroke-width:2px
    classDef decisionStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef errorStyle fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef successStyle fill:#c8e6c9,stroke:#388e3c,stroke-width:2px
    
    class Start,End startEndStyle
    class GetEnrollment,DisplayFee,SelectMethod,CreditCard,DebitCard,BankTransfer,ValidatePayment,SendToGateway,WaitResponse,CreateTransaction,UpdateEnrollment,GenerateReceipt,SendConfirmation,LogFailure processStyle
    class CheckMethod,CheckValid,CheckStatus,RetryPayment decisionStyle
    class ErrorInvalid,ShowError errorStyle
    class ShowSuccess successStyle
```

---

## Data Flow Specifications

### 1. Course Registration Data Flow

| Flow # | Source | Destination | Data Elements | Description |
|--------|--------|-------------|---------------|-------------|
| 1 | Student | Registration Process | firstName, lastName, email, password | Student submits registration form |
| 2 | Student | Registration Process | courseId, studentId | Student selects course to enroll |
| 3 | Registration Process | Users DB | email, password | Check user credentials |
| 4 | Users DB | Registration Process | userId, role, name | Return validated user |
| 5 | Registration Process | Courses DB | courseId | Query course availability |
| 6 | Courses DB | Registration Process | title, capacity, enrolled | Return course details |
| 7 | Registration Process | Enrollments DB | enrollmentId, userId, courseId, date | Create enrollment record |
| 8 | Registration Process | Student | confirmationMessage, enrollmentId | Send confirmation to student |

### 2. Fee Payment Data Flow

| Flow # | Source | Destination | Data Elements | Description |
|--------|--------|-------------|---------------|-------------|
| 10 | Student | Payment Process | amount, courseId, paymentMethod | Submit payment information |
| 11 | Payment Process | Enrollments DB | courseId, userId | Query enrollment details |
| 12 | Enrollments DB | Payment Process | courseFee, enrollmentStatus | Return course fee information |
| 13 | Payment Process | Payment Gateway | amount, cardDetails, transactionId | Send payment request |
| 14 | Payment Gateway | Payment Process | status, transactionId, timestamp | Return payment status |
| 15 | Payment Process | Payments DB | paymentId, amount, status, timestamp | Store transaction record |
| 16 | Payment Process | Student | receipt, transactionId, amount | Send payment receipt |

---

## System Integration Points

### 1. External Systems Integration

```mermaid
graph LR
    OrahSchool[Orah School<br/>System]
    
    PaymentGateway[Payment Gateway<br/>API]
    EmailService[Email Service<br/>SMTP]
    CloudStorage[Cloud Storage<br/>Videos/Files]
    Analytics[Analytics<br/>Service]
    
    OrahSchool <-->|"REST API<br/>Payment Requests"| PaymentGateway
    OrahSchool -->|"SMTP<br/>Email Notifications"| EmailService
    OrahSchool <-->|"S3/CDN<br/>File Upload/Download"| CloudStorage
    OrahSchool -->|"Event Tracking<br/>User Analytics"| Analytics
    
    classDef systemStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef externalStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    
    class OrahSchool systemStyle
    class PaymentGateway,EmailService,CloudStorage,Analytics externalStyle
```

---

## Key Takeaways for Registrar's Office

### Course Registration Process:
1. **Student initiates registration** → System validates credentials
2. **Course availability checked** → Prerequisites verified
3. **Enrollment record created** → Confirmation sent
4. **Payment required** → Transaction processed
5. **Final approval** → Instructor notified

### Fee Payment Process:
1. **Student selects payment method** → Information validated
2. **Request sent to payment gateway** → Real-time processing
3. **Transaction recorded** → Receipt generated
4. **Enrollment updated** → Confirmation email sent
5. **Reports generated** → Financial tracking

### Data Stores Involved:
- **D1: Users** - Student and staff information
- **D2: Courses** - Course catalog and details
- **D3: Enrollments** - Registration records
- **D4: Payments** - Financial transactions
- **D5: Attendance** - Attendance tracking

---

**Document Version:** 1.0  
**Last Updated:** December 17, 2025  
**Prepared By:** IT Systems Analyst  
**Project:** Orah School Learning Management System  
**Focus Area:** Registrar's Office - Course Registration & Fee Payment
