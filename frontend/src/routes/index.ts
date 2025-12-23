// Route path constants
export const ROUTES = {
    // Authentication
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        FORGOT_PASSWORD: '/forgot-password',
        RESET_PASSWORD: '/reset-password',
    },

    // Dashboard
    DASHBOARD: {
        ADMIN: '/dashboard/admin',
        CR: '/dashboard/cr',
        STUDENT: '/dashboard/student',
    },

    // Reports
    REPORTS: {
        ATTENDANCE_HISTORY: '/reports/attendance-history',
        ATTENDANCE_SUMMARY: '/reports/attendance-summary',
        STUDENT_REPORTS: '/reports/students',
    },

    // Announcements
    ANNOUNCEMENTS: {
        LIST: '/announcements',
    },

    // Management
    MANAGEMENT: {
        SECTIONS: '/management/sections',
        COURSES: '/management/courses',
        STUDENTS: '/management/students',
        USERS: '/management/users',
    },

    // Settings
    SETTINGS: {
        PROFILE: '/settings/profile',
        PREFERENCES: '/settings/preferences',
        SECURITY: '/settings/security',
    },

    // Legacy routes (for backward compatibility)
    LEGACY: {
        LOGIN: '/login',
        ADMIN: '/admin',
        ADMIN_DASHBOARD: '/admin-dashboard',
        CR: '/cr',
        CR_DASHBOARD: '/cr-dashboard',
        ATTENDANCE_HISTORY: '/attendance-history',
        ATTENDANCE: '/attendance',
    },
} as const;

// Helper function to get route by role
export const getDashboardRoute = (role: string): string => {
    console.log('[ROUTES] Getting dashboard route for role:', role);

    switch (role?.toLowerCase()) {
        case 'admin':
            console.log('[ROUTES] Redirecting to admin dashboard');
            return ROUTES.DASHBOARD.ADMIN;
        case 'cr':
            console.log('[ROUTES] Redirecting to CR dashboard');
            return ROUTES.DASHBOARD.CR;
        case 'student':
            console.log('[ROUTES] Redirecting to student dashboard');
            return ROUTES.DASHBOARD.STUDENT;
        case 'instructor':
        case 'teacher':
            // Future instructor role support
            console.log('[ROUTES] Redirecting instructor to student dashboard (fallback)');
            return ROUTES.DASHBOARD.STUDENT;
        default:
            console.warn('[ROUTES] Unknown role:', role, '- redirecting to login');
            return ROUTES.AUTH.LOGIN;
    }
};

// Helper function to check if route requires authentication
export const isProtectedRoute = (pathname: string): boolean => {
    const protectedPaths = [
        '/dashboard',
        '/reports',
        '/management',
        '/settings',
    ];

    return protectedPaths.some(path => pathname.startsWith(path));
};

// Helper function to check if route requires specific role
export const getRequiredRole = (pathname: string): string | null => {
    console.log('[ROUTES] Checking required role for path:', pathname);

    // Admin-only routes
    if (pathname.startsWith('/dashboard/admin') ||
        pathname.startsWith('/management') ||
        pathname === ROUTES.REPORTS.ATTENDANCE_HISTORY ||
        pathname === ROUTES.REPORTS.ATTENDANCE_SUMMARY ||
        pathname === ROUTES.REPORTS.STUDENT_REPORTS) {
        console.log('[ROUTES] Admin role required for:', pathname);
        return 'admin';
    }

    // CR-only routes
    if (pathname.startsWith('/dashboard/cr')) {
        console.log('[ROUTES] CR role required for:', pathname);
        return 'cr';
    }

    // Student-only routes
    if (pathname.startsWith('/dashboard/student')) {
        console.log('[ROUTES] Student role required for:', pathname);
        return 'student';
    }

    console.log('[ROUTES] No specific role required for:', pathname);
    return null;
};

// Helper function to validate user role
export const isValidRole = (role: string): boolean => {
    const validRoles = ['admin', 'cr', 'student', 'instructor', 'teacher'];
    return validRoles.includes(role?.toLowerCase());
};

// Helper function to check if user can access a specific route
export const canAccessRoute = (userRole: string, pathname: string): boolean => {
    console.log('[ROUTES] Checking access for role:', userRole, 'path:', pathname);

    if (!userRole || !isValidRole(userRole)) {
        console.warn('[ROUTES] Invalid user role:', userRole);
        return false;
    }

    const requiredRole = getRequiredRole(pathname);

    // If no specific role required, allow access to authenticated users
    if (!requiredRole) {
        console.log('[ROUTES] Access granted - no specific role required');
        return true;
    }

    // Check if user has required role
    const hasAccess = userRole.toLowerCase() === requiredRole.toLowerCase();
    console.log('[ROUTES] Access check result:', hasAccess);
    return hasAccess;
};

// Helper function to get user-friendly route names
export const getRouteDisplayName = (pathname: string): string => {
    const routeNames: Record<string, string> = {
        [ROUTES.AUTH.LOGIN]: 'Login',
        [ROUTES.DASHBOARD.ADMIN]: 'Admin Dashboard',
        [ROUTES.DASHBOARD.CR]: 'CR Dashboard',
        [ROUTES.DASHBOARD.STUDENT]: 'Student Dashboard',
        [ROUTES.REPORTS.ATTENDANCE_HISTORY]: 'Attendance History',
        [ROUTES.REPORTS.ATTENDANCE_SUMMARY]: 'Attendance Summary',
        [ROUTES.REPORTS.STUDENT_REPORTS]: 'Student Reports',
        [ROUTES.MANAGEMENT.SECTIONS]: 'Section Management',
        [ROUTES.MANAGEMENT.COURSES]: 'Course Management',
        [ROUTES.MANAGEMENT.STUDENTS]: 'Student Management',
        [ROUTES.MANAGEMENT.USERS]: 'User Management',
        [ROUTES.SETTINGS.PROFILE]: 'Profile Settings',
        [ROUTES.SETTINGS.PREFERENCES]: 'Preferences',
        [ROUTES.SETTINGS.SECURITY]: 'Security Settings',
    };

    return routeNames[pathname] || pathname;
};