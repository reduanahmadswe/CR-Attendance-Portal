# 🚀 Student Login System - Quick Reference

## একনজরে পুরো System

### 🎯 Main Concept
Student এর **Student ID** ই হবে তার **Username এবং Password উভয়ই**!

---

## 👤 Login Credentials

| Field | Value | Example |
|-------|-------|---------|
| Username | Student ID | `CSE-2021-001` |
| Password | Student ID | `CSE-2021-001` |

---

## 📝 Admin/CR: Student Account তৈরি

### Single Student:
```bash
POST /api/sections/{sectionId}/students
{
  "studentId": "CSE-2021-001",
  "name": "John Doe",
  "email": "john@university.edu"
}
```

**Result:** Password automatically = `CSE-2021-001`

### Custom Password চাইলে:
```bash
{
  "studentId": "CSE-2021-001",
  "name": "John Doe",
  "email": "john@university.edu",
  "password": "CustomPass@123"
}
```

---

## 🎓 Student: Login করা

```bash
POST /api/auth/student/login
{
  "studentId": "CSE-2021-001",
  "password": "CSE-2021-001"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUz...",
    "user": {
      "studentId": "CSE-2021-001",
      "name": "John Doe",
      "role": "student",
      "isPasswordDefault": true  // 🚨 Should change password!
    }
  }
}
```

---

## 🔐 Password Change (Optional)

```bash
PUT /api/auth/student/change-password
Authorization: Bearer {token}

{
  "currentPassword": "CSE-2021-001",
  "newPassword": "MyNewPassword@123"
}
```

---

## ✅ Complete Flow

```
1️⃣ Admin creates student → Password = Student ID
          ↓
2️⃣ Student logs in → Username: CSE-2021-001, Password: CSE-2021-001
          ↓
3️⃣ System shows: "isPasswordDefault: true" ⚠️
          ↓
4️⃣ Student changes password (optional)
          ↓
5️⃣ Student uses QR scanner for attendance ✅
```

---

## 🔑 Key Points

✅ **Easy to Remember:** Student ID = Password
✅ **Automatic Setup:** No manual password creation needed
✅ **Secure:** Bcrypt hashing (12 salt rounds)
✅ **Flexible:** Can change password anytime
✅ **Frontend Friendly:** `isPasswordDefault` flag for warnings

---

## 📚 Full Documentation

- **Complete Guide:** [STUDENT_LOGIN_GUIDE.md](./STUDENT_LOGIN_GUIDE.md)
- **QR System Guide:** [STUDENT_QR_ATTENDANCE_GUIDE.md](./STUDENT_QR_ATTENDANCE_GUIDE.md)
- **Implementation:** [QR_ATTENDANCE_IMPLEMENTATION_SUMMARY.md](./QR_ATTENDANCE_IMPLEMENTATION_SUMMARY.md)

---

**🎉 System Ready! Student ID = Username = Default Password**
