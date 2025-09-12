// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

// Auth types
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    sectionId?: string;
    iat?: number;
    exp?: number;
}

export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'cr' | 'instructor' | 'viewer';
    sectionId?: {
        _id: string;
        name: string;
        code?: string;
    } | string;
    createdAt: string;
    updatedAt: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    accessToken: string;
}

export interface Section {
    _id: string;
    name: string;
    code?: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSectionRequest {
    name: string;
    code?: string;
    description?: string;
}

export interface Course {
    _id: string;
    sectionId: string;
    name: string;
    code?: string;
    semester?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCourseRequest {
    sectionId: string;
    name: string;
    code?: string;
    semester?: string;
}

export interface Student {
    _id: string;
    studentId: string;
    name: string;
    email: string;
    sectionId: string;
    courses: string[] | Course[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateStudentRequest {
    studentId: string;
    name: string;
    email: string;
    sectionId: string;
    courses: string[];
}

export interface Attendee {
    studentId: string | Student;
    status: 'present' | 'absent' | 'late' | 'excused';
    note?: string;
}

export interface AttendanceRecord {
    _id: string;
    sectionId: string | Section;
    courseId: string | Course;
    date: string;
    takenBy: string | User;
    attendees: Attendee[];
    pdfUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAttendanceRequest {
    sectionId: string;
    courseId: string;
    date: string;
    attendees: {
        studentId: string;
        status: 'present' | 'absent' | 'late' | 'excused';
        note?: string;
    }[];
}

// Query types
export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface AttendanceFilters extends PaginationQuery {
    sectionId?: string;
    courseId?: string;
    from?: string;
    to?: string;
    takenBy?: string;
}

// Statistics types
export interface AttendanceStats {
    totalRecords: number;
    statusBreakdown: {
        _id: string;
        count: number;
    }[];
}