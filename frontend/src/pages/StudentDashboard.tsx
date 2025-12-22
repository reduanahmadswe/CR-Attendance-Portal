import { QRScanner } from '@/components/QRScanner';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import { Button } from '@/components/ui/button';
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
  History,
  QrCode,
  User,
  XCircle,
  KeyRound,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

// Quick Access Card Component
interface QuickAccessCardProps {
  icon: React.ReactNode;
  label: string;
  bgColor: string;
  onClick?: () => void;
  isActive?: boolean;
}

const QuickAccessCard = ({ icon, label, bgColor, onClick, isActive }: QuickAccessCardProps) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-4 sm:p-6 bg-white rounded-2xl border-2 transition-all duration-300 hover:shadow-lg group ${
      isActive ? 'border-emerald-300 shadow-lg bg-emerald-50/30' : 'border-gray-100 shadow-sm hover:border-gray-200'
    }`}
  >
    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${bgColor} flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300`}>
      {icon}
    </div>
    <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">{label}</span>
  </button>
);

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
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [hasShownPasswordPrompt, setHasShownPasswordPrompt] = useState(false);

  // Use authUser from context if available, fallback to Redux user
  const currentUser = authUser || user;

  // Get student ID
  const studentId = currentUser?._id || '';

  // Check if this is first login (isPasswordDefault = true)
  const isPasswordDefault = currentUser?.isPasswordDefault === true;

  // Show password change modal on first login (only once per session)
  useEffect(() => {
    if (isPasswordDefault && !hasShownPasswordPrompt) {
      setTimeout(() => {
        setIsPasswordModalOpen(true);
        setHasShownPasswordPrompt(true);
        toast.info('Security এর জন্য আপনার password পরিবর্তন করুন!', {
          duration: 5000,
        });
      }, 1000); // Show after 1 second delay
    }
  }, [isPasswordDefault, hasShownPasswordPrompt]);

  // Fetch student's attendance history
  const { data: attendanceResponse, isLoading: attendanceLoading, error: attendanceError } = useGetStudentAttendanceQuery(
    studentId,
    { skip: !studentId }
  );

  // Debug: Log API response
  useEffect(() => {
    console.log('🔍 Student ID:', studentId);
    console.log('🔍 Attendance Loading:', attendanceLoading);
    console.log('🔍 Attendance Response:', attendanceResponse);
    console.log('🔍 Attendance Error:', attendanceError);
  }, [studentId, attendanceLoading, attendanceResponse, attendanceError]);

  const attendanceRecords = useMemo(() => 
    (attendanceResponse?.data || []) as unknown as StudentAttendanceRecord[], 
    [attendanceResponse?.data]
  );

  // Debug: Log attendance data to verify it's counting from all courses
  useEffect(() => {
    console.log('📊 Attendance Records Array:', attendanceRecords);
    if (attendanceRecords.length > 0) {
      console.log('📊 Total Attendance Records:', attendanceRecords.length);
      console.log('📚 Courses:', [...new Set(attendanceRecords.map(r => 
        typeof r.courseId === 'object' ? r.courseId.name : 'Unknown'
      ))]);
      console.log('✅ Present:', attendanceRecords.filter(r => r.attendance?.status === 'present').length);
      console.log('❌ Absent:', attendanceRecords.filter(r => r.attendance?.status === 'absent').length);
      console.log('⏰ Late:', attendanceRecords.filter(r => r.attendance?.status === 'late').length);
      console.log('📝 Excused:', attendanceRecords.filter(r => r.attendance?.status === 'excused').length);
    } else {
      console.log('⚠️ No attendance records found!');
    }
  }, [attendanceRecords]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!auth?.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="text-center space-y-4">
          <User className="h-16 w-16 text-gray-400 mx-auto" />
          <p className="text-gray-600 font-medium">
            Please login to continue
          </p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }



  // Calculate attendance statistics from API data
  const totalClasses = attendanceRecords.length;
  
  const presentCount = attendanceRecords.filter((record: StudentAttendanceRecord) => {
    return record.attendance?.status === 'present';
  }).length;
  
  const lateCount = attendanceRecords.filter((record: StudentAttendanceRecord) => {
    return record.attendance?.status === 'late';
  }).length;
  
  const excusedCount = attendanceRecords.filter((record: StudentAttendanceRecord) => {
    return record.attendance?.status === 'excused';
  }).length;
  
  const absentCount = attendanceRecords.filter((record: StudentAttendanceRecord) => {
    return record.attendance?.status === 'absent';
  }).length;
  
  // Calculate attendance percentage (present + late + excused counts as attended)
  const attendedCount = presentCount + lateCount + excusedCount;
  const attendancePercentage = totalClasses > 0 
    ? Math.round((attendedCount / totalClasses) * 100) 
    : 0;

  // QR Scan success handler
  const handleScanSuccess = () => {
    toast.success('Attendance marked successfully!');
    // Refresh attendance history
    setTimeout(() => {
      setActiveSection('history');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="rounded-xl p-3 sm:p-4 border bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-white shadow-sm">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalClasses}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">TOTAL CLASSES</p>
          </div>
          <div className="rounded-xl p-3 sm:p-4 border bg-emerald-50 border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-white shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600">{presentCount}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">PRESENT</p>
          </div>
          <div className="rounded-xl p-3 sm:p-4 border bg-red-50 border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-white shadow-sm">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-red-600">{absentCount}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">ABSENT</p>
          </div>
          <div className="rounded-xl p-3 sm:p-4 border bg-purple-50 border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-white shadow-sm">
                <Calendar className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-purple-600">{attendancePercentage}%</p>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">ATTENDANCE</p>
          </div>
        </div>

        {/* Quick Access Section */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            <QuickAccessCard
              icon={<QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />}
              label="Scan QR"
              bgColor="bg-emerald-50"
              onClick={() => setActiveSection('scan')}
              isActive={activeSection === 'scan'}
            />
            <QuickAccessCard
              icon={<History className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />}
              label="History"
              bgColor="bg-blue-50"
              onClick={() => setActiveSection('history')}
              isActive={activeSection === 'history'}
            />
            <QuickAccessCard
              icon={<Bell className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500" />}
              label="Announcements"
              bgColor="bg-pink-50"
              onClick={() => navigate('/announcements')}
            />
            <QuickAccessCard
              icon={<KeyRound className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />}
              label="Change Password"
              bgColor="bg-orange-50"
              onClick={() => setIsPasswordModalOpen(true)}
            />
            <QuickAccessCard
              icon={<User className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />}
              label="Profile"
              bgColor="bg-indigo-50"
              onClick={() => {}}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {activeSection === 'scan' ? 'Scan QR Code' : 'Attendance History'}
          </h3>

          {/* Content Sections */}
          {activeSection === 'scan' ? (
            <QRScanner studentId={studentId} onSuccess={handleScanSuccess} />
          ) : (
            <div>
              {attendanceLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                </div>
              ) : attendanceRecords.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
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
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Present
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
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
            </div>
          )}
        </div>
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        isFirstLogin={isPasswordDefault}
      />
    </div>
  );
}
