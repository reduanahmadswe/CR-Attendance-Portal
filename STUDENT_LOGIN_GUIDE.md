# 🎓 Student Login System - Complete Guide

## ✅ System Overview

Student রা এখন **নিজেদের Student ID দিয়েই** login করতে পারবে!

### 🔑 Default Credentials:
- **Username:** Student ID (যেমন: `CSE-2021-001`)
- **Password:** Student ID (যেমন: `CSE-2021-001`)

**⚠️ Security Note:** Student ID ই default password, তাই student কে **প্রথম login এ password change** করতে উৎসাহিত করুন!

---

## 👨‍💼 Admin/CR: Student Account তৈরি করা

### পদ্ধতি ১: Single Student Create

```http
POST /api/sections/:sectionId/students
Authorization: Bearer {admin_or_cr_token}
Content-Type: application/json

{
  "studentId": "CSE-2021-001",
  "name": "John Doe",
  "email": "john.doe@university.edu",
  "courses": ["courseId1", "courseId2"]
}
```

**Default Password:** `CSE-2021-001` (Student ID নিজেই)

#### Custom Password দিতে চাইলে:

```json
{
  "studentId": "CSE-2021-001",
  "name": "John Doe",
  "email": "john.doe@university.edu",
  "password": "CustomPass@123",  // Optional custom password
  "courses": ["courseId1", "courseId2"]
}
```

### পদ্ধতি ২: Batch Create (Multiple Students)

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

**Note:** প্রতিটি student এর default password তাদের Student ID হবে।

---

## 🎓 Student: Login করা

### Login Endpoint:

```http
POST /api/auth/student/login
Content-Type: application/json

{
  "studentId": "CSE-2021-001",
  "password": "CSE-2021-001"
}
```

### Response:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "67...",
      "studentId": "CSE-2021-001",
      "name": "John Doe",
      "email": "john.doe@university.edu",
      "role": "student",
      "isPasswordDefault": true  // Shows student should change password
    }
  },
  "message": "Login successful"
}
```

---

## 🔐 Student: Password Change করা

### প্রথম Login এর পর Password Change:

```http
PUT /api/auth/student/change-password
Authorization: Bearer {student_token}
Content-Type: application/json

{
  "currentPassword": "CSE-2021-001",
  "newPassword": "MyNewSecurePassword@123"
}
```

### Response:

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 📱 Frontend Integration Example

### Login Component:

```tsx
const handleStudentLogin = async () => {
  try {
    const response = await fetch('/api/auth/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: 'CSE-2021-001',
        password: 'CSE-2021-001'  // Default: same as Student ID
      })
    });
    
    const data = await response.json();
    
    if (data.data.user.isPasswordDefault) {
      // Prompt user to change password
      alert('Please change your default password for security!');
    }
    
    // Store token and redirect
    localStorage.setItem('token', data.data.token);
    navigate('/student/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

---

## 🧪 Testing Guide

### Test 1: Create Student

```bash
curl -X POST http://localhost:5000/api/sections/67.../students \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "CSE-2021-001",
    "name": "Test Student",
    "email": "test@university.edu",
    "courses": []
  }'
```

**Expected:** Student created with password = `CSE-2021-001`

### Test 2: Student Login

```bash
curl -X POST http://localhost:5000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "CSE-2021-001",
    "password": "CSE-2021-001"
  }'
```

**Expected:** JWT token returned with `isPasswordDefault: true`

### Test 3: Change Password

```bash
curl -X PUT http://localhost:5000/api/auth/student/change-password \
  -H "Authorization: Bearer {student_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "CSE-2021-001",
    "newPassword": "NewSecurePass@123"
  }'
```

**Expected:** Password changed, `isPasswordDefault: false`

### Test 4: Login with New Password

```bash
curl -X POST http://localhost:5000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "CSE-2021-001",
    "password": "NewSecurePass@123"
  }'
```

**Expected:** Login successful with new password

---

## 🔄 Migration Guide (Existing Students)

যদি আপনার already students থাকে এবং তাদের password update করতে চান:

```javascript
// MongoDB Script to update existing students
db.students.updateMany(
  { password: { $exists: false } },  // Students without password
  [
    {
      $set: {
        password: "$studentId",  // Set password to their Student ID
        isPasswordDefault: true
      }
    }
  ]
);
```

**Note:** Password automatically hashed হবে Student model এর `pre-save` hook এ।

---

## 📊 Key Features

✅ **Username = Student ID**
✅ **Default Password = Student ID** (খুব সহজ মনে রাখা)
✅ **Automatic Password Hashing** (bcryptjs with 12 salt rounds)
✅ **Password Change Functionality**
✅ **isPasswordDefault Flag** (frontend warning দিতে পারে)
✅ **Custom Password Support** (admin চাইলে দিতে পারে)
✅ **Batch Create Support** (multiple students একসাথে)
✅ **Secure JWT Authentication**

---

## 🎯 User Flow

```
1. Admin creates student account with Student ID
   ↓
2. Student logs in with:
   - Username: CSE-2021-001
   - Password: CSE-2021-001
   ↓
3. System shows warning: "Default password detected"
   ↓
4. Student changes password (optional but recommended)
   ↓
5. Student uses QR scanner for attendance
```

---

## ❓ FAQ

**Q: Student ID টা sensitive হলে কি হবে?**
A: Admin চাইলে student create করার সময় custom password দিতে পারে।

**Q: Password change করা কি mandatory?**
A: না, optional। তবে security এর জন্য recommended।

**Q: একই password multiple students এর হলে problem?**
A: না, কারণ প্রতিটি student এর unique Student ID আছে। তবে security এর জন্য পরে change করা ভালো।

**Q: Batch create তে custom password দেয়া যাবে?**
A: হ্যাঁ, প্রতিটি student object এ `password` field যোগ করতে পারবেন।

---

## 🔒 Security Recommendations

1. ✅ প্রথম login এ password change করতে encourage করুন
2. ✅ Frontend এ `isPasswordDefault` check করে warning দেখান
3. ✅ Password strength validation implement করুন
4. ✅ Rate limiting add করুন login endpoint এ
5. ✅ Failed login attempts track করুন
6. ✅ JWT token expiration properly handle করুন

---

**🎉 System Ready! Students can now login using their Student ID as both username and password!**
