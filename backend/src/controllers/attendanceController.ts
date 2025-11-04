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

    console.log('Update request data:', {
        recordId: id,
        userId: updatedBy,
        userRole: req.user?.role,
        attendeesCount: attendees?.length
    });

    const record = await AttendanceRecord.findById(id);

    if (!record) {
        throw new AppError('Attendance record not found', 404);
    }

    console.log('Permission check:', {
        userRole: req.user?.role,
        recordTakenBy: record.takenBy.toString(),
        updatedBy: updatedBy?.toString(),
        isAdmin: req.user?.role === 'admin',
        isOwner: record.takenBy.toString() === updatedBy?.toString(),
        userSectionId: req.user?.sectionId,
        recordSectionId: record.sectionId.toString()
    });

    // Permission check: Allow admin, the person who took attendance, or CR of the same section
    const isAdmin = req.user?.role === 'admin';
    const isOwner = record.takenBy.toString() === updatedBy?.toString();
    const isCROfSameSection = req.user?.role === 'cr' && req.user?.sectionId === record.sectionId.toString();

    if (!isAdmin && !isOwner && !isCROfSameSection) {
        throw new AppError('You can only update attendance records for your section', 403);
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

    console.log(`[PDF DOWNLOAD] Starting download for attendance: ${id}`);
    console.log('[PDF DOWNLOAD] Auth user:', req.user?.userId, 'role:', req.user?.role);

    try {
        // Validate ObjectId format first
        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
            console.error('[PDF DOWNLOAD] Invalid ObjectId format:', id);
            throw new AppError('Invalid attendance record ID format', 400);
        }

        const record = await AttendanceRecord.findById(id)
            .populate({
                path: 'sectionId',
                select: 'name code'
            })
            .populate({
                path: 'courseId',
                select: 'name code'
            })
            .populate({
                path: 'takenBy',
                select: 'name email'
            })
            .populate({
                path: 'attendees.studentId',
                select: 'studentId name email'
            });

        if (!record) {
            console.error('[PDF DOWNLOAD] Attendance record not found:', id);
            throw new AppError('Attendance record not found', 404);
        }

        console.log('[PDF DOWNLOAD] Record found, validating populated data...');

        // Validate populated data
        if (!record.sectionId || !record.courseId || !record.takenBy) {
            console.error('[PDF DOWNLOAD] Missing populated data:', {
                hasSectionId: !!record.sectionId,
                hasCourseId: !!record.courseId,
                hasTakenBy: !!record.takenBy,
                sectionId: record.sectionId,
                courseId: record.courseId,
                takenBy: record.takenBy
            });
            throw new AppError('Incomplete attendance record data', 500);
        }

        // Check if user has permission to access this record
        const userRole = req.user?.role;
        const userId = req.user?.userId;
        const userSectionId = req.user?.sectionId;
        const takenById = (record as any)?.takenBy?._id?.toString?.();
        const recordSectionId = (record as any)?.sectionId?._id?.toString?.();

        if (userRole !== 'admin') {
            if (userRole === 'cr') {
                const isOwner = takenById && userId && takenById === userId;
                const sameSection = recordSectionId && userSectionId && recordSectionId === userSectionId;
                if (!isOwner && !sameSection) {
                    console.error('[PDF DOWNLOAD] Access denied for CR:', {
                        userId,
                        userSectionId,
                        takenById,
                        recordSectionId,
                        isOwner,
                        sameSection
                    });
                    throw new AppError('Access denied', 403);
                }
            } else {
                console.error('[PDF DOWNLOAD] Access denied for role:', userRole);
                throw new AppError('Access denied', 403);
            }
        }

        console.log('[PDF DOWNLOAD] Generating PDF...');
        const startTime = Date.now();

        // Validate record data before generating PDF
        if (!record.attendees || !Array.isArray(record.attendees) || record.attendees.length === 0) {
            console.error('[PDF DOWNLOAD] No attendees data found');
            throw new AppError('No attendees data found for this attendance record', 400);
        }

        const pdfBuffer = await generateAttendancePDF(record as any);

        const generationTime = Date.now() - startTime;
        console.log(`[PDF DOWNLOAD] PDF generated successfully in ${generationTime}ms. Size: ${pdfBuffer?.length} bytes`);

        if (!pdfBuffer || pdfBuffer.length === 0) {
            console.error('[PDF DOWNLOAD] Empty PDF buffer generated');
            throw new AppError('Failed to generate PDF: empty buffer', 500);
        }

        // Create filename
        const sectionName = (record.sectionId as any)?.name || 'Unknown-Section';
        const courseCode = (record.courseId as any)?.code || 'Unknown-Course';
        const date = new Date(record.date).toISOString().split('T')[0];

        const sanitizedSectionName = sectionName.replace(/[^a-zA-Z0-9-]/g, '-');
        const sanitizedCourseCode = courseCode.replace(/[^a-zA-Z0-9-]/g, '-');
        const filename = `Download_Attendance_Reports_${sanitizedSectionName}_${sanitizedCourseCode}_${date}.pdf`;

        console.log('[PDF DOWNLOAD] Sending PDF with filename:', filename);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Length', pdfBuffer.length.toString());

        res.send(pdfBuffer);

        console.log('[PDF DOWNLOAD] PDF sent successfully');

    } catch (error) {
        console.error('[PDF DOWNLOAD] Error occurred:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            attendanceId: id,
            userId: req.user?.userId,
            userRole: req.user?.role,
            timestamp: new Date().toISOString(),
            errorType: error?.constructor?.name
        });

        // Send more specific error responses
        if (error instanceof AppError) {
            throw error;
        } else if (error instanceof Error) {
            if (error.message.includes('PDF generation failed')) {
                throw new AppError('Failed to generate PDF document. Please try again later.', 500);
            } else if (error.message.includes('buffer')) {
                throw new AppError('PDF generation failed due to internal buffer error.', 500);
            } else {
                throw new AppError(`PDF generation failed: ${error.message}`, 500);
            }
        } else {
            throw new AppError('PDF generation failed due to unknown error', 500);
        }
    }
});

export const streamAttendancePDF = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const record = await AttendanceRecord.findById(id)
        .populate({
            path: 'sectionId',
            select: 'name code'
        })
        .populate({
            path: 'courseId',
            select: 'name code'
        })
        .populate({
            path: 'takenBy',
            select: 'name email'
        })
        .populate({
            path: 'attendees.studentId',
            select: 'studentId name email'
        });

    if (!record) {
        throw new AppError('Attendance record not found', 404);
    }

    // Check if user has permission to access this record (defensive checks)
    {
        const userRole = req.user?.role;
        const userId = req.user?.userId;
        const userSectionId = req.user?.sectionId;
        const takenById = (record as any)?.takenBy?._id?.toString?.();
        const recordSectionId = (record as any)?.sectionId?._id?.toString?.();

        if (userRole !== 'admin') {
            if (userRole === 'cr') {
                const isOwner = takenById && userId && takenById === userId;
                const sameSection = recordSectionId && userSectionId && recordSectionId === userSectionId;
                if (!isOwner && !sameSection) {
                    throw new AppError('Access denied', 403);
                }
            } else {
                throw new AppError('Access denied', 403);
            }
        }
    }

    try {
        const pdfBuffer = await generateAttendancePDF(record as any);
        console.log('Stream PDF buffer size (bytes):', pdfBuffer?.length);

        // Debug populated data for stream
        console.log('Stream - Section data:', record.sectionId);
        console.log('Stream - Course data:', record.courseId);

        const sectionName = (record.sectionId as any)?.name || 'Unknown-Section';
        const courseCode = (record.courseId as any)?.code || 'Unknown-Course';
        const date = new Date(record.date).toISOString().split('T')[0];

        // Sanitize filename by removing/replacing special characters
        const sanitizedSectionName = sectionName.replace(/[^a-zA-Z0-9-]/g, '-');
        const sanitizedCourseCode = courseCode.replace(/[^a-zA-Z0-9-]/g, '-');

        // Format: Download_Attendance_Reports_SectionName_CourseCode_Date.pdf
        const filename = `Download_Attendance_Reports_${sanitizedSectionName}_${sanitizedCourseCode}_${date}.pdf`;

        console.log('Stream - Generated filename:', filename);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-store');
        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF generation error:', error);
        throw new AppError('Failed to generate PDF', 500);
    }
});

export const downloadCourseAttendanceZip = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const { sectionId } = req.query;

    console.log('[ZIP DOWNLOAD] Request received:', { courseId, sectionId, userId: req.user?.userId });

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
        throw new AppError('Course not found', 404);
    }

    // Build filter
    const filter: any = { courseId };
    if (sectionId) {
        filter.sectionId = sectionId;
    }

    // Check permissions for CR users
    if (req.user?.role === 'cr') {
        // CR can only access their own section's attendance
        if (!req.user?.sectionId) {
            throw new AppError('CR must be assigned to a section', 403);
        }
        filter.sectionId = req.user.sectionId;
    }

    // Fetch all attendance records for this course
    const records = await AttendanceRecord.find(filter)
        .populate({
            path: 'sectionId',
            select: 'name code'
        })
        .populate({
            path: 'courseId',
            select: 'name code'
        })
        .populate({
            path: 'takenBy',
            select: 'name email'
        })
        .populate({
            path: 'attendees.studentId',
            select: 'studentId name email'
        })
        .sort({ date: 1 }); // Sort by date ascending

    if (!records || records.length === 0) {
        throw new AppError('No attendance records found for this course', 404);
    }

    console.log(`[ZIP DOWNLOAD] Found ${records.length} attendance records`);

    try {
        const archiver = require('archiver');
        
        // Get course and section info for filename
        const courseName = course.name.replace(/[^a-zA-Z0-9-]/g, '-');
        const courseCode = (course.code ?? 'Unknown-Course').replace(/[^a-zA-Z0-9-]/g, '-');
        const timestamp = new Date().toISOString().split('T')[0];
        
        let zipFilename = `Attendance_${courseName}_${courseCode}_${timestamp}.zip`;
        
        // Add section name if filtering by section
        if (sectionId) {
            const section = await Section.findById(sectionId);
            if (section) {
                const sectionName = section.name.replace(/[^a-zA-Z0-9-]/g, '-');
                zipFilename = `Attendance_${courseName}_${courseCode}_${sectionName}_${timestamp}.zip`;
            }
        }

        console.log('[ZIP DOWNLOAD] Creating ZIP file:', zipFilename);

        // Set response headers
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
        res.setHeader('Cache-Control', 'no-store');

        // Create archiver instance
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        // Handle archiver errors
        archive.on('error', (err: Error) => {
            console.error('[ZIP DOWNLOAD] Archiver error:', err);
            throw new AppError('Failed to create ZIP file', 500);
        });

        // Handle archiver warnings
        archive.on('warning', (err: Error) => {
            console.warn('[ZIP DOWNLOAD] Archiver warning:', err);
        });

        // Pipe archive to response
        archive.pipe(res);

        // Generate PDFs and add to archive
        let successCount = 0;
        let errorCount = 0;

        for (const record of records) {
            try {
                // Log record details for debugging
                console.log(`[ZIP DOWNLOAD] Processing record ${record._id}, date: ${record.date}, attendees count: ${record.attendees?.length || 0}`);
                
                const pdfBuffer = await generateAttendancePDF(record as any);
                
                const sectionName = (record.sectionId as any)?.name || 'Unknown-Section';
                const date = new Date(record.date).toISOString().split('T')[0];
                
                // Sanitize filename
                const sanitizedSectionName = sectionName.replace(/[^a-zA-Z0-9-]/g, '-');
                const pdfFilename = `Attendance_${sanitizedSectionName}_${date}.pdf`;
                
                // Add PDF to archive
                archive.append(pdfBuffer, { name: pdfFilename });
                successCount++;
                
                console.log(`[ZIP DOWNLOAD] ✓ Successfully added PDF: ${pdfFilename}`);
            } catch (error) {
                errorCount++;
                const sectionName = (record.sectionId as any)?.name || 'Unknown-Section';
                const date = new Date(record.date).toISOString().split('T')[0];
                const errorDetails = error instanceof Error ? error.message : String(error);
                
                console.error(`[ZIP DOWNLOAD] ✗ Failed to generate PDF for record ${record._id}:`, errorDetails);
                console.error(`[ZIP DOWNLOAD] Record date: ${date}, Section: ${sectionName}, Attendees: ${record.attendees?.length || 0}`);
                
                // Add error log file to ZIP so user knows which dates failed
                const errorFileName = `ERROR_${sectionName.replace(/[^a-zA-Z0-9-]/g, '-')}_${date}.txt`;
                const errorContent = `Failed to generate PDF for this attendance record.\n\nDate: ${date}\nSection: ${sectionName}\nRecord ID: ${record._id}\nError: ${errorDetails}\n\nPlease check the data for this attendance record or contact support.`;
                archive.append(Buffer.from(errorContent), { name: errorFileName });
                
                // Continue with other records even if one fails
            }
        }

        console.log(`[ZIP DOWNLOAD] Successfully added ${successCount} PDFs, ${errorCount} errors`);

        if (successCount === 0) {
            throw new AppError('Failed to generate any PDFs', 500);
        }

        // Finalize the archive
        await archive.finalize();
        
        console.log('[ZIP DOWNLOAD] ZIP file created successfully');
    } catch (error) {
        console.error('[ZIP DOWNLOAD] Error:', error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Failed to create attendance ZIP file', 500);
    }
});

/**
 * Get student's own attendance records
 * GET /api/attendance/student/:studentId
 */
export const getStudentAttendance = asyncHandler(async (req: Request, res: Response) => {
    const { studentId } = req.params;

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
        throw new AppError('Student not found', 404);
    }

    // Get all attendance records where this student is present
    const attendanceRecords = await AttendanceRecord.find({
        'attendance.studentId': studentId,
    })
        .populate('courseId', 'name code')
        .populate('sectionId', 'name')
        .sort({ date: -1 })
        .lean();

    // Format the response
    const formattedRecords = attendanceRecords.map((record: any) => {
        const studentAttendance = record.attendance.find(
            (a: any) => a.studentId.toString() === studentId
        );

        return {
            _id: record._id,
            date: record.date,
            courseId: record.courseId,
            sectionId: record.sectionId,
            attendance: studentAttendance,
        };
    });

    const response: ApiResponse<any> = {
        success: true,
        message: 'Student attendance records retrieved successfully',
        data: formattedRecords,
    };

    res.status(200).json(response);
});