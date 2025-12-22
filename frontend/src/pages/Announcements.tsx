import { useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetAnnouncementsQuery,
  useGetSectionCoursesQuery,
  useDeleteAnnouncementMutation,
  useGetAnnouncementStatsQuery,
} from '@/lib/apiSlice';
import type { RootState } from '@/lib/simpleStore';
import type { Announcement, AnnouncementType, Course } from '@/types';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  Filter,
  Mail,
  MapPin,
  Plus,
  Trash2,
  Link as LinkIcon,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import CreateAnnouncementDialog from '@/components/announcements/CreateAnnouncementDialog';
import EditAnnouncementDialog from '@/components/announcements/EditAnnouncementDialog';

const AnnouncementsPage = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const sectionId = typeof user?.sectionId === 'string' ? user.sectionId : user?.sectionId?._id;

  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Fetch courses for filter
  const { data: coursesResponse } = useGetSectionCoursesQuery(
    { sectionId: sectionId || '', params: { limit: 100 } },
    { skip: !sectionId }
  );

  // Fetch announcements
  const { data: announcementsResponse, isLoading, refetch } = useGetAnnouncementsQuery({
    ...(selectedCourse && selectedCourse !== 'all' && { courseId: selectedCourse }),
    ...(selectedType && selectedType !== 'all' && { type: selectedType as AnnouncementType }),
    page: currentPage,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Fetch stats
  const { data: statsResponse } = useGetAnnouncementStatsQuery({
    ...(sectionId && { sectionId }),
  });

  const [deleteAnnouncement] = useDeleteAnnouncementMutation();

  const courses = coursesResponse?.data?.data || [];
  const announcements = announcementsResponse?.data?.data || [];
  const pagination = announcementsResponse?.data?.pagination;
  const stats = statsResponse?.data;

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteAnnouncement(id).unwrap();
        refetch();
      } catch (error) {
        console.error('Failed to delete announcement:', error);
      }
    }
  };

  const getTypeColor = (type: AnnouncementType): string => {
    const colors: Record<AnnouncementType, string> = {
      'quiz-1': 'bg-blue-100 text-blue-800',
      'quiz-2': 'bg-blue-100 text-blue-800',
      'quiz-3': 'bg-blue-100 text-blue-800',
      'quiz-4': 'bg-blue-100 text-blue-800',
      presentation: 'bg-purple-100 text-purple-800',
      midterm: 'bg-red-100 text-red-800',
      final: 'bg-red-200 text-red-900',
      assignment: 'bg-orange-100 text-orange-800',
      class_cancel: 'bg-gray-100 text-gray-800',
      class_reschedule: 'bg-cyan-100 text-cyan-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: AnnouncementType) => {
    const icons: Record<AnnouncementType, React.ReactNode> = {
      'quiz-1': <FileText className="w-4 h-4" />,
      'quiz-2': <FileText className="w-4 h-4" />,
      'quiz-3': <FileText className="w-4 h-4" />,
      'quiz-4': <FileText className="w-4 h-4" />,
      presentation: <LinkIcon className="w-4 h-4" />,
      midterm: <Bell className="w-4 h-4" />,
      final: <Bell className="w-4 h-4" />,
      assignment: <FileText className="w-4 h-4" />,
      class_cancel: <Clock className="w-4 h-4" />,
      class_reschedule: <Calendar className="w-4 h-4" />,
    };
    return icons[type] || <Bell className="w-4 h-4" />;
  };

  const formatType = (type: AnnouncementType): string => {
    const typeNames: Record<AnnouncementType, string> = {
      'quiz-1': 'Quiz-1',
      'quiz-2': 'Quiz-2',
      'quiz-3': 'Quiz-3',
      'quiz-4': 'Quiz-4',
      presentation: 'Presentation',
      midterm: 'Midterm Exam',
      final: 'Final Exam',
      assignment: 'Assignment',
      class_cancel: 'Class Cancelled',
      class_reschedule: 'Class Rescheduled',
    };
    return typeNames[type] || type;
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canEdit = (announcement: Announcement): boolean => {
    if (user?.role === 'admin') return true;
    const createdBy = typeof announcement.createdBy === 'string' 
      ? announcement.createdBy 
      : announcement.createdBy._id;
    return user?._id === createdBy;
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                Announcements
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-600">
                Manage and view class announcements
              </p>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold text-indigo-600">{stats.total}</p>
                    <p className="text-xs sm:text-sm text-gray-600">Total</p>
                    <p className="text-xs text-gray-500 hidden sm:block">Announcements</p>
                  </div>
                </CardContent>
              </Card>
              {stats.byType.slice(0, 3).map((stat) => (
                <Card key={stat._id}>
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-bold text-indigo-600">{stat.count}</p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{formatType(stat._id)}</p>
                      <p className="text-xs text-gray-500">{stat.emailsSent} emails</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Filters and Create Button */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((course: Course) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="quiz-1">Quiz-1</SelectItem>
                    <SelectItem value="quiz-2">Quiz-2</SelectItem>
                    <SelectItem value="quiz-3">Quiz-3</SelectItem>
                    <SelectItem value="quiz-4">Quiz-4</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="midterm">Midterm Exam</SelectItem>
                    <SelectItem value="final">Final Exam</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="class_cancel">Class Cancelled</SelectItem>
                    <SelectItem value="class_reschedule">Class Rescheduled</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCourse('all');
                    setSelectedType('all');
                    setCurrentPage(1);
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>

                {(user?.role === 'admin' || user?.role === 'cr' || user?.role === 'instructor') && (
                  <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Create Announcement</span>
                        <span className="sm:hidden">Create</span>
                      </Button>
                    </DialogTrigger>
                    <CreateAnnouncementDialog
                      onClose={() => {
                        setShowCreateDialog(false);
                        refetch();
                      }}
                    />
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Announcements List */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 sm:py-12">
                <Bell className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-sm sm:text-base text-gray-600">No announcements found</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-2 px-4">
                  Try adjusting your filters or create a new announcement
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement: Announcement) => {
                const course = typeof announcement.courseId === 'string' 
                  ? null 
                  : announcement.courseId;
                const creator = typeof announcement.createdBy === 'string' 
                  ? null 
                  : announcement.createdBy;

                return (
                  <Card key={announcement._id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-4 sm:pt-6">
                      <div className="space-y-4">
                        {/* Header with badges and action buttons */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                          <div className="flex flex-wrap items-center gap-2 flex-1">
                            <span
                              className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getTypeColor(
                                announcement.type
                              )}`}
                            >
                              {getTypeIcon(announcement.type)}
                              <span className="hidden sm:inline">{formatType(announcement.type)}</span>
                              <span className="sm:hidden">{announcement.type}</span>
                            </span>
                            {announcement.emailSent && (
                              <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span className="hidden sm:inline">Email Sent</span>
                              </span>
                            )}
                          </div>

                          {canEdit(announcement) && (
                            <div className="flex gap-2 self-end sm:self-auto">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingAnnouncement(announcement)}
                              >
                                <Edit className="w-4 h-4" />
                                <span className="hidden sm:inline ml-1">Edit</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(announcement._id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline ml-1">Delete</span>
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Title and Message */}
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                            {announcement.title}
                          </h3>
                          {announcement.message && (
                            <p className="text-sm sm:text-base text-gray-700 mb-3 whitespace-pre-wrap">
                              {announcement.message}
                            </p>
                          )}
                        </div>

                        {/* Details for academic announcements */}
                        {announcement.details && (
                          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                            <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-2">Details</h4>
                            <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                              {announcement.details.topic && (
                                <div className="flex items-start gap-2">
                                  <FileText className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-gray-700 break-words">
                                    <strong>Topic:</strong> {announcement.details.topic}
                                  </span>
                                </div>
                              )}
                              {announcement.details.time && (
                                <div className="flex items-start gap-2">
                                  <Clock className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-gray-700">
                                    <strong>Time:</strong> {formatDateTime(announcement.details.time)}
                                  </span>
                                </div>
                              )}
                              {announcement.details.room && (
                                <div className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-gray-700">
                                    <strong>Room:</strong> {announcement.details.room}
                                  </span>
                                </div>
                              )}
                              {announcement.details.slideLink && (
                                <div className="flex items-start gap-2">
                                  <LinkIcon className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                  <a
                                    href={announcement.details.slideLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:underline break-all"
                                  >
                                    View Slides
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Footer metadata */}
                        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          {course && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="truncate max-w-[150px] sm:max-w-none">{course.name}</span>
                            </span>
                          )}
                          {creator && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">By {creator.name}</span>
                              <span className="sm:hidden">{creator.name}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">{formatDateTime(announcement.createdAt)}</span>
                            <span className="sm:hidden">{new Date(announcement.createdAt).toLocaleDateString()}</span>
                          </span>
                          {announcement.emailSentAt && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Sent {formatDateTime(announcement.emailSentAt)}</span>
                              <span className="sm:hidden">Sent</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-full sm:w-auto"
                size="sm"
              >
                Previous
              </Button>
              <span className="px-3 py-2 text-sm sm:text-base text-gray-700">
                Page {currentPage} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={currentPage === pagination.pages}
                className="w-full sm:w-auto"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </main>

        {/* Edit Dialog */}
        {editingAnnouncement && (
          <EditAnnouncementDialog
            announcement={editingAnnouncement}
            onClose={() => {
              setEditingAnnouncement(null);
              refetch();
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default AnnouncementsPage;
