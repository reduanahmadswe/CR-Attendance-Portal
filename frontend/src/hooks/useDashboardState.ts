import type { AttendanceRecord } from '@/types';
import { useCallback, useMemo, useState } from 'react';

export interface DashboardState {
    // Edit Modal State
    editingRecord: AttendanceRecord | null;
    editingStudents: { [studentId: string]: 'present' | 'absent' };
    isEditModalOpen: boolean;

    // Navigation State
    activeSection: 'dashboard' | 'reports';

    // Take Attendance Modal State
    isDialogOpen: boolean;
    selectedCourse: string;
    attendanceData: { [studentId: string]: 'present' | 'absent' };

    // Reports Filter State
    selectedCourseId: string;
}

export interface DashboardActions {
    // Edit Modal Actions
    setEditingRecord: (record: AttendanceRecord | null) => void;
    setEditingStudents: (students: { [studentId: string]: 'present' | 'absent' }) => void;
    updateStudentStatus: (studentId: string, status: 'present' | 'absent') => void;
    setIsEditModalOpen: (open: boolean) => void;
    resetEditModal: () => void;

    // Navigation Actions
    setActiveSection: (section: 'dashboard' | 'reports') => void;

    // Take Attendance Modal Actions
    setIsDialogOpen: (open: boolean) => void;
    setSelectedCourse: (courseId: string) => void;
    setAttendanceData: (data: { [studentId: string]: 'present' | 'absent' }) => void;
    updateAttendanceStatus: (studentId: string, status: 'present' | 'absent') => void;
    resetTakeAttendanceModal: () => void;

    // Reports Filter Actions
    setSelectedCourseId: (courseId: string) => void;
}

const initialState: DashboardState = {
    editingRecord: null,
    editingStudents: {},
    isEditModalOpen: false,
    activeSection: 'dashboard',
    isDialogOpen: false,
    selectedCourse: '',
    attendanceData: {},
    selectedCourseId: 'all',
};

export const useDashboardState = () => {
    const [state, setState] = useState<DashboardState>(initialState);

    // Edit Modal Actions
    const setEditingRecord = useCallback((record: AttendanceRecord | null) => {
        setState(prev => ({ ...prev, editingRecord: record }));
    }, []);

    const setEditingStudents = useCallback((students: { [studentId: string]: 'present' | 'absent' }) => {
        setState(prev => ({ ...prev, editingStudents: students }));
    }, []);

    const updateStudentStatus = useCallback((studentId: string, status: 'present' | 'absent') => {
        setState(prev => ({
            ...prev,
            editingStudents: {
                ...prev.editingStudents,
                [studentId]: status,
            },
        }));
    }, []);

    const setIsEditModalOpen = useCallback((open: boolean) => {
        setState(prev => ({ ...prev, isEditModalOpen: open }));
    }, []);

    const resetEditModal = useCallback(() => {
        setState(prev => ({
            ...prev,
            editingRecord: null,
            editingStudents: {},
            isEditModalOpen: false,
        }));
    }, []);

    // Navigation Actions
    const setActiveSection = useCallback((section: 'dashboard' | 'reports') => {
        setState(prev => ({ ...prev, activeSection: section }));
    }, []);

    // Take Attendance Modal Actions
    const setIsDialogOpen = useCallback((open: boolean) => {
        setState(prev => ({ ...prev, isDialogOpen: open }));
    }, []);

    const setSelectedCourse = useCallback((courseId: string) => {
        setState(prev => ({ ...prev, selectedCourse: courseId }));
    }, []);

    const setAttendanceData = useCallback((data: { [studentId: string]: 'present' | 'absent' }) => {
        setState(prev => ({ ...prev, attendanceData: data }));
    }, []);

    const updateAttendanceStatus = useCallback((studentId: string, status: 'present' | 'absent') => {
        setState(prev => ({
            ...prev,
            attendanceData: {
                ...prev.attendanceData,
                [studentId]: status,
            },
        }));
    }, []);

    const resetTakeAttendanceModal = useCallback(() => {
        setState(prev => ({
            ...prev,
            isDialogOpen: false,
            selectedCourse: '',
            attendanceData: {},
        }));
    }, []);

    // Reports Filter Actions
    const setSelectedCourseId = useCallback((courseId: string) => {
        setState(prev => ({ ...prev, selectedCourseId: courseId }));
    }, []);

    const actions: DashboardActions = useMemo(() => ({
        setEditingRecord,
        setEditingStudents,
        updateStudentStatus,
        setIsEditModalOpen,
        resetEditModal,
        setActiveSection,
        setIsDialogOpen,
        setSelectedCourse,
        setAttendanceData,
        updateAttendanceStatus,
        resetTakeAttendanceModal,
        setSelectedCourseId,
    }), [
        setEditingRecord,
        setEditingStudents,
        updateStudentStatus,
        setIsEditModalOpen,
        resetEditModal,
        setActiveSection,
        setIsDialogOpen,
        setSelectedCourse,
        setAttendanceData,
        updateAttendanceStatus,
        resetTakeAttendanceModal,
        setSelectedCourseId,
    ]);

    return {
        state,
        actions,
    };
};