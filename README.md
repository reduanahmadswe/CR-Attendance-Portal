# 🎓 CR Attendance Portal

<div align="center">

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)

A comprehensive full-stack web application for managing student attendance through Class Representatives (CR) with role-based access control, real-time notifications, and automated reporting.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [API Reference](#-api-reference) • [Deployment](#-deployment)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Environment Configuration](#-environment-configuration)
- [Database Models](#-database-models)
- [API Reference](#-api-reference)
- [User Roles & Permissions](#-user-roles--permissions)
- [Announcement System](#-announcement-system)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [Security](#-security)
- [License](#-license)

---

## 🌟 Overview

The **CR Attendance Portal** is a modern, full-stack web application designed to streamline the attendance management process in educational institutions. Class Representatives (CRs) can efficiently record attendance, while administrators have complete control over sections, courses, students, and user management. The system features a sophisticated announcement module with email notifications, PDF report generation, and comprehensive analytics.

### 🎯 Key Highlights

- **Role-Based Access Control**: Admin, CR, Instructor, and Viewer roles with granular permissions
- **Section-Specific Management**: CRs can only access their assigned section data
- **Real-Time Notifications**: Email announcements for quizzes, exams, assignments, and class updates
- **PDF Report Generation**: Professional attendance reports with statistics
- **Responsive Design**: Mobile-friendly UI with dark/light theme support
- **Secure Authentication**: JWT-based authentication with access/refresh token pattern
- **RESTful API**: Well-documented API endpoints with comprehensive error handling
- **TypeScript**: Fully typed codebase for enhanced developer experience

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with access and refresh tokens
- Role-based access control (Admin, CR, Instructor, Viewer)
- Secure password hashing with bcrypt (12 salt rounds)
- Protected routes with middleware authentication
- Profile management and password change functionality

### 👥 User Management
- Create, read, update, and delete users (Admin only)
- Role-based section assignments for CRs
- User profile viewing and editing
- Email validation and unique constraints

### 🏫 Section & Course Management
- Create and manage academic sections
- Add courses to sections with unique constraints
- Student enrollment management per course
- Bulk student import functionality
- Section-specific data isolation for CRs

### ✅ Attendance System
- **Record Attendance**: CRs can take attendance for their assigned section
- **Multiple Status Types**: Present, Absent, Late, Excused
- **Attendance History**: View past attendance records with filters
- **Statistics Dashboard**: Real-time attendance analytics
- **Edit & Delete**: Update or remove attendance records
- **Date-based Filtering**: Filter by date range, course, section
- **Duplicate Prevention**: One attendance record per section/course/date

### 📢 Announcement & Notification System
- **7 Announcement Types**: 
  - Quiz (1-4)
  - Presentation
  - Midterm Exam
  - Final Exam
  - Assignment
  - Class Cancel
  - Class Reschedule
- **Conditional Fields**: Topic, slide link, time, and room for academic events
- **Email Notifications**: Beautiful HTML email templates sent to enrolled students
- **Copy-to-Clipboard**: Generate formatted text for manual sharing
- **Batch Email Processing**: Efficient email delivery with tracking
- **Advanced Filtering**: Filter by course, section, type, and date
- **Role-Based Creation**: Section restrictions for CRs

### 📊 Reports & Analytics
- **PDF Generation**: Professional attendance reports with PDFKit
- **Bulk Downloads**: ZIP archives of course attendance reports
- **Attendance Statistics**: Present/absent/late/excused percentages
- **Course-wise Analysis**: Per-course attendance tracking
- **Student-wise Reports**: Individual student attendance history

### 🎨 User Interface
- **Modern Design**: Clean, intuitive interface with Shadcn UI components
- **Dark/Light Theme**: Persistent theme preference with next-themes
- **Responsive Layout**: Mobile-first design approach
- **Real-time Updates**: Redux Toolkit Query for efficient data fetching
- **Toast Notifications**: User-friendly feedback with Sonner
- **Error Boundaries**: Graceful error handling throughout the app
- **Loading States**: Skeleton loaders and progress indicators

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime environment |
| **Express.js** | Web application framework |
| **TypeScript** | Type-safe JavaScript |
| **MongoDB** | NoSQL database |
| **Mongoose** | MongoDB ODM with schema validation |
| **JWT** | JSON Web Tokens for authentication |
| **Bcrypt.js** | Password hashing |
| **Joi** | Request validation |
| **PDFKit** | PDF document generation |
| **Nodemailer** | Email sending service |
| **Helmet** | Security headers middleware |
| **CORS** | Cross-origin resource sharing |
| **Morgan** | HTTP request logger |
| **Express Rate Limit** | Rate limiting middleware |
| **Jest** | Testing framework |
| **Supertest** | HTTP assertion library |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI library |
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Build tool and dev server |
| **Tailwind CSS** | Utility-first CSS framework |
| **Redux Toolkit** | State management |
| **RTK Query** | Data fetching and caching |
| **React Router v6** | Client-side routing |
| **React Hook Form** | Form handling |
| **Zod** | Schema validation |
| **Shadcn UI** | Component library |
| **Radix UI** | Headless UI primitives |
| **Lucide React** | Icon library |
| **Sonner** | Toast notifications |
| **Next Themes** | Theme management |
| **date-fns** | Date utility library |
| **Axios** | HTTP client |

### DevOps & Deployment
- **Vercel**: Frontend and backend hosting
- **MongoDB Atlas**: Cloud database hosting
- **Git**: Version control
- **GitHub**: Repository hosting
- **npm**: Package management

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  React Frontend │ ◄─────► │  Express API    │ ◄─────► │   MongoDB       │
│  (Vite + TS)    │   JWT   │  (Node.js + TS) │         │   (Atlas)       │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                           │                           
        │                           │                           
        ▼                           ▼                           
┌─────────────────┐         ┌─────────────────┐               
│  Redux Toolkit  │         │  Nodemailer     │               
│  RTK Query      │         │  Email Service  │               
└─────────────────┘         └─────────────────┘               
```

### Data Flow

1. **Authentication Flow**:
   ```
   User Login → Express API → JWT Generation → Store in Redux & LocalStorage
   → Attach to API Requests → Middleware Verification → Route Access
   ```

2. **Attendance Flow**:
   ```
   CR Selects Course → Fetch Students → Mark Attendance → Validate Data
   → Save to MongoDB → Generate PDF (optional) → Display Statistics
   ```

3. **Announcement Flow**:
   ```
   Create Announcement → Validate Fields → Save to DB → Fetch Student Emails
   → Send Batch Emails → Track Delivery → Return Status
   ```

---

## 📁 Project Structure

```
CR-Attendance-Portal/
├── backend/                          # Backend API (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── controllers/             # Route controllers
│   │   │   ├── announcementController.ts
│   │   │   ├── attendanceController.ts
│   │   │   ├── authController.ts
│   │   │   ├── courseController.ts
│   │   │   ├── sectionController.ts
│   │   │   ├── studentController.ts
│   │   │   └── userController.ts
│   │   ├── middleware/              # Express middleware
│   │   │   ├── auth.ts              # JWT authentication
│   │   │   ├── errorHandler.ts      # Global error handler
│   │   │   ├── validation.ts        # Joi validation
│   │   │   └── notFoundHandler.ts
│   │   ├── models/                  # Mongoose schemas
│   │   │   ├── User.ts
│   │   │   ├── Section.ts
│   │   │   ├── Course.ts
│   │   │   ├── Student.ts
│   │   │   ├── AttendanceRecord.ts
│   │   │   └── Announcement.ts
│   │   ├── routes/                  # API routes
│   │   │   ├── authRoutes.ts
│   │   │   ├── sectionRoutes.ts
│   │   │   ├── courseRoutes.ts
│   │   │   ├── studentRoutes.ts
│   │   │   ├── attendanceRoutes.ts
│   │   │   ├── userRoutes.ts
│   │   │   └── announcementRoutes.ts
│   │   ├── utils/                   # Utility functions
│   │   │   ├── jwt.ts               # JWT helpers
│   │   │   ├── errorHandler.ts      # Error utilities
│   │   │   ├── pdfGenerator.ts      # PDF generation
│   │   │   └── emailService.ts      # Email sending
│   │   ├── config/                  # Configuration
│   │   │   ├── database.ts          # MongoDB connection
│   │   │   └── env.ts               # Environment variables
│   │   ├── scripts/                 # Utility scripts
│   │   │   └── seed.ts              # Database seeding
│   │   ├── __tests__/               # Test files
│   │   │   └── announcement.test.ts
│   │   ├── types/                   # TypeScript types
│   │   │   └── index.ts
│   │   ├── app.ts                   # Express app setup
│   │   └── server.ts                # Server entry point
│   ├── dist/                        # Compiled JavaScript
│   ├── .env                         # Environment variables
│   ├── .env.example                 # Environment template
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── vercel.json                  # Vercel deployment config
│   └── README.md                    # Backend documentation
│
├── frontend/                         # Frontend App (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── ui/                  # Shadcn UI components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   └── ...
│   │   │   ├── announcements/       # Announcement components
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── PrivateRoute.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── pages/                   # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── CRDashboard.tsx
│   │   │   ├── Announcements.tsx
│   │   │   └── AttendanceHistory.tsx
│   │   ├── routes/                  # Route configuration
│   │   │   ├── AuthRoutes.tsx
│   │   │   ├── DashboardRoutes.tsx
│   │   │   ├── AnnouncementsRoutes.tsx
│   │   │   └── index.ts
│   │   ├── context/                 # React Context
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useErrorHandler.ts
│   │   │   └── ...
│   │   ├── lib/                     # Libraries & utilities
│   │   │   ├── apiSlice.ts          # RTK Query API
│   │   │   ├── authSlice.ts         # Auth Redux slice
│   │   │   ├── simpleStore.ts       # Redux store
│   │   │   ├── hooks.ts             # Redux hooks
│   │   │   └── utils.ts             # Helper functions
│   │   ├── types/                   # TypeScript types
│   │   │   └── index.ts
│   │   ├── App.tsx                  # Root component
│   │   ├── main.tsx                 # App entry point
│   │   └── index.css                # Global styles
│   ├── public/                      # Static assets
│   │   └── manifest.json
│   ├── .env                         # Environment variables
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vercel.json                  # Vercel deployment config
│   └── README.md                    # Frontend documentation
│
├── .github/
│   └── copilot-instructions.md      # GitHub Copilot instructions
├── .gitignore
└── README.md                         # This file
```

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (comes with Node.js)
- **MongoDB** >= 6.0 ([Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Git** ([Download](https://git-scm.com/downloads))

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/reduanahmadswe/CR-Attendance-Portal.git
cd CR-Attendance-Portal
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# Required: MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET
```

**Backend Environment Variables** (`.env`):

```env
# Database
MONGO_URI=mongodb://localhost:27017/cr-attendance-portal

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-access-tokens
JWT_REFRESH_SECRET=your-super-secret-refresh-key-for-refresh-tokens
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=4000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Email Configuration (Optional - for announcements)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=noreply@cr-attendance.com
EMAIL_FROM_NAME=CR Attendance Portal
```

```bash
# Seed the database with sample data (optional)
npm run seed

# Start development server
npm run dev
```

Backend will be running at `http://localhost:4000`

#### 3. Frontend Setup

```bash
# Navigate to frontend directory (from root)
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with backend API URL
```

**Frontend Environment Variables** (`.env`):

```env
VITE_API_URL=http://localhost:4000/api
```

```bash
# Start development server
npm run dev
```

Frontend will be running at `http://localhost:5173`

#### 4. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000/api

**Default Login Credentials** (after seeding):

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@admin.com | admin123 |
| CR (CSE-3A) | john.cr@university.edu | cr123456 |
| CR (CSE-3B) | jane.cr@university.edu | cr123456 |

---

## ⚙️ Environment Configuration

### Backend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGO_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | Secret key for access tokens | Yes | - |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | Yes | - |
| `JWT_EXPIRES_IN` | Access token expiration | No | 15m |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | No | 7d |
| `PORT` | Server port | No | 4000 |
| `NODE_ENV` | Environment mode | No | development |
| `FRONTEND_URL` | Frontend URL for CORS | No | http://localhost:5173 |
| `EMAIL_HOST` | SMTP host | No | - |
| `EMAIL_PORT` | SMTP port | No | 587 |
| `EMAIL_SECURE` | Use TLS | No | false |
| `EMAIL_USER` | SMTP username | No | - |
| `EMAIL_PASSWORD` | SMTP password | No | - |
| `EMAIL_FROM` | Sender email address | No | - |
| `EMAIL_FROM_NAME` | Sender name | No | CR Attendance Portal |

### Frontend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API base URL | Yes | http://localhost:4000/api |

---

## 🗄️ Database Models

### User
```typescript
{
  _id: ObjectId,
  name: string,
  email: string (unique),
  passwordHash: string,
  role: 'admin' | 'cr' | 'instructor' | 'viewer',
  sectionId?: ObjectId (required for CR role),
  createdAt: Date,
  updatedAt: Date
}
```

### Section
```typescript
{
  _id: ObjectId,
  name: string (unique),
  code?: string,
  description?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Course
```typescript
{
  _id: ObjectId,
  sectionId: ObjectId → Section,
  name: string,
  code?: string,
  semester?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Student
```typescript
{
  _id: ObjectId,
  studentId: string (unique),
  name: string,
  email: string,
  sectionId: ObjectId → Section,
  courses: ObjectId[] → Course,
  createdAt: Date,
  updatedAt: Date
}
```

### AttendanceRecord
```typescript
{
  _id: ObjectId,
  sectionId: ObjectId → Section,
  courseId: ObjectId → Course,
  date: Date,
  takenBy: ObjectId → User,
  attendees: [{
    studentId: ObjectId → Student,
    status: 'present' | 'absent' | 'late' | 'excused',
    note?: string
  }],
  pdfUrl?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Announcement
```typescript
{
  _id: ObjectId,
  title: string,
  type: 'quiz-1' | 'quiz-2' | 'quiz-3' | 'quiz-4' | 
        'presentation' | 'midterm' | 'final' | 
        'assignment' | 'class_cancel' | 'class_reschedule',
  message?: string,
  courseId: ObjectId → Course,
  sectionId: ObjectId → Section,
  createdBy: ObjectId → User,
  sendEmail: boolean,
  emailSent: boolean,
  emailSentAt?: Date,
  emailRecipients?: string[],
  details?: {
    topic?: string,
    slideLink?: string,
    time?: Date,
    room?: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📚 API Reference

### Base URL
```
Development: http://localhost:4000/api
Production: https://crportal-nu.vercel.app/api
```

### Authentication Endpoints

#### POST `/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "admin@admin.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "Admin User",
      "email": "admin@admin.com",
      "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST `/auth/logout`
Logout current user (requires authentication).

#### GET `/auth/profile`
Get current user profile (requires authentication).

#### PUT `/auth/profile`
Update current user profile (requires authentication).

#### PUT `/auth/change-password`
Change password (requires authentication).

### Section Endpoints

#### GET `/sections`
List all sections (authenticated users).

**Query Parameters:**
- `page` (number): Page number for pagination
- `limit` (number): Items per page

#### POST `/sections`
Create a new section (Admin only).

**Request Body:**
```json
{
  "name": "CSE-3A",
  "code": "CSE3A",
  "description": "Computer Science Engineering Section A"
}
```

#### GET `/sections/:id`
Get section details by ID.

#### PUT `/sections/:id`
Update section (Admin only).

#### DELETE `/sections/:id`
Delete section (Admin only).

#### GET `/sections/:sectionId/courses`
Get all courses in a section.

#### POST `/sections/:sectionId/courses`
Add a course to a section (Admin only).

#### GET `/sections/:sectionId/students`
Get all students in a section.

#### POST `/sections/:sectionId/students`
Add a student to a section (Admin only).

#### POST `/sections/:sectionId/students/batch`
Bulk add students to a section (Admin only).

### Attendance Endpoints

#### POST `/attendance`
Create an attendance record (CR/Admin/Instructor).

**Request Body:**
```json
{
  "sectionId": "507f1f77bcf86cd799439011",
  "courseId": "507f1f77bcf86cd799439012",
  "date": "2025-11-05",
  "attendees": [
    {
      "studentId": "507f1f77bcf86cd799439013",
      "status": "present"
    },
    {
      "studentId": "507f1f77bcf86cd799439014",
      "status": "absent",
      "note": "Sick leave"
    }
  ]
}
```

#### GET `/attendance`
List attendance records with filters.

**Query Parameters:**
- `sectionId` (string): Filter by section
- `courseId` (string): Filter by course
- `from` (date): Start date
- `to` (date): End date
- `page` (number): Page number
- `limit` (number): Items per page

#### GET `/attendance/stats`
Get attendance statistics.

**Query Parameters:**
- `sectionId` (string): Filter by section
- `courseId` (string): Filter by course
- `from` (date): Start date
- `to` (date): End date

#### GET `/attendance/:id`
Get attendance record by ID.

#### PUT `/attendance/:id`
Update attendance record (Creator/Admin).

#### DELETE `/attendance/:id`
Delete attendance record (Creator/Admin).

#### GET `/attendance/:id/pdf`
Download attendance PDF report.

#### GET `/attendance/course/:courseId/zip`
Download all attendance records for a course as ZIP.

### Announcement Endpoints

#### POST `/announcements`
Create an announcement (CR/Admin/Instructor).

**Request Body (Quiz/Exam/Assignment):**
```json
{
  "title": "Quiz 1 - Data Structures",
  "type": "quiz-1",
  "message": "Quiz will cover arrays and linked lists",
  "courseId": "507f1f77bcf86cd799439011",
  "sendEmail": true,
  "topic": "Arrays and Linked Lists",
  "slideLink": "https://drive.google.com/slides/xyz",
  "time": "2025-11-10T10:00:00Z",
  "room": "Room 301"
}
```

**Request Body (Class Cancel/Reschedule):**
```json
{
  "title": "Class Cancelled - Nov 5",
  "type": "class_cancel",
  "message": "Due to university event",
  "courseId": "507f1f77bcf86cd799439011",
  "sendEmail": true
}
```

#### GET `/announcements`
List announcements with filters.

**Query Parameters:**
- `courseId` (string): Filter by course
- `sectionId` (string): Filter by section
- `type` (string): Filter by announcement type
- `page` (number): Page number
- `limit` (number): Items per page

#### GET `/announcements/stats`
Get announcement statistics.

#### GET `/announcements/:id`
Get announcement by ID.

#### PUT `/announcements/:id`
Update announcement (Creator/Admin).

#### DELETE `/announcements/:id`
Delete announcement (Creator/Admin).

### User Management Endpoints (Admin Only)

#### GET `/users`
List all users.

#### POST `/users`
Create a new user.

#### GET `/users/:id`
Get user by ID.

#### PUT `/users/:id`
Update user.

#### DELETE `/users/:id`
Delete user.

---

## 👥 User Roles & Permissions

### Admin
- **Full System Access**: Complete control over all features
- **User Management**: Create, edit, delete users
- **Section Management**: Create, edit, delete sections
- **Course Management**: Create, edit, delete courses
- **Student Management**: Add, edit, remove students
- **Attendance**: View all attendance records
- **Announcements**: Create and manage all announcements
- **Reports**: Access all reports and analytics

### CR (Class Representative)
- **Section-Specific Access**: Limited to assigned section only
- **Attendance Management**: Take, edit, delete attendance for their section
- **Announcements**: Create announcements for their section courses
- **Reports**: View and download attendance reports for their section
- **Student View**: View students in their section
- **Course View**: View courses in their section

### Instructor
- **Multi-Section Access**: Can access multiple sections
- **Attendance View**: View attendance records
- **Announcements**: Create announcements for any section
- **Reports**: View attendance reports

### Viewer
- **Read-Only Access**: View-only permissions
- **Attendance View**: View attendance records
- **Reports**: View reports but cannot modify

---

## 📢 Announcement System

The announcement system allows CRs and Instructors to notify students about important academic events.

### Announcement Types

1. **Quiz (1-4)**: Quiz announcements with topic, time, room, slides
2. **Presentation**: Student presentation schedules
3. **Midterm Exam**: Midterm examination details
4. **Final Exam**: Final examination details
5. **Assignment**: Assignment deadlines and details
6. **Class Cancel**: Class cancellation notifications
7. **Class Reschedule**: Class rescheduling information

### Email Features

- **Beautiful HTML Templates**: Professional email design
- **Batch Processing**: Efficient email delivery (10 per batch)
- **Delivery Tracking**: Track email sent status
- **Error Handling**: Robust error handling and logging
- **Student Filtering**: Only enrolled students receive emails

### Copy Text Feature

When `sendEmail: false`, the API returns a formatted text message that can be copied and shared via:
- WhatsApp
- Telegram
- SMS
- Any messaging platform

### Usage Example

```bash
POST /api/announcements
Authorization: Bearer <token>

{
  "title": "Quiz 2 - Algorithms",
  "type": "quiz-2",
  "courseId": "...",
  "sendEmail": true,
  "topic": "Sorting and Searching",
  "time": "2025-11-15T14:00:00Z",
  "room": "Lab 201"
}
```

For detailed documentation, see: [backend/ANNOUNCEMENT_MODULE.md](backend/ANNOUNCEMENT_MODULE.md)

---

## 🚀 Deployment

### Backend Deployment (Vercel)

1. **Push code to GitHub**

2. **Import project to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Set **Root Directory** to `backend`

3. **Configure Environment Variables** in Vercel:
   ```
   NODE_ENV=production
   MONGO_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=your-production-jwt-secret
   JWT_REFRESH_SECRET=your-production-refresh-secret
   FRONTEND_URL=https://your-frontend-url.vercel.app
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

4. **Deploy**: Vercel will automatically deploy

**Backend URL**: `https://your-backend.vercel.app`

### Frontend Deployment (Vercel)

1. **Update API URL** in frontend `.env`:
   ```env
   VITE_API_URL=https://your-backend.vercel.app/api
   ```

2. **Import project to Vercel**:
   - Select your GitHub repository
   - Set **Root Directory** to `frontend`
   - Framework Preset: Vite

3. **Configure Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Add Environment Variable**:
   ```
   VITE_API_URL=https://your-backend.vercel.app/api
   ```

5. **Deploy**: Vercel will automatically deploy

**Frontend URL**: `https://your-frontend.vercel.app`

### MongoDB Atlas Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Add database user with password
4. Whitelist IP addresses (0.0.0.0/0 for all IPs)
5. Get connection string and update `MONGO_URI`

For detailed deployment guide, see: [backend/DEPLOY.md](backend/DEPLOY.md)

---

## 🧪 Testing

### Backend Testing

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Test Coverage**:
- Authentication tests
- Announcement API tests (20+ test cases)
- Attendance controller tests
- Validation middleware tests
- Error handling tests

### Frontend Testing

```bash
cd frontend

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the existing code style
   - Write tests for new features
   - Update documentation

4. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```

5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**

### Code Style Guidelines

- Use TypeScript for all new code
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful commit messages
- Document complex logic with comments
- Add JSDoc comments for functions

---

## 🔒 Security

### Best Practices Implemented

- ✅ **Password Hashing**: Bcrypt with 12 salt rounds
- ✅ **JWT Authentication**: Access and refresh token pattern
- ✅ **Input Validation**: Joi schema validation
- ✅ **SQL Injection Prevention**: Mongoose ODM with parameterized queries
- ✅ **XSS Protection**: Helmet middleware
- ✅ **CORS Configuration**: Restricted to frontend domain
- ✅ **Rate Limiting**: Express rate limiter
- ✅ **Secure Headers**: Helmet security headers
- ✅ **Environment Variables**: Sensitive data in .env files
- ✅ **HTTPS**: Enforced in production
- ✅ **Error Handling**: No sensitive data in error responses

### Security Recommendations

- Change default credentials immediately
- Use strong JWT secrets (32+ characters)
- Enable MongoDB authentication
- Use HTTPS in production
- Keep dependencies updated
- Regular security audits
- Enable MongoDB Atlas IP whitelisting
- Use environment variables for all secrets
- Enable 2FA for admin accounts (future feature)

---

## 📝 Available Scripts

### Backend Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |
| `npm run lint` | Lint TypeScript files |
| `npm run lint:fix` | Lint and fix issues |
| `npm run format` | Format code with Prettier |
| `npm run seed` | Seed database with sample data |

### Frontend Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Lint code |
| `npm run lint:fix` | Lint and fix issues |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Run TypeScript type checking |

---

## 📖 Documentation

- [Backend README](backend/README.md) - Backend API documentation
- [Frontend README](frontend/README.md) - Frontend documentation
- [Announcement Module](backend/ANNOUNCEMENT_MODULE.md) - Announcement system guide
- [API Testing Guide](backend/ANNOUNCEMENT_API_TESTING.md) - Postman API testing
- [Quick Start Guide](backend/QUICK_START.md) - Quick start for announcements
- [Deployment Guide](backend/DEPLOY.md) - Deployment instructions
- [Implementation Report](backend/COMPLETE_IMPLEMENTATION_REPORT.md) - Feature implementation details

---

## 🐛 Known Issues

- PDF generation may be slow for large attendance records
- Email delivery may fail with invalid SMTP credentials
- Dark theme may have contrast issues in some components

---

## 🛣️ Roadmap

### Version 1.1 (Q1 2026) - Enhanced Attendance & Analytics
- [ ] **Student Self-Service Portal**
  - View personal attendance records
  - Download attendance certificates
  - Request leave applications
  - View course schedule and announcements
- [ ] **Biometric Attendance Integration**
  - Fingerprint scanner support
  - Face recognition integration
  - RFID card reader support
- [ ] **QR Code Attendance System**
  - Generate unique QR codes per class session
  - Student mobile app for QR scanning
  - Real-time attendance marking
  - Anti-fraud measures (location verification)
- [ ] **Advanced Analytics Dashboard**
  - Attendance trends and patterns
  - Course-wise comparison charts
  - Student performance predictions
  - Export reports in multiple formats
- [ ] **Excel/CSV Import/Export**
  - Bulk student data import
  - Attendance report export
  - Custom report templates
  - Data backup and restore

### Version 1.2 (Q2 2026) - Communication & Integration
- [ ] **Real-Time Notifications (WebSocket)**
  - Live attendance updates
  - Instant announcement broadcasting
  - Desktop and mobile push notifications
  - Notification preferences management
- [ ] **Mobile App (React Native)**
  - iOS and Android support
  - Offline attendance mode
  - Biometric authentication
  - Push notifications
  - QR code scanner
- [ ] **Parent/Guardian Portal**
  - Real-time attendance monitoring
  - Email/SMS attendance alerts
  - Academic progress tracking
  - Communication with CRs/teachers
- [ ] **Automated Attendance Reminders**
  - Daily attendance reminder emails
  - Low attendance warnings (< 75%)
  - Weekly attendance summary
  - Customizable alert thresholds
- [ ] **Multi-Language Support (i18n)**
  - Bengali (বাংলা)
  - English
  - Arabic (العربية)
  - Language preference per user

### Version 1.3 (Q3 2026) - Academic Management
- [ ] **Leave Management System**
  - Student leave applications
  - Medical/casual/emergency leave types
  - Approval workflow (CR → Instructor → Admin)
  - Leave balance tracking
  - Document attachment support
- [ ] **Timetable Management**
  - Class schedule creation
  - Room allocation
  - Teacher assignment
  - Conflict detection
  - Calendar integration (Google/Outlook)
- [ ] **Grade Management Integration**
  - Quiz, assignment, exam marks entry
  - Attendance impact on grades (configurable %)
  - Grade calculation and CGPA
  - Transcript generation
  - Performance analytics
- [ ] **Course Material Repository**
  - Lecture notes upload/download
  - Assignment submission portal
  - Resource categorization
  - Version control for materials
  - File preview support

### Version 1.4 (Q4 2026) - Advanced Features
- [ ] **AI-Powered Features**
  - Attendance pattern analysis
  - At-risk student identification
  - Optimal class timing recommendations
  - Automated attendance prediction
  - Chatbot for common queries
- [ ] **Video Lecture Integration**
  - Record and upload lectures
  - Video playback tracking
  - Attendance based on video completion
  - Live class integration (Zoom/Teams)
- [ ] **Examination Management**
  - Exam schedule creation
  - Seating arrangement
  - Hall ticket generation
  - Invigilator assignment
  - Result publication
- [ ] **Financial Integration**
  - Attendance-based scholarship tracking
  - Fee payment status integration
  - Penalty for low attendance
  - Financial reports
- [ ] **Advanced Security**
  - Two-factor authentication (2FA)
  - Biometric login
  - IP whitelisting
  - Audit logs and activity tracking
  - Role-based data encryption
  - GDPR compliance features

### Version 2.0 (2027) - Enterprise Features
- [ ] **Multi-Institution Support**
  - Multiple university/college management
  - Department-wise isolation
  - Centralized admin dashboard
  - Cross-institution reporting
- [ ] **API Marketplace**
  - Public REST API
  - GraphQL API
  - Webhook support
  - Third-party integrations
  - API documentation portal
- [ ] **Advanced Reporting Engine**
  - Custom report builder
  - Scheduled report generation
  - Data visualization tools
  - Export to multiple formats (PDF, Excel, CSV, JSON)
  - Report sharing and collaboration
- [ ] **Learning Management System (LMS) Integration**
  - Moodle integration
  - Canvas LMS integration
  - Blackboard integration
  - SCORM compliance
- [ ] **Blockchain Integration**
  - Immutable attendance records
  - Digital certificates
  - Transcript verification
  - Academic credential verification
- [ ] **Smart Classroom Integration**
  - IoT device integration
  - Automatic attendance via smart cameras
  - Occupancy detection
  - Environmental monitoring
- [ ] **Geofencing & GPS Tracking**
  - Location-based attendance
  - Campus boundary enforcement
  - Outdoor class support
  - Field trip attendance

### Version 2.1+ (Beyond 2027) - Future Innovation
- [ ] **Virtual Reality (VR) Classroom**
  - VR attendance tracking
  - Immersive learning experiences
  - Virtual lab sessions
- [ ] **Augmented Reality (AR) Features**
  - AR-based campus navigation
  - Interactive course materials
  - AR attendance verification
- [ ] **Machine Learning Insights**
  - Predictive analytics for student success
  - Personalized learning recommendations
  - Automated intervention systems
  - Dropout risk prediction
- [ ] **Social Learning Features**
  - Study groups formation
  - Peer-to-peer tutoring marketplace
  - Discussion forums
  - Knowledge sharing platform
- [ ] **Gamification**
  - Attendance streaks and badges
  - Leaderboards
  - Reward points system
  - Achievement certificates

---

## 📞 Support

For support, please:
- Open an issue on [GitHub](https://github.com/reduanahmadswe/CR-Attendance-Portal/issues)
- Email: reduanahmadswe@gmail.com

---

## 👨‍💻 Authors

- **Reduan Ahmad** - *Initial work* - [@reduanahmadswe](https://github.com/reduanahmadswe)

---

## 🙏 Acknowledgments

- [Shadcn UI](https://ui.shadcn.com/) for beautiful React components
- [Vercel](https://vercel.com) for hosting platform
- [MongoDB](https://www.mongodb.com/) for database
- [Express.js](https://expressjs.com/) for backend framework
- [React](https://react.dev/) for frontend library
- [Tailwind CSS](https://tailwindcss.com/) for styling

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📊 Project Statistics

- **Total Lines of Code**: ~15,000+
- **Backend Endpoints**: 40+
- **Frontend Components**: 50+
- **Database Models**: 6
- **Test Cases**: 20+
- **Dependencies**: 60+

---

<div align="center">

**Made with ❤️ by [Reduan Ahmad](https://github.com/reduanahmadswe)**

⭐ Star this repository if you find it helpful!

</div>
