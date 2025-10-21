# 🚀 Quick Start Guide - Announcement Module

## Prerequisites
- ✅ Backend is running
- ✅ MongoDB is connected
- ✅ You have a valid JWT token
- ✅ Email SMTP is configured (for email sending)

---

## 1️⃣ Setup Email (Optional but Recommended)

### Option A: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated 16-character password

3. **Update `.env` file**:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # App password from step 2
EMAIL_FROM=noreply@cr-attendance.com
EMAIL_FROM_NAME=CR Attendance Portal
```

### Option B: Other SMTP Providers

**SendGrid**:
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

**Mailgun**:
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-username
EMAIL_PASSWORD=your-mailgun-password
```

---

## 2️⃣ Test the API (No Email)

### Get Your Token
```bash
POST http://localhost:4000/api/auth/login
Content-Type: application/json

{
  "email": "cr@test.com",
  "password": "password123"
}
```

Save the `accessToken` from response.

### Create Your First Announcement

```bash
POST http://localhost:4000/api/announcements
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "title": "Quiz 1 - Data Structures",
  "type": "quiz",
  "message": "Quiz will cover arrays, linked lists, and stacks. Duration: 30 minutes.",
  "courseId": "YOUR_COURSE_ID",
  "sendEmail": false,
  "topic": "Arrays and Linked Lists",
  "time": "2025-11-05T10:00:00Z",
  "room": "Room 301"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Announcement created successfully",
  "data": {
    "announcement": { ... },
    "textMessage": "Quiz 1 - Data Structures\n\nType: Quiz\n...",
    "emailStatus": null
  }
}
```

✅ **Copy the `textMessage` and share via WhatsApp/Telegram!**

---

## 3️⃣ Test Email Sending

### Update Request to Send Emails

```bash
POST http://localhost:4000/api/announcements
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "title": "Important: Midterm Exam",
  "type": "midterm",
  "message": "Midterm exam scheduled. Please prepare all topics from week 1-7.",
  "courseId": "YOUR_COURSE_ID",
  "sendEmail": true,  ← Change to true
  "topic": "Weeks 1-7: Complete Syllabus",
  "time": "2025-11-20T09:00:00Z",
  "room": "Exam Hall 1"
}
```

**Expected Response**:
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

✅ **Check student email inboxes for beautiful HTML emails!**

---

## 4️⃣ Get All Announcements

```bash
GET http://localhost:4000/api/announcements
Authorization: Bearer YOUR_TOKEN_HERE
```

With filters:
```bash
GET http://localhost:4000/api/announcements?type=quiz&page=1&limit=10
```

---

## 5️⃣ Create Different Types

### Class Cancel (No Details Required)

```json
{
  "title": "Class Cancelled - Nov 3",
  "type": "class_cancel",
  "message": "Due to university event, today's class is cancelled.",
  "courseId": "YOUR_COURSE_ID",
  "sendEmail": true
}
```

### Assignment

```json
{
  "title": "Assignment 1 - Database Design",
  "type": "assignment",
  "message": "Design a normalized database for e-commerce. Submit PDF.",
  "courseId": "YOUR_COURSE_ID",
  "sendEmail": true,
  "topic": "Database Normalization",
  "slideLink": "https://classroom.google.com/assignment/xyz",
  "time": "2025-11-08T23:59:00Z",
  "room": "Submit Online"
}
```

### Presentation

```json
{
  "title": "Group Presentation - Design Patterns",
  "type": "presentation",
  "message": "Each group has 15 minutes + 5 min Q&A",
  "courseId": "YOUR_COURSE_ID",
  "sendEmail": false,
  "topic": "Software Design Patterns",
  "slideLink": "https://docs.google.com/presentation/xyz",
  "time": "2025-11-10T14:00:00Z",
  "room": "Seminar Hall 2"
}
```

---

## 6️⃣ Update an Announcement

```bash
PUT http://localhost:4000/api/announcements/ANNOUNCEMENT_ID
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "title": "Updated Title",
  "room": "Room 302 (Changed)"
}
```

---

## 7️⃣ Delete an Announcement

```bash
DELETE http://localhost:4000/api/announcements/ANNOUNCEMENT_ID
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 8️⃣ Get Statistics

```bash
GET http://localhost:4000/api/announcements/stats
Authorization: Bearer YOUR_TOKEN_HERE
```

Response:
```json
{
  "success": true,
  "data": {
    "total": 48,
    "byType": [
      { "_id": "quiz", "count": 15, "emailsSent": 12 },
      { "_id": "assignment", "count": 12, "emailsSent": 10 }
    ]
  }
}
```

---

## 🧪 Run Tests

```bash
cd backend
npm test announcement.test.ts
```

Expected output:
```
PASS  src/__tests__/announcement.test.ts
  Announcement Module
    POST /api/announcements
      ✓ should create a quiz announcement with all details
      ✓ should create a class cancel announcement without details
      ✓ should reject quiz announcement without required details
      ✓ should reject announcement from CR for different section
      ✓ should allow admin to create announcement
      ✓ should reject announcement from viewer
    GET /api/announcements
      ✓ should get all announcements
      ✓ should filter announcements by type
      ...

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
```

---

## 🐛 Troubleshooting

### "Course not found" Error
- Make sure you're using a valid `courseId` from your database
- Get course IDs: `GET /api/courses`

### "You can only create announcements for your assigned section" Error
- You're logged in as CR but trying to create for a different section
- Use admin token or create for your assigned section

### "Topic is required" Error
- For quiz/presentation/midterm/final/assignment, you MUST provide:
  - `topic`
  - `time`
  - `room`

### Email Not Sending
1. Check `.env` email configuration
2. Check console logs for `✅ Email sent` or `❌ Error sending email`
3. Verify SMTP credentials
4. For Gmail: Make sure you're using App Password, not regular password
5. Check if students exist in the course: `GET /api/students?courseId=XXX`

### No Students Receiving Email
- Verify students are enrolled in the course
- Check `Student` model has correct `courses` array
- Query students: `GET /api/students?courseId=YOUR_COURSE_ID`

---

## 📱 Frontend Integration Checklist

- [ ] Create announcement form with conditional fields
- [ ] Show "Copy Text" button when `sendEmail: false`
- [ ] Show email status when `sendEmail: true`
- [ ] Display announcements list with filters
- [ ] Add type badges (different colors for each type)
- [ ] Show details (topic, time, room, slides) for academic announcements
- [ ] Implement edit/delete for creators
- [ ] Add confirmation dialog before sending emails
- [ ] Show loading state during email sending

---

## 🎯 Recommended Workflow

### For CRs:
1. Login → Get sections and courses
2. Select course from dropdown
3. Choose announcement type
4. Fill form (conditional fields appear based on type)
5. Toggle "Send Email" (default: off)
6. Submit → Copy text or view email status
7. Share text via WhatsApp/Telegram group

### For Admins:
1. Login → Full access to all sections
2. Monitor announcement statistics
3. Edit/delete any announcement if needed
4. View email delivery reports

---

## 📚 Documentation

- **Full Documentation**: [ANNOUNCEMENT_MODULE.md](./ANNOUNCEMENT_MODULE.md)
- **API Testing Guide**: [ANNOUNCEMENT_API_TESTING.md](./ANNOUNCEMENT_API_TESTING.md)
- **Implementation Summary**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

---

## ✅ You're All Set!

The announcement module is ready to use. Start creating announcements and enjoy automated email notifications! 🎉

For questions or issues, refer to the documentation files or run the test suite.

---

**Happy Announcing! 📢**
