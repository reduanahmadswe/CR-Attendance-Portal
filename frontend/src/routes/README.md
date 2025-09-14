# Frontend Routing Structure

This document outlines the organized routing structure for the CR Attendance Portal frontend.

## 📁 Route Organization

The routing system has been reorganized into logical modules for better maintainability:

```
src/routes/
├── index.ts              # Route constants and helper functions
├── AuthRoutes.tsx        # Authentication-related routes
├── DashboardRoutes.tsx   # Role-based dashboard routes
├── ReportsRoutes.tsx     # Reports and analytics routes
├── ManagementRoutes.tsx  # Admin management routes (future)
└── SettingsRoutes.tsx    # User settings routes (future)
```

## 🛣️ Route Structure

### Authentication Routes

- `/auth/login` - User login page
- `/login` → redirects to `/auth/login` (legacy support)

### Dashboard Routes

- `/dashboard/admin` - Admin dashboard (requires admin role)
- `/dashboard/cr` - Class Representative dashboard (requires cr role)
- `/dashboard/student` - Student dashboard (future, requires student role)

### Reports Routes

- `/reports/attendance-history` - Attendance history and analytics (admin only)
- `/reports/attendance-summary` - Summary reports (future)
- `/reports/students` - Student reports (future)

### Management Routes (Future)

- `/management/sections` - Section management
- `/management/courses` - Course management
- `/management/students` - Student management
- `/management/users` - User management

### Settings Routes (Future)

- `/settings/profile` - User profile settings
- `/settings/preferences` - User preferences
- `/settings/security` - Security settings

## 🔄 Legacy Route Redirects

For backward compatibility, all old routes automatically redirect to new ones:

| Legacy Route          | New Route                     |
| --------------------- | ----------------------------- |
| `/login`              | `/auth/login`                 |
| `/admin`              | `/dashboard/admin`            |
| `/admin-dashboard`    | `/dashboard/admin`            |
| `/cr`                 | `/dashboard/cr`               |
| `/cr-dashboard`       | `/dashboard/cr`               |
| `/attendance-history` | `/reports/attendance-history` |
| `/attendance`         | `/reports/attendance-history` |

## 🔧 Helper Functions

### `getDashboardRoute(role: string)`

Returns the appropriate dashboard route based on user role:

- `admin` → `/dashboard/admin`
- `cr` → `/dashboard/cr`
- `student` → `/dashboard/student`
- other → `/auth/login`

### `isProtectedRoute(pathname: string)`

Checks if a route requires authentication.

### `getRequiredRole(pathname: string)`

Returns the required role for a specific route or `null` if any authenticated user can access.

## 📋 Usage Examples

### In Components

```tsx
import { ROUTES, getDashboardRoute } from '@/routes'

// Navigate to role-based dashboard
const dashboardRoute = getDashboardRoute(user.role)
navigate(dashboardRoute)

// Use route constants
navigate(ROUTES.AUTH.LOGIN)
navigate(ROUTES.REPORTS.ATTENDANCE_HISTORY)
```

### In Route Protection

```tsx
import { getRequiredRole } from '@/routes'

const requiredRole = getRequiredRole(location.pathname)
if (requiredRole && user?.role !== requiredRole) {
  // Redirect to appropriate dashboard
}
```

## 🎯 Benefits

1. **Better Organization**: Routes are logically grouped by functionality
2. **Maintainability**: Easy to add new routes and modify existing ones
3. **Type Safety**: Route constants prevent typos and provide IntelliSense
4. **Backward Compatibility**: Legacy routes still work via redirects
5. **Scalability**: Easy to add new route groups for future features
6. **Consistency**: Standardized route naming convention

## 🚀 Future Enhancements

- Route-based code splitting for better performance
- Route guards with permission-based access
- Breadcrumb generation from route structure
- Dynamic route loading based on user permissions
- Route analytics and navigation tracking
