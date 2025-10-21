# Announcement Module - Postman/API Testing Guide

## Base URL
```
http://localhost:4000/api
```

## Authentication
All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📋 API Endpoints Collection

### 1. Create Quiz Announcement

**POST** `/announcements`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{crToken}}
```

**Body** (JSON):
```json
{
  "title": "Quiz 1 on Data Structures",
  "type": "quiz",
  "message": "This quiz will cover arrays, linked lists, stacks, and queues. Duration: 30 minutes. Open book allowed.",
  "courseId": "{{courseId}}",
  "sendEmail": false,
  "topic": "Arrays, Linked Lists, Stacks, Queues",
  "slideLink": "https://drive.google.com/slides/d/xyz123",
  "time": "2025-11-05T10:00:00Z",
  "room": "Room 301, Building A"
}
```

---

### 2. Create Presentation Announcement

**POST** `/announcements`

**Body** (JSON):
```json
{
  "title": "Group Presentation - Software Design Patterns",
  "type": "presentation",
  "message": "Each group will have 15 minutes for presentation and 5 minutes for Q&A.",
  "courseId": "{{courseId}}",
  "sendEmail": true,
  "topic": "Design Patterns in Software Engineering",
  "slideLink": "https://docs.google.com/presentation/d/abc456",
  "time": "2025-11-10T14:00:00Z",
  "room": "Seminar Hall 2"
}
```

---

### 3. Create Midterm Exam Announcement

**POST** `/announcements`

**Body** (JSON):
```json
{
  "title": "Midterm Examination",
  "type": "midterm",
  "message": "Midterm exam will cover all topics from week 1 to week 7. Please bring your student ID card and pen. No electronic devices allowed.",
  "courseId": "{{courseId}}",
  "sendEmail": true,
  "topic": "Weeks 1-7: Full Syllabus",
  "time": "2025-11-20T09:00:00Z",
  "room": "Exam Hall 1"
}
```

---

### 4. Create Final Exam Announcement

**POST** `/announcements`

**Body** (JSON):
```json
{
  "title": "Final Examination - Software Engineering",
  "type": "final",
  "message": "Final exam is comprehensive. Duration: 3 hours. Bring calculator, pen, and student ID.",
  "courseId": "{{courseId}}",
  "sendEmail": true,
  "topic": "Comprehensive - Full Semester",
  "time": "2025-12-15T08:00:00Z",
  "room": "Main Exam Hall"
}
```

---

### 5. Create Assignment Announcement

**POST** `/announcements`

**Body** (JSON):
```json
{
  "title": "Assignment 2 - Database Design",
  "type": "assignment",
  "message": "Design a normalized database schema for an e-commerce platform. Submit PDF and SQL files.",
  "courseId": "{{courseId}}",
  "sendEmail": true,
  "topic": "Database Normalization & E-commerce Schema",
  "slideLink": "https://classroom.google.com/assignment/xyz",
  "time": "2025-11-08T23:59:00Z",
  "room": "Submit Online"
}
```

---

### 6. Create Class Cancel Announcement

**POST** `/announcements`

**Body** (JSON):
```json
{
  "title": "Class Cancelled - November 3rd",
  "type": "class_cancel",
  "message": "Due to the university sports day event, today's class is cancelled. The lecture will be rescheduled next week.",
  "courseId": "{{courseId}}",
  "sendEmail": true
}
```

---

### 7. Create Class Reschedule Announcement

**POST** `/announcements`

**Body** (JSON):
```json
{
  "title": "Class Rescheduled to Friday",
  "type": "class_reschedule",
  "message": "Tuesday's class has been moved to Friday at 2:00 PM in Room 405. Please adjust your schedule accordingly.",
  "courseId": "{{courseId}}",
  "sendEmail": false
}
```

---

### 8. Get All Announcements

**GET** `/announcements`

**Query Parameters**:
```
?page=1&limit=20&sortBy=createdAt&order=desc
```

---

### 9. Filter Announcements by Type

**GET** `/announcements?type=quiz`

**Other Type Options**:
- `type=presentation`
- `type=midterm`
- `type=final`
- `type=assignment`
- `type=class_cancel`
- `type=class_reschedule`

---

### 10. Filter Announcements by Course

**GET** `/announcements?courseId={{courseId}}`

---

### 11. Filter Announcements by Section

**GET** `/announcements?sectionId={{sectionId}}`

---

### 12. Combined Filters with Pagination

**GET** `/announcements?courseId={{courseId}}&type=quiz&page=1&limit=10&order=desc`

---

### 13. Get Announcement by ID

**GET** `/announcements/{{announcementId}}`

---

### 14. Update Announcement

**PUT** `/announcements/{{announcementId}}`

**Body** (JSON):
```json
{
  "title": "Updated Quiz Title",
  "message": "Updated quiz message with new information",
  "room": "Room 302 (Changed)"
}
```

---

### 15. Delete Announcement

**DELETE** `/announcements/{{announcementId}}`

---

### 16. Get Announcement Statistics

**GET** `/announcements/stats`

**With Filters**:
```
GET /announcements/stats?courseId={{courseId}}
GET /announcements/stats?sectionId={{sectionId}}
```

---

## 🔧 Postman Environment Variables

Set up these variables in your Postman environment:

```json
{
  "baseUrl": "http://localhost:4000/api",
  "adminToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "crToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "instructorToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "sectionId": "507f1f77bcf86cd799439011",
  "courseId": "507f1f77bcf86cd799439012",
  "announcementId": "507f1f77bcf86cd799439013"
}
```

---

## 🧪 Test Scenarios

### Scenario 1: CR Creates Quiz with Email

1. Login as CR
2. Create quiz announcement with `sendEmail: true`
3. Verify response includes `emailStatus` with sent count
4. Check student emails

### Scenario 2: CR Gets Copy Text

1. Login as CR
2. Create announcement with `sendEmail: false`
3. Verify response includes `textMessage`
4. Use textMessage for WhatsApp/Telegram

### Scenario 3: Unauthorized Access

1. Login as CR for Section A
2. Try to create announcement for Section B course
3. Should receive 403 Forbidden

### Scenario 4: Validation Error

1. Create quiz without required `topic` field
2. Should receive 400 Bad Request
3. Error should specify missing field

### Scenario 5: Admin Full Access

1. Login as Admin
2. Create announcement for any section
3. Update any announcement
4. Delete any announcement

---

## 📊 Response Examples

### Success Response (sendEmail: false)

```json
{
  "success": true,
  "message": "Announcement created successfully",
  "data": {
    "announcement": {
      "_id": "6537a1b2c3d4e5f6a7b8c9d0",
      "title": "Quiz 1 on Data Structures",
      "type": "quiz",
      "message": "This quiz will cover...",
      "courseId": {
        "_id": "6537a1b2c3d4e5f6a7b8c9d1",
        "name": "Software Engineering",
        "code": "CSE301"
      },
      "sectionId": {
        "_id": "6537a1b2c3d4e5f6a7b8c9d2",
        "name": "Section A",
        "code": "SEC-A"
      },
      "createdBy": {
        "_id": "6537a1b2c3d4e5f6a7b8c9d3",
        "name": "CR Name",
        "email": "cr@test.com",
        "role": "cr"
      },
      "sendEmail": false,
      "emailSent": false,
      "details": {
        "topic": "Arrays, Linked Lists, Stacks, Queues",
        "slideLink": "https://drive.google.com/slides/d/xyz123",
        "time": "2025-11-05T10:00:00.000Z",
        "room": "Room 301, Building A"
      },
      "createdAt": "2025-10-21T12:00:00.000Z",
      "updatedAt": "2025-10-21T12:00:00.000Z"
    },
    "textMessage": "Quiz 1 on Data Structures\n\nType: Quiz\nCourse: Software Engineering\n\nTopic: Arrays, Linked Lists, Stacks, Queues\nTime: Tuesday, November 5, 2025, 10:00 AM\nRoom: Room 301, Building A\nSlides: https://drive.google.com/slides/d/xyz123\n\nMessage:\nThis quiz will cover arrays, linked lists, stacks, and queues. Duration: 30 minutes. Open book allowed.\n\n---\nSent by: CR Name\nDate: Monday, October 21, 2025, 12:00 PM",
    "emailStatus": null
  }
}
```

### Success Response (sendEmail: true)

```json
{
  "success": true,
  "message": "Announcement created and 45 emails sent successfully",
  "data": {
    "announcement": { ... },
    "textMessage": "...",
    "emailStatus": {
      "sent": 45,
      "failed": 0,
      "total": 45
    }
  }
}
```

### Error Response (Validation)

```json
{
  "success": false,
  "error": "\"topic\" is required",
  "field": "topic"
}
```

### Error Response (Authorization)

```json
{
  "success": false,
  "error": "You can only create announcements for your assigned section"
}
```

---

## 🔍 Testing Tips

1. **Get Tokens First**: Login to get valid JWT tokens for different roles
2. **Save IDs**: After creating section/course/announcement, save IDs in environment
3. **Test All Roles**: Test with admin, cr, instructor, and viewer tokens
4. **Test Validation**: Try invalid inputs to ensure validation works
5. **Test Email**: Use your real email to test email functionality
6. **Check Logs**: Monitor backend console for email send logs

---

## 🚀 Quick Start Testing Workflow

```bash
# 1. Start backend
cd backend
npm run dev

# 2. Login as Admin
POST /auth/login
{
  "email": "admin@test.com",
  "password": "password123"
}

# 3. Get Section ID
GET /sections

# 4. Get Course ID for that section
GET /courses?sectionId={{sectionId}}

# 5. Create Announcement
POST /announcements
{
  "title": "Test Quiz",
  "type": "quiz",
  "message": "Test message",
  "courseId": "{{courseId}}",
  "sendEmail": false,
  "topic": "Test Topic",
  "time": "2025-11-01T10:00:00Z",
  "room": "Room 101"
}

# 6. Get All Announcements
GET /announcements

# 7. Update Announcement
PUT /announcements/{{announcementId}}
{
  "title": "Updated Title"
}

# 8. Delete Announcement
DELETE /announcements/{{announcementId}}
```

---

## 📝 Notes

- Replace `{{variableName}}` with actual values
- All dates should be in ISO 8601 format
- Email functionality requires proper SMTP configuration
- CRs can only access their own section's data
- Admins have full access to all operations

---

Happy Testing! 🎉
