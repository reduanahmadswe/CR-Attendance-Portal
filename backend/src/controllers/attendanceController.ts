import { Request, Response } from 'express';
import { AttendanceRecord, Course, Section, Student } from '../models';
import { ApiResponse, PaginatedResponse } from '../types';
import { AppError, asyncHandler } from '../utils/errorHandler';
import { generateAttendancePDF } from '../utils/pdfGenerator';

export const createAttendance = asyncHandler(async (req: Request, res: Response) => {
    const { sectionId, courseId, date, attendees } = req.body;
    const takenBy = req.user?.userId;

    // Verify section and course exist
    const [section, course] = await Promise.all([
        Section.findById(sectionId),
        Course.findById(courseId),
    ]);

    if (!section) {
        throw new AppError('Section not found', 404);
    }

    if (!course) {
        throw new AppError('Course not found', 404);
    }

    // Verify course belongs to section
    if (course.sectionId.toString() !== sectionId) {
        throw new AppError('Course does not belong to this section', 400);
    }

    // Verify all students belong to the section and course
    const studentIds = attendees.map((a: any) => a.studentId);
    const studentsCount = await Student.countDocuments({
        _id: { $in: studentIds },
        sectionId,
        courses: courseId,
    });

    if (studentsCount !== studentIds.length) {
        throw new AppError('Some students do not belong to this section or course', 400);
    }

    // Check if attendance already exists for this date, section, and course
    const existingAttendance = await AttendanceRecord.findOne({
        sectionId,
        courseId,
        date: new Date(date),
    });

    if (existingAttendance) {
        throw new AppError('Attendance already recorded for this date', 409);
    }

    const attendance = await AttendanceRecord.create({
        sectionId,
        courseId,
        date: new Date(date),
        takenBy,
        attendees,
    });

    const populatedAttendance = await AttendanceRecord.findById(attendance._id)
        .populate('sectionId', 'name code')
        .populate('courseId', 'name code')
        .populate('takenBy', 'name email')
        .populate('attendees.studentId', 'studentId name');

    const response: ApiResponse<any> = {
        success: true,
        data: populatedAttendance,
        message: 'Attendance recorded successfully',
    };

    res.status(201).json(response);
});

export const getAttendanceRecords = asyncHandler(async (req: Request, res: Response) => {
    const {
        sectionId,
        courseId,
        from,
        to,
        takenBy,
        page = 1,
        limit = 10,
    } = req.query;

    // Build filter
    const filter: any = {};

    if (sectionId) filter.sectionId = sectionId;
    if (courseId) filter.courseId = courseId;
    if (takenBy) filter.takenBy = takenBy;

    if (from || to) {
        filter.date = {};
        if (from) filter.date.$gte = new Date(from as string);
        if (to) filter.date.$lte = new Date(to as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [records, total] = await Promise.all([
        AttendanceRecord.find(filter)
            .populate('sectionId', 'name code')
            .populate('courseId', 'name code')
            .populate('takenBy', 'name email')
            .sort({ date: -1 })
            .skip(skip)
            .limit(Number(limit)),
        AttendanceRecord.countDocuments(filter),
    ]);

    const response: ApiResponse<PaginatedResponse<any>> = {
        success: true,
        data: {
            data: records,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        },
    };

    res.status(200).json(response);
});

export const getAttendanceRecord = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const record = await AttendanceRecord.findById(id)
        .populate('sectionId', 'name code')
        .populate('courseId', 'name code')
        .populate('takenBy', 'name email')
        .populate('attendees.studentId', 'studentId name email');

    if (!record) {
        throw new AppError('Attendance record not found', 404);
    }

    const response: ApiResponse<any> = {
        success: true,
        data: record,
    };

    res.status(200).json(response);
});

export const updateAttendanceRecord = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { attendees } = req.body;
    const updatedBy = req.user?.userId;

    const record = await AttendanceRecord.findById(id);

    if (!record) {
        throw new AppError('Attendance record not found', 404);
    }

    // Only allow admin or the person who took attendance to update
    if (req.user?.role !== 'admin' && record.takenBy.toString() !== updatedBy) {
        throw new AppError('You can only update attendance records you created', 403);
    }

    // Verify all students in the attendees belong to the section and course
    if (attendees && attendees.length > 0) {
        const studentIds = attendees.map((a: any) => a.studentId);
        const studentsCount = await Student.countDocuments({
            _id: { $in: studentIds },
            sectionId: record.sectionId,
            courses: record.courseId,
        });

        if (studentsCount !== studentIds.length) {
            throw new AppError('Some students do not belong to this section or course', 400);
        }
    }

    const updatedRecord = await AttendanceRecord.findByIdAndUpdate(
        id,
        { attendees },
        { new: true, runValidators: true }
    )
        .populate('sectionId', 'name code')
        .populate('courseId', 'name code')
        .populate('takenBy', 'name email')
        .populate('attendees.studentId', 'studentId name email');

    const response: ApiResponse<any> = {
        success: true,
        data: updatedRecord,
        message: 'Attendance record updated successfully',
    };

    res.status(200).json(response);
});

export const deleteAttendanceRecord = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const record = await AttendanceRecord.findById(id);

    if (!record) {
        throw new AppError('Attendance record not found', 404);
    }

    // Only allow admin or the person who took attendance to delete
    if (req.user?.role !== 'admin' && record.takenBy.toString() !== req.user?.userId) {
        throw new AppError('You can only delete attendance records you created', 403);
    }

    await AttendanceRecord.findByIdAndDelete(id);

    const response: ApiResponse = {
        success: true,
        message: 'Attendance record deleted successfully',
    };

    res.status(200).json(response);
});

export const getAttendanceStats = asyncHandler(async (req: Request, res: Response) => {
    const { sectionId, courseId, from, to } = req.query;

    // Build filter
    const filter: any = {};
    if (sectionId) filter.sectionId = sectionId;
    if (courseId) filter.courseId = courseId;

    if (from || to) {
        filter.date = {};
        if (from) filter.date.$gte = new Date(from as string);
        if (to) filter.date.$lte = new Date(to as string);
    }

    const stats = await AttendanceRecord.aggregate([
        { $match: filter },
        { $unwind: '$attendees' },
        {
            $group: {
                _id: '$attendees.status',
                count: { $sum: 1 },
            },
        },
    ]);

    const totalRecords = await AttendanceRecord.countDocuments(filter);

    const response: ApiResponse<any> = {
        success: true,
        data: {
            totalRecords,
            statusBreakdown: stats,
        },
    };

    res.status(200).json(response);
});

export const generateAttendancePDFEndpoint = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const record = await AttendanceRecord.findById(id)
        .populate('sectionId', 'name code')
        .populate('courseId', 'name code')
        .populate('takenBy', 'name email')
        .populate('attendees.studentId', 'studentId name email');

    if (!record) {
        throw new AppError('Attendance record not found', 404);
    }

    // Check if user has permission to access this record
    if (req.user?.role !== 'admin' && record.takenBy._id.toString() !== req.user?.userId) {
        // For CR, check if the record belongs to their section
        if (req.user?.role === 'cr' && record.sectionId._id.toString() !== req.user?.sectionId) {
            throw new AppError('Access denied', 403);
        }
    }

    try {
        const pdfBuffer = await generateAttendancePDF(record as any);

        const sectionName = (record.sectionId as any).name;
        const courseName = (record.courseId as any).name;
        const filename = `attendance-${sectionName}-${courseName}-${new Date(record.date).toISOString().split('T')[0]}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF generation error:', error);
        throw new AppError('Failed to generate PDF', 500);
    }
});

export const streamAttendancePDF = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const record = await AttendanceRecord.findById(id)
        .populate('sectionId', 'name code')
        .populate('courseId', 'name code')
        .populate('takenBy', 'name email')
        .populate('attendees.studentId', 'studentId name email');

    if (!record) {
        throw new AppError('Attendance record not found', 404);
    }

    // Check if user has permission to access this record
    if (req.user?.role !== 'admin' && record.takenBy._id.toString() !== req.user?.userId) {
        // For CR, check if the record belongs to their section
        if (req.user?.role === 'cr' && record.sectionId._id.toString() !== req.user?.sectionId) {
            throw new AppError('Access denied', 403);
        }
    }

    try {
        const pdfBuffer = await generateAttendancePDF(record as any);

        const sectionName = (record.sectionId as any).name;
        const courseName = (record.courseId as any).name;
        const filename = `attendance-${sectionName}-${courseName}-${new Date(record.date).toISOString().split('T')[0]}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF generation error:', error);
        throw new AppError('Failed to generate PDF', 500);
    }
});