import { QRScanner } from '@/components/QRScanner';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetStudentAttendanceQuery } from '@/lib/apiSlice';
import type { RootState } from '@/lib/simpleStore';
import {
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  LogOut,
  QrCode,
  User,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

interface StudentAttendanceRecord {
  _id: string;
  date: string;
  courseId: { name: string; code?: string } | string;
  sectionId: { name: string } | string;
  attendance: {
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    markedAt?: string;
  };
}

export function StudentDashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const auth = useAuth();
  const { isLoading, user: authUser } = auth;
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<'scan' | 'history'>('scan');

  // Use authUser from context if available, fallback to Redux user
  const currentUser = authUser || user;

  // Get student ID
  const studentId = currentUser?._id || '';

  // Fetch student's attendance history
  const { data: attendanceResponse, isLoading: attendanceLoading } = useGetStudentAttendanceQuery(
    studentId,
    { skip: !studentId }
  );

  const attendanceRecords = (attendanceResponse?.data || []) as unknown as StudentAttendanceRecord[];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!auth?.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center space-y-4">
          <User className="h-16 w-16 text-gray-400 mx-auto" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            Please login to continue
          </p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  // Logout handler
  const handleLogout = async () => {
    try {
      if (auth?.logout) {
        await auth.logout();
        toast.success('Logged out successfully');
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  // Calculate attendance statistics
  const totalClasses = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((record: StudentAttendanceRecord) => {
    return record.attendance?.status === 'present';
  }).length;
  const absentCount = totalClasses - presentCount;
  const attendancePercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  // QR Scan success handler
  const handleScanSuccess = () => {
    toast.success('Attendance marked successfully!');
    // Refresh attendance history
    setTimeout(() => {
      setActiveSection('history');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-700/60 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-indigo-50/50 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-indigo-900/20"></div>

        <div className="px-4 sm:px-6 lg:px-8 py-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                  {activeSection === 'scan' ? 'Mark Attendance' : 'Attendance History'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  Welcome, <span className="font-semibold">{currentUser?.name}</span>
                  {activeSection === 'scan' && (
                    <span className="ml-2 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">
                      QR Scanner
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant={activeSection === 'scan' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection('scan')}
                className={`flex items-center gap-2 h-10 px-4 ${
                  activeSection === 'scan'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                    : ''
                }`}
              >
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">Scan QR</span>
              </Button>
              <Button
                variant={activeSection === 'history' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection('history')}
                className={`flex items-center gap-2 h-10 px-4 ${
                  activeSection === 'history'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                    : ''
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/announcements')}
                className="flex items-center gap-2 h-10 px-4"
              >
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Announcements</span>
              </Button>
              <ThemeToggle />
              <Button
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 h-10 px-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {totalClasses}
                  </span>
                  <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-emerald-200 dark:border-emerald-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Present
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {presentCount}
                  </span>
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-red-200 dark:border-red-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Absent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {absentCount}
                  </span>
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Attendance %
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {attendancePercentage}%
                  </span>
                  <div className="relative">
                    <svg className="h-8 w-8" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#9333ea"
                        strokeWidth="3"
                        strokeDasharray={`${attendancePercentage}, 100`}
                      />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Sections */}
          {activeSection === 'scan' ? (
            <div className="animate-in fade-in-0 slide-in-from-left-4 duration-500">
              <QRScanner studentId={studentId} onSuccess={handleScanSuccess} />
            </div>
          ) : (
            <div className="animate-in fade-in-0 slide-in-from-right-4 duration-500">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Attendance History
                  </CardTitle>
                  <CardDescription>
                    View your complete attendance records across all courses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {attendanceLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                    </div>
                  ) : attendanceRecords.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No attendance records found
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Marked At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceRecords.map((record) => {
                            const attendance = record.attendance;
                            return (
                              <TableRow key={record._id}>
                                <TableCell>
                                  {new Date(record.date).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {typeof record.courseId === 'object' ? record.courseId?.name : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {attendance?.status === 'present' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Present
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full">
                                      <XCircle className="h-3 w-3" />
                                      Absent
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {attendance?.markedAt
                                    ? new Date(attendance.markedAt).toLocaleTimeString()
                                    : 'N/A'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
