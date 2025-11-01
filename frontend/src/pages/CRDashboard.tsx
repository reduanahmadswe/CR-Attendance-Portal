import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useCreateAttendanceRecordMutation,
  useDownloadAttendancePDFMutation,
  useDownloadCourseAttendanceZipMutation,
  useGetAttendanceRecordsQuery,
  useGetCourseStudentsQuery,
  useGetSectionCoursesQuery,
  useGetSectionStudentsQuery,
  useUpdateAttendanceRecordMutation,
} from '@/lib/apiSlice'
import type { RootState } from '@/lib/simpleStore'
import type { AttendanceRecord, Course, Student } from '@/types'
import {
  Bell,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Edit,
  FileText,
  LogOut,
  Plus,
  Users,
  XCircle,
} from 'lucide-react'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'

interface AttendanceFormData {
  course: string
  date: string
}

export function CRDashboard() {
  const user = useSelector((state: RootState) => state.auth.user)
  const auth = useAuth()
  const { isLoading, user: authUser } = auth
  const navigate = useNavigate()

  // Edit Attendance Modal States - moved to top to avoid conditional hook calls
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(
    null
  )
  const [editingStudents, setEditingStudents] = useState<{
    [studentId: string]: 'present' | 'absent'
  }>({})
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [updateAttendanceRecord] = useUpdateAttendanceRecordMutation()
  const [downloadCourseZip] = useDownloadCourseAttendanceZipMutation()
  const [downloadingCourseId, setDownloadingCourseId] = useState<string | null>(null)

  // Navigation state for different sections
  const [activeSection, setActiveSection] = useState<'dashboard' | 'reports'>(
    'dashboard'
  )

  // Use authUser from context if available, fallback to Redux user
  const currentUser = authUser || user

  // Main data fetching for the entire dashboard - to avoid duplicate API calls
  const finalSectionId =
    typeof currentUser?.sectionId === 'string'
      ? currentUser.sectionId
      : currentUser?.sectionId?._id || ''

  const { data: mainStudentsResponse, isLoading: studentsLoading } =
    useGetSectionStudentsQuery(
      { sectionId: finalSectionId },
      { skip: !finalSectionId }
    )
  const { data: mainAttendanceResponse, isLoading: attendanceLoading } =
    useGetAttendanceRecordsQuery(
      { sectionId: finalSectionId },
      { skip: !finalSectionId }
    )
  const { data: mainCoursesResponse, isLoading: coursesLoading } =
    useGetSectionCoursesQuery(
      { sectionId: finalSectionId },
      { skip: !finalSectionId }
    )

  const mainDataLoading = studentsLoading || attendanceLoading || coursesLoading
  const mainStudents = mainStudentsResponse?.data?.data || []
  const mainAttendance = mainAttendanceResponse?.data?.data || []
  const mainCourses = mainCoursesResponse?.data?.data || []

  // Fetch section students for proper name/ID display in edit modal
  // Note: This uses user or authUser sectionId, might be undefined initially
  const tempSectionId = user?.sectionId || authUser?.sectionId
  const { data: sectionStudentsResponse } = useGetSectionStudentsQuery(
    {
      sectionId:
        typeof tempSectionId === 'string'
          ? tempSectionId
          : tempSectionId?._id || '',
    },
    { skip: !tempSectionId }
  )
  const sectionStudents = sectionStudentsResponse?.data?.data || []

  console.log('[CR DASHBOARD] Component rendered')
  console.log('[CR DASHBOARD] Redux user:', user)
  console.log('[CR DASHBOARD] Auth user:', authUser)
  console.log('[CR DASHBOARD] Is loading:', isLoading)
  console.log('[CR DASHBOARD] Auth object:', auth)
  console.log('[CR DASHBOARD] isAuthenticated:', auth.isAuthenticated)

  // Add loading state check
  if (isLoading) {
    console.log('[CR DASHBOARD] Showing loading state')
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Use authUser from context if available, fallback to Redux user
  // const currentUser = authUser || user (moved to top)

  // Helper function to get student info by ID
  const getStudentInfo = (studentId: string) => {
    const student = sectionStudents.find((s) => s._id === studentId)

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[STUDENT INFO] Looking for studentId:', studentId)
      console.log('[STUDENT INFO] Available students:', sectionStudents.length)
      console.log('[STUDENT INFO] Found student:', student)
    }

    if (student) {
      return {
        name: student.name || 'Unknown Student',
        studentId: student.studentId || 'N/A',
        id: studentId,
      }
    }

    // Fallback: if we can't find the student in section students,
    // try to get info from the attendance record itself
    return {
      name: 'Loading...',
      studentId: studentId.slice(-8), // Show last 8 chars of ObjectId as fallback
      id: studentId,
    }
  }

  console.log('[CR DASHBOARD] Current user:', currentUser)
  console.log('[CR DASHBOARD] Current user role:', currentUser?.role)
  console.log('[CR DASHBOARD] Current user sectionId:', currentUser?.sectionId)

  // Debug component - show current state
  if (process.env.NODE_ENV === 'development') {
    console.log('[CR DASHBOARD] Debug info:', {
      isLoading,
      isAuthenticated: auth.isAuthenticated,
      user,
      authUser,
      currentUser,
    })
  }

  const handleLogout = async () => {
    console.log('[CR DASHBOARD] Logout button clicked')

    try {
      if (auth?.logout) {
        console.log('[CR DASHBOARD] Calling auth.logout()')
        await auth.logout() // This will handle redirect to login
        console.log('[CR DASHBOARD] auth.logout() completed')
      } else {
        console.log(
          '[CR DASHBOARD] auth.logout not available, fallback redirect'
        )
        window.location.href = '/auth/login'
      }
    } catch (error) {
      console.error('[CR DASHBOARD] Logout failed:', error)
      // Still navigate to login even if logout fails
      window.location.href = '/auth/login'
    }
  }

  if (!currentUser) {
    console.log('[CR DASHBOARD] No current user, checking token')
    const token = localStorage.getItem('accessToken')

    if (!token) {
      console.log('[CR DASHBOARD] No token, redirecting to login')
      navigate('/auth/login')
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Redirecting to login...
            </p>
          </div>
        </div>
      )
    } else {
      console.log(
        '[CR DASHBOARD] Token exists but no user data, showing loading'
      )
      // Token exists but user data not loaded yet, show loading
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading user data...
            </p>
          </div>
        </div>
      )
    }
  }

  if (currentUser.role !== 'cr') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Unauthorized Access
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
          <Button onClick={() => navigate('/auth/login')} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  if (!currentUser.sectionId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-yellow-600 mb-2">
            No Section Assigned
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please contact admin to assign you to a section.
          </p>
          <Button onClick={() => navigate('/auth/login')} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  const sectionId =
    typeof currentUser.sectionId === 'string'
      ? currentUser.sectionId
      : currentUser.sectionId._id

  // Edit Attendance Functions
  const handleEditRecord = (record: AttendanceRecord) => {
    console.log('Opening edit modal for record:', record)
    setEditingRecord(record)
    const initialStatus: { [studentId: string]: 'present' | 'absent' } = {}
    record.attendees.forEach((attendee) => {
      const studentId =
        typeof attendee.studentId === 'string'
          ? attendee.studentId
          : attendee.studentId._id
      initialStatus[studentId] = attendee.status as 'present' | 'absent'
    })
    console.log('Initial status for editing:', initialStatus)
    setEditingStudents(initialStatus)
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingRecord) return

    try {
      const updatedAttendees = Object.entries(editingStudents).map(
        ([studentId, status]) => ({
          studentId,
          status,
        })
      )

      console.log('Updating attendance with data:', {
        id: editingRecord._id,
        data: { attendees: updatedAttendees },
        originalRecord: editingRecord,
        editingStudents: editingStudents,
      })

      const result = await updateAttendanceRecord({
        id: editingRecord._id,
        data: {
          attendees: updatedAttendees,
        },
      }).unwrap()

      console.log('Update result:', result)
      toast.success('Attendance updated successfully!')
      setIsEditModalOpen(false)
      setEditingRecord(null)
      setEditingStudents({})
    } catch (error) {
      console.error('Error updating attendance:', error)
      toast.error('Failed to update attendance. Please try again.')
    }
  }

  const handleStatusChange = (
    studentId: string,
    status: 'present' | 'absent'
  ) => {
    console.log('Changing status for student:', studentId, 'to:', status)
    setEditingStudents((prev) => {
      const updated = {
        ...prev,
        [studentId]: status,
      }
      console.log('Updated editing students:', updated)
      return updated
    })
  }

  const handleDownloadAllAttendance = async (courseId: string, courseName: string) => {
    try {
      setDownloadingCourseId(courseId)
      console.log('Starting ZIP download for course:', courseId)
      
      const blob = await downloadCourseZip({ 
        courseId, 
        sectionId: sectionId 
      }).unwrap()
      
      console.log('ZIP blob received, size:', blob.size)

      if (blob.size === 0) {
        throw new Error('Received empty ZIP file')
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance-${courseName.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('All attendance records downloaded successfully!')
      console.log('ZIP download completed successfully')
    } catch (error) {
      console.error('Error downloading attendance ZIP:', error)

      let errorMessage = 'Failed to download attendance records. Please try again.'
      if (error && typeof error === 'object' && 'status' in error) {
        if (error.status === 403) {
          errorMessage = 'You do not have permission to download attendance records.'
        } else if (error.status === 404) {
          errorMessage = 'No attendance records found for this course.'
        } else if (
          error &&
          typeof error === 'object' &&
          'data' in error &&
          error.data &&
          typeof error.data === 'object' &&
          'message' in error.data
        ) {
          errorMessage = String(error.data.message)
        }
      }

      toast.error(errorMessage)
    } finally {
      setDownloadingCourseId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/5 to-pink-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      {/* Modern Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-700/60 shadow-lg shadow-gray-200/20 dark:shadow-gray-900/20">
        {/* Header gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-indigo-50/50 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-indigo-900/20"></div>

        <div className="px-4 sm:px-6 lg:px-8 py-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            {/* User Info with enhanced styling */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient">
                  {activeSection === 'dashboard'
                    ? 'CR Dashboard'
                    : 'Attendance Reports'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  Welcome back,{' '}
                  <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {currentUser.name}
                  </span>
                  {activeSection === 'reports' && (
                    <span className="ml-2 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-full">
                      Reports View
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions with enhanced styling */}
            <div className="flex items-center gap-3">
              <Button
                variant={activeSection === 'reports' ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setActiveSection(
                    activeSection === 'reports' ? 'dashboard' : 'reports'
                  )
                }
                className={`flex items-center gap-2 h-10 px-4 transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm ${
                  activeSection === 'reports'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-105'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 hover:border-amber-300 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 dark:hover:border-amber-600'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">
                  {activeSection === 'reports' ? 'Dashboard' : 'Reports'}
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/announcements'}
                className="flex items-center gap-2 h-10 px-4 transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 dark:hover:border-blue-600"
              >
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Announcements</span>
              </Button>
              <div className="p-1 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-sm">
                <ThemeToggle />
              </div>
              <Button
                size="sm"
                onClick={handleLogout}
                disabled={auth?.isLoggingOut}
                className="flex items-center gap-2 h-10 px-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {auth?.isLoggingOut ? 'Logging out...' : 'Logout'}
                </span>
              </Button>
            </div>
          </div>

          {/* Section Info with modern design */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-blue-900/30 dark:via-indigo-900/20 dark:to-purple-900/30 rounded-xl border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Managing Section:{' '}
                <span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {typeof currentUser.sectionId === 'string'
                    ? currentUser.sectionId
                    : `${currentUser.sectionId.name} ${currentUser.sectionId.code ? `(${currentUser.sectionId.code})` : ''}`}
                </span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with enhanced spacing and backdrop */}
      <main className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
          {/* Conditional Content Based on Active Section */}
          <div className="transition-all duration-500 ease-in-out">
            {activeSection === 'dashboard' ? (
              <div className="space-y-8 sm:space-y-12 animate-in fade-in-0 slide-in-from-left-4 duration-500">
                {/* Quick Stats */}
                <CRStatsCards
                  students={mainStudents}
                  attendance={mainAttendance}
                  courses={mainCourses}
                  isLoading={mainDataLoading}
                />

                {/* Take Attendance Section */}
                <TakeAttendanceSection sectionId={sectionId} />

                {/* Recent Attendance Records */}
                <ErrorBoundary>
                  <RecentAttendanceSection
                    attendance={mainAttendance}
                    isLoading={mainDataLoading}
                  />
                </ErrorBoundary>
              </div>
            ) : (
              <div className="space-y-8 sm:space-y-12 animate-in fade-in-0 slide-in-from-right-4 duration-500">
                {/* Download Course Attendance Section */}
                <DownloadCourseAttendanceSection
                  courses={mainCourses}
                  onDownloadCourseAttendance={handleDownloadAllAttendance}
                  downloadingCourseId={downloadingCourseId}
                />

                {/* Manage Attendance Reports Section */}
                <EditAttendanceSection
                  sectionId={sectionId}
                  onEditRecord={handleEditRecord}
                />

                {/* Download Reports Section */}
                <DownloadReportsSection sectionId={sectionId} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Attendance Modal */}
      {isEditModalOpen && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
              <DialogTitle className="text-lg sm:text-xl font-bold">
                Edit Attendance -{' '}
                {editingRecord &&
                  new Date(editingRecord.date).toLocaleDateString()}
              </DialogTitle>
            </DialogHeader>

            {editingRecord && (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Course Info - Fixed header */}
                <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b flex-shrink-0">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 text-sm sm:text-base">
                    Course:{' '}
                    {typeof editingRecord.courseId === 'string'
                      ? editingRecord.courseId
                      : `${editingRecord.courseId.name} (${editingRecord.courseId.code})`}
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-300">
                    Date: {new Date(editingRecord.date).toLocaleDateString()}
                  </p>
                </div>

                {/* Loading state */}
                {sectionStudents.length === 0 && (
                  <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b flex-shrink-0">
                    <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Loading student information...
                    </p>
                  </div>
                )}

                {/* Students List - Scrollable content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b flex-shrink-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                      Student Attendance ({editingRecord.attendees.length}{' '}
                      students)
                    </h4>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-2">
                    <div className="space-y-2">
                      {editingRecord.attendees.map((attendee) => {
                        const studentId =
                          typeof attendee.studentId === 'string'
                            ? attendee.studentId
                            : attendee.studentId._id

                        // Get proper student info using helper function
                        const studentInfo = getStudentInfo(studentId)

                        return (
                          <div
                            key={studentId}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg gap-3 sm:gap-0"
                          >
                            {/* Student Info */}
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs sm:text-sm font-medium">
                                  {studentInfo.name.charAt(0) || 'S'}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                                  {studentInfo.name}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                  ID: {studentInfo.studentId}
                                </p>
                              </div>
                            </div>

                            {/* Status Buttons */}
                            <div className="flex space-x-2 w-full sm:w-auto">
                              <Button
                                size="sm"
                                variant={
                                  editingStudents[studentId] === 'present'
                                    ? 'default'
                                    : 'outline'
                                }
                                onClick={() =>
                                  handleStatusChange(studentId, 'present')
                                }
                                className={`flex-1 sm:flex-none text-xs sm:text-sm ${
                                  editingStudents[studentId] === 'present'
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'border-green-300 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                                }`}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Present
                              </Button>
                              <Button
                                size="sm"
                                variant={
                                  editingStudents[studentId] === 'absent'
                                    ? 'default'
                                    : 'outline'
                                }
                                onClick={() =>
                                  handleStatusChange(studentId, 'absent')
                                }
                                className={`flex-1 sm:flex-none text-xs sm:text-sm ${
                                  editingStudents[studentId] === 'absent'
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'border-red-300 text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                                }`}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Absent
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Fixed footer */}
                <div className="px-4 py-3 border-t bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditModalOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveEdit}
                      className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// CR Stats Cards Component
const CRStatsCards = ({
  students,
  attendance,
  courses,
  isLoading = false,
}: {
  students: Student[]
  attendance: AttendanceRecord[]
  courses: Course[]
  isLoading?: boolean
}) => {
  const todayAttendance = attendance.filter((record) => {
    const recordDate = new Date(record.date)
    const today = new Date()
    return recordDate.toDateString() === today.toDateString()
  })

  const stats = [
    {
      title: 'Total Students',
      value: students.length,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      darkBgGradient: 'from-blue-900/40 to-cyan-900/40',
      description: 'Enrolled in section',
    },
    {
      title: 'Available Courses',
      value: courses.length,
      icon: BookOpen,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      darkBgGradient: 'from-green-900/40 to-emerald-900/40',
      description: 'Active courses',
    },
    {
      title: "Today's Sessions",
      value: todayAttendance.length,
      icon: Clock,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      darkBgGradient: 'from-purple-900/40 to-pink-900/40',
      description: 'Sessions recorded',
    },
    {
      title: 'Total Records',
      value: attendance.length,
      icon: CheckCircle,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
      darkBgGradient: 'from-orange-900/40 to-red-900/40',
      description: 'All-time records',
    },
  ]

  // Loading skeleton component
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
        {[1, 2, 3, 4].map((index) => (
          <Card
            key={index}
            className="overflow-hidden border border-gray-200/60 dark:border-gray-700/40 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            style={{
              animationDelay: `${index * 150}ms`,
              animation: 'fadeInUp 0.8s ease-out forwards',
            }}
          >
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2 sm:space-y-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg lg:rounded-xl animate-pulse"></div>
                  <div className="space-y-1 sm:space-y-2">
                    <div className="h-3 sm:h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse w-3/4"></div>
                    <div className="h-5 sm:h-6 lg:h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse w-1/2"></div>
                    <div className="h-2 sm:h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse w-full hidden sm:block"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className={`group overflow-hidden border border-gray-200/60 dark:border-gray-700/40 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] bg-gradient-to-br ${stat.bgGradient} dark:bg-gradient-to-br dark:${stat.darkBgGradient} backdrop-blur-sm hover:border-gray-300/80 dark:hover:border-gray-600/60 relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500`}
            style={{
              animationDelay: `${index * 150}ms`,
              animation: 'fadeInUp 0.8s ease-out forwards',
            }}
          >
            <CardContent className="p-3 sm:p-4 lg:p-6 relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div
                    className={`inline-flex p-2 sm:p-2.5 lg:p-3 rounded-lg lg:rounded-xl bg-gradient-to-r ${stat.gradient} shadow-lg mb-2 sm:mb-3 lg:mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 group-hover:shadow-xl`}
                  >
                    <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 sm:mb-2 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors duration-300">
                    {stat.title}
                  </p>
                  <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-50 mb-1 sm:mb-2 group-hover:scale-105 transition-transform duration-300">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 font-medium hidden sm:block lg:block">
                    {stat.description}
                  </p>
                </div>

                {/* Decorative corner element */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/20 to-transparent dark:from-gray-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

// Download Course Attendance Section Component
const DownloadCourseAttendanceSection = ({
  courses,
  onDownloadCourseAttendance,
  downloadingCourseId,
}: {
  courses: Course[]
  onDownloadCourseAttendance: (courseId: string, courseName: string) => void
  downloadingCourseId: string | null
}) => {
  if (courses.length === 0) {
    return (
      <Card className="border border-gray-200/60 dark:border-gray-700/40 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
            <Download className="h-12 w-12 text-indigo-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Courses Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No courses found for your section.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200/60 dark:border-gray-700/40 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          <Download className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          Download Course Attendance
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Download all attendance records for any course as a ZIP file containing individual PDFs for each date
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {courses.map((course) => (
          <div
            key={course._id}
            className="group p-5 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-1 line-clamp-2">
                  {course.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {course.code}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => onDownloadCourseAttendance(course._id, course.name)}
              disabled={downloadingCourseId === course._id}
              className="w-full h-10 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all group-hover:scale-105"
            >
              {downloadingCourseId === course._id ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download All Records
                </>
              )}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Take Attendance Section Component
const TakeAttendanceSection = ({ sectionId }: { sectionId: string }) => {
  const [createAttendanceRecord] = useCreateAttendanceRecordMutation()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [attendanceData, setAttendanceData] = useState<
    Record<string, 'present' | 'absent'>
  >({})

  // Get courses for the CR's section
  const { data: coursesResponse } = useGetSectionCoursesQuery(
    { sectionId },
    { skip: !sectionId }
  )
  const courses = coursesResponse?.data?.data || []

  // Get students for selected course only
  const { data: courseStudentsResponse } = useGetCourseStudentsQuery(
    { sectionId, courseId: selectedCourse },
    { skip: !selectedCourse }
  )
  const students = courseStudentsResponse?.data?.data || []

  const { register, handleSubmit, reset } = useForm<AttendanceFormData>()

  const onSubmit = async (data: AttendanceFormData) => {
    console.log('[ATTENDANCE] Submitting attendance data:', data)
    console.log('[ATTENDANCE] Selected course state:', selectedCourse)
    console.log('[ATTENDANCE] Students data:', students)
    console.log('[ATTENDANCE] Attendance data:', attendanceData)

    // Validate course selection
    if (!selectedCourse) {
      toast.error('Please select a course')
      return
    }

    try {
      const attendees = students.map((student: Student) => ({
        studentId: student._id,
        status: attendanceData[student._id] || ('absent' as const),
      }))

      console.log('[ATTENDANCE] Sending attendees:', attendees)

      // Ensure date is in correct format
      const formattedDate = new Date(data.date).toISOString().split('T')[0]
      console.log('[ATTENDANCE] Formatted date:', formattedDate)

      const result = await createAttendanceRecord({
        sectionId: sectionId,
        courseId: selectedCourse,
        date: formattedDate,
        attendees,
      }).unwrap()

      console.log('[ATTENDANCE] Success result:', result)
      toast.success('Attendance recorded successfully!')

      setIsDialogOpen(false)
      setSelectedCourse('')
      setAttendanceData({})
      reset()
    } catch (error) {
      console.error('[ATTENDANCE] Error creating attendance:', error)
      const errorMessage =
        error && typeof error === 'object' && 'data' in error
          ? (error as { data?: { message?: string } }).data?.message ||
            'Failed to record attendance'
          : 'Failed to record attendance'
      toast.error(errorMessage)
    }
  }

  const handleAttendanceChange = (
    studentId: string,
    status: 'present' | 'absent'
  ) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: status,
    }))
  }

  const markAllPresent = () => {
    const allPresent: Record<string, 'present'> = {}
    students.forEach((student: Student) => {
      allPresent[student._id] = 'present'
    })
    setAttendanceData(allPresent)
  }

  const markAllAbsent = () => {
    const allAbsent: Record<string, 'absent'> = {}
    students.forEach((student: Student) => {
      allAbsent[student._id] = 'absent'
    })
    setAttendanceData(allAbsent)
  }

  return (
    <Card className="overflow-hidden shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Take Attendance</h3>
              <p className="text-blue-100 text-sm">
                Record student attendance for your classes
              </p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Attendance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-none md:max-w-6xl max-h-[100vh] md:max-h-[90vh] h-screen md:h-auto w-screen md:w-auto p-0 md:p-6 overflow-hidden md:overflow-y-auto flex flex-col">
              <DialogHeader className="pb-4 md:pb-6 border-b px-4 md:px-0 pt-4 md:pt-0">
                <div className="flex items-center justify-between md:justify-start">
                  <DialogTitle className="text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                      <Users className="h-4 md:h-5 lg:h-5 w-4 md:w-5 lg:w-5 text-white" />
                    </div>
                    Take Attendance
                  </DialogTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDialogOpen(false)}
                    className="md:hidden h-8 w-8 p-0 rounded-full"
                  >
                    ✕
                  </Button>
                </div>
              </DialogHeader>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex-1 flex flex-col pt-4 md:pt-6 px-4 md:px-0 overflow-hidden"
              >
                {/* Scrollable Content Area */}
                <div className="flex-1 space-y-4 md:space-y-6 lg:space-y-8 overflow-y-auto md:overflow-visible pb-20 md:pb-0">
                {/* Mobile Course/Date Selection */}
                <div className="md:hidden space-y-3 mb-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      Course
                    </label>
                    <Select
                      onValueChange={(value) => {
                        setSelectedCourse(value)
                      }}
                    >
                      <SelectTrigger className="h-10 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
                        <SelectValue placeholder="Choose a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course._id} value={course._id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="truncate text-sm">
                                {course.name}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                      <Input
                        {...register('date', { required: true })}
                        type="date"
                        className="h-10 pl-10 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700"
                        defaultValue={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </div>

                {/* Desktop/Tablet Course and Date Selection */}
                <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      Course
                    </label>
                    <Select
                      onValueChange={(value) => {
                        setSelectedCourse(value)
                      }}
                    >
                      <SelectTrigger className="h-11 sm:h-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
                        <SelectValue placeholder="Choose a course to take attendance" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course._id} value={course._id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="truncate">
                                {course.name} ({course.code})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                      <Input
                        {...register('date', { required: true })}
                        type="date"
                        className="h-11 sm:h-12 pl-12 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700"
                        defaultValue={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      You can select any date (past, present, or future)
                    </p>
                  </div>
                </div>

                {selectedCourse && (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
                        <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Users className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500" />
                          <span className="hidden sm:inline">Student Attendance</span>
                          <span className="sm:hidden">Attendance</span>
                          <span className="text-sm sm:text-base">({students.length})</span>
                        </h3>
                        <div className="hidden sm:flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={markAllPresent}
                            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            All Present
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={markAllAbsent}
                            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            All Absent
                          </Button>
                        </div>
                      </div>
                      
                      {/* Mobile Quick Actions */}
                      <div className="sm:hidden flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={markAllPresent}
                          className="flex-1 h-8 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          All Present
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={markAllAbsent}
                          className="flex-1 h-8 text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          All Absent
                        </Button>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                      {/* Desktop Table View */}
                      <div className="hidden md:block max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                        <Table>
                          <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                            <TableRow>
                              <TableHead className="font-semibold">
                                Student ID
                              </TableHead>
                              <TableHead className="font-semibold">
                                Name
                              </TableHead>
                              <TableHead className="font-semibold text-center">
                                Attendance Status
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...students]
                              .sort((a, b) => {
                                const idA = a.studentId || ''
                                const idB = b.studentId || ''
                                return idA.localeCompare(idB, undefined, {
                                  numeric: true,
                                })
                              })
                              .map((student: Student) => (
                                <TableRow
                                  key={student._id}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                >
                                  <TableCell className="font-medium">
                                    {student.studentId}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {student.name}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex justify-center gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                          attendanceData[student._id] ===
                                          'present'
                                            ? 'default'
                                            : 'outline'
                                        }
                                        onClick={() =>
                                          handleAttendanceChange(
                                            student._id,
                                            'present'
                                          )
                                        }
                                        className={
                                          attendanceData[student._id] ===
                                          'present'
                                            ? 'bg-green-500 hover:bg-green-600 text-white'
                                            : 'border-green-200 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400'
                                        }
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Present
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                          attendanceData[student._id] ===
                                          'absent'
                                            ? 'destructive'
                                            : 'outline'
                                        }
                                        onClick={() =>
                                          handleAttendanceChange(
                                            student._id,
                                            'absent'
                                          )
                                        }
                                        className={
                                          attendanceData[student._id] ===
                                          'absent'
                                            ? 'bg-red-500 hover:bg-red-600 text-white'
                                            : 'border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400'
                                        }
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Absent
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden max-h-[60vh] overflow-y-auto space-y-2 pb-16">
                        {[...students]
                          .sort((a, b) => {
                            const idA = a.studentId || ''
                            const idB = b.studentId || ''
                            return idA.localeCompare(idB, undefined, {
                              numeric: true,
                            })
                          })
                          .map((student: Student) => (
                            <div
                              key={student._id}
                              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2"
                            >
                              <div className="flex flex-col space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    ID: {student.studentId}
                                  </span>
                                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    attendanceData[student._id] === 'present'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                      : attendanceData[student._id] === 'absent'
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                  }`}>
                                    {attendanceData[student._id] === 'present' ? '✓ Present' : 
                                     attendanceData[student._id] === 'absent' ? '✗ Absent' : 'Not Set'}
                                  </div>
                                </div>
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                  {student.name}
                                </h4>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={
                                    attendanceData[student._id] === 'present'
                                      ? 'default'
                                      : 'outline'
                                  }
                                  onClick={() =>
                                    handleAttendanceChange(
                                      student._id,
                                      'present'
                                    )
                                  }
                                  className={`flex-1 h-8 text-xs ${
                                    attendanceData[student._id] === 'present'
                                      ? 'bg-green-500 hover:bg-green-600 text-white'
                                      : 'border-green-200 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400'
                                  }`}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Present
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={
                                    attendanceData[student._id] === 'absent'
                                      ? 'destructive'
                                      : 'outline'
                                  }
                                  onClick={() =>
                                    handleAttendanceChange(
                                      student._id,
                                      'absent'
                                    )
                                  }
                                  className={`flex-1 h-8 text-xs ${
                                    attendanceData[student._id] === 'absent'
                                      ? 'bg-red-500 hover:bg-red-600 text-white'
                                      : 'border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400'
                                  }`}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Absent
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
                </div>
                {/* End of Scrollable Content Area */}

                {/* Desktop Save Actions */}
                <div className="hidden md:flex flex-row justify-end gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!selectedCourse}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Attendance
                  </Button>
                </div>

                {/* Mobile Fixed Save Actions */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-3 flex gap-2 z-[100] shadow-2xl">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1 h-10 text-sm font-medium border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!selectedCourse}
                    className="flex-1 h-10 text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Save Attendance
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400">
          Click "New Attendance" to record attendance for your section.
        </p>
      </CardContent>
    </Card>
  )
}

// Manage Attendance Reports Section Component
const EditAttendanceSection = ({
  sectionId,
  onEditRecord,
}: {
  sectionId: string
  onEditRecord: (record: AttendanceRecord) => void
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  // Get courses for display
  const { data: coursesResponse } = useGetSectionCoursesQuery(
    { sectionId },
    { skip: !sectionId }
  )
  const courses = coursesResponse?.data?.data || []

  // Get attendance records for this section and selected course with pagination
  const { data: attendanceResponse, isLoading } = useGetAttendanceRecordsQuery({
    sectionId,
    courseId:
      selectedCourseId === 'all' ? undefined : selectedCourseId || undefined,
    page: currentPage,
    limit: pageSize,
  })
  const attendanceRecords = attendanceResponse?.data?.data || []
  const totalRecords = attendanceResponse?.data?.pagination?.total || 0
  const totalPages = Math.ceil(totalRecords / pageSize)

  // Reset to page 1 when course changes
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId)
    setCurrentPage(1)
  }

  const handleEditRecord = (record: AttendanceRecord) => {
    onEditRecord(record)
  }

  const handleDownloadPDF = async (record: AttendanceRecord) => {
    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || 'https://crportal-nu.vercel.app/api'
      const response = await fetch(`${apiUrl}/attendance/${record._id}/pdf`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to download PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `attendance-${new Date(record.date).toLocaleDateString()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to download PDF. Please try again.')
    }
  }

  const getCourseName = (
    courseId: string | { _id: string; name: string; code?: string }
  ) => {
    if (typeof courseId === 'string') {
      const course = courses.find((c) => c._id === courseId)
      return course ? `${course.name} (${course.code})` : courseId
    }
    return `${courseId.name} (${courseId.code || ''})`
  }

  return (
    <Card className="overflow-hidden shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">
                Manage Attendance Reports
              </h2>
              <p className="text-amber-100 text-sm">
                View and edit existing attendance records
              </p>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Select Course
          </h4>
          <Select value={selectedCourseId} onValueChange={handleCourseChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a course to view attendance records" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course._id} value={course._id}>
                  {course.name} ({course.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 mx-auto mb-4 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading attendance records...
            </p>
          </div>
        ) : selectedCourseId !== 'all' && attendanceRecords.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Attendance Records
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              No attendance records found for the selected course.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Attendance Records
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {attendanceRecords.length} of {totalRecords} records
              </p>
            </div>
            <div className="space-y-3">
              {attendanceRecords.map((record) => (
                <div
                  key={record._id}
                  className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                        <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full">
                          {getCourseName(record.courseId)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{record.attendees.length} students</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>
                            {
                              record.attendees.filter(
                                (a) => a.status === 'present'
                              ).length
                            }{' '}
                            present
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-red-500" />
                          <span>
                            {
                              record.attendees.filter(
                                (a) => a.status === 'absent'
                              ).length
                            }{' '}
                            absent
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditRecord(record)}
                        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPDF(record)}
                        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3"
                  >
                    First
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      return (
                        <Button
                          key={pageNum}
                          size="sm"
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                              : ''
                          }`}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3"
                  >
                    Next
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3"
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Download Reports Section Component
const DownloadReportsSection = ({ sectionId }: { sectionId: string }) => {
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [availableSessions, setAvailableSessions] = useState<
    AttendanceRecord[]
  >([])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  // Get courses for the CR's section
  const { data: coursesResponse } = useGetSectionCoursesQuery(
    { sectionId },
    { skip: !sectionId }
  )
  const courses = coursesResponse?.data?.data || []

  // Get all attendance records for the selected course
  const { data: attendanceResponse } = useGetAttendanceRecordsQuery({
    sectionId,
  })

  // Memoize allAttendance to prevent unnecessary re-renders
  const allAttendance = React.useMemo(() => {
    return attendanceResponse?.data?.data || []
  }, [attendanceResponse?.data?.data])

  // Filter sessions by selected course
  React.useEffect(() => {
    if (selectedCourse && allAttendance.length > 0) {
      const courseSessions = allAttendance
        .filter((record) => {
          if (typeof record.courseId === 'string') {
            return record.courseId === selectedCourse
          }
          return record.courseId._id === selectedCourse
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setAvailableSessions(courseSessions)
      setCurrentPage(1) // Reset to page 1 when course changes
    } else {
      setAvailableSessions([])
      setCurrentPage(1)
    }
  }, [selectedCourse, allAttendance])

  // Pagination calculations
  const totalSessions = availableSessions.length
  const totalPages = Math.ceil(totalSessions / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedSessions = availableSessions.slice(startIndex, endIndex)

  const [downloadAttendancePDF] = useDownloadAttendancePDFMutation()

  const downloadSessionPDF = async (
    attendanceId: string,
    courseName: string,
    date: string
  ) => {
    try {
      console.log(
        '[PDF DOWNLOAD] Starting download for attendance:',
        attendanceId
      )

      const blob = await downloadAttendancePDF(attendanceId).unwrap()
      console.log('[PDF DOWNLOAD] PDF blob received, size:', blob.size)

      if (blob.size === 0) {
        throw new Error('Received empty PDF file')
      }

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${courseName}-attendance-${date}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // You can add a toast notification here
      console.log('[PDF DOWNLOAD] Success!')
    } catch (error) {
      console.error('[PDF DOWNLOAD] Error:', error)

      let errorMessage = 'Failed to download PDF'
      if (error && typeof error === 'object' && 'status' in error) {
        if (error.status === 403) {
          errorMessage =
            'You do not have permission to download this attendance record'
        } else if (error.status === 404) {
          errorMessage = 'Attendance record not found'
        }
      }

      // You can add a toast notification here
      alert(errorMessage)
    }
  }

  return (
    <Card className="overflow-hidden shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Download Attendance Reports</h3>
              <p className="text-emerald-100 text-sm">
                Select course and download specific session reports
              </p>
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Course Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-500" />
              Select Course
            </label>
            <Select
              onValueChange={(value) => {
                setSelectedCourse(value)
              }}
              value={selectedCourse}
            >
              <SelectTrigger className="h-12 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-700">
                <SelectValue placeholder="Choose a course to view attendance sessions" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course._id} value={course._id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="font-medium">{course.name}</span>
                      <span className="text-sm text-gray-500">
                        ({course.code})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Available Sessions */}
          {selectedCourse && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Available Sessions
                  </h4>
                </div>
                {availableSessions.length > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalSessions)} of {totalSessions} sessions
                  </p>
                )}
              </div>

              {availableSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No attendance sessions found for this course
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-3">
                    {paginatedSessions.map((session) => {
                    const courseName =
                      typeof session.courseId === 'string'
                        ? session.courseId
                        : session.courseId.name
                    const courseCode =
                      typeof session.courseId === 'string'
                        ? ''
                        : session.courseId.code
                    const date = new Date(session.date).toLocaleDateString()
                    const totalStudents = session.attendees.length
                    const presentStudents = session.attendees.filter(
                      (a) => a.status === 'present'
                    ).length
                    const attendancePercentage =
                      totalStudents > 0
                        ? Math.round((presentStudents / totalStudents) * 100)
                        : 0

                    return (
                      <div
                        key={session._id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {date}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {courseName} {courseCode && `(${courseCode})`}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {presentStudents}/{totalStudents} present
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                attendancePercentage >= 80
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : attendancePercentage >= 60
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}
                            >
                              {attendancePercentage}%
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={() =>
                            downloadSessionPDF(session._id, courseName, date)
                          }
                          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                          size="sm"
                        >
                          <Download className="h-4 w-4" />
                          <span className="hidden sm:inline">Download PDF</span>
                        </Button>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination Controls - Always show if there are sessions */}
                {availableSessions.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {totalPages > 1 ? (
                        <>Page {currentPage} of {totalPages}</>
                      ) : (
                        <>Showing all {totalSessions} sessions</>
                      )}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="px-3"
                        >
                          First
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3"
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                              pageNum = i + 1
                            } else if (currentPage <= 3) {
                              pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = currentPage - 2 + i
                            }
                            return (
                              <Button
                                key={pageNum}
                                size="sm"
                                variant={currentPage === pageNum ? 'default' : 'outline'}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-10 ${
                                  currentPage === pageNum
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                                    : ''
                                }`}
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-3"
                        >
                          Next
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-3"
                        >
                          Last
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
              )}
            </div>
          )}

          {!selectedCourse && (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Select a course to view available attendance sessions
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Recent Attendance Section Component
const RecentAttendanceSection = ({
  attendance,
  isLoading = false,
}: {
  attendance: AttendanceRecord[]
  isLoading?: boolean
}) => {
  // Defensive check to ensure attendance is an array
  const safeAttendance = Array.isArray(attendance) ? attendance : []

  const recentAttendance = [...safeAttendance]
    .filter(
      (record): record is AttendanceRecord =>
        record &&
        typeof record === 'object' &&
        'date' in record &&
        '_id' in record
    )
    .sort(
      (a: AttendanceRecord, b: AttendanceRecord) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 10)

  const [downloadAttendancePDF] = useDownloadAttendancePDFMutation()

  const downloadPDF = async (attendanceId: string) => {
    try {
      console.log(
        '[PDF DOWNLOAD] Starting download for attendance:',
        attendanceId
      )

      const blob = await downloadAttendancePDF(attendanceId).unwrap()
      console.log('[PDF DOWNLOAD] PDF blob received, size:', blob.size)

      if (blob.size === 0) {
        throw new Error('Received empty PDF file')
      }

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `attendance-${attendanceId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('[PDF DOWNLOAD] REduan:', error)

      let errorMessage = 'Failed to download PDF'
      if (error && typeof error === 'object' && 'status' in error) {
        if (error.status === 403) {
          errorMessage =
            'You do not have permission to download this attendance record'
        } else if (error.status === 404) {
          errorMessage = 'Attendance record not found'
        }
      }

      toast.error(errorMessage)
    }
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading attendance records...
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <Clock className="h-6 w-6 text-white" />
          <h3 className="text-xl font-semibold text-white">
            Recent Attendance Records
          </h3>
        </div>
      </div>

      <CardContent className="p-6">
        {recentAttendance.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              No attendance records yet
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              Start taking attendance to see records here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentAttendance.slice(0, 5).map((record: AttendanceRecord) => {
              const totalStudents = record.attendees.length
              const presentStudents = record.attendees.filter(
                (a) => a.status === 'present'
              ).length
              const attendancePercentage =
                totalStudents > 0
                  ? ((presentStudents / totalStudents) * 100).toFixed(1)
                  : '0'

              return (
                <div
                  key={record._id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <BookOpen className="h-4 w-4 text-green-500" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {typeof record.courseId === 'string'
                            ? record.courseId
                            : record.courseId.name}
                        </span>
                        {typeof record.courseId === 'object' &&
                          record.courseId.code && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({record.courseId.code})
                            </span>
                          )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(record.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{presentStudents} present</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {presentStudents}/{totalStudents}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {attendancePercentage}% present
                        </div>
                      </div>

                      <div className="w-12 h-12 relative">
                        <svg
                          className="w-12 h-12 transform -rotate-90"
                          viewBox="0 0 36 36"
                        >
                          <path
                            className="text-gray-200 dark:text-gray-600"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={`${
                              parseFloat(attendancePercentage) >= 80
                                ? 'text-green-500'
                                : parseFloat(attendancePercentage) >= 60
                                  ? 'text-yellow-500'
                                  : 'text-red-500'
                            }`}
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={`${parseFloat(attendancePercentage)}, 100`}
                            strokeLinecap="round"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {attendancePercentage}%
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadPDF(record._id)}
                        className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20"
                      >
                        <FileText className="h-3 w-3" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
