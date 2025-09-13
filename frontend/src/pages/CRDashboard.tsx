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
  useGetAttendanceRecordsQuery,
  useGetCourseStudentsQuery,
  useGetSectionCoursesQuery,
  useGetSectionStudentsQuery,
} from '@/lib/apiSlice'
import type { RootState } from '@/lib/simpleStore'
import type { AttendanceRecord, Student } from '@/types'
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  History,
  LogOut,
  Plus,
  Users,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
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

  // Add loading state check
  if (isLoading) {
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
  const currentUser = authUser || user

  const handleLogout = async () => {
    console.log('[CR DASHBOARD] Logout button clicked')
    console.log('[CR DASHBOARD] Auth object:', auth)

    try {
      if (auth?.logout) {
        console.log('[CR DASHBOARD] Calling auth.logout()')
        await auth.logout()
        console.log('[CR DASHBOARD] auth.logout() completed')
      } else {
        console.log('[CR DASHBOARD] auth.logout not available')
      }
      console.log('[CR DASHBOARD] Navigating to login')
      // Force redirect using window.location for immediate effect
      window.location.href = '/login'
    } catch (error) {
      console.error('[CR DASHBOARD] Logout failed:', error)
      // Still navigate to login even if logout fails
      window.location.href = '/login'
    }
  }

  const handleNavigateToHistory = () => {
    navigate('/attendance-history')
  }

  if (!currentUser) {
    console.log('[CR DASHBOARD] No current user, redirecting to login')
    navigate('/login')
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Redirecting to login...
          </p>
        </div>
      </div>
    )
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
          <Button onClick={() => navigate('/login')} className="mt-4">
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
          <Button onClick={() => navigate('/login')} className="mt-4">
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              CR Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Welcome, {currentUser.name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleNavigateToHistory}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              View History
            </Button>
            <ThemeToggle />
            <Button onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            CR Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Managing attendance for section:{' '}
            {typeof currentUser.sectionId === 'string'
              ? currentUser.sectionId
              : `${currentUser.sectionId.name} ${currentUser.sectionId.code ? `(${currentUser.sectionId.code})` : ''}`}
          </p>
        </div>

        {/* Quick Stats */}
        <CRStatsCards sectionId={sectionId} />

        {/* Take Attendance Section */}
        <TakeAttendanceSection sectionId={sectionId} />

        {/* Recent Attendance Records */}
        <ErrorBoundary>
          <RecentAttendanceSection sectionId={sectionId} />
        </ErrorBoundary>
      </div>
    </div>
  )
}

// CR Stats Cards Component
const CRStatsCards = ({ sectionId }: { sectionId: string }) => {
  const { data: studentsResponse } = useGetSectionStudentsQuery(
    { sectionId },
    { skip: !sectionId }
  )
  const { data: attendanceResponse } = useGetAttendanceRecordsQuery(
    { sectionId },
    { skip: !sectionId }
  )
  const { data: coursesResponse } = useGetSectionCoursesQuery(
    { sectionId },
    { skip: !sectionId }
  )

  const students = studentsResponse?.data?.data || []
  const attendance = attendanceResponse?.data?.data || []
  const courses = coursesResponse?.data?.data || []

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
      color: 'bg-blue-500',
    },
    {
      title: 'Available Courses',
      value: courses.length,
      icon: BookOpen,
      color: 'bg-green-500',
    },
    {
      title: "Today's Sessions",
      value: todayAttendance.length,
      icon: Clock,
      color: 'bg-purple-500',
    },
    {
      title: 'Total Records',
      value: attendance.length,
      icon: CheckCircle,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
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
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Take Attendance</span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Attendance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Take Attendance</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Course</label>
                    <Select
                      onValueChange={(value) => {
                        setSelectedCourse(value)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course._id} value={course._id}>
                            {course.name} ({course.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input
                        {...register('date', { required: true })}
                        type="date"
                        className="pl-10"
                        defaultValue={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      You can select any date (past, present, or future)
                    </p>
                  </div>
                </div>

                {selectedCourse && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">
                        Student Attendance
                      </h3>
                      <div className="space-x-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={markAllPresent}
                        >
                          Mark All Present
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={markAllAbsent}
                        >
                          Mark All Absent
                        </Button>
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
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
                              <TableRow key={student._id}>
                                <TableCell>{student.studentId}</TableCell>
                                <TableCell className="font-medium">
                                  {student.name}
                                </TableCell>
                                <TableCell>{student.email}</TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
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
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
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
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!selectedCourse}>
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

// Recent Attendance Section Component
const RecentAttendanceSection = ({ sectionId }: { sectionId: string }) => {
  const { data: attendanceResponse, isLoading } = useGetAttendanceRecordsQuery({
    sectionId,
  })

  const attendance = attendanceResponse?.data?.data || []

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

  if (isLoading) return <div>Loading attendance records...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Attendance Records</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Total Students</TableHead>
                <TableHead>Present</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Attendance %</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAttendance.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-gray-500 py-8"
                  >
                    No attendance records found. Start by taking attendance!
                  </TableCell>
                </TableRow>
              ) : (
                recentAttendance.map((record: AttendanceRecord) => {
                  const totalStudents = record.attendees.length
                  const presentStudents = record.attendees.filter(
                    (a) => a.status === 'present'
                  ).length
                  const attendancePercentage =
                    totalStudents > 0
                      ? ((presentStudents / totalStudents) * 100).toFixed(1)
                      : '0'

                  return (
                    <TableRow key={record._id}>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {typeof record.courseId === 'string'
                          ? record.courseId
                          : `${record.courseId.name} (${record.courseId.code})`}
                      </TableCell>
                      <TableCell>{totalStudents}</TableCell>
                      <TableCell className="text-green-600">
                        {presentStudents}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {totalStudents - presentStudents}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            parseFloat(attendancePercentage) >= 80
                              ? 'bg-green-100 text-green-800'
                              : parseFloat(attendancePercentage) >= 60
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {attendancePercentage}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadPDF(record._id)}
                          className="flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
