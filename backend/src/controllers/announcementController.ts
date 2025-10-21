import { Request, Response } from 'express';
import { Announcement, Course, Student, User } from '../models';
import { ApiResponse, PaginatedResponse } from '../types';
import { AppError, asyncHandler } from '../utils/errorHandler';
import { generateAnnouncementText, sendAnnouncementEmails } from '../utils/emailService';

/**
 * Create a new announcement
 * POST /api/announcements
 * Access: CR, Instructor, Admin
 */
export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    const {
        title,
        type,
        message,
        courseId,
        sendEmail,
        topic,
        slideLink,
        time,
        room,
    } = req.body;

    const createdBy = req.user?.userId;

    if (!createdBy) {
        throw new AppError('User not authenticated', 401);
    }

    // Verify course exists and get section info
    const course = await Course.findById(courseId).populate('sectionId');

    if (!course) {
        throw new AppError('Course not found', 404);
    }

    const sectionId = course.sectionId;

    // CR can only create announcements for their assigned section
    if (req.user?.role === 'cr') {
        if (!req.user.sectionId) {
            throw new AppError('CR must be assigned to a section', 403);
        }

        const userSectionId = String(req.user.sectionId);
        const courseSectionId = typeof sectionId === 'object' && sectionId !== null && '_id' in sectionId
            ? String((sectionId as any)._id)
            : String(sectionId);

        console.log('🔍 Section ID comparison:', { 
            userSectionId, 
            courseSectionId, 
            match: userSectionId === courseSectionId 
        });

        if (userSectionId !== courseSectionId) {
            throw new AppError('You can only create announcements for your assigned section', 403);
        }
    }

    // Build announcement details if type requires them
    const typesRequiringDetails = ['quiz-1', 'quiz-2', 'quiz-3', 'quiz-4', 'presentation', 'midterm', 'final', 'assignment'];
    let details: any = undefined;

    if (typesRequiringDetails.includes(type)) {
        details = {
            topic,
            slideLink,
            time: time ? new Date(time) : undefined,
            room,
        };
    }

    // Create announcement
    const announcement = await Announcement.create({
        title,
        type,
        message,
        courseId,
        sectionId,
        createdBy,
        sendEmail,
        details,
    });

    // Populate references
    await announcement.populate([
        { path: 'courseId', select: 'name code' },
        { path: 'sectionId', select: 'name code' },
        { path: 'createdBy', select: 'name email role' },
    ]);

    console.log(`📢 Announcement created: ${announcement._id} by ${req.user?.email}`);

    // Generate text message for "Copy Text" button
    const user = await User.findById(createdBy).select('name');
    const textMessage = generateAnnouncementText({
        title,
        type,
        message,
        courseName: (announcement.courseId as any).name,
        senderName: user?.name || 'Unknown',
        details,
    });

    // If sendEmail is true, send emails to students
    let emailResult = null;

    if (sendEmail) {
        // Get all students enrolled in this course
        const students = await Student.find({
            courses: courseId,
            sectionId,
        }).select('email name');

        if (students.length === 0) {
            console.log('⚠️ No students found for this course');
        } else {
            const recipients = students.map((s) => s.email);

            emailResult = await sendAnnouncementEmails(recipients, {
                title,
                type,
                message,
                courseName: (announcement.courseId as any).name,
                senderName: user?.name || 'Unknown',
                details,
            });

            // Update announcement with email status
            announcement.emailSent = emailResult.sent > 0;
            announcement.emailSentAt = new Date();
            announcement.emailRecipients = emailResult.recipients;
            await announcement.save();

            console.log(`📧 Emails sent: ${emailResult.sent}/${recipients.length}`);
        }
    }

    const response: ApiResponse<any> = {
        success: true,
        message: sendEmail
            ? `Announcement created and ${emailResult?.sent || 0} emails sent successfully`
            : 'Announcement created successfully',
        data: {
            announcement,
            textMessage,
            emailStatus: emailResult
                ? {
                      sent: emailResult.sent,
                      failed: emailResult.failed,
                      total: emailResult.sent + emailResult.failed,
                  }
                : null,
        },
    };

    res.status(201).json(response);
});

/**
 * Get all announcements with filters
 * GET /api/announcements
 * Access: CR, Instructor, Admin, Viewer
 */
export const getAnnouncements = asyncHandler(async (req: Request, res: Response) => {
    const {
        courseId,
        sectionId,
        type,
        page = '1',
        limit = '20',
        sortBy = 'createdAt',
        order = 'desc',
    } = req.query;

    // Build filter
    const filter: any = {};

    if (courseId) {
        filter.courseId = courseId;
    }

    if (sectionId) {
        filter.sectionId = sectionId;
    }

    if (type) {
        filter.type = type;
    }

    // Role-based filtering
    if (req.user?.role === 'cr') {
        // CR can only see announcements for their section
        if (!req.user.sectionId) {
            throw new AppError('CR must be assigned to a section', 403);
        }
        filter.sectionId = req.user.sectionId;
    }

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sortOrder = order === 'asc' ? 1 : -1;
    const sort: any = { [sortBy as string]: sortOrder };

    // Execute query
    const [announcements, total] = await Promise.all([
        Announcement.find(filter)
            .populate('courseId', 'name code')
            .populate('sectionId', 'name code')
            .populate('createdBy', 'name email role')
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean(),
        Announcement.countDocuments(filter),
    ]);

    const response: any = {
        success: true,
        message: 'Announcements retrieved successfully',
        data: announcements,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
        },
    };

    res.status(200).json(response);
});

/**
 * Get announcement by ID
 * GET /api/announcements/:id
 * Access: CR, Instructor, Admin, Viewer
 */
export const getAnnouncementById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const announcement = await Announcement.findById(id)
        .populate('courseId', 'name code semester')
        .populate('sectionId', 'name code description')
        .populate('createdBy', 'name email role')
        .lean();

    if (!announcement) {
        throw new AppError('Announcement not found', 404);
    }

    // Role-based access control
    if (req.user?.role === 'cr') {
        if (!req.user.sectionId) {
            throw new AppError('CR must be assigned to a section', 403);
        }

        if ((announcement.sectionId as any)._id.toString() !== req.user.sectionId) {
            throw new AppError('You can only view announcements for your assigned section', 403);
        }
    }

    const response: ApiResponse<any> = {
        success: true,
        message: 'Announcement retrieved successfully',
        data: announcement,
    };

    res.status(200).json(response);
});

/**
 * Update announcement
 * PUT /api/announcements/:id
 * Access: Admin, Creator only
 */
export const updateAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        title,
        type,
        message,
        topic,
        slideLink,
        time,
        room,
    } = req.body;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
        throw new AppError('Announcement not found', 404);
    }

    // Only admin or creator can update
    if (req.user?.role !== 'admin' && announcement.createdBy.toString() !== req.user?.userId) {
        throw new AppError('You can only update your own announcements', 403);
    }

    // Update fields
    if (title !== undefined) announcement.title = title;
    if (type !== undefined) announcement.type = type;
    if (message !== undefined) announcement.message = message;

    // Update details if type requires them
    const typesRequiringDetails = ['quiz-1', 'quiz-2', 'quiz-3', 'quiz-4', 'presentation', 'midterm', 'final', 'assignment'];
    
    if (type && typesRequiringDetails.includes(type)) {
        announcement.details = {
            topic: topic || announcement.details?.topic,
            slideLink: slideLink || announcement.details?.slideLink,
            time: time ? new Date(time) : announcement.details?.time,
            room: room || announcement.details?.room,
        } as any;
    } else if (type && !typesRequiringDetails.includes(type)) {
        announcement.details = undefined as any;
    }

    await announcement.save();

    await announcement.populate([
        { path: 'courseId', select: 'name code' },
        { path: 'sectionId', select: 'name code' },
        { path: 'createdBy', select: 'name email role' },
    ]);

    console.log(`📝 Announcement updated: ${announcement._id} by ${req.user?.email}`);

    const response: ApiResponse<any> = {
        success: true,
        message: 'Announcement updated successfully',
        data: announcement,
    };

    res.status(200).json(response);
});

/**
 * Delete announcement
 * DELETE /api/announcements/:id
 * Access: Admin, Creator only
 */
export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
        throw new AppError('Announcement not found', 404);
    }

    // Only admin or creator can delete
    if (req.user?.role !== 'admin' && announcement.createdBy.toString() !== req.user?.userId) {
        throw new AppError('You can only delete your own announcements', 403);
    }

    await announcement.deleteOne();

    console.log(`🗑️ Announcement deleted: ${id} by ${req.user?.email}`);

    const response: ApiResponse<null> = {
        success: true,
        message: 'Announcement deleted successfully',
        data: null,
    };

    res.status(200).json(response);
});

/**
 * Get announcement statistics
 * GET /api/announcements/stats
 * Access: CR, Instructor, Admin
 */
export const getAnnouncementStats = asyncHandler(async (req: Request, res: Response) => {
    const { sectionId, courseId } = req.query;

    const filter: any = {};

    if (sectionId) {
        filter.sectionId = sectionId;
    }

    if (courseId) {
        filter.courseId = courseId;
    }

    // Role-based filtering
    if (req.user?.role === 'cr') {
        if (!req.user.sectionId) {
            throw new AppError('CR must be assigned to a section', 403);
        }
        filter.sectionId = req.user.sectionId;
    }

    const stats = await Announcement.aggregate([
        { $match: filter },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                emailsSent: {
                    $sum: { $cond: ['$emailSent', 1, 0] },
                },
            },
        },
        { $sort: { count: -1 } },
    ]);

    const total = await Announcement.countDocuments(filter);

    const response: ApiResponse<any> = {
        success: true,
        message: 'Announcement statistics retrieved successfully',
        data: {
            total,
            byType: stats,
        },
    };

    res.status(200).json(response);
});
