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
    role: 'admin' | 'cr' | 'instructor' | 'viewer' | 'student';
    sectionId?: {
        _id: string;
        name: string;
        code?: string;
    } | string;
    studentId?: string; // For student role
    isPasswordDefault?: boolean; // For student role - indicates if password needs to be changed
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
// Announcement types
export type AnnouncementType = 'quiz-1' | 'quiz-2' | 'quiz-3' | 'quiz-4' | 'presentation' | 'midterm' | 'final' | 'assignment' | 'class_cancel' | 'class_reschedule';

export interface AnnouncementDetails {
    topic?: string;
    slideLink?: string;
    time?: string;
    room?: string;
}

export interface Announcement {
    _id: string;
    title: string;
    type: AnnouncementType;
    message?: string;
    courseId: string | Course;
    sectionId: string | Section;
    createdBy: string | User;
    sendEmail: boolean;
    emailSent: boolean;
    emailSentAt?: string;
    emailRecipients?: string[];
    details?: AnnouncementDetails;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAnnouncementRequest {
    title: string;
    type: AnnouncementType;
    message?: string;
    courseId: string;
    sendEmail: boolean;
    details?: {
        topic?: string;
        slideLink?: string;
        time?: string;
        room?: string;
    };
}

export interface UpdateAnnouncementRequest {
    title?: string;
    type?: AnnouncementType;
    message?: string;
    courseId?: string;
    details?: {
        topic?: string;
        slideLink?: string;
        time?: string;
        room?: string;
    };
}

export interface AnnouncementFilters extends PaginationQuery {
    courseId?: string;
    sectionId?: string;
    type?: AnnouncementType;
}

export interface AnnouncementStats {
    total: number;
    byType: {
        _id: AnnouncementType;
        count: number;
        emailsSent: number;
    }[];
}

// QR Code Attendance types
export interface Location {
    latitude: number;
    longitude: number;
    accuracy?: number;
    radius?: number;
}

export interface AttendedStudent {
    studentId: string | Student;
    scannedAt: string;
    location?: Location;
    deviceInfo?: string;
}

export interface AttendanceSession {
    _id: string;
    sessionId: string;
    sectionId: string | Section;
    courseId: string | Course;
    date: string;
    startTime: string;
    endTime: string;
    qrCode: string;
    qrCodeData: string;
    location?: Location;
    expiresAt: string;
    isActive: boolean;
    createdBy: string | User;
    attendedStudents: AttendedStudent[];
    maxDuration: number;
    allowedRadius: number;
    antiCheatEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateQRSessionRequest {
    sectionId: string;
    courseId: string;
    duration?: number;
    location?: Location;
    allowedRadius?: number;
    antiCheatEnabled?: boolean;
}

export interface ScanQRCodeRequest {
    qrCodeData: string;
    studentId: string;
    location?: Location;
    deviceInfo?: string;
}

export interface CloseSessionRequest {
    generateAttendanceRecord?: boolean;
}

export interface QRSessionStats {
    sessionInfo: {
        sessionId: string;
        course: Course;
        section: Section;
        startTime: string;
        endTime: string;
        isActive: boolean;
    };
    attendance: {
        totalStudents: number;
        attendedCount: number;
        absentCount: number;
        attendanceRate: number;
    };
    recentScans: Array<{
        student: Student;
        scannedAt: string;
        location?: Location;
    }>;
}

export interface QRSessionHistory {
    sessions: AttendanceSession[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
