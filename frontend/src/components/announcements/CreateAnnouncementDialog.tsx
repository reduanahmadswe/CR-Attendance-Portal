import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
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
import { useCreateAnnouncementMutation, useGetSectionCoursesQuery } from '@/lib/apiSlice';
import type { RootState } from '@/lib/simpleStore';
import type { AnnouncementType, CreateAnnouncementRequest } from '@/types';
import { AlertCircle, CheckCircle2, Copy, Loader2, Mail } from 'lucide-react';
import { useSelector } from 'react-redux';

interface CreateAnnouncementDialogProps {
  onClose: () => void;
}

const CreateAnnouncementDialog = ({ onClose }: CreateAnnouncementDialogProps) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const sectionId = typeof user?.sectionId === 'string' ? user.sectionId : user?.sectionId?._id;

  const [formData, setFormData] = useState<CreateAnnouncementRequest>({
    title: '', // Will be auto-generated from type
    message: '',
    type: 'quiz-1',
    courseId: '',
    sendEmail: false,
  });

  const [showDetails, setShowDetails] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [emailStatus, setEmailStatus] = useState<{
    sent: number;
    failed: number;
    total: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: coursesResponse } = useGetSectionCoursesQuery(
    { sectionId: sectionId || '', params: { limit: 100 } },
    { skip: !sectionId }
  );

  const [createAnnouncement, { isLoading, error }] = useCreateAnnouncementMutation();

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
    setShowDetails(typesWithDetails.includes(formData.type));

    // Reset details if not needed
    if (!typesWithDetails.includes(formData.type)) {
      setFormData((prev) => ({ ...prev, details: undefined }));
    }
  }, [formData.type]);

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

    const generatedTitle = typeToTitleMap[formData.type];

    try {
      // Flatten the details object for backend
      const requestData = {
        title: generatedTitle,
        type: formData.type,
        courseId: formData.courseId,
        sendEmail: formData.sendEmail,
        ...(formData.message && formData.message.trim() && { message: formData.message }),
        ...(formData.details?.topic && { topic: formData.details.topic }),
        ...(formData.details?.time && { time: formData.details.time }),
        ...(formData.details?.room && { room: formData.details.room }),
        ...(formData.details?.slideLink && { slideLink: formData.details.slideLink }),
      };

      const result = await createAnnouncement(requestData as CreateAnnouncementRequest).unwrap();

      if (result?.data?.textMessage) {
        setGeneratedText(result.data.textMessage);
      }

      if (result?.data?.emailStatus) {
        setEmailStatus(result.data.emailStatus);
      }

      // If email was sent or text generated, don't close immediately
      if (!result?.data?.textMessage && !result?.data?.emailStatus) {
        onClose();
      }
    } catch (err) {
      console.error('Failed to create announcement:', err);
    }
  };

  const handleCopyText = () => {
    if (generatedText) {
      navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setFormData({
      title: '', // Will be auto-generated
      message: '',
      type: 'quiz-1',
      courseId: '',
      sendEmail: false,
    });
    setGeneratedText('');
    setEmailStatus(null);
    setCopied(false);
  };

  // Show success state
  if (generatedText || emailStatus) {
    return (
      <DialogContent className="max-w-[95vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600 text-lg sm:text-xl">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="hidden sm:inline">Announcement Created Successfully</span>
            <span className="sm:hidden">Created Successfully</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Your announcement has been created and saved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Generated Text Message */}
          {generatedText && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-900">Generated Message</h4>
                <Button variant="outline" size="sm" onClick={handleCopyText}>
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Text
                    </>
                  )}
                </Button>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-white p-3 rounded border">
                {generatedText}
              </pre>
              <p className="text-xs text-gray-500 mt-2">
                Copy this text and share it on WhatsApp or other platforms
              </p>
            </div>
          )}

          {/* Email Status */}
          {emailStatus && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-900">Email Delivery Status</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Successfully sent:</span>
                  <span className="font-semibold text-green-600">{emailStatus.sent}</span>
                </div>
                {emailStatus.failed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Failed:</span>
                    <span className="font-semibold text-red-600">{emailStatus.failed}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-700">Total recipients:</span>
                  <span className="font-semibold text-gray-900">
                    {emailStatus.total}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Create Another
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    );
  }

  // Show form
  return (
    <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl">Create New Announcement</DialogTitle>
        <DialogDescription className="text-sm">
          Fill in the details below to create a new announcement
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
          <div className="bg-blue-50 rounded-lg p-4 space-y-4">
            <h4 className="font-semibold text-blue-900">Additional Details</h4>

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
                value={formData.details?.time || ''}
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

        {/* Send Email Checkbox */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-4">
          <input
            type="checkbox"
            id="sendEmail"
            checked={formData.sendEmail}
            onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <Label htmlFor="sendEmail" className="cursor-pointer">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>Send email notifications to all students</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.sendEmail
                ? 'Emails will be sent to all students in the course'
                : 'A formatted text message will be generated for manual sharing'}
            </p>
          </Label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 rounded-lg p-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Failed to create announcement</p>
              <p className="text-sm text-red-700 mt-1">
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
                Creating...
              </>
            ) : (
              'Create Announcement'
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default CreateAnnouncementDialog;
