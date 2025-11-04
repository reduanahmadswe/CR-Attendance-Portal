# 🎓 Student Account Setup & Login Guide

## ✅ সম্পূর্ণ System যুক্ত হয়েছে!

Student রা এখন **নিজেদের Student ID দিয়েই login** করতে পারবে!

**🔑 Default Credential:**
- **Username:** Student ID (যেমন: `CSE-2021-001`)
- **Password:** Student ID (যেমন: `CSE-2021-001`)

---

## 📋 System Overview

### Student Account Creation প্রক্রিয়া:

```
Admin/CR → Student Create → Default Password (Student ID) → Student Login → Change Password (Optional)
```

---

## 👨‍💼 Admin/CR এর কাজ: Student Account তৈরি করা

### পদ্ধতি ১: Single Student Create

#### API Endpoint:
```http
POST /api/sections/:sectionId/students
Authorization: Bearer {admin_or_cr_token}
Content-Type: application/json

{
  "studentId": "CSE-2021-001",
  "name": "John Doe",
  "email": "john.doe@university.edu",
  "password": "CSE-2021-001",  // Optional - default হবে Student ID নিজেই
  "courses": ["courseId1", "courseId2"]
}
```

#### Response:
```json
{
  "success": true,
  "message": "Student created successfully",
  "data": {
    "_id": "67...",
    "studentId": "CSE-2021-001",
    "name": "John Doe",
    "email": "john.doe@university.edu",
    "sectionId": {...},
    "courses": [...],
    "isPasswordDefault": true  // Shows password is default
  }
}
```

### পদ্ধতি ২: Batch Create (Multiple Students একসাথে)

```http
POST /api/sections/:sectionId/students/batch
Authorization: Bearer {admin_or_cr_token}
Content-Type: application/json

{
  "students": [
    {
      "studentId": "CSE-2021-001",
      "name": "John Doe",
      "email": "john.doe@university.edu",
      "courses": ["courseId1", "courseId2"]
    },
    {
      "studentId": "CSE-2021-002",
      "name": "Jane Smith",
      "email": "jane.smith@university.edu",
      "courses": ["courseId1", "courseId2"]
    }
  ]
}
```

**Note**: Batch create তে সবার জন্য default password তাদের **Student ID** নিজেই হবে।

---

## 🎓 Student এর কাজ: Login করা

### 🔐 Student Login Credentials:

প্রতিটি student এর default credentials:
- **Username:** Student ID (যেমন: `CSE-2021-001`)
- **Password:** Student ID (যেমন: `CSE-2021-001`)

**⚠️ Security Note:** Student ID ই default password, তাই student কে **প্রথম login এ password change** করতে বলা উচিত!

### Student Login Process:

#### API Endpoint:
```http
POST /api/auth/student/login
Content-Type: application/json

{
  "studentId": "CSE-2021-001",
  "password": "CSE-2021-001"
}
```

#### Success Response:
```json
{
  "success": true,
  "message": "Student login successful",
  "data": {
    "user": {
      "_id": "67...",
      "studentId": "CSE-2021-001",
      "name": "John Doe",
      "email": "john.doe@university.edu",
      "sectionId": {...},
      "courses": [...],
      "isPasswordDefault": true,
      "role": "student"
    },
    "accessToken": "eyJhbGc..."
  }
}
```

#### Frontend Login Form:
```typescript
// Student Login
{
  studentId: "CSE-2021-001",  // NOT email!
  password: "student123"       // Default or changed password
}
```

---

## 🔐 Password Change (Student)

### Student নিজের Password পরিবর্তন করতে পারবে:

#### API Endpoint:
```http
PUT /api/auth/student/change-password
Authorization: Bearer {student_access_token}
Content-Type: application/json

{
  "currentPassword": "student123",
  "newPassword": "MyNewSecurePassword@123"
}
```

#### Response:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Important**: Password change করার পর `isPasswordDefault` automatically `false` হয়ে যাবে।

---

## 📊 Database Schema Changes

### Student Model এ যুক্ত হয়েছে:

```typescript
{
  studentId: String,        // Existing
  name: String,            // Existing
  email: String,           // Existing
  password: String,        // NEW! (hashed with bcrypt)
  isPasswordDefault: Boolean,  // NEW! (tracks if using default password)
  sectionId: ObjectId,     // Existing
  courses: [ObjectId],     // Existing
}
```

### Default Values:
- **password**: `"student123"` (automatically hashed)
- **isPasswordDefault**: `true` (when using default)

---

## 🚀 Complete Flow Example

### Scenario: নতুন Student "Ahmed" কে যুক্ত করা

#### Step 1: Admin creates student account
```bash
# Admin Portal থেকে বা API call করে
POST /api/sections/section123/students
{
  "studentId": "CSE-2024-042",
  "name": "Ahmed Rahman",
  "email": "ahmed@university.edu",
  "courses": ["course1", "course2"]
}
```

#### Step 2: Admin shares credentials with Ahmed
```
Student ID: CSE-2024-042
Password: student123 (default)
```

#### Step 3: Ahmed logs in
```bash
POST /api/auth/student/login
{
  "studentId": "CSE-2024-042",
  "password": "student123"
}
```

#### Step 4 (Optional): Ahmed changes password
```bash
PUT /api/auth/student/change-password
{
  "currentPassword": "student123",
  "newPassword": "Ahmed@Secure2024"
}
```

#### Step 5: Ahmed scans QR for attendance
```
- Navigate to Student Dashboard
- Click "Scan QR"
- Scan CR's QR code
- ✅ Attendance marked!
```

---

## 🎨 Frontend Login Page Update

### Login Page এ দুইটি Tab থাকবে:

#### Tab 1: Admin/CR Login (Existing)
```
Email: admin@example.com
Password: ********
[Login]
```

#### Tab 2: Student Login (NEW)
```
Student ID: CSE-2024-042
Password: ********
[Login]
```

---

## 📝 Important Notes

### ✅ Security Features:
1. **Password Hashing**: bcryptjs দিয়ে hash করা (salt rounds: 12)
2. **JWT Authentication**: Students ও JWT token পায়
3. **Role-based Access**: Student role আলাদা করা
4. **Password History**: `isPasswordDefault` field track করে

### ✅ Default Password Policy:
- Default password: **`student123`**
- Students recommend করা হবে first login এ password change করতে
- Admin চাইলে custom password set করতে পারবে student create করার সময়

### ✅ Student ID Format:
- **Unique** হতে হবে
- **Case-insensitive** (uppercase এ store হয়)
- Example formats:
  - `CSE-2024-001`
  - `EEE2024042`
  - `STUDENT-2024-123`

---

## 🔧 Migration Guide

### Existing Students এর জন্য Password Add করা:

যদি database তে ইতিমধ্যে students থাকে যাদের password নেই:

#### Option 1: MongoDB Script
```javascript
// MongoDB Shell বা Compass
db.students.updateMany(
  { password: { $exists: false } },
  { 
    $set: { 
      password: "$2a$12$hashed_student123_here",  // Pre-hashed
      isPasswordDefault: true 
    }
  }
)
```

#### Option 2: Backend Migration Script
```typescript
// backend/src/scripts/migrate-students.ts
import { Student } from '../models';
import bcryptjs from 'bcryptjs';

async function migrateStudents() {
  const studentsWithoutPassword = await Student.find({ 
    password: { $exists: false } 
  });

  for (const student of studentsWithoutPassword) {
    const hashedPassword = await bcryptjs.hash('student123', 12);
    student.password = hashedPassword;
    student.isPasswordDefault = true;
    await student.save({ validateBeforeSave: false });
  }

  console.log(`Migrated ${studentsWithoutPassword.length} students`);
}

migrateStudents();
```

---

## 📱 API Endpoints Summary

### Student Authentication:
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/student/login` | Student login | ❌ |
| PUT | `/api/auth/student/change-password` | Change password | ✅ |

### Student Management (Admin/CR):
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/sections/:id/students` | Create single student | ✅ (Admin/CR) |
| POST | `/api/sections/:id/students/batch` | Create multiple students | ✅ (Admin/CR) |
| GET | `/api/sections/:id/students` | Get all students | ✅ |
| PUT | `/api/students/:id` | Update student | ✅ (Admin/CR) |
| DELETE | `/api/students/:id` | Delete student | ✅ (Admin/CR) |

### Student Attendance:
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/qr-attendance/scan` | Scan QR code | ✅ (Student) |
| GET | `/api/attendance/student/:studentId` | Get own attendance | ✅ (Student) |

---

## 🎯 Testing Guide

### Test করার জন্য:

#### 1. Create Test Student
```bash
# Using curl or Postman
curl -X POST http://localhost:4000/api/sections/SECTION_ID/students \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "TEST-2024-001",
    "name": "Test Student",
    "email": "test@student.com",
    "courses": ["COURSE_ID"]
  }'
```

#### 2. Student Login
```bash
curl -X POST http://localhost:4000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "TEST-2024-001",
    "password": "student123"
  }'
```

#### 3. Verify Token
```bash
# Copy accessToken from response
curl -X GET http://localhost:4000/api/attendance/student/STUDENT_MONGO_ID \
  -H "Authorization: Bearer STUDENT_ACCESS_TOKEN"
```

---

## ✅ Implementation Complete!

### Backend যুক্ত হয়েছে:
- ✅ Student Model updated (password, isPasswordDefault fields)
- ✅ Password hashing & comparison methods
- ✅ `studentLogin` controller function
- ✅ `studentChangePassword` controller function
- ✅ Student auth routes (`/api/auth/student/login`, `/api/auth/student/change-password`)
- ✅ Default password: "student123"
- ✅ Automatic password hashing on save

### Frontend এ যা যুক্ত করতে হবে:
- 🔲 Login page এ Student tab
- 🔲 Student ID input field
- 🔲 Password change modal/page
- 🔲 First login password change prompt

---

## 🎊 Ready to Use!

Student রা এখন:
- ✅ **Student ID** ও **Password** দিয়ে login করতে পারবে
- ✅ Default password: **student123**
- ✅ Password change করতে পারবে
- ✅ QR scan করে attendance দিতে পারবে
- ✅ নিজেদের attendance history দেখতে পারবে

**Admin/CR দের শুধু Student account তৈরি করতে হবে, বাকি সব student নিজেরাই করতে পারবে! 🎓✨**
