# CR Attendance Portal - API Testing Guide for Postman

Base URL: `http://localhost:4000/api`

## Authentication Headers

For protected routes, add this header:

```
Authorization: Bearer <your_access_token>
```

---

## 1. AUTHENTICATION ENDPOINTS

### 1.1 Login

- **Method**: POST
- **URL**: `{{base_url}}/auth/login`
- **Body** (JSON):

```json
{
  "email": "admin@university.edu",
  "password": "admin123"
}
```

### 1.2 Refresh Token

- **Method**: POST
- **URL**: `{{base_url}}/auth/refresh`
- **Body**: Empty (uses httpOnly cookie)

### 1.3 Logout

- **Method**: POST
- **URL**: `{{base_url}}/auth/logout`
- **Headers**: Authorization required

### 1.4 Get Profile

- **Method**: GET
- **URL**: `{{base_url}}/auth/profile`
- **Headers**: Authorization required

### 1.5 Update Profile

- **Method**: PUT
- **URL**: `{{base_url}}/auth/profile`
- **Headers**: Authorization required
- **Body** (JSON):

```json
{
  "name": "Updated Name",
  "email": "updated@university.edu"
}
```

### 1.6 Change Password

- **Method**: PUT
- **URL**: `{{base_url}}/auth/change-password`
- **Headers**: Authorization required
- **Body** (JSON):

```json
{
  "currentPassword": "admin123",
  "newPassword": "newPassword123"
}
```

---

## 2. SECTION ENDPOINTS

### 2.1 Create Section (Admin only)

- **Method**: POST
- **URL**: `{{base_url}}/sections`
- **Headers**: Authorization required
- **Body** (JSON):

```json
{
  "name": "CSE-4A",
  "code": "CSE4A",
  "description": "Computer Science Engineering Section A - 4th Year"
}
```

### 2.2 Get All Sections

- **Method**: GET
- **URL**: `{{base_url}}/sections?page=1&limit=10&sortBy=name&sortOrder=asc`
- **Headers**: Authorization required

### 2.3 Get Section by ID

- **Method**: GET
- **URL**: `{{base_url}}/sections/{{section_id}}`
- **Headers**: Authorization required

### 2.4 Update Section (Admin only)

- **Method**: PUT
- **URL**: `{{base_url}}/sections/{{section_id}}`
- **Headers**: Authorization required
- **Body** (JSON):

```json
{
  "name": "CSE-4A Updated",
  "description": "Updated description"
}
```

### 2.5 Delete Section (Admin only)

- **Method**: DELETE
- **URL**: `{{base_url}}/sections/{{section_id}}`
- **Headers**: Authorization required

### 2.6 Get Section Courses

- **Method**: GET
- **URL**: `{{base_url}}/sections/{{section_id}}/courses?page=1&limit=10`
- **Headers**: Authorization required

### 2.7 Add Course to Section (Admin only)

- **Method**: POST
- **URL**: `{{base_url}}/sections/{{section_id}}/courses`
- **Headers**: Authorization required
- **Body** (JSON):

```json
{
  "name": "Advanced Software Engineering",
  "code": "CSE401",
  "semester": "Fall 2025"
}
```

### 2.8 Get Section Students

- **Method**: GET
- **URL**: `{{base_url}}/sections/{{section_id}}/students?page=1&limit=10`
- **Headers**: Authorization required

### 2.9 Add Student to Section (Admin only)

- **Method**: POST
- **URL**: `{{base_url}}/sections/{{section_id}}/students`
- **Headers**: Authorization required
- **Body** (JSON):

```json
{
  "studentId": "2021CSE010",
  "name": "New Student",
  "email": "new.student@university.edu",
  "courses": ["{{course_id_1}}", "{{course_id_2}}"]
}
```

### 2.10 Bulk Add Students (Admin only)

- **Method**: POST
- **URL**: `{{base_url}}/sections/{{section_id}}/students/batch`
- **Headers**: Authorization required
- **Body** (JSON):

```json
{
  "students": [
    {
      "studentId": "2021CSE011",
      "name": "Student One",
      "email": "student1@university.edu",
      "courses": ["{{course_id}}"]
    },
    {
      "studentId": "2021CSE012",
      "name": "Student Two",
      "email": "student2@university.edu",
      "courses": ["{{course_id}}"]
    }
  ]
}
```

### 2.11 Get Students for Course in Section

- **Method**: GET
- **URL**: `{{base_url}}/sections/{{section_id}}/courses/{{course_id}}/students`
- **Headers**: Authorization required

---

## 3. COURSE ENDPOINTS

### 3.1 Get Course by ID

- **Method**: GET
- **URL**: `{{base_url}}/courses/{{course_id}}`
- **Headers**: Authorization required

### 3.2 Update Course (Admin only)

- **Method**: PUT
- **URL**: `{{base_url}}/courses/{{course_id}}`
- **Headers**: Authorization required
- **Body** (JSON):

```json
{
  "name": "Updated Course Name",
  "code": "UPDATED101",
  "semester": "Spring 2026"
}
```

### 3.3 Delete Course (Admin only)

- **Method**: DELETE
- **URL**: `{{base_url}}/courses/{{course_id}}`
- **Headers**: Authorization required

---

## 4. STUDENT ENDPOINTS

### 4.1 Get Student by ID

- **Method**: GET
- **URL**: `{{base_url}}/students/{{student_id}}`
- **Headers**: Authorization required

### 4.2 Update Student (Admin only)

- **Method**: PUT
- **URL**: `{{base_url}}/students/{{student_id}}`
- **Headers**: Authorization required
- **Body** (JSON):

```json
{
  "studentId": "2021CSE001",
  "name": "Updated Student Name",
  "email": "updated.student@university.edu",
  "courses": ["{{course_id_1}}", "{{course_id_2}}"]
}
```

### 4.3 Delete Student (Admin only)

- **Method**: DELETE
- **URL**: `{{base_url}}/students/{{student_id}}`
- **Headers**: Authorization required

### 4.4 Add Student to Courses (Admin only)

- **Method**: POST
- **URL**: `{{base_url}}/students/{{student_id}}/courses`
- **Headers**: Authorization required
- **Body** (JSON):

```json
{
  "courseIds": ["{{course_id_1}}", "{{course_id_2}}"]
}
```

### 4.5 Remove Student from Courses (Admin only)

- **Method**: DELETE
- **URL**: `{{base_url}}/students/{{student_id}}/courses`
- **Headers**: Authorization required
- **Body** (JSON):

```json
{
  "courseIds": ["{{course_id_1}}"]
}
```

---

## 5. ATTENDANCE ENDPOINTS

### 5.1 Create Attendance Record

- **Method**: POST
- **URL**: `{{base_url}}/attendance`
- **Headers**: Authorization required
- **Body** (JSON):

```json
{
  "sectionId": "{{section_id}}",
  "courseId": "{{course_id}}",
  "date": "2025-09-12",
  "attendees": [
    {
      "studentId": "{{student_id_1}}",
      "status": "present",
      "note": "On time"
    },
    {
      "studentId": "{{student_id_2}}",
      "status": "absent",
      "note": "Sick leave"
    },
    {
      "studentId": "{{student_id_3}}",
      "status": "late",
      "note": "Arrived 10 minutes late"
    },
    {
      "studentId": "{{student_id_4}}",
      "status": "excused",
      "note": "Official university event"
    }
  ]
}
```

### 5.2 Get Attendance Records (with filters)

- **Method**: GET
- **URL**: `{{base_url}}/attendance?sectionId={{section_id}}&courseId={{course_id}}&from=2025-09-01&to=2025-09-30&page=1&limit=10`
- **Headers**: Authorization required

### 5.3 Get Attendance Statistics

- **Method**: GET
- **URL**: `{{base_url}}/attendance/stats?sectionId={{section_id}}&courseId={{course_id}}&from=2025-09-01&to=2025-09-30`
- **Headers**: Authorization required

### 5.4 Get Attendance Record by ID

- **Method**: GET
- **URL**: `{{base_url}}/attendance/{{attendance_id}}`
- **Headers**: Authorization required

### 5.5 Update Attendance Record

- **Method**: PUT
- **URL**: `{{base_url}}/attendance/{{attendance_id}}`
- **Headers**: Authorization required
- **Body** (JSON):

```json
{
  "attendees": [
    {
      "studentId": "{{student_id_1}}",
      "status": "present",
      "note": "Updated status"
    }
  ]
}
```

### 5.6 Delete Attendance Record

- **Method**: DELETE
- **URL**: `{{base_url}}/attendance/{{attendance_id}}`
- **Headers**: Authorization required

### 5.7 Stream Attendance PDF

- **Method**: GET
- **URL**: `{{base_url}}/attendance/{{attendance_id}}/pdf`
- **Headers**: Authorization required
- **Response**: PDF file (inline)

### 5.8 Download Attendance PDF

- **Method**: GET
- **URL**: `{{base_url}}/attendance/{{attendance_id}}/download`
- **Headers**: Authorization required
- **Response**: PDF file (download)

---

## 6. USER MANAGEMENT ENDPOINTS (Admin only)

### 6.1 Create User

- **Method**: POST
- **URL**: `{{base_url}}/users`
- **Headers**: Authorization required (Admin)
- **Body** (JSON):

```json
{
  "name": "New CR User",
  "email": "new.cr@university.edu",
  "password": "password123",
  "role": "cr",
  "sectionId": "{{section_id}}"
}
```

### 6.2 Get All Users

- **Method**: GET
- **URL**: `{{base_url}}/users?page=1&limit=10&role=cr&sectionId={{section_id}}`
- **Headers**: Authorization required (Admin)

### 6.3 Get User by ID

- **Method**: GET
- **URL**: `{{base_url}}/users/{{user_id}}`
- **Headers**: Authorization required (Admin)

### 6.4 Update User

- **Method**: PUT
- **URL**: `{{base_url}}/users/{{user_id}}`
- **Headers**: Authorization required (Admin)
- **Body** (JSON):

```json
{
  "name": "Updated User Name",
  "email": "updated.user@university.edu",
  "role": "cr",
  "sectionId": "{{section_id}}"
}
```

### 6.5 Delete User

- **Method**: DELETE
- **URL**: `{{base_url}}/users/{{user_id}}`
- **Headers**: Authorization required (Admin)

### 6.6 Reset User Password

- **Method**: PUT
- **URL**: `{{base_url}}/users/{{user_id}}/reset-password`
- **Headers**: Authorization required (Admin)
- **Body** (JSON):

```json
{
  "newPassword": "newPassword123"
}
```

---

## 7. HEALTH CHECK

### 7.1 Health Check

- **Method**: GET
- **URL**: `{{base_url}}/health`
- **Headers**: None required

---

## POSTMAN ENVIRONMENT VARIABLES

Create these variables in your Postman environment:

```
base_url: http://localhost:4000/api
access_token: (will be set after login)
section_id: (get from sections list)
course_id: (get from courses list)
student_id: (get from students list)
attendance_id: (get from attendance list)
user_id: (get from users list)
```

## TEST SEQUENCE

1. **Start with Health Check** to ensure server is running
2. **Login** with admin credentials to get access token
3. **Get Sections** to get section IDs
4. **Get Section Courses** to get course IDs
5. **Get Section Students** to get student IDs
6. **Create Attendance** record
7. **Test other endpoints** as needed

## SAMPLE LOGIN CREDENTIALS

From the seed data:

**Admin:**

- Email: `admin@university.edu`
- Password: `admin123`

**CR Users:**

- Email: `john.cr@university.edu` (CSE-3A)
- Password: `cr123`
- Email: `jane.cr@university.edu` (CSE-3B)
- Password: `cr123`

## NOTES

- All endpoints require valid JWT token except login, refresh, logout, and health check
- Admin role required for user management and CRUD operations
- CRs can only access their assigned section data
- PDF endpoints return binary data (PDF files)
- Use the seed script to populate test data: `npm run seed`
