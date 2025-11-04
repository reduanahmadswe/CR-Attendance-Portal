import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  role: 'admin' | 'cr' | 'instructor' | 'viewer' | 'student'
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
  useDownloadCourseAttendanceZipMutation,
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
  Building2,
  Download,
  Edit,
  FileText,
  GraduationCap,
  History,
  LogOut,
  Plus,
  Shield,
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

    try {
      if (auth?.logout) {
        console.log('[ADMIN DASHBOARD] Calling auth.logout()')
        await auth.logout() // This will handle redirect to login
        console.log('[ADMIN DASHBOARD] auth.logout() completed')
      } else {
        console.log(
          '[ADMIN DASHBOARD] auth.logout not available, fallback redirect'
        )
        window.location.href = '/auth/login'
      }
    } catch (error) {
      console.error('[ADMIN DASHBOARD] Logout failed:', error)
      // Still navigate to login even if logout fails
      window.location.href = '/auth/login'
    }
  }

  const handleNavigateToHistory = () => {
    navigate('/reports/attendance-history')
  }

  if (!user || user.role !== 'admin') {
    return <div className="p-6">Unauthorized access. Admin role required.</div>
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
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent animate-gradient">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  Welcome back,{' '}
                  <span className="font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    {user.name}
                  </span>
                </p>
              </div>
            </div>

            {/* Actions with enhanced styling */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateToHistory}
                className="flex items-center gap-2 h-10 px-4 border-gray-200 dark:border-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 hover:border-purple-300 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 dark:hover:border-purple-600 transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">
                  View History
                </span>
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
        </div>
      </header>

      {/* Main Content with enhanced spacing and backdrop */}
      <main className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Quick Stats */}
          <AdminStatsCards />

          {/* Modern Navigation Tabs */}
          <div className="mb-6 sm:mb-8">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              <nav className="flex flex-wrap gap-1 sm:gap-2">
                {[
                  {
                    id: 'sections',
                    label: 'Sections',
                    icon: GraduationCap,
                    color: 'from-blue-500 to-cyan-500',
                  },
                  {
                    id: 'courses',
                    label: 'Courses',
                    icon: BookOpen,
                    color: 'from-green-500 to-emerald-500',
                  },
                  {
                    id: 'students',
                    label: 'Students',
                    icon: Users,
                    color: 'from-purple-500 to-pink-500',
                  },
                  {
                    id: 'users',
                    label: 'Users',
                    icon: Shield,
                    color: 'from-orange-500 to-red-500',
                  },
                  {
                    id: 'attendance',
                    label: 'Attendance',
                    icon: FileText,
                    color: 'from-indigo-500 to-blue-500',
                  },
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
                    className={`flex items-center px-2 sm:px-4 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 min-w-fit flex-1 sm:flex-none justify-center sm:justify-start ${
                      activeTab === tab.id
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg hover:shadow-xl transform hover:scale-105`
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-white/80 dark:hover:bg-gray-700/50 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                    <span className="hidden sm:inline ml-1 sm:ml-0">
                      {tab.label}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'sections' && <SectionsManagement />}
          {activeTab === 'courses' && <CoursesManagement />}
          {activeTab === 'students' && <StudentsManagement />}
          {activeTab === 'users' && <UsersManagement />}
          {activeTab === 'attendance' && <AttendanceManagement />}
        </div>
      </main>
    </div>
  )
}

// Admin Stats Cards Component
const AdminStatsCards = () => {
  const { data: sectionsResponse, isLoading: sectionsLoading } =
    useGetSectionsQuery({})
  const { data: usersResponse, isLoading: usersLoading } = useGetUsersQuery({})
  const { data: attendanceResponse, isLoading: attendanceLoading } =
    useGetAttendanceRecordsQuery({})

  const isLoading = sectionsLoading || usersLoading || attendanceLoading

  const sections = sectionsResponse?.data?.data || []
  const users = usersResponse?.data?.data || []
  const attendance = attendanceResponse?.data?.data || []

  const stats = [
    {
      title: 'Total Sections',
      value: sections.length,
      icon: GraduationCap,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      darkBgGradient: 'from-blue-900/40 to-cyan-900/40',
      description: 'Active sections',
    },
    {
      title: 'Total Users',
      value: users.length,
      icon: Users,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      darkBgGradient: 'from-green-900/40 to-emerald-900/40',
      description: 'Registered users',
    },
    {
      title: 'Total Records',
      value: attendance.length,
      icon: BarChart3,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      darkBgGradient: 'from-purple-900/40 to-pink-900/40',
      description: 'Attendance records',
    },
    {
      title: 'Active CRs',
      value: users.filter((user) => user.role === 'cr').length,
      icon: Shield,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
      darkBgGradient: 'from-orange-900/40 to-red-900/40',
      description: 'Class representatives',
    },
  ]

  // Loading skeleton component
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[1, 2, 3, 4].map((index) => (
          <Card
            key={index}
            className="overflow-hidden border border-gray-200/60 dark:border-gray-700/40 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            style={{
              animationDelay: `${index * 150}ms`,
              animation: 'fadeInUp 0.8s ease-out forwards',
            }}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg animate-pulse"></div>
                  <div className="space-y-1">
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse w-3/4"></div>
                    <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse w-1/2"></div>
                    <div className="h-2 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse w-full"></div>
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
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className={`group overflow-hidden border border-gray-200/60 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] bg-gradient-to-br ${stat.bgGradient} dark:bg-gradient-to-br dark:${stat.darkBgGradient} backdrop-blur-sm hover:border-gray-300/80 dark:hover:border-gray-600/60 relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300`}
          style={{
            animationDelay: `${index * 150}ms`,
            animation: 'fadeInUp 0.8s ease-out forwards',
          }}
        >
          <CardContent className="p-3 sm:p-4 relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div
                  className={`inline-flex p-2 sm:p-2.5 rounded-lg bg-gradient-to-r ${stat.gradient} shadow-md mb-2 sm:mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 group-hover:shadow-lg`}
                >
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors duration-300">
                  {stat.title}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1 group-hover:scale-105 transition-transform duration-300">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  {stat.description}
                </p>
              </div>

              {/* Decorative corner element */}
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-white/20 to-transparent dark:from-gray-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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

  if (isLoading) {
    return (
      <div className="fadeInUp">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading sections...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fadeInUp">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-50 dark:from-purple-900/20 dark:via-purple-800/20 dark:to-indigo-900/20 rounded-xl p-6 mb-6 border border-purple-200 dark:border-purple-700/30 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
              🏫 Sections Management
            </h2>
            <p className="text-purple-700 dark:text-purple-300 text-sm">
              Create and manage different academic sections
            </p>
          </div>

          {/* Add Section Button */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">
              Actions
            </label>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full lg:w-auto bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md sm:max-w-lg backdrop-blur-md bg-white/95 dark:bg-gray-900/95 border-purple-200 dark:border-purple-700 max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-4">
                  <DialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    {editingSection ? 'Edit Section' : 'Add New Section'}
                  </DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                        🏷️ Section Name
                      </label>
                      <Input
                        {...register('name', { required: true })}
                        placeholder="e.g., CSE-3A"
                        className="h-10 sm:h-12 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 focus:border-purple-400 dark:focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                        🔖 Section Code
                      </label>
                      <Input
                        {...register('code')}
                        placeholder="e.g., CSE3A"
                        className="h-10 sm:h-12 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 focus:border-purple-400 dark:focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                        📝 Description
                      </label>
                      <Textarea
                        {...register('description')}
                        placeholder="Section description..."
                        className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 focus:border-purple-400 dark:focus:border-purple-500 transition-colors resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-purple-100 dark:border-purple-800">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false)
                        setEditingSection(null)
                        reset()
                      }}
                      className="w-full sm:flex-1 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="w-full sm:flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {editingSection ? 'Update Section' : 'Create Section'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-purple-100 dark:border-purple-800 shadow-xl">
        <CardContent className="p-6">
          {sections.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
                <Building2 className="h-12 w-12 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No Sections Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                Create your first section to start organizing students and
                courses.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-700/30 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-800/30 dark:to-indigo-800/30 border-purple-200 dark:border-purple-700/50">
                        <TableHead className="font-bold text-purple-800 dark:text-purple-200">
                          Section Name
                        </TableHead>
                        <TableHead className="font-bold text-purple-800 dark:text-purple-200">
                          Code
                        </TableHead>
                        <TableHead className="font-bold text-purple-800 dark:text-purple-200">
                          Description
                        </TableHead>
                        <TableHead className="font-bold text-purple-800 dark:text-purple-200">
                          Created
                        </TableHead>
                        <TableHead className="font-bold text-purple-800 dark:text-purple-200">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sections.map((section) => (
                        <TableRow
                          key={section._id}
                          className="bg-gradient-to-r from-purple-25 to-white dark:from-purple-950/10 dark:to-gray-900/50 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors duration-200 border-purple-100 dark:border-purple-800/30"
                        >
                          <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4 text-purple-500" />
                              <span>{section.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400 font-mono">
                            {section.code || '-'}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400 max-w-xs truncate">
                            {section.description || '-'}
                          </TableCell>
                          <TableCell className="text-gray-500 dark:text-gray-500 text-sm">
                            {new Date(section.createdAt).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              }
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(section)}
                                className="border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(section._id)}
                                className="bg-red-500 hover:bg-red-600 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {sections.map((section) => (
                  <div
                    key={section._id}
                    className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-700/30 p-4 backdrop-blur-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Building2 className="h-4 w-4 text-purple-500" />
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                            {section.name}
                          </h3>
                        </div>
                        {section.code && (
                          <p className="text-sm font-mono text-purple-600 dark:text-purple-400 mb-1">
                            {section.code}
                          </p>
                        )}
                        {section.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {section.description}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(section)}
                          className="border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 p-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(section._id)}
                          className="bg-red-500 hover:bg-red-600 p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-purple-200 dark:border-purple-700/30 pt-2">
                      Created:{' '}
                      {new Date(section.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
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
  const [downloadCourseZip] = useDownloadCourseAttendanceZipMutation()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [downloadingCourseId, setDownloadingCourseId] = useState<string | null>(null)

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

  const handleDownloadAllAttendance = async (courseId: string, courseName: string) => {
    try {
      setDownloadingCourseId(courseId)
      console.log('Starting ZIP download for course:', courseId)
      
      const blob = await downloadCourseZip({ 
        courseId, 
        sectionId: selectedSection 
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
    <div className="fadeInUp">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-orange-50 via-orange-100 to-yellow-50 dark:from-orange-900/20 dark:via-orange-800/20 dark:to-yellow-900/20 rounded-xl p-6 mb-6 border border-orange-200 dark:border-orange-700/30 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 dark:from-orange-400 dark:to-yellow-400 bg-clip-text text-transparent">
              📚 Courses Management
            </h2>
            <p className="text-orange-700 dark:text-orange-300 text-sm">
              Manage course assignments for different sections
            </p>
          </div>

          {/* Section Selection */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wide">
                Select Section
              </label>
              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
              >
                <SelectTrigger className="w-full sm:w-64 bg-white/70 dark:bg-gray-800/70 border-orange-200 dark:border-orange-700 focus:border-orange-400 dark:focus:border-orange-500 backdrop-blur-sm">
                  <SelectValue placeholder="Choose a section..." />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-md">
                  {sections.map((section) => (
                    <SelectItem key={section._id} value={section._id}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{section.name}</span>
                        <span className="text-sm text-gray-500">
                          ({section.code})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add Course Button */}
            {selectedSection && (
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-medium text-transparent uppercase tracking-wide">
                  Actions
                </label>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-md sm:max-w-lg backdrop-blur-md bg-white/95 dark:bg-gray-900/95 border-orange-200 dark:border-orange-700 max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-4">
                      <DialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 dark:from-orange-400 dark:to-yellow-400 bg-clip-text text-transparent">
                        {editingCourse ? 'Edit Course' : 'Add New Course'}
                      </DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={handleSubmit(onSubmit)}
                      className="space-y-4 sm:space-y-6"
                    >
                      <div className="space-y-3 sm:space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                            📖 Course Name
                          </label>
                          <Input
                            {...register('name', { required: true })}
                            placeholder="e.g., Advanced Mathematics"
                            className="h-10 sm:h-12 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 focus:border-orange-400 dark:focus:border-orange-500 transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                            🏷️ Course Code
                          </label>
                          <Input
                            {...register('code')}
                            placeholder="e.g., MATH301"
                            className="h-10 sm:h-12 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 focus:border-orange-400 dark:focus:border-orange-500 transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                            📅 Semester
                          </label>
                          <Input
                            {...register('semester')}
                            placeholder="e.g., Spring 2025"
                            className="h-10 sm:h-12 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 focus:border-orange-400 dark:focus:border-orange-500 transition-colors"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-orange-100 dark:border-orange-800">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsDialogOpen(false)
                            setEditingCourse(null)
                            reset()
                          }}
                          className="w-full sm:flex-1 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="w-full sm:flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          {editingCourse ? 'Update Course' : 'Create Course'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-orange-100 dark:border-orange-800 shadow-xl">
        <CardContent className="p-6">
          {!selectedSection ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30 rounded-full flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Select a Section
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Choose a section from the dropdown above to view and manage
                courses for that specific section.
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading courses...
              </p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30 rounded-full flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No Courses Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                This section doesn't have any courses yet. Click the "Add
                Course" button to create the first course.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border border-orange-200 dark:border-orange-700/30 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-800/30 dark:to-yellow-800/30 border-orange-200 dark:border-orange-700/50">
                        <TableHead className="font-bold text-orange-800 dark:text-orange-200">
                          Course Name
                        </TableHead>
                        <TableHead className="font-bold text-orange-800 dark:text-orange-200">
                          Code
                        </TableHead>
                        <TableHead className="font-bold text-orange-800 dark:text-orange-200">
                          Semester
                        </TableHead>
                        <TableHead className="font-bold text-orange-800 dark:text-orange-200">
                          Created
                        </TableHead>
                        <TableHead className="font-bold text-orange-800 dark:text-orange-200">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow
                          key={course._id}
                          className="bg-gradient-to-r from-orange-25 to-white dark:from-orange-950/10 dark:to-gray-900/50 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors duration-200 border-orange-100 dark:border-orange-800/30"
                        >
                          <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                            <div className="flex items-center space-x-2">
                              <BookOpen className="h-4 w-4 text-orange-500" />
                              <span>{course.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400 font-mono">
                            {course.code || '-'}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">
                            {course.semester || '-'}
                          </TableCell>
                          <TableCell className="text-gray-500 dark:text-gray-500 text-sm">
                            {new Date(course.createdAt).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              }
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadAllAttendance(course._id, course.name)}
                                disabled={downloadingCourseId === course._id}
                                className="border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                title="Download all attendance records for this course"
                              >
                                {downloadingCourseId === course._id ? (
                                  <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Download className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(course)}
                                className="border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(course._id)}
                                className="bg-red-500 hover:bg-red-600 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {courses.map((course) => (
                  <div
                    key={course._id}
                    className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border border-orange-200 dark:border-orange-700/30 p-4 backdrop-blur-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <BookOpen className="h-4 w-4 text-orange-500" />
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                            {course.name}
                          </h3>
                        </div>
                        {course.code && (
                          <p className="text-sm font-mono text-orange-600 dark:text-orange-400 mb-1">
                            {course.code}
                          </p>
                        )}
                        {course.semester && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {course.semester}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadAllAttendance(course._id, course.name)}
                          disabled={downloadingCourseId === course._id}
                          className="border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 p-2"
                          title="Download all attendance"
                        >
                          {downloadingCourseId === course._id ? (
                            <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(course)}
                          className="border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 p-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(course._id)}
                          className="bg-red-500 hover:bg-red-600 p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-orange-200 dark:border-orange-700/30 pt-2">
                      Created:{' '}
                      {new Date(course.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
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
        toast.success('Student updated successfully! 🎉')
      } else {
        await createStudent(studentData).unwrap()
        toast.success('Student created successfully! 🎉')
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
        toast.success('Student deleted successfully! 🗑️')
      } catch (error: unknown) {
        toast.error(handleApiError(error) || 'Failed to delete student')
      }
    }
  }

  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    )
  }

  const selectAllCourses = () => {
    setSelectedCourses(courses.map((course) => course._id))
  }

  const clearAllCourses = () => {
    setSelectedCourses([])
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-200/60 dark:border-gray-700/40 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-gray-800/10 opacity-50"></div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-indigo-800 dark:from-white dark:via-purple-200 dark:to-indigo-200 bg-clip-text text-transparent mb-2">
                👥 Students Management
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base font-medium">
                Add, edit, and manage student enrollments with course
                assignments
              </p>
            </div>

            {/* Section Selection and Add Button */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full lg:w-auto">
              <div className="flex-1 lg:flex-none">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  🏫 Select Section
                </label>
                <Select
                  value={selectedSection}
                  onValueChange={setSelectedSection}
                >
                  <SelectTrigger className="w-full sm:w-64 h-12 bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/40 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 shadow-lg">
                    <SelectValue placeholder="Choose a section..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/40">
                    {sections.map((section) => (
                      <SelectItem
                        key={section._id}
                        value={section._id}
                        className="hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                          <span className="font-medium">{section.name}</span>
                          <span className="text-gray-500">
                            ({section.code})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSection && (
                <div className="flex-shrink-0">
                  <label className="block text-sm font-semibold text-transparent mb-2">
                    Add
                  </label>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingStudent(null)
                          setSelectedCourses([])
                          reset()
                        }}
                        className="w-full sm:w-auto h-12 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        <span className="font-semibold">Add Student</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/40">
                      <DialogHeader className="pb-4 sm:pb-6">
                        <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {editingStudent
                            ? '✏️ Edit Student'
                            : '➕ Add New Student'}
                        </DialogTitle>
                      </DialogHeader>

                      <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4 sm:space-y-6"
                      >
                        {/* Student Basic Info */}
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200/40 dark:border-blue-700/40">
                          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center gap-2">
                            👤 Student Information
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                🆔 Student ID
                              </label>
                              <Input
                                {...register('studentId', { required: true })}
                                placeholder="e.g., 232-35-016"
                                className="h-12 bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/40 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-300"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                👨‍🎓 Full Name
                              </label>
                              <Input
                                {...register('name', { required: true })}
                                placeholder="Student full name"
                                className="h-12 bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/40 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-300"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              📧 Email Address
                            </label>
                            <Input
                              {...register('email', { required: true })}
                              type="email"
                              placeholder="student@university.edu"
                              className="h-12 bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/40 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-300"
                            />
                          </div>
                        </div>

                        {/* Course Selection */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 sm:p-6 border border-green-200/40 dark:border-green-700/40">
                          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center mb-4">
                            <h3 className="text-base sm:text-lg font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                              📚 Course Selection
                            </h3>

                            {courses.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={selectAllCourses}
                                  className="text-xs sm:text-sm flex-1 sm:flex-initial h-8 sm:h-9 text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-900/20"
                                >
                                  ✅ Select All
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={clearAllCourses}
                                  className="text-xs sm:text-sm flex-1 sm:flex-initial h-8 sm:h-9 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
                                >
                                  ❌ Clear All
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-4 max-h-72 sm:max-h-80 overflow-y-auto border border-green-200/60 dark:border-green-700/40">
                            {courses.length > 0 ? (
                              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                                {courses.map((course) => (
                                  <div
                                    key={course._id}
                                    className={`flex items-center p-2 sm:p-3 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-md ${
                                      selectedCourses.includes(course._id)
                                        ? 'border-green-400 bg-green-50 dark:border-green-500 dark:bg-green-900/30'
                                        : 'border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700/50 hover:border-green-300 dark:hover:border-green-600'
                                    }`}
                                    onClick={() => toggleCourse(course._id)}
                                  >
                                    <input
                                      type="checkbox"
                                      id={course._id}
                                      checked={selectedCourses.includes(
                                        course._id
                                      )}
                                      onChange={() => toggleCourse(course._id)}
                                      className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 border-2 border-gray-300 rounded focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700"
                                    />
                                    <label
                                      htmlFor={course._id}
                                      className="ml-2 sm:ml-3 flex-1 cursor-pointer"
                                    >
                                      <div className="flex flex-col space-y-1 sm:space-y-0 sm:flex-row sm:items-center sm:gap-2">
                                        <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                                          {course.name}
                                        </span>
                                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-full font-medium inline-block w-fit">
                                          {course.code}
                                        </span>
                                      </div>
                                    </label>
                                    {selectedCourses.includes(course._id) && (
                                      <div className="ml-1 sm:ml-2 text-green-600 dark:text-green-400 text-sm sm:text-base">
                                        ✅
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6 sm:py-8">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                  📚
                                </div>
                                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">
                                  No courses available for this section
                                </p>
                                <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">
                                  Please add courses to this section first
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Course Selection Summary */}
                          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-green-200/60 dark:border-green-700/40">
                            <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                Selected Courses:
                              </span>
                              <span
                                className={`text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 rounded-full text-center ${
                                  selectedCourses.length > 0
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                                }`}
                              >
                                {selectedCourses.length} / {courses.length}
                              </span>
                            </div>
                            {selectedCourses.length === 0 &&
                              courses.length > 0 && (
                                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                                  ⚠️ Please select at least one course
                                </p>
                              )}
                          </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200/60 dark:border-gray-700/40">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsDialogOpen(false)
                              setEditingStudent(null)
                              setSelectedCourses([])
                              reset()
                            }}
                            className="order-2 sm:order-1 h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/50"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={
                              selectedCourses.length === 0 && courses.length > 0
                            }
                            className="order-1 sm:order-2 h-10 sm:h-12 px-6 sm:px-8 text-sm sm:text-base bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                          >
                            {editingStudent
                              ? '💾 Update Student'
                              : '➕ Create Student'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Students Table Section */}
      {!selectedSection ? (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-gray-200/50 dark:border-gray-700/50 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-6">
            🏫
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Select a Section First
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Please choose a section from the dropdown above to view and manage
            students for that section.
          </p>
        </div>
      ) : isLoading ? (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="flex items-center space-x-4 py-3">
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse w-24"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse flex-1"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse w-32"></div>
                <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse w-20"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          {students.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                👥
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                No Students Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This section doesn't have any students yet. Add some students to
                get started.
              </p>
              <Button
                onClick={() => {
                  setEditingStudent(null)
                  setSelectedCourses([])
                  reset()
                  setIsDialogOpen(true)
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Student
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Cards View (Hidden on larger screens) */}
              <div className="block lg:hidden p-4 space-y-4">
                {students.map((student, index) => (
                  <div
                    key={student._id}
                    className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 rounded-xl p-4 shadow-lg border border-gray-200/60 dark:border-gray-700/40 hover:shadow-xl transition-all duration-300"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'fadeInUp 0.6s ease-out forwards',
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {student.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {student.studentId}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(student)}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(student._id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">
                          📧
                        </span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {student.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">
                          📅
                        </span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {student.courses && student.courses.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400">
                            📚
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {student.courses.length} course
                            {student.courses.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (Hidden on mobile) */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-b border-gray-200/60 dark:border-gray-600/40">
                      <TableHead className="font-bold text-gray-900 dark:text-gray-100 py-4">
                        🆔 Student ID
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-100">
                        👨‍🎓 Name
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-100">
                        📧 Email
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-100">
                        📚 Courses
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-100">
                        📅 Created
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-100 text-center">
                        ⚙️ Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student, index) => (
                      <TableRow
                        key={student._id}
                        className={`hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 border-b border-gray-100/60 dark:border-gray-700/40 ${
                          index % 2 === 0
                            ? 'bg-white/40 dark:bg-gray-800/40'
                            : 'bg-gray-50/40 dark:bg-gray-900/40'
                        }`}
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animation: 'fadeInUp 0.6s ease-out forwards',
                        }}
                      >
                        <TableCell className="font-medium py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                            {student.studentId}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            {student.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-300">
                          {student.email}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/40 dark:to-emerald-900/40 dark:text-green-200">
                              {student.courses?.length || 0} courses
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-300">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(student)}
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20 transition-all duration-200"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(student._id)}
                              className="h-8 w-8 p-0 hover:shadow-lg transition-all duration-200"
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
            </>
          )}
        </div>
      )}
    </div>
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
        toast.success('User updated successfully! 🎉')
      } else {
        console.log('[USER FORM] Creating new user')
        await createUser(data).unwrap()
        toast.success('User created successfully! 🎉')
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
        toast.success('User deleted successfully! 🗑️')
      } catch (error: unknown) {
        toast.error(handleApiError(error) || 'Failed to delete user')
      }
    }
  }

  const getRoleInfo = (role: string) => {
    const roleConfig = {
      admin: {
        icon: '👑',
        label: 'Administrator',
        color: 'from-red-500 to-pink-500',
        bg: 'from-red-50 to-pink-50',
        darkBg: 'from-red-900/40 to-pink-900/40',
      },
      cr: {
        icon: '🎓',
        label: 'Class Representative',
        color: 'from-blue-500 to-cyan-500',
        bg: 'from-blue-50 to-cyan-50',
        darkBg: 'from-blue-900/40 to-cyan-900/40',
      },
      instructor: {
        icon: '👨‍🏫',
        label: 'Instructor',
        color: 'from-green-500 to-emerald-500',
        bg: 'from-green-50 to-emerald-50',
        darkBg: 'from-green-900/40 to-emerald-900/40',
      },
      viewer: {
        icon: '👁️',
        label: 'Viewer',
        color: 'from-gray-500 to-slate-500',
        bg: 'from-gray-50 to-slate-50',
        darkBg: 'from-gray-900/40 to-slate-900/40',
      },
    }
    return roleConfig[role as keyof typeof roleConfig] || roleConfig.viewer
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-200/60 dark:border-gray-700/40 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-gray-800/10 opacity-50"></div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent mb-2">
                👥 Users Management
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base font-medium">
                Create and manage user accounts with role-based access control
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-3">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl shadow-lg">
                <div className="text-xs font-medium opacity-90">
                  Total Users
                </div>
                <div className="text-lg font-bold">{users.length}</div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-xl shadow-lg">
                <div className="text-xs font-medium opacity-90">Active CRs</div>
                <div className="text-lg font-bold">
                  {users.filter((u) => u.role === 'cr').length}
                </div>
              </div>
            </div>
          </div>

          {/* Add User Button */}
          <div className="mt-6">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingUser(null)
                    reset()
                  }}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 h-12 px-6"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  <span className="font-semibold">Add New User</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/40">
                <DialogHeader className="pb-4 sm:pb-6">
                  <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {editingUser ? '✏️ Edit User' : '➕ Add New User'}
                  </DialogTitle>
                </DialogHeader>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-4 sm:space-y-6"
                >
                  {/* User Basic Info */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 sm:p-6 border border-blue-200/40 dark:border-blue-700/40">
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center gap-2">
                      👤 User Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          👨‍💼 Full Name
                        </label>
                        <Input
                          {...register('name', { required: true })}
                          placeholder="Enter full name"
                          className="h-12 bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/40 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-300"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          📧 Email Address
                        </label>
                        <Input
                          {...register('email', { required: true })}
                          type="email"
                          placeholder="user@university.edu"
                          className="h-12 bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/40 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-300"
                        />
                      </div>
                    </div>

                    {!editingUser && (
                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          🔒 Password
                        </label>
                        <Input
                          {...register('password', { required: !editingUser })}
                          type="password"
                          placeholder="Create a secure password"
                          className="h-12 bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/40 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-300"
                        />
                      </div>
                    )}
                  </div>

                  {/* Role Selection */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-purple-200/40 dark:border-purple-700/40">
                    <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4 flex items-center gap-2">
                      🎭 Role & Permissions
                    </h3>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Select User Role
                      </label>
                      <Select
                        value={selectedRole || ''}
                        onValueChange={(value) =>
                          setValue(
                            'role',
                            value as 'admin' | 'cr' | 'instructor' | 'viewer'
                          )
                        }
                      >
                        <SelectTrigger className="h-12 bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/40 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300">
                          <SelectValue placeholder="Choose a role..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/40">
                          {[
                            {
                              value: 'admin',
                              label: 'Administrator',
                              icon: '👑',
                              desc: 'Full system access',
                            },
                            {
                              value: 'cr',
                              label: 'Class Representative',
                              icon: '🎓',
                              desc: 'Section management',
                            },
                            {
                              value: 'instructor',
                              label: 'Instructor',
                              icon: '👨‍🏫',
                              desc: 'Teaching access',
                            },
                            {
                              value: 'viewer',
                              label: 'Viewer',
                              icon: '👁️',
                              desc: 'Read-only access',
                            },
                          ].map((role) => (
                            <SelectItem
                              key={role.value}
                              value={role.value}
                              className="hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer py-3"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{role.icon}</span>
                                <div>
                                  <div className="font-semibold">
                                    {role.label}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {role.desc}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Role Description */}
                    {selectedRole && (
                      <div className="mt-4 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-purple-200/60 dark:border-purple-700/40">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">
                            {getRoleInfo(selectedRole).icon}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {getRoleInfo(selectedRole).label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedRole === 'admin' &&
                            'Complete access to all system features, user management, and administrative controls.'}
                          {selectedRole === 'cr' &&
                            'Can take attendance for assigned section and manage student records within their section.'}
                          {selectedRole === 'instructor' &&
                            'Access to course materials, student records, and teaching-related features.'}
                          {selectedRole === 'viewer' &&
                            'Read-only access to attendance records and basic system information.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Section Assignment (for CR role) */}
                  {selectedRole === 'cr' && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200/40 dark:border-green-700/40">
                      <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center gap-2">
                        🏫 Section Assignment
                      </h3>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Assign Section to CR
                        </label>
                        <Select
                          value={selectedSectionId || ''}
                          onValueChange={(value) =>
                            setValue('sectionId', value)
                          }
                        >
                          <SelectTrigger className="h-12 bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/40 hover:border-green-300 dark:hover:border-green-600 transition-all duration-300">
                            <SelectValue placeholder="Select a section..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/40">
                            {sections.map((section) => (
                              <SelectItem
                                key={section._id}
                                value={section._id}
                                className="hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                                  <span className="font-medium">
                                    {section.name}
                                  </span>
                                  <span className="text-gray-500">
                                    ({section.code})
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {selectedSectionId && (
                          <div className="mt-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-green-200/60 dark:border-green-700/40">
                            <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                              ✅ Section assigned successfully! The CR will be
                              able to manage attendance for this section.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200/60 dark:border-gray-700/40">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false)
                        setEditingUser(null)
                        reset()
                      }}
                      className="order-2 sm:order-1 h-12 px-6 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/50"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="order-1 sm:order-2 h-12 px-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl font-semibold"
                    >
                      {editingUser ? '💾 Update User' : '➕ Create User'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      {/* Users Table Section */}
      {isLoading ? (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="flex items-center space-x-4 py-3">
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse w-24"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse flex-1"></div>
                <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full animate-pulse w-16"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse w-20"></div>
                <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse w-20"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                👥
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                No Users Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start by creating your first user account to manage the system.
              </p>
              <Button
                onClick={() => {
                  setEditingUser(null)
                  reset()
                  setIsDialogOpen(true)
                }}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First User
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Cards View (Hidden on larger screens) */}
              <div className="block lg:hidden p-4 space-y-4">
                {users.map((user, index) => {
                  const roleInfo = getRoleInfo(user.role)
                  return (
                    <div
                      key={user._id}
                      className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 rounded-xl p-4 shadow-lg border border-gray-200/60 dark:border-gray-700/40 hover:shadow-xl transition-all duration-300"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards',
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 bg-gradient-to-r ${roleInfo.color} rounded-full flex items-center justify-center text-white text-sm font-bold`}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {user.name}
                            </h3>
                            <div
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${roleInfo.color} text-white`}
                            >
                              <span className="mr-1">{roleInfo.icon}</span>
                              {roleInfo.label}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(user)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(user._id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400">
                            📧
                          </span>
                          <span className="text-gray-900 dark:text-gray-100">
                            {user.email}
                          </span>
                        </div>
                        {user.sectionId && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400">
                              🏫
                            </span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {typeof user.sectionId === 'string'
                                ? user.sectionId
                                : `${user.sectionId.name} (${user.sectionId.code})`}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400">
                            📅
                          </span>
                          <span className="text-gray-900 dark:text-gray-100">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop Table View (Hidden on mobile) */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-b border-gray-200/60 dark:border-gray-600/40">
                      <TableHead className="font-bold text-gray-900 dark:text-gray-100 py-4">
                        👤 Name
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-100">
                        📧 Email
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-100">
                        🎭 Role
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-100">
                        🏫 Section
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-100">
                        📅 Created
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-100 text-center">
                        ⚙️ Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => {
                      const roleInfo = getRoleInfo(user.role)
                      return (
                        <TableRow
                          key={user._id}
                          className={`hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 transition-all duration-300 border-b border-gray-100/60 dark:border-gray-700/40 ${
                            index % 2 === 0
                              ? 'bg-white/40 dark:bg-gray-800/40'
                              : 'bg-gray-50/40 dark:bg-gray-900/40'
                          }`}
                          style={{
                            animationDelay: `${index * 100}ms`,
                            animation: 'fadeInUp 0.6s ease-out forwards',
                          }}
                        >
                          <TableCell className="font-semibold py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 bg-gradient-to-r ${roleInfo.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}
                              >
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                                {user.name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-300">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${roleInfo.color} text-white shadow-lg`}
                            >
                              <span className="mr-1">{roleInfo.icon}</span>
                              {roleInfo.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-300">
                            {user.sectionId ? (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                                {typeof user.sectionId === 'string'
                                  ? user.sectionId
                                  : `${user.sectionId.name} (${user.sectionId.code})`}
                              </div>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">
                                -
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-300">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(user)}
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20 transition-all duration-200"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(user._id)}
                                className="h-8 w-8 p-0 hover:shadow-lg transition-all duration-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Attendance Management Component
const AttendanceManagement = () => {
  // Query all attendance records for admin (no filtering by section)
  const {
    data: attendanceResponse,
    isLoading,
    error,
  } = useGetAttendanceRecordsQuery({
    page: 1,
    limit: 100, // Increase limit to get more records for admin view
  })

  // Debug logging
  console.log('[ATTENDANCE MANAGEMENT] Response:', attendanceResponse)
  console.log('[ATTENDANCE MANAGEMENT] Loading:', isLoading)
  console.log('[ATTENDANCE MANAGEMENT] Error:', error)

  const attendance = attendanceResponse?.data?.data || []

  console.log('[ATTENDANCE MANAGEMENT] Attendance records:', attendance)
  console.log('[ATTENDANCE MANAGEMENT] Number of records:', attendance.length)

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-3">
              <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg animate-pulse w-64"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse w-96"></div>
            </div>
            <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg animate-pulse w-32"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="flex items-center space-x-4 py-3">
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse flex-1"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse w-20"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse w-16"></div>
                <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full animate-pulse w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error handling
  if (error) {
    console.error('[ATTENDANCE MANAGEMENT] API Error:', error)
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-red-200/60 dark:border-red-700/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              ⚠️
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                Error Loading Attendance Records
              </h3>
              <p className="text-red-600 dark:text-red-300">
                {error && 'data' in error
                  ? `API Error: ${error.status} - ${JSON.stringify(error.data)}`
                  : 'message' in error
                    ? error.message
                    : 'Failed to load attendance records'}
              </p>
            </div>
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">
            <p>Debug Info:</p>
            <pre className="bg-red-100 dark:bg-red-900/40 p-2 rounded mt-2 overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  // Calculate summary statistics
  const totalRecords = attendance.length
  const totalStudentsOverall = attendance.reduce(
    (sum, record) => sum + record.attendees.length,
    0
  )
  const totalPresentOverall = attendance.reduce(
    (sum, record) =>
      sum + record.attendees.filter((a) => a.status === 'present').length,
    0
  )
  const overallAttendanceRate =
    totalStudentsOverall > 0
      ? ((totalPresentOverall / totalStudentsOverall) * 100).toFixed(1)
      : '0'

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Enhanced Header with Statistics */}
      <div className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-200/60 dark:border-gray-700/40 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-gray-800/10 opacity-50"></div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-2">
                📊 Attendance Records
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base font-medium">
                View and manage attendance records with detailed insights
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-xl shadow-lg">
                <div className="text-xs font-medium opacity-90">
                  Total Records
                </div>
                <div className="text-lg font-bold">{totalRecords}</div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl shadow-lg">
                <div className="text-xs font-medium opacity-90">
                  Overall Rate
                </div>
                <div className="text-lg font-bold">
                  {overallAttendanceRate}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Responsive Table */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        {/* Mobile Cards View (Hidden on larger screens) */}
        <div className="block lg:hidden">
          <div className="p-4 space-y-4">
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
                <div
                  key={record._id}
                  className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 rounded-xl p-4 shadow-lg border border-gray-200/60 dark:border-gray-700/40 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {new Date(record.date).toLocaleDateString()}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        parseFloat(attendancePercentage) >= 80
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          : parseFloat(attendancePercentage) >= 60
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                            : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                      }`}
                    >
                      {attendancePercentage}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Section:
                      </span>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {typeof record.sectionId === 'string'
                          ? record.sectionId
                          : record.sectionId.name}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Course:
                      </span>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {typeof record.courseId === 'string'
                          ? record.courseId
                          : record.courseId.name}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Present:
                      </span>
                      <div className="font-bold text-green-600 dark:text-green-400">
                        {presentStudents}/{totalStudents}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Taken by:
                      </span>
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {typeof record.takenBy === 'string'
                          ? record.takenBy
                          : record.takenBy.name}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-b border-gray-200/60 dark:border-gray-600/40">
                <TableHead className="font-bold text-gray-900 dark:text-gray-100 py-4">
                  📅 Date
                </TableHead>
                <TableHead className="font-bold text-gray-900 dark:text-gray-100">
                  🏫 Section
                </TableHead>
                <TableHead className="font-bold text-gray-900 dark:text-gray-100">
                  📚 Course
                </TableHead>
                <TableHead className="font-bold text-gray-900 dark:text-gray-100 text-center">
                  👥 Total
                </TableHead>
                <TableHead className="font-bold text-gray-900 dark:text-gray-100 text-center">
                  ✅ Present
                </TableHead>
                <TableHead className="font-bold text-gray-900 dark:text-gray-100 text-center">
                  ❌ Absent
                </TableHead>
                <TableHead className="font-bold text-gray-900 dark:text-gray-100 text-center">
                  📊 Rate
                </TableHead>
                <TableHead className="font-bold text-gray-900 dark:text-gray-100">
                  👤 Taken By
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((record: AttendanceRecord, index) => {
                const totalStudents = record.attendees.length
                const presentStudents = record.attendees.filter(
                  (a) => a.status === 'present'
                ).length
                const attendancePercentage =
                  totalStudents > 0
                    ? ((presentStudents / totalStudents) * 100).toFixed(1)
                    : '0'

                return (
                  <TableRow
                    key={record._id}
                    className={`hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-cyan-50/50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 transition-all duration-300 border-b border-gray-100/60 dark:border-gray-700/40 ${
                      index % 2 === 0
                        ? 'bg-white/40 dark:bg-gray-800/40'
                        : 'bg-gray-50/40 dark:bg-gray-900/40'
                    }`}
                  >
                    <TableCell className="font-medium py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                        {new Date(record.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {typeof record.sectionId === 'string'
                        ? record.sectionId
                        : record.sectionId.name}
                    </TableCell>
                    <TableCell className="font-medium">
                      {typeof record.courseId === 'string'
                        ? record.courseId
                        : record.courseId.name}
                    </TableCell>
                    <TableCell className="text-center font-bold text-gray-900 dark:text-gray-100">
                      {totalStudents}
                    </TableCell>
                    <TableCell className="text-center font-bold text-green-600 dark:text-green-400">
                      {presentStudents}
                    </TableCell>
                    <TableCell className="text-center font-bold text-red-600 dark:text-red-400">
                      {totalStudents - presentStudents}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                          parseFloat(attendancePercentage) >= 80
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                            : parseFloat(attendancePercentage) >= 60
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                              : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                        }`}
                      >
                        {attendancePercentage}%
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {(typeof record.takenBy === 'string'
                            ? record.takenBy
                            : record.takenBy.name
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        {typeof record.takenBy === 'string'
                          ? record.takenBy
                          : record.takenBy.name}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Empty State */}
        {attendance.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Attendance Records Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Attendance records will appear here once they are created by Class
              Representatives.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
