# CR Attendance Portal - Backend

A comprehensive Node.js Express TypeScript backend for managing class attendance through Class Representatives (CR).

## Features

- **Authentication & Authorization**
  - JWT-based authentication with access/refresh tokens
  - Role-based access control (Admin, CR, Instructor, Viewer)
  - Secure password hashing with bcrypt

- **User Management**
  - Admin can manage users (CRUD operations)
  - Role-based section assignments for CRs
  - Profile management and password changes

- **Section & Course Management**
  - Create and manage sections
  - Add courses to sections
  - Student enrollment management

- **Attendance System**
  - CRs can take attendance for their assigned section only
  - Support for different attendance statuses (Present, Absent, Late, Excused)
  - Attendance history and statistics
  - Update and delete attendance records

- **PDF Generation**
  - Generate professional PDF reports for attendance
  - Download and stream PDF functionality
  - Detailed attendance summaries with statistics

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **PDF Generation**: Puppeteer
- **Security**: Helmet, CORS, Rate limiting
- **Testing**: Jest, Supertest

## Project Structure

```
backend/
├── src/
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Authentication, validation, etc.
│   ├── models/            # Mongoose models
│   ├── routes/            # Express routes
│   ├── scripts/           # Utility scripts (seeding, etc.)
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── server.ts          # Main server file
├── tests/                 # Test files
├── dist/                  # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── .env.example
```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database
MONGO_URI=mongodb://localhost:27017/cr-attendance-portal

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-for-access-tokens
JWT_REFRESH_SECRET=your-super-secret-refresh-key-for-refresh-tokens
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=4000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

## Installation & Setup

1. **Clone the repository and navigate to backend**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Start MongoDB**
   - Make sure MongoDB is running on your system
   - Or use MongoDB Atlas for cloud database

5. **Seed the database (optional)**

   ```bash
   npm run seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:4000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Lint TypeScript files
- `npm run lint:fix` - Lint and fix TypeScript files
- `npm run format` - Format code with Prettier
- `npm run seed` - Seed database with sample data

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Sections

- `GET /api/sections` - List sections
- `POST /api/sections` - Create section (Admin only)
- `GET /api/sections/:id` - Get section details
- `PUT /api/sections/:id` - Update section (Admin only)
- `DELETE /api/sections/:id` - Delete section (Admin only)
- `GET /api/sections/:sectionId/courses` - Get section courses
- `POST /api/sections/:sectionId/courses` - Add course to section (Admin only)
- `GET /api/sections/:sectionId/students` - Get section students
- `POST /api/sections/:sectionId/students` - Add student to section (Admin only)
- `POST /api/sections/:sectionId/students/batch` - Bulk add students (Admin only)

### Students

- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student (Admin only)
- `DELETE /api/students/:id` - Delete student (Admin only)
- `POST /api/students/:id/courses` - Add student to courses (Admin only)
- `DELETE /api/students/:id/courses` - Remove student from courses (Admin only)

### Courses

- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course (Admin only)
- `DELETE /api/courses/:id` - Delete course (Admin only)

### Attendance

- `POST /api/attendance` - Create attendance record
- `GET /api/attendance` - List attendance records (with filters)
- `GET /api/attendance/stats` - Get attendance statistics
- `GET /api/attendance/:id` - Get attendance record details
- `PUT /api/attendance/:id` - Update attendance record
- `DELETE /api/attendance/:id` - Delete attendance record
- `GET /api/attendance/:id/pdf` - Stream attendance PDF
- `GET /api/attendance/:id/download` - Download attendance PDF

### Users (Admin only)

- `POST /api/users` - Create user
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/reset-password` - Reset user password

## Sample Data

The seed script creates:

**Admin Account:**

- Email: `admin@university.edu`
- Password: `admin123`

**CR Accounts:**

- John Doe (`john.cr@university.edu`) - Section: CSE-3A - Password: `cr123`
- Jane Smith (`jane.cr@university.edu`) - Section: CSE-3B - Password: `cr123`

**Sections:**

- CSE-3A (Computer Science Engineering Section A - 3rd Year)
- CSE-3B (Computer Science Engineering Section B - 3rd Year)
- EEE-2A (Electrical and Electronics Engineering Section A - 2nd Year)

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents brute force attacks
- **CORS Protection**: Configured for specific frontend domains
- **Helmet**: Security headers for Express
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Joi schema validation
- **Role-based Access**: Section-specific data access for CRs

## Error Handling

The API uses consistent error responses with the following structure:

```json
{
  "success": false,
  "error": "Error message description",
  "stack": "Error stack trace (development only)"
}
```

## Success Response Format

All successful API responses follow this format:

```json
{
  "success": true,
  "data": "Response data",
  "message": "Optional success message"
}
```

## Pagination

List endpoints support pagination with the following query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - Field to sort by
- `sortOrder` - Sort direction (asc/desc)

## Development Guidelines

1. **Code Style**: Follow TypeScript strict mode
2. **Error Handling**: Use asyncHandler wrapper for async routes
3. **Validation**: Validate all inputs using Joi schemas
4. **Security**: Always check user permissions for data access
5. **Testing**: Write tests for new features
6. **Documentation**: Update API documentation for new endpoints

## Testing

Run tests with:

```bash
npm test
```

The test suite includes:

- Unit tests for controllers and utilities
- Integration tests for API endpoints
- Authentication and authorization tests

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables for Production

- Set `NODE_ENV=production`
- Use strong, unique JWT secrets
- Configure MongoDB Atlas or production database
- Set appropriate CORS origins
- Enable SSL/HTTPS

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 4000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details
