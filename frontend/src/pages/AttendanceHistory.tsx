import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { AttendanceRecord, Section } from '@/types'
import { Calendar, Download, Eye, Filter, Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

export function AttendanceHistory() {
  const user = useSelector((state: RootState) => state.auth.user)

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
      const blob = await downloadPDF(recordId).unwrap()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance-${recordId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Attendance History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage attendance records
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Records
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalRecords}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-500">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    This Month
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
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
                <div className="p-3 rounded-full bg-green-500">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Average Attendance
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {attendanceRecords.length > 0
                      ? Math.round(
                          attendanceRecords.reduce(
                            (acc: number, record: AttendanceRecord) => {
                              const total = record.attendees.length
                              const present = record.attendees.filter(
                                (a) => a.status === 'present'
                              ).length
                              return (
                                acc + (total > 0 ? (present / total) * 100 : 0)
                              )
                            },
                            0
                          ) / attendanceRecords.length
                        )
                      : 0}
                    %
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-500">
                  <Eye className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by course or section..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {user.role === 'admin' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Section</label>
                  <Select
                    value={selectedSection}
                    onValueChange={setSelectedSection}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All sections" />
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

              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                Loading attendance records...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No attendance records found</p>
              </div>
            ) : (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record: AttendanceRecord) => {
                        const totalStudents = record.attendees.length
                        const presentStudents = record.attendees.filter(
                          (a) => a.status === 'present'
                        ).length
                        const attendancePercentage =
                          totalStudents > 0
                            ? ((presentStudents / totalStudents) * 100).toFixed(
                                1
                              )
                            : '0'

                        return (
                          <TableRow key={record._id}>
                            <TableCell>
                              {new Date(record.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {typeof record.sectionId === 'string'
                                ? record.sectionId
                                : `${record.sectionId.name} ${record.sectionId.code ? `(${record.sectionId.code})` : ''}`}
                            </TableCell>
                            <TableCell>
                              {typeof record.courseId === 'string'
                                ? record.courseId
                                : `${record.courseId.name} (${record.courseId.code || ''})`}
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
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadPDF(record._id)}
                                className="flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" />
                                PDF
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-500">
                      Showing {(currentPage - 1) * pageSize + 1} to{' '}
                      {Math.min(currentPage * pageSize, totalRecords)} of{' '}
                      {totalRecords} records
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                      >
                        Previous
                      </Button>
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
                            >
                              {page}
                            </Button>
                          )
                        }
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
