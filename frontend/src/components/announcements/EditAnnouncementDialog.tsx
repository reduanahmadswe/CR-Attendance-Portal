import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateAnnouncementMutation, useGetSectionCoursesQuery } from '@/lib/apiSlice';
import type { RootState } from '@/lib/simpleStore';
import type { Announcement, AnnouncementType, UpdateAnnouncementRequest } from '@/types';
import { AlertCircle, Loader2, Mail } from 'lucide-react';
import { useSelector } from 'react-redux';

interface EditAnnouncementDialogProps {
  announcement: Announcement;
  onClose: () => void;
}

const EditAnnouncementDialog = ({ announcement, onClose }: EditAnnouncementDialogProps) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const sectionId = typeof user?.sectionId === 'string' ? user.sectionId : user?.sectionId?._id;

  const courseId = typeof announcement.courseId === 'string'
    ? announcement.courseId
    : announcement.courseId._id;

  const [formData, setFormData] = useState<UpdateAnnouncementRequest>({
    title: announcement.title,
    message: announcement.message,
    type: announcement.type,
    courseId: courseId,
    details: announcement.details || {},
  });

  const [showDetails, setShowDetails] = useState(false);

  const { data: coursesResponse } = useGetSectionCoursesQuery(
    { sectionId: sectionId || '', params: { limit: 100 } },
    { skip: !sectionId }
  );

  const [updateAnnouncement, { isLoading, error, isSuccess }] = useUpdateAnnouncementMutation();

  const courses = coursesResponse?.data?.data || [];

  // Check if selected type requires details
  useEffect(() => {
    const typesWithDetails: AnnouncementType[] = [
      'quiz-1',
      'quiz-2',
      'quiz-3',
      'quiz-4',
      'presentation',
      'midterm',
      'final',
      'assignment',
      'class_reschedule',
    ];
    setShowDetails(formData.type ? typesWithDetails.includes(formData.type) : false);

    // Reset details if not needed
    if (formData.type && !typesWithDetails.includes(formData.type)) {
      setFormData((prev) => ({ ...prev, details: undefined }));
    }
  }, [formData.type]);

  // Close dialog on success
  useEffect(() => {
    if (isSuccess) {
      onClose();
    }
  }, [isSuccess, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.courseId) {
      alert('Please select a course');
      return;
    }

    // Auto-generate title from announcement type
    const typeToTitleMap: Record<AnnouncementType, string> = {
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

    const generatedTitle = formData.type ? typeToTitleMap[formData.type] : announcement.title;

    try {
      await updateAnnouncement({ 
        id: announcement._id, 
        data: {
          ...formData,
          title: generatedTitle
        } 
      }).unwrap();
    } catch (err) {
      console.error('Failed to update announcement:', err);
    }
  };

  // Format datetime for input
  const formatDateTimeForInput = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Edit Announcement</DialogTitle>
          <DialogDescription className="text-sm">
            Update the announcement details below
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Announcement Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value: AnnouncementType) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
          </div>

          {/* Course */}
          <div className="space-y-2">
            <Label htmlFor="course">
              Course <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.courseId}
              onValueChange={(value) => setFormData({ ...formData, courseId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course._id} value={course._id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Additional message (optional)"
              rows={4}
            />
          </div>

          {/* Conditional Details */}
          {showDetails && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Additional Details</h4>

              {/* Topic - For Quiz, Assignment, Presentation (optional) */}
              {(formData.type === 'quiz-1' || 
                formData.type === 'quiz-2' || 
                formData.type === 'quiz-3' || 
                formData.type === 'quiz-4' || 
                formData.type === 'assignment' || 
                formData.type === 'presentation') && (
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic (Optional)</Label>
                  <Input
                    id="topic"
                    value={formData.details?.topic || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        details: { ...formData.details, topic: e.target.value },
                      })
                    }
                    placeholder="Enter topic"
                  />
                </div>
              )}

              {/* Syllabus - For Midterm/Final */}
              {(formData.type === 'midterm' || formData.type === 'final') && (
                <div className="space-y-2">
                  <Label htmlFor="topic">Syllabus (Optional)</Label>
                  <Textarea
                    id="topic"
                    value={formData.details?.topic || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        details: { ...formData.details, topic: e.target.value },
                      })
                    }
                    placeholder="Enter syllabus topics"
                    rows={3}
                  />
                </div>
              )}

              {/* Date & Time - For all types with details */}
              <div className="space-y-2">
                <Label htmlFor="time">
                  Date & Time {(formData.type === 'class_reschedule') && '(Required for Reschedule)'}
                </Label>
                <Input
                  id="time"
                  type="datetime-local"
                  value={formatDateTimeForInput(formData.details?.time)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      details: { ...formData.details, time: e.target.value },
                    })
                  }
                />
              </div>

              {/* Room - For all types with details */}
              <div className="space-y-2">
                <Label htmlFor="room">Room (Optional)</Label>
                <Input
                  id="room"
                  value={formData.details?.room || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      details: { ...formData.details, room: e.target.value },
                    })
                  }
                  placeholder="Enter room number"
                />
              </div>

              {/* Slide/Presentation Link - For Presentation only */}
              {formData.type === 'presentation' && (
                <div className="space-y-2">
                  <Label htmlFor="slideLink">Presentation List Link (Optional)</Label>
                  <Input
                    id="slideLink"
                    type="url"
                    value={formData.details?.slideLink || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        details: { ...formData.details, slideLink: e.target.value },
                      })
                    }
                    placeholder="https://example.com/presentations"
                  />
                </div>
              )}
            </div>
          )}

          {/* Email Info */}
          {announcement.emailSent && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <Mail className="w-5 h-5" />
                <p className="text-sm">
                  <strong>Note:</strong> Emails were already sent for this announcement. 
                  Editing will not resend emails.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-100">Failed to update announcement</p>
                <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                  {(error as { data?: { error?: string } })?.data?.error || 'An error occurred. Please try again.'}
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Announcement'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAnnouncementDialog;
