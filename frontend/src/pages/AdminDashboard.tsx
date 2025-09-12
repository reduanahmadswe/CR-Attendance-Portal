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
import { Textarea } from '@/components/ui/textarea'

// Type definitions for forms
interface CreateUserForm {
  name: string
  email: string
  role: 'admin' | 'cr' | 'instructor' | 'viewer'
  sectionId?: string
  password: string
}

// Helper function to handle API errors
const handleApiError = (error: unknown) => {
  if (error && typeof error === 'object' && 'data' in error) {
    const apiError = error as { data?: { message?: string } }
    return apiError.data?.message || 'An error occurred'
  }
  return error instanceof Error ? error.message : 'An error occurred'
}

import {
  useCreateCourseMutation,
  useCreateSectionMutation,
  useCreateStudentMutation,
  useCreateUserMutation,
  useDeleteCourseMutation,
  useDeleteSectionMutation,
  useDeleteStudentMutation,
  useDeleteUserMutation,
  useGetAttendanceRecordsQuery,
  useGetSectionCoursesQuery,
  useGetSectionStudentsQuery,
  useGetSectionsQuery,
  useGetUsersQuery,
  useUpdateCourseMutation,
  useUpdateSectionMutation,
  useUpdateStudentMutation,
  useUpdateUserMutation,
} from '@/lib/apiSlice'
import { type RootState } from '@/lib/simpleStore'
import type {
  AttendanceRecord,
  Course,
  CreateCourseRequest,
  CreateSectionRequest,
  CreateStudentRequest,
  Section,
  Student,
  User,
} from '@/types'
import {
  BarChart3,
  BookOpen,
  Edit,
  FileText,
  GraduationCap,
  History,
  LogOut,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'

function AdminDashboard() {
  const user = useSelector((state: RootState) => state.auth.user)
  const auth = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<
    'sections' | 'courses' | 'students' | 'users' | 'attendance'
  >('sections')

  const handleLogout = async () => {
    console.log('[ADMIN DASHBOARD] Logout button clicked')
    console.log('[ADMIN DASHBOARD] Auth object:', auth)

    try {
      if (auth?.logout) {
        console.log('[ADMIN DASHBOARD] Calling auth.logout()')
        await auth.logout()
        console.log('[ADMIN DASHBOARD] auth.logout() completed')
      } else {
        console.log('[ADMIN DASHBOARD] auth.logout not available')
      }
      console.log('[ADMIN DASHBOARD] Navigating to login')
      // Force redirect using window.location for immediate effect
      window.location.href = '/login'
    } catch (error) {
      console.error('[ADMIN DASHBOARD] Logout failed:', error)
      // Still navigate to login even if logout fails
      window.location.href = '/login'
    }
  }

  const handleNavigateToHistory = () => {
    navigate('/attendance-history')
  }

  if (!user || user.role !== 'admin') {
    return <div className="p-6">Unauthorized access. Admin role required.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
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
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage sections, courses, students, and users
          </p>
        </div>

        {/* Quick Stats */}
        <AdminStatsCards />

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'sections', label: 'Sections', icon: GraduationCap },
              { id: 'courses', label: 'Courses', icon: BookOpen },
              { id: 'students', label: 'Students', icon: Users },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'attendance', label: 'Attendance', icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as
                      | 'sections'
                      | 'courses'
                      | 'students'
                      | 'users'
                      | 'attendance'
                  )
                }
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'sections' && <SectionsManagement />}
        {activeTab === 'courses' && <CoursesManagement />}
        {activeTab === 'students' && <StudentsManagement />}
        {activeTab === 'users' && <UsersManagement />}
        {activeTab === 'attendance' && <AttendanceManagement />}
      </div>
    </div>
  )
}

// Admin Stats Cards Component
const AdminStatsCards = () => {
  const { data: sectionsResponse } = useGetSectionsQuery({})
  const { data: usersResponse } = useGetUsersQuery({})
  const { data: attendanceResponse } = useGetAttendanceRecordsQuery({})

  const sections = sectionsResponse?.data?.data || []
  const users = usersResponse?.data?.data || []
  const attendance = attendanceResponse?.data?.data || []

  const stats = [
    {
      title: 'Total Sections',
      value: sections.length,
      icon: GraduationCap,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Users',
      value: users.length,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Attendance Records',
      value: attendance.length,
      icon: BarChart3,
      color: 'bg-purple-500',
    },
    {
      title: 'Active CRs',
      value: users.filter((user) => user.role === 'cr').length,
      icon: Users,
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

// Sections Management Component
const SectionsManagement = () => {
  const { data: sectionsResponse, isLoading } = useGetSectionsQuery({})
  const [createSection] = useCreateSectionMutation()
  const [updateSection] = useUpdateSectionMutation()
  const [deleteSection] = useDeleteSectionMutation()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)

  const { register, handleSubmit, reset, setValue } =
    useForm<CreateSectionRequest>()

  const sections = sectionsResponse?.data?.data || []

  const onSubmit = async (data: CreateSectionRequest) => {
    try {
      if (editingSection) {
        await updateSection({
          id: editingSection._id,
          data,
        }).unwrap()
        toast.success('Section updated successfully!')
      } else {
        await createSection(data).unwrap()
        toast.success('Section created successfully!')
      }
      setIsDialogOpen(false)
      setEditingSection(null)
      reset()
    } catch (error: unknown) {
      toast.error(handleApiError(error))
    }
  }

  const handleEdit = (section: Section) => {
    setEditingSection(section)
    setValue('name', section.name)
    setValue('code', section.code || '')
    setValue('description', section.description || '')
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this section?')) {
      try {
        await deleteSection(id).unwrap()
        toast.success('Section deleted successfully!')
      } catch (error: unknown) {
        toast.error(handleApiError(error) || 'Failed to delete section')
      }
    }
  }

  if (isLoading) return <div>Loading sections...</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Sections Management</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSection ? 'Edit Section' : 'Add New Section'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Section Name</label>
                  <Input
                    {...register('name', { required: true })}
                    placeholder="e.g., CSE-3A"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Section Code</label>
                  <Input {...register('code')} placeholder="e.g., CSE3A" />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    {...register('description')}
                    placeholder="Section description"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      setEditingSection(null)
                      reset()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSection ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-white dark:bg-gray-800 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((section) => (
                <TableRow key={section._id}>
                  <TableCell className="font-medium">{section.name}</TableCell>
                  <TableCell>{section.code}</TableCell>
                  <TableCell>{section.description}</TableCell>
                  <TableCell>
                    {new Date(section.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(section)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(section._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

// Courses Management Component
const CoursesManagement = () => {
  const [selectedSection, setSelectedSection] = useState<string>('')
  const { data: sectionsResponse } = useGetSectionsQuery({})
  const { data: coursesResponse, isLoading } = useGetSectionCoursesQuery(
    { sectionId: selectedSection },
    { skip: !selectedSection }
  )
  const [createCourse] = useCreateCourseMutation()
  const [updateCourse] = useUpdateCourseMutation()
  const [deleteCourse] = useDeleteCourseMutation()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  const { register, handleSubmit, reset, setValue } =
    useForm<CreateCourseRequest>()

  const sections = sectionsResponse?.data?.data || []
  const courses = coursesResponse?.data?.data || []

  const onSubmit = async (data: CreateCourseRequest) => {
    try {
      const courseData = { ...data, sectionId: selectedSection }
      if (editingCourse) {
        await updateCourse({
          id: editingCourse._id,
          data: courseData,
        }).unwrap()
        toast.success('Course updated successfully!')
      } else {
        await createCourse(courseData).unwrap()
        toast.success('Course created successfully!')
      }
      setIsDialogOpen(false)
      setEditingCourse(null)
      reset()
    } catch (error: unknown) {
      toast.error(handleApiError(error))
    }
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setValue('name', course.name)
    setValue('code', course.code || '')
    setValue('semester', course.semester || '')
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteCourse(id).unwrap()
        toast.success('Course deleted successfully!')
      } catch (error: unknown) {
        toast.error(handleApiError(error) || 'Failed to delete course')
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Courses Management</CardTitle>
          <div className="flex gap-4 items-center">
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section._id} value={section._id}>
                    {section.name} ({section.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSection && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Course
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCourse ? 'Edit Course' : 'Add New Course'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Course Name</label>
                      <Input
                        {...register('name', { required: true })}
                        placeholder="e.g., Mathematics"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Course Code</label>
                      <Input
                        {...register('code')}
                        placeholder="e.g., MATH101"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Semester</label>
                      <Input
                        {...register('semester')}
                        placeholder="e.g., Fall 2025"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false)
                          setEditingCourse(null)
                          reset()
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingCourse ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!selectedSection ? (
          <p className="text-center text-gray-500 py-8">
            Please select a section to view courses
          </p>
        ) : isLoading ? (
          <div>Loading courses...</div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course._id}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell>{course.code}</TableCell>
                    <TableCell>{course.semester}</TableCell>
                    <TableCell>
                      {new Date(course.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(course)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(course._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Students Management Component
const StudentsManagement = () => {
  const [selectedSection, setSelectedSection] = useState<string>('')
  const { data: sectionsResponse } = useGetSectionsQuery({})
  const { data: studentsResponse, isLoading } = useGetSectionStudentsQuery(
    { sectionId: selectedSection },
    { skip: !selectedSection }
  )
  const { data: coursesResponse } = useGetSectionCoursesQuery(
    { sectionId: selectedSection },
    { skip: !selectedSection }
  )
  const [createStudent] = useCreateStudentMutation()
  const [updateStudent] = useUpdateStudentMutation()
  const [deleteStudent] = useDeleteStudentMutation()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])

  const { register, handleSubmit, reset, setValue } =
    useForm<CreateStudentRequest>()

  const sections = sectionsResponse?.data?.data || []
  const students = studentsResponse?.data?.data || []
  const courses = coursesResponse?.data?.data || []

  const onSubmit = async (data: CreateStudentRequest) => {
    try {
      const studentData = {
        ...data,
        sectionId: selectedSection,
        courses: selectedCourses,
      }
      if (editingStudent) {
        await updateStudent({
          id: editingStudent._id,
          data: studentData,
        }).unwrap()
        toast.success('Student updated successfully!')
      } else {
        await createStudent(studentData).unwrap()
        toast.success('Student created successfully!')
      }
      setIsDialogOpen(false)
      setEditingStudent(null)
      setSelectedCourses([])
      reset()
    } catch (error: unknown) {
      toast.error(handleApiError(error))
    }
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setValue('studentId', student.studentId)
    setValue('name', student.name)
    setValue('email', student.email)
    setSelectedCourses(
      student.courses?.map((c) => (typeof c === 'string' ? c : c._id)) || []
    )
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteStudent(id).unwrap()
        toast.success('Student deleted successfully!')
      } catch (error: unknown) {
        toast.error(handleApiError(error) || 'Failed to delete student')
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Students Management</CardTitle>
          <div className="flex gap-4 items-center">
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section._id} value={section._id}>
                    {section.name} ({section.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSection && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingStudent(null)
                      setSelectedCourses([])
                      reset()
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Student
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingStudent ? 'Edit Student' : 'Add New Student'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Student ID</label>
                      <Input
                        {...register('studentId', { required: true })}
                        placeholder="e.g., 2025CSE001"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        {...register('name', { required: true })}
                        placeholder="Student name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        {...register('email', { required: true })}
                        type="email"
                        placeholder="student@university.edu"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Courses *</label>
                      <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                        {courses.length > 0 ? (
                          courses.map((course) => (
                            <div
                              key={course._id}
                              className="flex items-center space-x-2 mb-2"
                            >
                              <input
                                type="checkbox"
                                id={course._id}
                                checked={selectedCourses.includes(course._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCourses([
                                      ...selectedCourses,
                                      course._id,
                                    ])
                                  } else {
                                    setSelectedCourses(
                                      selectedCourses.filter(
                                        (id) => id !== course._id
                                      )
                                    )
                                  }
                                }}
                                className="rounded"
                              />
                              <label
                                htmlFor={course._id}
                                className="text-sm cursor-pointer"
                              >
                                {course.name} ({course.code})
                              </label>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">
                            No courses available for this section
                          </p>
                        )}
                      </div>
                      {selectedCourses.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          Please select at least one course
                        </p>
                      )}
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false)
                          setEditingStudent(null)
                          setSelectedCourses([])
                          reset()
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={selectedCourses.length === 0}
                      >
                        {editingStudent ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!selectedSection ? (
          <p className="text-center text-gray-500 py-8">
            Please select a section to view students
          </p>
        ) : isLoading ? (
          <div>Loading students...</div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell className="font-medium">
                      {student.name}
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      {new Date(student.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(student)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(student._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Users Management Component
const UsersManagement = () => {
  const { data: usersResponse, isLoading } = useGetUsersQuery({})
  const { data: sectionsResponse } = useGetSectionsQuery({})
  const [createUser] = useCreateUserMutation()
  const [updateUser] = useUpdateUserMutation()
  const [deleteUser] = useDeleteUserMutation()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const { register, handleSubmit, reset, setValue, watch } =
    useForm<CreateUserForm>()

  const users = usersResponse?.data?.data || []
  const sections = sectionsResponse?.data?.data || []
  const selectedRole = watch('role')
  const selectedSectionId = watch('sectionId')

  const onSubmit = async (data: CreateUserForm) => {
    console.log('[USER FORM] Submitting data:', data)
    console.log('[USER FORM] EditingUser:', editingUser)

    try {
      if (editingUser) {
        console.log('[USER FORM] Updating user with ID:', editingUser._id)
        await updateUser({
          id: editingUser._id,
          data,
        }).unwrap()
        toast.success('User updated successfully!')
      } else {
        console.log('[USER FORM] Creating new user')
        await createUser(data).unwrap()
        toast.success('User created successfully!')
      }
      setIsDialogOpen(false)
      setEditingUser(null)
      reset()
    } catch (error: unknown) {
      console.error('[USER FORM] Error:', error)
      toast.error(handleApiError(error))
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setValue('name', user.name)
    setValue('email', user.email)
    setValue('role', user.role)
    if (user.sectionId) {
      setValue(
        'sectionId',
        typeof user.sectionId === 'string' ? user.sectionId : user.sectionId._id
      )
    }
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id).unwrap()
        toast.success('User deleted successfully!')
      } catch (error: unknown) {
        toast.error(handleApiError(error) || 'Failed to delete user')
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Users Management</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Edit User' : 'Add New User'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    {...register('name', { required: true })}
                    placeholder="User name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    {...register('email', { required: true })}
                    type="email"
                    placeholder="user@university.edu"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Select
                    value={selectedRole || ''}
                    onValueChange={(value) =>
                      setValue(
                        'role',
                        value as 'admin' | 'cr' | 'instructor' | 'viewer'
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="cr">CR</SelectItem>
                      <SelectItem value="instructor">Instructor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedRole === 'cr' && (
                  <div>
                    <label className="text-sm font-medium">
                      Assigned Section
                    </label>
                    <Select
                      value={selectedSectionId || ''}
                      onValueChange={(value) => setValue('sectionId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((section) => (
                          <SelectItem key={section._id} value={section._id}>
                            {section.name} ({section.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {!editingUser && (
                  <div>
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      {...register('password', { required: !editingUser })}
                      type="password"
                      placeholder="User password"
                    />
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      setEditingUser(null)
                      reset()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingUser ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading users...</div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.sectionId
                        ? typeof user.sectionId === 'string'
                          ? user.sectionId
                          : `${user.sectionId.name} (${user.sectionId.code})`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(user._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Attendance Management Component
const AttendanceManagement = () => {
  const { data: attendanceResponse, isLoading } = useGetAttendanceRecordsQuery({
    limit: 20,
  })

  const attendance = attendanceResponse?.data?.data || []

  if (isLoading) return <div>Loading attendance records...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Attendance Records</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-white dark:bg-gray-800 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Total Students</TableHead>
                <TableHead>Present</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Attendance %</TableHead>
                <TableHead>Taken By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((record: AttendanceRecord) => {
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
                      {typeof record.sectionId === 'string'
                        ? record.sectionId
                        : `${record.sectionId.name}`}
                    </TableCell>
                    <TableCell>
                      {typeof record.courseId === 'string'
                        ? record.courseId
                        : `${record.courseId.name}`}
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
                      {typeof record.takenBy === 'string'
                        ? record.takenBy
                        : record.takenBy.name}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default AdminDashboard
