import { Button } from '@/components/ui/button'
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
  useDownloadAttendancePDFMutation,
  useGetAttendanceRecordsQuery,
  useGetSectionsQuery,
} from '@/lib/apiSlice'
import type { RootState } from '@/lib/simpleStore'
import { getDashboardRoute } from '@/routes'
import type { AttendanceRecord, Section } from '@/types'
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Download,
  Eye,
  Filter,
  Search,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

export function AttendanceHistory() {
  const user = useSelector((state: RootState) => state.auth.user)
  const navigate = useNavigate()
  const handleBackToDashboard = () => {
    const dashboardRoute = getDashboardRoute(user?.role || '')
    console.log(
      '[ATTENDANCE HISTORY] Navigating back to dashboard:',
      dashboardRoute,
      'for role:',
      user?.role
    )
    navigate(dashboardRoute)
  }

  // Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSection, setSelectedSection] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Get data based on user role
  const sectionFilter =
    user?.role === 'cr' && user.sectionId
      ? {
          sectionId:
            typeof user.sectionId === 'string'
              ? user.sectionId
              : user.sectionId._id,
        }
      : {}

  const { data: attendanceResponse, isLoading } = useGetAttendanceRecordsQuery({
    ...sectionFilter,
    page: currentPage,
    limit: pageSize,
    from: dateFrom || undefined,
    to: dateTo || undefined,
  })

  const { data: sectionsResponse } = useGetSectionsQuery({})
  const [downloadPDF] = useDownloadAttendancePDFMutation()

  const attendanceRecords = useMemo(
    () => attendanceResponse?.data?.data || [],
    [attendanceResponse]
  )
  const totalRecords = attendanceResponse?.data?.pagination?.total || 0
  const totalPages = Math.ceil(totalRecords / pageSize)

  // Filter records by search term
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter((record: AttendanceRecord) => {
      const matchesSearch =
        searchTerm === '' ||
        (typeof record.courseId === 'string'
          ? record.courseId
          : record.courseId.name
        )
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (typeof record.sectionId === 'string'
          ? record.sectionId
          : record.sectionId.name
        )
          .toLowerCase()
          .includes(searchTerm.toLowerCase())

      const matchesSection =
        selectedSection === 'all' ||
        (typeof record.sectionId === 'string'
          ? record.sectionId
          : record.sectionId._id) === selectedSection

      return matchesSearch && matchesSection
    })
  }, [attendanceRecords, searchTerm, selectedSection])

  const handleDownloadPDF = async (recordId: string) => {
    try {
      console.log('Starting PDF download for record:', recordId)
      const blob = await downloadPDF(recordId).unwrap()
      console.log('PDF blob received, size:', blob.size)

      if (blob.size === 0) {
        throw new Error('Received empty PDF file')
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance-${recordId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      console.log('PDF download completed successfully')
    } catch (error) {
      console.error('Error downloading PDF:', error)

      // Show user-friendly error message
      let errorMessage = 'Failed to download PDF. Please try again.'
      if (error && typeof error === 'object' && 'status' in error) {
        if (error.status === 403) {
          errorMessage =
            'You do not have permission to download this attendance record.'
        } else if (error.status === 404) {
          errorMessage = 'Attendance record not found.'
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

      // You could add a toast notification here
      alert(errorMessage)
    }
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedSection('all')
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
  }

  if (!user) {
    return <div className="p-6">Please log in to view attendance history</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Page Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Attendance History
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back,{' '}
                <span className="font-medium">{user?.name}</span>
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 h-9 px-3 hover:bg-blue-50 hover:border-blue-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Button>
        </div>

        {/* Section Info for CR */}
        {user?.role === 'cr' && user?.sectionId && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Managing Section:{' '}
                <span className="font-bold">
                  {typeof user.sectionId === 'string'
                    ? user.sectionId
                    : `${user.sectionId.name} ${user.sectionId.code ? `(${user.sectionId.code})` : ''}`}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Modern Header Section */}
          <div className="bg-gradient-to-br from-gray-50 via-white to-blue-50 rounded-2xl p-6 border border-gray-200 backdrop-blur-sm mb-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📊 Attendance Records
              </h1>
              <p className="text-gray-600">
                View and manage attendance records with detailed insights
              </p>
            </div>

            {/* Enhanced Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">
                      Total Records
                    </p>
                    <p className="text-3xl font-bold">{totalRecords}</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <Calendar className="h-8 w-8" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium mb-1">
                      This Month
                    </p>
                    <p className="text-3xl font-bold">
                      {
                        attendanceRecords.filter((record: AttendanceRecord) => {
                          const recordDate = new Date(record.date)
                          const now = new Date()
                          return (
                            recordDate.getMonth() === now.getMonth() &&
                            recordDate.getFullYear() === now.getFullYear()
                          )
                        }).length
                      }
                    </p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <Users className="h-8 w-8" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium mb-1">
                      Average Attendance
                    </p>
                    <p className="text-3xl font-bold">
                      {attendanceRecords.length > 0
                        ? Math.round(
                            attendanceRecords.reduce(
                              (acc: number, record: AttendanceRecord) => {
                                const total = record.attendees.length
                                const present = record.attendees.filter(
                                  (a) => a.status === 'present'
                                ).length
                                return (
                                  acc +
                                  (total > 0 ? (present / total) * 100 : 0)
                                )
                              },
                              0
                            ) / attendanceRecords.length
                          )
                        : 100}
                      %
                    </p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <Eye className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Filters Section */}
          <div className="bg-white/70 rounded-xl p-6 backdrop-blur-sm border border-gray-200 shadow-lg mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gray-100 rounded-lg p-2">
                <Filter className="h-5 w-5 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Filters
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by course or section..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-gray-200 focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>

              {/* Section Filter - Only for Admin */}
              {user.role === 'admin' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Section
                  </label>
                  <Select
                    value={selectedSection}
                    onValueChange={setSelectedSection}
                  >
                    <SelectTrigger className="bg-white border-gray-200 focus:border-blue-400">
                      <SelectValue placeholder="All Sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {sectionsResponse?.data?.data?.map((section: Section) => (
                        <SelectItem key={section._id} value={section._id}>
                          {section.name} {section.code && `(${section.code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* From Date */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  From Date
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-white border-gray-200 focus:border-blue-400 transition-colors"
                />
              </div>

              {/* To Date */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  To Date
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-white border-gray-200 focus:border-blue-400 transition-colors"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="px-6 py-2 border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Enhanced Attendance Records Table */}
          <div className="bg-white/80 rounded-2xl shadow-xl border border-gray-200 backdrop-blur-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Attendance Records
              </h3>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-gray-600">
                    Loading attendance records...
                  </p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No Records Found
                  </h3>
                  <p className="text-gray-500">
                    No attendance records match your current filters.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-gray-100 to-gray-50 border-gray-200">
                            <TableHead className="font-bold text-gray-900">
                              Date
                            </TableHead>
                            <TableHead className="font-bold text-gray-900">
                              Section
                            </TableHead>
                            <TableHead className="font-bold text-gray-900">
                              Course
                            </TableHead>
                            <TableHead className="font-bold text-gray-900 text-center">
                              Total Students
                            </TableHead>
                            <TableHead className="font-bold text-gray-900 text-center">
                              Present
                            </TableHead>
                            <TableHead className="font-bold text-gray-900 text-center">
                              Absent
                            </TableHead>
                            <TableHead className="font-bold text-gray-900 text-center">
                              Attendance %
                            </TableHead>
                            <TableHead className="font-bold text-gray-900">
                              Taken By
                            </TableHead>
                            <TableHead className="font-bold text-gray-900">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRecords.map(
                            (record: AttendanceRecord, index) => {
                              const totalStudents = record.attendees.length
                              const presentStudents = record.attendees.filter(
                                (a) => a.status === 'present'
                              ).length
                              const attendancePercentage =
                                totalStudents > 0
                                  ? (
                                      (presentStudents / totalStudents) *
                                      100
                                    ).toFixed(1)
                                  : '0'

                              return (
                                <TableRow
                                  key={record._id}
                                  className={`hover:bg-blue-50 transition-colors duration-200 border-gray-100 ${
                                    index % 2 === 0
                                      ? 'bg-white'
                                      : 'bg-gray-50/50'
                                  }`}
                                >
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      {new Date(
                                        record.date
                                      ).toLocaleDateString()}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {typeof record.sectionId === 'string'
                                      ? record.sectionId
                                      : `${record.sectionId.name} ${record.sectionId.code ? `(${record.sectionId.code})` : ''}`}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {typeof record.courseId === 'string'
                                      ? record.courseId
                                      : `${record.courseId.name} ${record.courseId.code ? `(${record.courseId.code})` : ''}`}
                                  </TableCell>
                                  <TableCell className="text-center font-bold text-gray-900">
                                    {totalStudents}
                                  </TableCell>
                                  <TableCell className="text-center font-bold text-green-600">
                                    {presentStudents}
                                  </TableCell>
                                  <TableCell className="text-center font-bold text-red-600">
                                    {totalStudents - presentStudents}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span
                                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                                        parseFloat(attendancePercentage) >= 80
                                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                          : parseFloat(attendancePercentage) >=
                                              60
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
                                      <span className="truncate">
                                        {typeof record.takenBy === 'string'
                                          ? record.takenBy
                                          : record.takenBy.name}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleDownloadPDF(record._id)
                                      }
                                      className="flex items-center gap-1 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                                    >
                                      <Download className="h-3 w-3" />
                                      PDF
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              )
                            }
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                    {filteredRecords.map((record: AttendanceRecord) => {
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
                          className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl p-4 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm font-semibold text-gray-900">
                                {new Date(record.date).toLocaleDateString()}
                              </span>
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

                          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                            <div>
                              <span className="text-gray-500">
                                Section:
                              </span>
                              <div className="font-medium text-gray-900">
                                {typeof record.sectionId === 'string'
                                  ? record.sectionId
                                  : `${record.sectionId.name} ${record.sectionId.code ? `(${record.sectionId.code})` : ''}`}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">
                                Course:
                              </span>
                              <div className="font-medium text-gray-900 truncate">
                                {typeof record.courseId === 'string'
                                  ? record.courseId
                                  : record.courseId.name}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">
                                Present:
                              </span>
                              <div className="font-bold text-green-600">
                                {presentStudents}/{totalStudents}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">
                                Taken by:
                              </span>
                              <div className="font-medium text-gray-900 truncate">
                                {typeof record.takenBy === 'string'
                                  ? record.takenBy
                                  : record.takenBy.name}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadPDF(record._id)}
                              className="flex items-center gap-1 hover:bg-blue-50 hover:border-blue-200"
                            >
                              <Download className="h-3 w-3" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Enhanced Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4">
                      <div className="text-sm text-gray-600">
                        Showing {(currentPage - 1) * pageSize + 1} to{' '}
                        {Math.min(currentPage * pageSize, totalRecords)} of{' '}
                        {totalRecords} records
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                          }
                          className="hover:bg-blue-50 hover:border-blue-200"
                        >
                          Previous
                        </Button>
                        <div className="flex gap-1">
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                              const page = i + 1
                              return (
                                <Button
                                  key={page}
                                  variant={
                                    currentPage === page ? 'default' : 'outline'
                                  }
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
                                  className={
                                    currentPage === page
                                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                      : 'hover:bg-blue-50 hover:border-blue-200'
                                  }
                                >
                                  {page}
                                </Button>
                              )
                            }
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(totalPages, prev + 1)
                            )
                          }
                          className="hover:bg-blue-50 hover:border-blue-200"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
