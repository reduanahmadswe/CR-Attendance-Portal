/* eslint-disable @typescript-eslint/no-unused-vars */
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { QRGenerator } from '@/components/QRGenerator'
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
  History,
  Plus,
  QrCode,
  Settings,
  Users,
  XCircle,
} from 'lucide-react'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'

// Quick Access Card Component for CR
interface QuickAccessCardProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
  onClick?: () => void;
  isActive?: boolean;
}

const QuickAccessCard = ({ icon, label, bgColor, onClick, isActive }: QuickAccessCardProps) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-4 sm:p-6 bg-white rounded-2xl border-2 transition-all duration-300 hover:shadow-lg group ${
      isActive ? 'border-blue-300 shadow-lg bg-blue-50/30' : 'border-gray-100 shadow-sm hover:border-gray-200'
    }`}
  >
    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${bgColor} flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300`}>
      {icon}
    </div>
    <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">{label}</span>
  </button>
);

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
  const [activeSection, setActiveSection] = useState<'dashboard' | 'reports' | 'qr-attendance'>(
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Use authUser from context if available, fallback to Redux user
  // const currentUser = authUser || user (moved to top)

  // Helper function to get student info by ID
  const getStudentInfo = (studentId: string) => {
    const student = sectionStudents.find((s) => s._id === studentId)

   

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

  if (!currentUser) {
    console.log('[CR DASHBOARD] No current user, checking token')
    const token = localStorage.getItem('accessToken')

    if (!token) {
      console.log('[CR DASHBOARD] No token, redirecting to login')
      navigate('/auth/login')
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">
              Redirecting to login...
            </p>
          </div>
        </div>
      )
    } else {
     
      // Token exists but user data not loaded yet, show loading
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              Loading user data...
            </p>
          </div>
        </div>
      )
    }
  }

  if (currentUser.role !== 'cr') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Unauthorized Access
          </h2>
          <p className="text-gray-600">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-yellow-600 mb-2">
            No Section Assigned
          </h2>
          <p className="text-gray-600">
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
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
          <div className="rounded-xl p-3 sm:p-4 border bg-emerald-50 border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-white shadow-sm">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600">{mainStudents.length}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">STUDENTS</p>
          </div>
          <div className="rounded-xl p-3 sm:p-4 border bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-white shadow-sm">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{mainCourses.length}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">COURSES</p>
          </div>
          <div className="rounded-xl p-3 sm:p-4 border bg-purple-50 border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-white shadow-sm">
                <Calendar className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-purple-600">{mainAttendance.length}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">RECORDS</p>
          </div>
          <div className="rounded-xl p-3 sm:p-4 border bg-green-50 border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-white shadow-sm">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {mainAttendance.reduce((acc, r) => acc + r.attendees.filter(a => a.status === 'present').length, 0)}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">PRESENT</p>
          </div>
          <div className="rounded-xl p-3 sm:p-4 border bg-red-50 border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-white shadow-sm">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-red-600">
              {mainAttendance.reduce((acc, r) => acc + r.attendees.filter(a => a.status === 'absent').length, 0)}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">ABSENT</p>
          </div>
        </div>

        {/* Quick Access Section */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            <QuickAccessCard
              icon={<QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />}
              label="QR Attendance"
              color="emerald"
              bgColor="bg-emerald-50"
              onClick={() => setActiveSection(activeSection === 'qr-attendance' ? 'dashboard' : 'qr-attendance')}
              isActive={activeSection === 'qr-attendance'}
            />
            <QuickAccessCard
              icon={<Plus className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />}
              label="Take Attendance"
              color="blue"
              bgColor="bg-blue-50"
              onClick={() => setActiveSection('dashboard')}
              isActive={activeSection === 'dashboard'}
            />
            <QuickAccessCard
              icon={<FileText className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />}
              label="Reports"
              color="orange"
              bgColor="bg-orange-50"
              onClick={() => setActiveSection(activeSection === 'reports' ? 'dashboard' : 'reports')}
              isActive={activeSection === 'reports'}
            />
            <QuickAccessCard
              icon={<History className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />}
              label="History"
              color="indigo"
              bgColor="bg-indigo-50"
              onClick={() => navigate('/reports/attendance-history')}
            />
            <QuickAccessCard 
              icon={<Bell className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500" />}
              label="Announcements"
              color="pink"
              bgColor="bg-pink-50"
              onClick={() => navigate('/announcements')}
            />
            <QuickAccessCard
              icon={<Settings className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />}
              label="Security"
              color="gray"
              bgColor="bg-gray-50"
              onClick={() => navigate('/settings/security')}
            />
          </div>
        </div>

        {/* Section Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              Managing Section:{' '}
              <span className="font-bold">
                {typeof currentUser.sectionId === 'string'
                  ? currentUser.sectionId
                  : `${currentUser.sectionId.name} ${currentUser.sectionId.code ? `(${currentUser.sectionId.code})` : ''}`}
              </span>
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {/* Content Sections */}
          <div className="transition-all duration-500 ease-in-out">
            {activeSection === 'dashboard' ? (
              <div className="space-y-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Take Attendance</h3>
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
            ) : activeSection === 'qr-attendance' ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">QR Code Attendance</h3>
                {/* QR Attendance Section */}
                <ErrorBoundary>
                  <QRGenerator sectionId={sectionId} courses={mainCourses || []} />
                </ErrorBoundary>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Reports & Downloads</h3>
                <div className="space-y-6">
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
                <div className="px-4 py-3 bg-blue-50 border-b flex-shrink-0">
                  <h3 className="font-semibold text-blue-800 text-sm sm:text-base">
                    Course:{' '}
                    {typeof editingRecord.courseId === 'string'
                      ? editingRecord.courseId
                      : `${editingRecord.courseId.name} (${editingRecord.courseId.code})`}
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-600">
                    Date: {new Date(editingRecord.date).toLocaleDateString()}
                  </p>
                </div>

                {/* Loading state */}
                {sectionStudents.length === 0 && (
                  <div className="px-4 py-3 bg-yellow-50 border-b flex-shrink-0">
                    <p className="text-xs sm:text-sm text-yellow-800 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Loading student information...
                    </p>
                  </div>
                )}

                {/* Students List - Scrollable content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b flex-shrink-0">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
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
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-3 sm:gap-0"
                          >
                            {/* Student Info */}
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs sm:text-sm font-medium">
                                  {studentInfo.name.charAt(0) || 'S'}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                                  {studentInfo.name}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500">
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
                                    : 'border-green-300 text-green-700 hover:bg-green-50'
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
                                    : 'border-red-300 text-red-700 hover:bg-red-50'
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
                <div className="px-4 py-3 border-t bg-gray-50 flex-shrink-0">
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
      <Card className="border border-gray-200/60 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
            <Download className="h-12 w-12 text-indigo-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Courses Available
          </h3>
          <p className="text-gray-500">
            No courses found for your section.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200/60 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          <Download className="h-6 w-6 text-indigo-600" />
          Download Course Attendance
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Download all attendance records for any course as a ZIP file containing individual PDFs for each date
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {courses.map((course) => (
          <div
            key={course._id}
            className="group p-5 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-indigo-300 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-base mb-1 line-clamp-2">
                  {course.name}
                </h4>
                <p className="text-xs text-gray-500 font-mono">
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
    <Card className="overflow-hidden shadow-xl border-0 bg-white/80 backdrop-blur-sm">
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
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      Course
                    </label>
                    <Select
                      onValueChange={(value) => {
                        setSelectedCourse(value)
                      }}
                    >
                      <SelectTrigger className="h-10 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
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
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                      <Input
                        {...register('date', { required: true })}
                        type="date"
                        className="h-10 pl-10 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200"
                        defaultValue={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </div>

                {/* Desktop/Tablet Course and Date Selection */}
                <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      Course
                    </label>
                    <Select
                      onValueChange={(value) => {
                        setSelectedCourse(value)
                      }}
                    >
                      <SelectTrigger className="h-11 sm:h-12 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
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
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                      <Input
                        {...register('date', { required: true })}
                        type="date"
                        className="h-11 sm:h-12 pl-12 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200"
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
                        <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
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
                            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            All Present
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={markAllAbsent}
                            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
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
                          className="flex-1 h-8 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          All Present
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={markAllAbsent}
                          className="flex-1 h-8 text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          All Absent
                        </Button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      {/* Desktop Table View */}
                      <div className="hidden md:block max-h-80 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                        <Table>
                          <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
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
                                  className="hover:bg-gray-50"
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
                                            : 'border-green-200 text-green-700 hover:bg-green-50'
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
                                            : 'border-red-200 text-red-700 hover:bg-red-50'
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
                              className="bg-white border border-gray-200 rounded-lg p-3 space-y-2"
                            >
                              <div className="flex flex-col space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-gray-500">
                                    ID: {student.studentId}
                                  </span>
                                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    attendanceData[student._id] === 'present'
                                      ? 'bg-green-100 text-green-800'
                                      : attendanceData[student._id] === 'absent'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {attendanceData[student._id] === 'present' ? '✓ Present' : 
                                     attendanceData[student._id] === 'absent' ? '✗ Absent' : 'Not Set'}
                                  </div>
                                </div>
                                <h4 className="font-semibold text-gray-900 text-sm">
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
                                      : 'border-green-200 text-green-700 hover:bg-green-50'
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
                                      : 'border-red-200 text-red-700 hover:bg-red-50'
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
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex gap-2 z-[100] shadow-2xl">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1 h-10 text-sm font-medium border-gray-300 hover:bg-gray-50"
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
        <p className="text-gray-600">
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
    <Card className="overflow-hidden shadow-xl border-0 bg-white/80 backdrop-blur-sm">
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
          <h4 className="text-lg font-semibold text-gray-900">
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
            <p className="text-gray-600">
              Loading attendance records...
            </p>
          </div>
        ) : selectedCourseId !== 'all' && attendanceRecords.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Attendance Records
            </h3>
            <p className="text-gray-500">
              No attendance records found for the selected course.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h4 className="text-lg font-semibold text-gray-900">
                Attendance Records
              </h4>
              <p className="text-sm text-gray-600">
                Showing {attendanceRecords.length} of {totalRecords} records
              </p>
            </div>
            <div className="space-y-3">
              {attendanceRecords.map((record) => (
                <div
                  key={record._id}
                  className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                          {getCourseName(record.courseId)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
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
    <Card className="overflow-hidden shadow-xl border-0 bg-white/80 backdrop-blur-sm">
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
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-500" />
              Select Course
            </label>
            <Select
              onValueChange={(value) => {
                setSelectedCourse(value)
              }}
              value={selectedCourse}
            >
              <SelectTrigger className="h-12 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
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
                  <h4 className="font-semibold text-gray-900">
                    Available Sessions
                  </h4>
                </div>
                {availableSessions.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalSessions)} of {totalSessions} sessions
                  </p>
                )}
              </div>

              {availableSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
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
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            <span className="font-medium text-gray-900">
                              {date}
                            </span>
                            <span className="text-sm text-gray-500">
                              {courseName} {courseCode && `(${courseCode})`}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {presentStudents}/{totalStudents} present
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                attendancePercentage >= 80
                                  ? 'bg-green-100 text-green-800'
                                  : attendancePercentage >= 60
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
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
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
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
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
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
      <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Loading attendance records...
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm">
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
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              No attendance records yet
            </p>
            <p className="text-gray-400 text-sm mt-2">
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
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <BookOpen className="h-4 w-4 text-green-500" />
                        <span className="font-semibold text-gray-900">
                          {typeof record.courseId === 'string'
                            ? record.courseId
                            : record.courseId.name}
                        </span>
                        {typeof record.courseId === 'object' &&
                          record.courseId.code && (
                            <span className="text-sm text-gray-500">
                              ({record.courseId.code})
                            </span>
                          )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                        <div className="text-sm font-medium text-gray-900">
                          {presentStudents}/{totalStudents}
                        </div>
                        <div className="text-xs text-gray-500">
                          {attendancePercentage}% present
                        </div>
                      </div>

                      <div className="w-12 h-12 relative">
                        <svg
                          className="w-12 h-12 transform -rotate-90"
                          viewBox="0 0 36 36"
                        >
                          <path
                            className="text-gray-200"
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
                          <span className="text-xs font-bold text-gray-700">
                            {attendancePercentage}%
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadPDF(record._id)}
                        className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200"
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
