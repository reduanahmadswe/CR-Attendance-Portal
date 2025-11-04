import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
    Announcement,
    AnnouncementFilters,
    AnnouncementStats,
    ApiResponse,
    AttendanceFilters,
    AttendanceRecord,
    AttendanceSession,
    AttendanceStats,
    CloseSessionRequest,
    Course,
    CreateAnnouncementRequest,
    CreateAttendanceRequest,
    CreateCourseRequest,
    CreateQRSessionRequest,
    CreateSectionRequest,
    CreateStudentRequest,
    LoginRequest,
    LoginResponse,
    PaginatedResponse,
    PaginationQuery,
    QRSessionHistory,
    QRSessionStats,
    ScanQRCodeRequest,
    Section,
    Student,
    UpdateAnnouncementRequest,
    User
} from '../types';
import type { RootState } from './simpleStore';

const baseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'https://crportal-nu.vercel.app/api',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
        const state = getState() as RootState;
        const token = state.auth.accessToken;

        // Set common headers
        headers.set('Content-Type', 'application/json');
        headers.set('Accept', 'application/json');

        if (token) {
            headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

// Enhanced base query with error handling
const baseQueryWithErrorHandling: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    try {
        const result = await baseQuery(args, api, extraOptions);

        // Handle successful responses
        if (result.data) {
            return result;
        }

        // Handle errors
        if (result.error) {
            console.error('API Error:', result.error);

            // Handle 401 errors - token expired
            if (result.error.status === 401) {
                // Clear auth state for token expiry
                api.dispatch({ type: 'auth/clearCredentials' });
            }

            return result;
        }

        return result;
    } catch (error) {
        console.error('Network Error:', error);
        return {
            error: {
                status: 'FETCH_ERROR',
                error: 'Network error occurred',
            },
        };
    }
};

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithErrorHandling,
    tagTypes: ['User', 'Section', 'Course', 'Student', 'AttendanceRecord', 'Announcement'],
    keepUnusedDataFor: 60, // Keep data for 60 seconds
    refetchOnMountOrArgChange: 30, // Only refetch if data is older than 30 seconds
    refetchOnFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: false, // Don't refetch when reconnecting
    endpoints: (builder) => ({
        // Auth endpoints
        login: builder.mutation<ApiResponse<LoginResponse>, LoginRequest>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        studentLogin: builder.mutation<ApiResponse<LoginResponse>, { studentId: string; password: string }>({
            query: (credentials) => ({
                url: '/auth/student/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        logout: builder.mutation<ApiResponse<undefined>, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
        }),
        refreshToken: builder.mutation<ApiResponse<{ accessToken: string }>, void>({
            query: () => ({
                url: '/auth/refresh',
                method: 'POST',
            }),
        }),
        getProfile: builder.query<ApiResponse<User>, void>({
            query: () => '/auth/profile',
            providesTags: ['User'],
        }),
        updateProfile: builder.mutation<ApiResponse<User>, Partial<User>>({
            query: (userData) => ({
                url: '/auth/profile',
                method: 'PUT',
                body: userData,
            }),
            invalidatesTags: ['User'],
        }),
        changePassword: builder.mutation<ApiResponse<undefined>, { currentPassword: string; newPassword: string }>({
            query: (passwordData) => ({
                url: '/auth/change-password',
                method: 'PUT',
                body: passwordData,
            }),
        }),

        // Sections endpoints
        getSections: builder.query<ApiResponse<PaginatedResponse<Section>>, PaginationQuery | undefined>({
            query: (params) => ({
                url: '/sections',
                params: params || {},
            }),
            providesTags: ['Section'],
        }),
        getSection: builder.query<ApiResponse<Section>, string>({
            query: (id) => `/sections/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Section', id }],
        }),
        createSection: builder.mutation<ApiResponse<Section>, CreateSectionRequest>({
            query: (sectionData) => ({
                url: '/sections',
                method: 'POST',
                body: sectionData,
            }),
            invalidatesTags: ['Section'],
        }),
        updateSection: builder.mutation<ApiResponse<Section>, { id: string; data: Partial<CreateSectionRequest> }>({
            query: ({ id, data }) => ({
                url: `/sections/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Section', id }, 'Section'],
        }),
        deleteSection: builder.mutation<ApiResponse<undefined>, string>({
            query: (id) => ({
                url: `/sections/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Section'],
        }),
        getSectionCourses: builder.query<ApiResponse<PaginatedResponse<Course>>, { sectionId: string; params?: PaginationQuery }>({
            query: ({ sectionId, params }) => ({
                url: `/sections/${sectionId}/courses`,
                params: params || {},
            }),
            providesTags: (_result, _error, { sectionId }) => [{ type: 'Course', id: sectionId }],
        }),
        getSectionStudents: builder.query<ApiResponse<PaginatedResponse<Student>>, { sectionId: string; params?: PaginationQuery }>({
            query: ({ sectionId, params }) => ({
                url: `/sections/${sectionId}/students`,
                params: params || {},
            }),
            providesTags: (_result, _error, { sectionId }) => [{ type: 'Student', id: sectionId }],
        }),
        getCourseStudents: builder.query<ApiResponse<PaginatedResponse<Student>>, { sectionId: string; courseId: string; params?: PaginationQuery }>({
            query: ({ sectionId, courseId, params }) => ({
                url: `/sections/${sectionId}/courses/${courseId}/students`,
                params: params || {},
            }),
            providesTags: (_result, _error, { sectionId, courseId }) => [
                { type: 'Student', id: `${sectionId}-${courseId}` }
            ],
        }),

        // Courses endpoints
        getCourse: builder.query<ApiResponse<Course>, string>({
            query: (id) => `/courses/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Course', id }],
        }),
        createCourse: builder.mutation<ApiResponse<Course>, CreateCourseRequest>({
            query: (courseData) => {
                const { sectionId, ...bodyData } = courseData;
                return {
                    url: `/sections/${sectionId}/courses`,
                    method: 'POST',
                    body: bodyData,
                };
            },
            invalidatesTags: ['Course'],
        }),
        updateCourse: builder.mutation<ApiResponse<Course>, { id: string; data: Partial<CreateCourseRequest> }>({
            query: ({ id, data }) => ({
                url: `/courses/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Course', id }, 'Course'],
        }),
        deleteCourse: builder.mutation<ApiResponse<undefined>, string>({
            query: (id) => ({
                url: `/courses/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Course'],
        }),

        // Students endpoints
        getStudent: builder.query<ApiResponse<Student>, string>({
            query: (id) => `/students/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Student', id }],
        }),
        createStudent: builder.mutation<ApiResponse<Student>, CreateStudentRequest>({
            query: (studentData) => {
                const { sectionId, ...bodyData } = studentData;
                return {
                    url: `/sections/${sectionId}/students`,
                    method: 'POST',
                    body: bodyData,
                };
            },
            invalidatesTags: ['Student'],
        }),
        updateStudent: builder.mutation<ApiResponse<Student>, { id: string; data: Partial<CreateStudentRequest> }>({
            query: ({ id, data }) => ({
                url: `/students/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Student', id }, 'Student'],
        }),
        deleteStudent: builder.mutation<ApiResponse<undefined>, string>({
            query: (id) => ({
                url: `/students/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Student'],
        }),
        bulkCreateStudents: builder.mutation<ApiResponse<Student[]>, { sectionId: string; students: CreateStudentRequest[] }>({
            query: ({ sectionId, students }) => ({
                url: `/students/bulk`,
                method: 'POST',
                body: { sectionId, students },
            }),
            invalidatesTags: ['Student'],
        }),

        // Attendance endpoints
        getAttendanceRecords: builder.query<ApiResponse<PaginatedResponse<AttendanceRecord>>, AttendanceFilters | undefined>({
            query: (params) => ({
                url: '/attendance',
                params: params || {},
            }),
            providesTags: ['AttendanceRecord'],
        }),
        getStudentAttendance: builder.query<ApiResponse<AttendanceRecord[]>, string>({
            query: (studentId) => `/attendance/student/${studentId}`,
            providesTags: (_result, _error, studentId) => [{ type: 'AttendanceRecord', id: studentId }],
        }),
        getAttendanceRecord: builder.query<ApiResponse<AttendanceRecord>, string>({
            query: (id) => `/attendance/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'AttendanceRecord', id }],
        }),
        createAttendanceRecord: builder.mutation<ApiResponse<AttendanceRecord>, CreateAttendanceRequest>({
            query: (attendanceData) => ({
                url: '/attendance',
                method: 'POST',
                body: attendanceData,
            }),
            invalidatesTags: ['AttendanceRecord'],
        }),
        updateAttendanceRecord: builder.mutation<ApiResponse<AttendanceRecord>, { id: string; data: { attendees: CreateAttendanceRequest['attendees'] } }>({
            query: ({ id, data }) => ({
                url: `/attendance/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'AttendanceRecord', id }, 'AttendanceRecord'],
        }),
        deleteAttendanceRecord: builder.mutation<ApiResponse<undefined>, string>({
            query: (id) => ({
                url: `/attendance/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['AttendanceRecord'],
        }),
        getAttendanceStats: builder.query<ApiResponse<AttendanceStats>, Omit<AttendanceFilters, 'page' | 'limit'> | undefined>({
            query: (params) => ({
                url: '/attendance/stats',
                params: params || {},
            }),
        }),
        generateAttendancePDF: builder.mutation<Blob, string>({
            query: (id) => ({
                url: `/attendance/${id}/pdf`,
                method: 'GET',
                responseHandler: (response) => response.blob(),
            }),
        }),
        downloadAttendancePDF: builder.mutation<Blob, string>({
            query: (id) => ({
                url: `/attendance/${id}/download`,
                method: 'GET',
                responseHandler: (response) => response.blob(),
            }),
        }),
        downloadCourseAttendanceZip: builder.mutation<Blob, { courseId: string; sectionId?: string }>({
            query: ({ courseId, sectionId }) => ({
                url: `/attendance/course/${courseId}/download-zip`,
                method: 'GET',
                params: sectionId ? { sectionId } : {},
                responseHandler: (response) => response.blob(),
            }),
        }),

        // Users endpoints (admin only)
        getUsers: builder.query<ApiResponse<PaginatedResponse<User>>, (PaginationQuery & { role?: string; sectionId?: string }) | undefined>({
            query: (params) => ({
                url: '/users',
                params: params || {},
            }),
            providesTags: ['User'],
        }),
        getUser: builder.query<ApiResponse<User>, string>({
            query: (id) => `/users/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'User', id }],
        }),
        createUser: builder.mutation<ApiResponse<User>, Omit<User, '_id' | 'createdAt' | 'updatedAt'> & { password: string }>({
            query: (userData) => ({
                url: '/users',
                method: 'POST',
                body: userData,
            }),
            invalidatesTags: ['User'],
        }),
        updateUser: builder.mutation<ApiResponse<User>, { id: string; data: Partial<User> }>({
            query: ({ id, data }) => ({
                url: `/users/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, 'User'],
        }),
        deleteUser: builder.mutation<ApiResponse<undefined>, string>({
            query: (id) => ({
                url: `/users/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['User'],
        }),
        resetUserPassword: builder.mutation<ApiResponse<undefined>, { id: string; newPassword: string }>({
            query: ({ id, newPassword }) => ({
                url: `/users/${id}/reset-password`,
                method: 'PUT',
                body: { newPassword },
            }),
        }),

        // Announcements endpoints
        getAnnouncements: builder.query<ApiResponse<PaginatedResponse<Announcement>>, AnnouncementFilters | undefined>({
            query: (params) => ({
                url: '/announcements',
                params: params || {},
            }),
            providesTags: ['Announcement'],
        }),
        getAnnouncement: builder.query<ApiResponse<Announcement>, string>({
            query: (id) => `/announcements/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Announcement', id }],
        }),
        createAnnouncement: builder.mutation<ApiResponse<{ announcement: Announcement; textMessage: string; emailStatus: { sent: number; failed: number; total: number } | null }>, CreateAnnouncementRequest>({
            query: (announcementData) => ({
                url: '/announcements',
                method: 'POST',
                body: announcementData,
            }),
            invalidatesTags: ['Announcement'],
        }),
        updateAnnouncement: builder.mutation<ApiResponse<Announcement>, { id: string; data: UpdateAnnouncementRequest }>({
            query: ({ id, data }) => ({
                url: `/announcements/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Announcement', id }, 'Announcement'],
        }),
        deleteAnnouncement: builder.mutation<ApiResponse<undefined>, string>({
            query: (id) => ({
                url: `/announcements/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Announcement'],
        }),
        getAnnouncementStats: builder.query<ApiResponse<AnnouncementStats>, { courseId?: string; sectionId?: string }>({
            query: (params) => ({
                url: '/announcements/stats',
                params,
            }),
        }),

        // QR Code Attendance endpoints
        generateQRSession: builder.mutation<ApiResponse<{ session: AttendanceSession; qrCode: string; expiresIn: number }>, CreateQRSessionRequest>({
            query: (data) => ({
                url: '/qr-attendance/generate',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['AttendanceRecord'],
        }),
        scanQRCode: builder.mutation<ApiResponse<{ message: string; student: Student; session: Partial<AttendanceSession> }>, ScanQRCodeRequest>({
            query: (data) => ({
                url: '/qr-attendance/scan',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['AttendanceRecord'],
        }),
        getActiveQRSession: builder.query<ApiResponse<AttendanceSession>, { sectionId: string; courseId: string }>({
            query: ({ sectionId, courseId }) => ({
                url: `/qr-attendance/active/${sectionId}/${courseId}`,
            }),
        }),
        closeQRSession: builder.mutation<ApiResponse<{ session: AttendanceSession; attendanceRecord?: AttendanceRecord; stats: { totalScanned: number; sessionDuration: number } }>, { sessionId: string; data: CloseSessionRequest }>({
            query: ({ sessionId, data }) => ({
                url: `/qr-attendance/close/${sessionId}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['AttendanceRecord'],
        }),
        getQRSessionStats: builder.query<ApiResponse<QRSessionStats>, string>({
            query: (sessionId) => ({
                url: `/qr-attendance/stats/${sessionId}`,
            }),
        }),
        getQRSessionHistory: builder.query<ApiResponse<QRSessionHistory>, { sectionId?: string; courseId?: string; from?: string; to?: string; page?: number; limit?: number }>({
            query: (params) => ({
                url: '/qr-attendance/history',
                params,
            }),
        }),
    }),
});

export const {
    // Auth hooks
    useLoginMutation,
    useStudentLoginMutation,
    useLogoutMutation,
    useRefreshTokenMutation,
    useGetProfileQuery,
    useUpdateProfileMutation,
    useChangePasswordMutation,

    // Sections hooks
    useGetSectionsQuery,
    useGetSectionQuery,
    useCreateSectionMutation,
    useUpdateSectionMutation,
    useDeleteSectionMutation,
    useGetSectionCoursesQuery,
    useGetSectionStudentsQuery,
    useGetCourseStudentsQuery,

    // Courses hooks
    useGetCourseQuery,
    useCreateCourseMutation,
    useUpdateCourseMutation,
    useDeleteCourseMutation,

    // Students hooks
    useGetStudentQuery,
    useCreateStudentMutation,
    useUpdateStudentMutation,
    useDeleteStudentMutation,
    useBulkCreateStudentsMutation,

    // Attendance hooks
    useGetAttendanceRecordsQuery,
    useGetStudentAttendanceQuery,
    useGetAttendanceRecordQuery,
    useCreateAttendanceRecordMutation,
    useUpdateAttendanceRecordMutation,
    useDeleteAttendanceRecordMutation,
    useGetAttendanceStatsQuery,
    useGenerateAttendancePDFMutation,
    useDownloadAttendancePDFMutation,
    useDownloadCourseAttendanceZipMutation,

    // Users hooks
    useGetUsersQuery,
    useGetUserQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
    useResetUserPasswordMutation,

    // Announcements hooks
    useGetAnnouncementsQuery,
    useGetAnnouncementQuery,
    useCreateAnnouncementMutation,
    useUpdateAnnouncementMutation,
    useDeleteAnnouncementMutation,
    useGetAnnouncementStatsQuery,

    // QR Attendance hooks
    useGenerateQRSessionMutation,
    useScanQRCodeMutation,
    useGetActiveQRSessionQuery,
    useCloseQRSessionMutation,
    useGetQRSessionStatsQuery,
    useGetQRSessionHistoryQuery,
} = apiSlice;