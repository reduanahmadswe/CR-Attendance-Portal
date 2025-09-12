export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
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

export interface AttendanceFilters {
    sectionId?: string;
    courseId?: string;
    from?: string;
    to?: string;
    takenBy?: string;
}