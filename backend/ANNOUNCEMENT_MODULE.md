# Class Announcement & Notification Module

## Overview

This module extends the CR Attendance Portal backend with a comprehensive announcement and notification system. CRs and Instructors can create announcements about quizzes, presentations, exams, assignments, class cancellations, and class reschedules. The system supports optional email delivery to enrolled students.

## Features

✅ **Multiple Announcement Types**
- Quiz
- Presentation
- Midterm Exam
- Final Exam
- Assignment
- Class Cancel
- Class Reschedule

✅ **Conditional Fields**
For Quiz, Presentation, Midterm, Final, and Assignment:
- Topic (required)
- Slide Link (optional)
- Time (required)
- Room (required)

✅ **Email Notifications**
- Send emails to all students enrolled in the course
- Beautiful HTML email templates
- Plain text fallback
- Batch email processing
- Email delivery tracking

✅ **Copy Text Feature**
- Generate formatted text message for manual sharing
- Returns with API response when `sendEmail` is `false`

✅ **Role-Based Access Control**
- **Admin**: Full access to all announcements
- **CR**: Can create/edit/delete announcements for their assigned section only
- **Instructor**: Can create/edit/delete announcements for any section
- **Viewer**: Read-only access to announcements

✅ **Advanced Filtering & Pagination**
- Filter by course, section, type
- Sort by creation date
- Pagination support

---

## API Endpoints

### 1. Create Announcement

**POST** `/api/announcements`

**Access**: Admin, CR, Instructor

**Request Body**:
```json
{
  "title": "Quiz 1 on Data Structures",
  "type": "quiz",
  "message": "Quiz will cover arrays, linked lists, and stacks. Prepare accordingly.",
  "courseId": "507f1f77bcf86cd799439011",
  "sendEmail": false,
  "topic": "Arrays and Linked Lists",
  "slideLink": "https://drive.google.com/slides/xyz",
  "time": "2025-11-01T10:00:00Z",
  "room": "Room 301"
}
```

**For Class Cancel/Reschedule** (no details required):
```json
{
  "title": "Class Cancelled - Nov 5",
  "type": "class_cancel",
  "message": "Due to university event, today's class is cancelled.",
  "courseId": "507f1f77bcf86cd799439011",
  "sendEmail": true
}
```

**Response** (sendEmail = false):
```json
{
  "success": true,
  "message": "Announcement created successfully",
  "data": {
    "announcement": {
      "_id": "507f191e810c19729de860ea",
      "title": "Quiz 1 on Data Structures",
      "type": "quiz",
      "message": "Quiz will cover arrays...",
      "courseId": { "_id": "...", "name": "Software Engineering" },
      "sectionId": { "_id": "...", "name": "Section A" },
      "createdBy": { "_id": "...", "name": "CR Name" },
      "sendEmail": false,
      "emailSent": false,
      "details": {
        "topic": "Arrays and Linked Lists",
        "slideLink": "https://drive.google.com/slides/xyz",
        "time": "2025-11-01T10:00:00.000Z",
        "room": "Room 301"
      },
      "createdAt": "2025-10-21T12:00:00.000Z",
      "updatedAt": "2025-10-21T12:00:00.000Z"
    },
    "textMessage": "Quiz 1 on Data Structures\n\nType: Quiz\nCourse: Software Engineering\n\nTopic: Arrays and Linked Lists\nTime: Saturday, November 1, 2025, 10:00 AM\nRoom: Room 301\nSlides: https://drive.google.com/slides/xyz\n\nMessage:\nQuiz will cover arrays, linked lists, and stacks. Prepare accordingly.\n\n---\nSent by: CR Name\nDate: Monday, October 21, 2025, 12:00 PM",
    "emailStatus": null
  }
}
```

**Response** (sendEmail = true):
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

---

### 2. Get All Announcements

**GET** `/api/announcements`

**Access**: Admin, CR, Instructor, Viewer

**Query Parameters**:
- `courseId` (optional): Filter by course
- `sectionId` (optional): Filter by section
- `type` (optional): Filter by type (quiz, presentation, etc.)
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `sortBy` (optional, default: createdAt)
- `order` (optional, default: desc)

**Example Request**:
```
GET /api/announcements?courseId=507f1f77bcf86cd799439011&type=quiz&page=1&limit=10
```

**Response**:
```json
{
  "success": true,
  "message": "Announcements retrieved successfully",
  "data": [
    {
      "_id": "507f191e810c19729de860ea",
      "title": "Quiz 1 on Data Structures",
      "type": "quiz",
      "message": "Quiz will cover...",
      "courseId": { "_id": "...", "name": "Software Engineering" },
      "sectionId": { "_id": "...", "name": "Section A" },
      "createdBy": { "_id": "...", "name": "CR Name", "email": "cr@test.com" },
      "sendEmail": true,
      "emailSent": true,
      "emailSentAt": "2025-10-21T12:01:00.000Z",
      "details": {
        "topic": "Arrays and Linked Lists",
        "time": "2025-11-01T10:00:00.000Z",
        "room": "Room 301"
      },
      "createdAt": "2025-10-21T12:00:00.000Z",
      "updatedAt": "2025-10-21T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

### 3. Get Announcement by ID

**GET** `/api/announcements/:id`

**Access**: Admin, CR (own section), Instructor, Viewer

**Response**:
```json
{
  "success": true,
  "message": "Announcement retrieved successfully",
  "data": {
    "_id": "507f191e810c19729de860ea",
    "title": "Midterm Exam",
    "type": "midterm",
    "message": "Midterm exam will cover chapters 1-5.",
    "courseId": { "_id": "...", "name": "Software Engineering", "code": "CSE301" },
    "sectionId": { "_id": "...", "name": "Section A", "code": "SEC-A" },
    "createdBy": { "_id": "...", "name": "Instructor Name", "email": "instructor@test.com" },
    "details": {
      "topic": "Chapters 1-5",
      "time": "2025-12-01T09:00:00.000Z",
      "room": "Exam Hall 1"
    },
    "createdAt": "2025-10-21T12:00:00.000Z",
    "updatedAt": "2025-10-21T12:00:00.000Z"
  }
}
```

---

### 4. Update Announcement

**PUT** `/api/announcements/:id`

**Access**: Admin, Creator only

**Request Body** (partial update):
```json
{
  "title": "Updated Quiz Title",
  "message": "Updated message",
  "room": "Room 302"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Announcement updated successfully",
  "data": { ... }
}
```

---

### 5. Delete Announcement

**DELETE** `/api/announcements/:id`

**Access**: Admin, Creator only

**Response**:
```json
{
  "success": true,
  "message": "Announcement deleted successfully",
  "data": null
}
```

---

### 6. Get Announcement Statistics

**GET** `/api/announcements/stats`

**Access**: Admin, CR, Instructor

**Query Parameters**:
- `sectionId` (optional)
- `courseId` (optional)

**Response**:
```json
{
  "success": true,
  "message": "Announcement statistics retrieved successfully",
  "data": {
    "total": 48,
    "byType": [
      { "_id": "quiz", "count": 15, "emailsSent": 12 },
      { "_id": "assignment", "count": 12, "emailsSent": 10 },
      { "_id": "presentation", "count": 10, "emailsSent": 8 },
      { "_id": "midterm", "count": 5, "emailsSent": 5 },
      { "_id": "final", "count": 3, "emailsSent": 3 },
      { "_id": "class_cancel", "count": 2, "emailsSent": 0 },
      { "_id": "class_reschedule", "count": 1, "emailsSent": 1 }
    ]
  }
}
```

---

## Database Schema

### Announcement Model

```typescript
{
  _id: ObjectId,
  title: String (required, max: 200),
  type: Enum (required) ['quiz', 'presentation', 'midterm', 'final', 'assignment', 'class_cancel', 'class_reschedule'],
  message: String (required, max: 2000),
  courseId: ObjectId (required, ref: 'Course'),
  sectionId: ObjectId (required, ref: 'Section'),
  createdBy: ObjectId (required, ref: 'User'),
  sendEmail: Boolean (default: false),
  emailSent: Boolean (default: false),
  emailSentAt: Date (optional),
  emailRecipients: [String] (optional),
  details: {
    topic: String (optional, max: 200),
    slideLink: String (optional, max: 500),
    time: Date (optional),
    room: String (optional, max: 100)
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `courseId` + `createdAt` (desc)
- `sectionId` + `createdAt` (desc)
- `type` + `createdAt` (desc)
- `createdBy`

---

## Email Configuration

Add the following environment variables to your `.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@cr-attendance.com
EMAIL_FROM_NAME=CR Attendance Portal
```

### Gmail Setup

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Create a new app password for "Mail"
   - Use this password in `EMAIL_PASSWORD`

### Other SMTP Providers

- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`
- **AWS SES**: `email-smtp.us-east-1.amazonaws.com:587`

---

## Validation Rules

### Create Announcement

**Common Fields** (all types):
- `title`: Required, max 200 chars
- `type`: Required, must be one of the allowed types
- `message`: Required, max 2000 chars
- `courseId`: Required, valid MongoDB ObjectId
- `sendEmail`: Optional boolean, default false

**Conditional Fields** (quiz, presentation, midterm, final, assignment):
- `topic`: Required, max 200 chars
- `time`: Required, valid date
- `room`: Required, max 100 chars
- `slideLink`: Optional, must be valid URI, max 500 chars

**Not Required** (class_cancel, class_reschedule):
- No additional fields required

---

## Security & Authorization

### Access Control Matrix

| Role       | Create | View All | View Own Section | Edit Own | Edit All | Delete Own | Delete All |
|------------|--------|----------|------------------|----------|----------|------------|------------|
| Admin      | ✅     | ✅       | ✅               | ✅       | ✅       | ✅         | ✅         |
| CR         | ✅     | ❌       | ✅               | ✅       | ❌       | ✅         | ❌         |
| Instructor | ✅     | ✅       | ✅               | ✅       | ❌       | ✅         | ❌         |
| Viewer     | ❌     | ✅       | ✅               | ❌       | ❌       | ❌         | ❌         |

### Business Rules

1. **CR Restrictions**:
   - Can only create announcements for their assigned section
   - Can only view/edit/delete announcements for their section
   - Cannot access announcements from other sections

2. **Instructor Rights**:
   - Can create announcements for any section/course
   - Can only edit/delete their own announcements

3. **Admin Powers**:
   - Full access to all announcements
   - Can edit/delete anyone's announcements

---

## Testing

Run the comprehensive test suite:

```bash
cd backend
npm test announcement.test.ts
```

The test suite covers:
- ✅ Create announcements with details (quiz, presentation, etc.)
- ✅ Create announcements without details (class_cancel, class_reschedule)
- ✅ Validation for required conditional fields
- ✅ Role-based access control
- ✅ CR section restrictions
- ✅ Filtering and pagination
- ✅ Update and delete operations
- ✅ Statistics aggregation

---

## Usage Examples

### Frontend Integration

#### Create Quiz Announcement

```typescript
const createQuizAnnouncement = async (data: any) => {
  const response = await fetch('/api/announcements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Quiz 1 - Data Structures',
      type: 'quiz',
      message: 'Quiz will cover arrays and linked lists',
      courseId: selectedCourse._id,
      sendEmail: false, // Set to true to send emails
      topic: 'Arrays and Linked Lists',
      slideLink: 'https://slides.google.com/xyz',
      time: new Date('2025-11-01T10:00:00Z'),
      room: 'Room 301'
    })
  });

  const result = await response.json();
  
  if (!result.data.emailStatus) {
    // User can copy the text message
    copyToClipboard(result.data.textMessage);
  }
};
```

#### Get Announcements for Course

```typescript
const fetchAnnouncements = async (courseId: string) => {
  const response = await fetch(
    `/api/announcements?courseId=${courseId}&page=1&limit=20`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const result = await response.json();
  return result.data;
};
```

---

## Logging

The module includes comprehensive logging:

```
📢 Announcement created: 507f191e810c19729de860ea by cr@test.com
📧 Announcement emails sent: 45/45
✅ Email sent successfully to: student@test.com
❌ Error sending email: [error details]
📝 Announcement updated: 507f191e810c19729de860ea by admin@test.com
🗑️ Announcement deleted: 507f191e810c19729de860ea by cr@test.com
```

---

## Error Handling

All errors follow the standard API error format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common Error Codes**:
- `400`: Validation error (missing required fields)
- `401`: Authentication required
- `403`: Forbidden (insufficient permissions)
- `404`: Announcement/Course/Section not found
- `409`: Conflict (duplicate announcement)
- `500`: Server error

---

## Performance Considerations

1. **Email Batching**: Emails are sent in batches of 10 to avoid overwhelming the SMTP server
2. **Database Indexes**: Optimized indexes for fast querying by course, section, type
3. **Pagination**: Default limit of 20 to prevent large payloads
4. **Lean Queries**: Uses `.lean()` for read operations to improve performance

---

## Future Enhancements

- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] SMS notifications (Twilio integration)
- [ ] Announcement templates
- [ ] Scheduled announcements
- [ ] File attachments
- [ ] Read receipts tracking
- [ ] Announcement reactions/acknowledgments
- [ ] Announcement expiry dates
- [ ] Recurring announcements

---

## Support

For issues or questions, please contact the development team or create an issue in the repository.

---

## License

MIT License - CR Attendance Portal
