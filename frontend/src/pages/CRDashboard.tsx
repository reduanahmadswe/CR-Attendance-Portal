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
  useGetAttendanceRecordsQuery,
  useGetSectionCoursesQuery,
  useGetSectionStudentsQuery,
  useGetSectionsQuery,
} from '@/lib/apiSlice'
import type { RootState } from '@/lib/simpleStore'
import { clearCredentials } from '@/lib/simpleStore'
import type { AttendanceRecord, Student } from '@/types'
import {
  BookOpen,
  CheckCircle,
  Clock,
  History,
  LogOut,
  Plus,
  Users,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

interface AttendanceFormData {
  course: string
  date: string
}

export function CRDashboard() {
  const user = useSelector((state: RootState) => state.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(clearCredentials())
    navigate('/login')
  }

  const handleNavigateToHistory = () => {
    navigate('/attendance-history')
  }

  if (!user || user.role !== 'cr') {
    return <div className="p-6">Unauthorized access</div>
  }

  if (!user.sectionId) {
    return <div className="p-6">No section assigned</div>
  }

  const sectionId =
    typeof user.sectionId === 'string' ? user.sectionId : user.sectionId._id

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
              Welcome, {user.name}
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
            {typeof user.sectionId === 'string'
              ? user.sectionId
              : `${user.sectionId.name} ${user.sectionId.code ? `(${user.sectionId.code})` : ''}`}
          </p>
        </div>

        {/* Quick Stats */}
        <CRStatsCards sectionId={sectionId} />

        {/* Take Attendance Section */}
        <TakeAttendanceSection sectionId={sectionId} />

        {/* Recent Attendance Records */}
        <RecentAttendanceSection sectionId={sectionId} />
      </div>
    </div>
  )
}

// CR Stats Cards Component
const CRStatsCards = ({ sectionId }: { sectionId: string }) => {
  const { data: studentsResponse } = useGetSectionStudentsQuery({ sectionId })
  const { data: attendanceResponse } = useGetAttendanceRecordsQuery({
    sectionId,
  })
  const { data: sectionsResponse } = useGetSectionsQuery({})

  const students = studentsResponse?.data?.data || []
  const attendance = attendanceResponse?.data?.data || []

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
      value: sectionsResponse?.data?.data?.length || 0,
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
  const { data: studentsResponse } = useGetSectionStudentsQuery({ sectionId })
  const [createAttendanceRecord] = useCreateAttendanceRecordMutation()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [attendanceData, setAttendanceData] = useState<
    Record<string, 'present' | 'absent'>
  >({})

  const students = studentsResponse?.data?.data || []

  // Get courses for the CR's section
  const { data: coursesResponse } = useGetSectionCoursesQuery(
    { sectionId },
    { skip: !sectionId }
  )
  const courses = coursesResponse?.data?.data || []

  const { register, handleSubmit, reset } = useForm<AttendanceFormData>()

  const onSubmit = async (data: AttendanceFormData) => {
    try {
      const attendees = students.map((student: Student) => ({
        studentId: student._id,
        status: attendanceData[student._id] || ('absent' as const),
      }))

      await createAttendanceRecord({
        sectionId: sectionId,
        courseId: data.course,
        date: data.date,
        attendees,
      }).unwrap()

      setIsDialogOpen(false)
      setSelectedCourse('')
      setAttendanceData({})
      reset()
    } catch (error) {
      console.error('Error creating attendance:', error)
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
                    <input
                      type="hidden"
                      {...register('course')}
                      value={selectedCourse}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Input
                      {...register('date', { required: true })}
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                    />
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
                          {students.map((student: Student) => (
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
  const recentAttendance = attendance
    .sort(
      (a: AttendanceRecord, b: AttendanceRecord) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 10)

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAttendance.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
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
