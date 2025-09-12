<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# CR Attendance Portal - Copilot Instructions

This is a full-stack CR Attendance Portal built with React TypeScript frontend and Node.js Express TypeScript backend.

## Project Structure

```
cr-attendance-portal/
├── frontend/          # React + TypeScript + Vite + Tailwind + Redux Toolkit
├── backend/           # Node.js + Express + TypeScript + MongoDB
├── shared/            # Shared types and utilities
└── docs/              # Documentation
```

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Redux Toolkit, RTK Query
- **Backend**: Node.js, Express, TypeScript, MongoDB, Mongoose
- **Authentication**: JWT with role-based access control (admin/cr)
- **PDF Generation**: jsPDF or puppeteer for attendance reports
- **Testing**: Jest, React Testing Library, Supertest
- **Deployment**: Vercel (frontend), Railway/Render (backend), MongoDB Atlas

## Key Features

1. Admin can manage sections, courses, and students
2. Class Representatives (CR) can take attendance for their assigned section only
3. Attendance records are stored in MongoDB and can be exported as PDF
4. Role-based authentication with JWT tokens
5. Mobile-responsive UI design

## User Roles

- **Admin**: Full access to manage sections, courses, students, and view all attendance
- **CR**: Can only take attendance for their assigned section
- **Viewer**: Read-only access to attendance reports (optional)

## Development Guidelines

- Follow TypeScript strict mode
- Use consistent naming conventions (camelCase for variables, PascalCase for components)
- Implement proper error handling and validation
- Write tests for critical functionality
- Follow the specified API contract from documentation
- Ensure CRs can only access their own section data
- Use RTK Query for API state management on frontend
- Implement proper authentication middleware on backend routes

## Security Considerations

- JWT tokens with access/refresh token pattern
- Role-based access control on all routes
- Input validation and sanitization
- Password hashing with bcrypt
- CORS configuration for frontend domain
