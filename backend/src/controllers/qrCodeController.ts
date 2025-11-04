import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { AttendanceSession, Course, Section, Student, AttendanceRecord } from '../models';
import { ApiResponse } from '../types';
import { AppError, asyncHandler } from '../utils/errorHandler';
import { verifyLocation, detectLocationSpoofing, isWithinSessionTime } from '../utils/locationVerification';
import crypto from 'crypto';

// Encryption key for QR code data (should be in environment variables)
const ENCRYPTION_KEY = process.env.QR_ENCRYPTION_KEY || 'your-32-character-secret-key!!!';
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt QR code data for security
 */
const encryptQRData = (data: string): string => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt QR code data
 */
const decryptQRData = (encryptedData: string): string => {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
    }
    const iv = Buffer.from(parts[0]!, 'hex');
    const encryptedText = parts[1]!;
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
    let decrypted: string = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

/**
 * Generate QR Code Session
 * POST /api/qr-attendance/generate
 */
export const generateQRSession = asyncHandler(async (req: Request, res: Response) => {
    const { sectionId, courseId, duration, location, allowedRadius, antiCheatEnabled } = req.body;
    const createdBy = req.user?.userId;
    const userRole = req.user?.role;

    // Verify user can create session for this section
    if (userRole === 'cr' && req.user?.sectionId !== sectionId) {
        throw new AppError('You can only create sessions for your assigned section', 403);
    }

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

    // Check if there's already an active session
    const existingSession = await AttendanceSession.findOne({
        sectionId,
        courseId,
        isActive: true,
        expiresAt: { $gt: new Date() },
    });

    if (existingSession) {
        throw new AppError('An active session already exists for this course', 409);
    }

    // Generate unique session ID
    const sessionId = uuidv4();
    const startTime = new Date();
    const maxDuration = duration || 15; // minutes
    const endTime = new Date(startTime.getTime() + maxDuration * 60 * 1000);
    const expiresAt = endTime;

    // Create QR code data
    const qrData = {
        sessionId,
        sectionId,
        courseId,
        timestamp: startTime.getTime(),
        expiresAt: expiresAt.getTime(),
    };

    // Encrypt QR code data
    const encryptedData = encryptQRData(JSON.stringify(qrData));

    // Generate QR code image (base64)
    const qrCodeImage = await QRCode.toDataURL(encryptedData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 400,
        margin: 2,
    });

    // Create attendance session
    const session = await AttendanceSession.create({
        sessionId,
        sectionId,
        courseId,
        date: new Date(),
        startTime,
        endTime,
        qrCode: qrCodeImage,
        qrCodeData: encryptedData,
        location,
        expiresAt,
        isActive: true,
        createdBy,
        maxDuration,
        allowedRadius: allowedRadius || 100,
        antiCheatEnabled: antiCheatEnabled !== false,
        attendedStudents: [],
    });

    const populatedSession = await AttendanceSession.findById(session._id)
        .populate('sectionId', 'name code')
        .populate('courseId', 'name code')
        .populate('createdBy', 'name email');

    const response: ApiResponse<any> = {
        success: true,
        data: {
            session: populatedSession,
            qrCode: qrCodeImage,
            expiresIn: maxDuration,
        },
        message: 'QR code session generated successfully',
    };

    res.status(201).json(response);
});

/**
 * Scan QR Code and Mark Attendance
 * POST /api/qr-attendance/scan
 */
export const scanQRCode = asyncHandler(async (req: Request, res: Response) => {
    const { qrCodeData, studentId, location, deviceInfo } = req.body;
    const userId = req.user?.userId;

    if (!qrCodeData || !studentId) {
        throw new AppError('QR code data and student ID are required', 400);
    }

    // Verify student exists
    const student = await Student.findById(studentId).populate('sectionId courses');
    
    if (!student) {
        throw new AppError('Student not found', 404);
    }

    // Decrypt and parse QR code data
    let sessionData;
    try {
        const decryptedData = decryptQRData(qrCodeData);
        sessionData = JSON.parse(decryptedData);
    } catch (error) {
        throw new AppError('Invalid or corrupted QR code', 400);
    }

    // Find the session
    const session = await AttendanceSession.findOne({ sessionId: sessionData.sessionId })
        .populate('sectionId', 'name code')
        .populate('courseId', 'name code');

    if (!session) {
        throw new AppError('Session not found', 404);
    }

    // Verify session is still active
    if (!session.isActive) {
        throw new AppError('This session has been closed', 410);
    }

    if (new Date() > session.expiresAt) {
        session.isActive = false;
        await session.save();
        throw new AppError('This QR code has expired', 410);
    }

    // Verify session time window
    if (!isWithinSessionTime(session.startTime, session.endTime, new Date(), 5)) {
        throw new AppError('Attendance can only be marked during the session time', 400);
    }

    // Verify student belongs to the section
    if (student.sectionId._id.toString() !== session.sectionId._id.toString()) {
        throw new AppError('You are not enrolled in this section', 403);
    }

    // Verify student is enrolled in the course
    const isEnrolled = student.courses.some(
        (course: any) => course._id.toString() === session.courseId._id.toString()
    );

    if (!isEnrolled) {
        throw new AppError('You are not enrolled in this course', 403);
    }

    // Check if student has already attended
    if (session.hasStudentAttended(studentId)) {
        throw new AppError('You have already marked attendance for this session', 409);
    }

    // Anti-cheat: Location verification
    if (session.antiCheatEnabled && session.location && location) {
        const verification = verifyLocation(
            session.location,
            location,
            session.allowedRadius
        );

        if (!verification.isValid) {
            throw new AppError(
                verification.reason || 'Location verification failed. You must be in the classroom.',
                403
            );
        }

        // Check for location spoofing
        const spoofingCheck = detectLocationSpoofing(location);
        if (spoofingCheck.isSuspicious) {
            console.warn(`Suspicious location detected for student ${studentId}: ${spoofingCheck.reason}`);
            // Log for admin review but don't block (can be configured)
        }
    }

    // Add student attendance to session
    await session.addStudentAttendance(studentId, location, deviceInfo);

    const response: ApiResponse<any> = {
        success: true,
        data: {
            message: 'Attendance marked successfully',
            student: {
                id: student._id,
                name: student.name,
                studentId: student.studentId,
            },
            session: {
                id: session._id,
                course: session.courseId,
                section: session.sectionId,
                scannedAt: new Date(),
            },
        },
        message: 'Attendance marked successfully!',
    };

    res.status(200).json(response);
});

/**
 * Get Active Session
 * GET /api/qr-attendance/active/:sectionId/:courseId
 */
export const getActiveSession = asyncHandler(async (req: Request, res: Response) => {
    const { sectionId, courseId } = req.params;
    const userRole = req.user?.role;

    // Verify user can access this section
    if (userRole === 'cr' && req.user?.sectionId !== sectionId) {
        throw new AppError('You can only view sessions for your assigned section', 403);
    }

    const session = await AttendanceSession.findOne({
        sectionId,
        courseId,
        isActive: true,
        expiresAt: { $gt: new Date() },
    })
        .populate('sectionId', 'name code')
        .populate('courseId', 'name code')
        .populate('createdBy', 'name email')
        .populate('attendedStudents.studentId', 'studentId name email');

    if (!session) {
        throw new AppError('No active session found', 404);
    }

    const response: ApiResponse<any> = {
        success: true,
        data: session,
        message: 'Active session retrieved successfully',
    };

    res.status(200).json(response);
});

/**
 * Close Session
 * PUT /api/qr-attendance/close/:sessionId
 */
export const closeSession = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { generateAttendanceRecord } = req.body;
    const userId = req.user?.userId;

    const session = await AttendanceSession.findOne({ sessionId })
        .populate('sectionId', 'name code')
        .populate('courseId', 'name code')
        .populate('attendedStudents.studentId', 'studentId name email');

    if (!session) {
        throw new AppError('Session not found', 404);
    }

    // Verify user can close this session
    if (session.createdBy.toString() !== userId && req.user?.role !== 'admin') {
        throw new AppError('You can only close sessions you created', 403);
    }

    if (!session.isActive) {
        throw new AppError('Session is already closed', 400);
    }

    // Mark session as inactive
    session.isActive = false;
    await session.save();

    // Optionally create an attendance record
    let attendanceRecord = null;
    if (generateAttendanceRecord) {
        // Get all students in the course
        const allStudents = await Student.find({
            sectionId: session.sectionId._id,
            courses: session.courseId._id,
        });

        // Create attendees array with present/absent status
        const attendees = allStudents.map((student) => {
            const attended = session.attendedStudents.find(
                (a) => a.studentId._id.toString() === student._id.toString()
            );

            return {
                studentId: student._id,
                status: attended ? 'present' : 'absent',
                note: attended ? `Scanned at ${attended.scannedAt.toLocaleTimeString()}` : undefined,
            };
        });

        attendanceRecord = await AttendanceRecord.create({
            sectionId: session.sectionId._id,
            courseId: session.courseId._id,
            date: session.date,
            takenBy: session.createdBy,
            attendees,
        });

        await attendanceRecord.populate('sectionId', 'name code');
        await attendanceRecord.populate('courseId', 'name code');
    }

    const response: ApiResponse<any> = {
        success: true,
        data: {
            session,
            attendanceRecord,
            stats: {
                totalScanned: session.attendedStudents.length,
                sessionDuration: Math.round((new Date().getTime() - session.startTime.getTime()) / 60000),
            },
        },
        message: 'Session closed successfully',
    };

    res.status(200).json(response);
});

/**
 * Get Session Statistics
 * GET /api/qr-attendance/stats/:sessionId
 */
export const getSessionStats = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    const session = await AttendanceSession.findOne({ sessionId })
        .populate('sectionId', 'name code')
        .populate('courseId', 'name code')
        .populate('attendedStudents.studentId', 'studentId name email');

    if (!session) {
        throw new AppError('Session not found', 404);
    }

    // Get total enrolled students
    const totalStudents = await Student.countDocuments({
        sectionId: session.sectionId._id,
        courses: session.courseId._id,
    });

    const attendedCount = session.attendedStudents.length;
    const attendanceRate = totalStudents > 0 ? (attendedCount / totalStudents) * 100 : 0;

    const stats = {
        sessionInfo: {
            sessionId: session.sessionId,
            course: session.courseId,
            section: session.sectionId,
            startTime: session.startTime,
            endTime: session.endTime,
            isActive: session.isActive,
        },
        attendance: {
            totalStudents,
            attendedCount,
            absentCount: totalStudents - attendedCount,
            attendanceRate: Math.round(attendanceRate * 100) / 100,
        },
        recentScans: session.attendedStudents
            .sort((a, b) => b.scannedAt.getTime() - a.scannedAt.getTime())
            .slice(0, 10)
            .map((a) => ({
                student: a.studentId,
                scannedAt: a.scannedAt,
                location: a.location,
            })),
    };

    const response: ApiResponse<any> = {
        success: true,
        data: stats,
        message: 'Session statistics retrieved successfully',
    };

    res.status(200).json(response);
});

/**
 * Get Session History
 * GET /api/qr-attendance/history
 */
export const getSessionHistory = asyncHandler(async (req: Request, res: Response) => {
    const { sectionId, courseId, from, to, page = 1, limit = 10 } = req.query;
    const userRole = req.user?.role;

    const filter: any = {};

    if (sectionId) filter.sectionId = sectionId;
    if (courseId) filter.courseId = courseId;

    // CR can only see their section
    if (userRole === 'cr') {
        filter.sectionId = req.user?.sectionId;
    }

    if (from || to) {
        filter.date = {};
        if (from) filter.date.$gte = new Date(from as string);
        if (to) filter.date.$lte = new Date(to as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [sessions, total] = await Promise.all([
        AttendanceSession.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('sectionId', 'name code')
            .populate('courseId', 'name code')
            .populate('createdBy', 'name email'),
        AttendanceSession.countDocuments(filter),
    ]);

    const response: ApiResponse<any> = {
        success: true,
        data: {
            sessions,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        },
        message: 'Session history retrieved successfully',
    };

    res.status(200).json(response);
});
