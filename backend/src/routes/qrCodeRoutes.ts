import { Router } from 'express';
import {
    generateQRSession,
    scanQRCode,
    getActiveSession,
    closeSession,
    getSessionStats,
    getSessionHistory,
} from '../controllers/qrCodeController';
import { authenticate, authorize } from '../middleware/auth';
import Joi from 'joi';

const router = Router();

// Validation middleware
const validateBody = (schema: Joi.ObjectSchema) => {
    return (req: any, res: any, next: any) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0]?.message || 'Validation error',
            });
        }
        next();
    };
};

// Validation schemas
const generateSessionSchema = Joi.object({
    sectionId: Joi.string().required(),
    courseId: Joi.string().required(),
    duration: Joi.number().min(5).max(120).default(15),
    location: Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
        accuracy: Joi.number().min(0).optional(),
        radius: Joi.number().min(10).max(1000).default(100),
    }).optional(),
    allowedRadius: Joi.number().min(10).max(1000).default(100),
    antiCheatEnabled: Joi.boolean().default(true),
});

const scanQRSchema = Joi.object({
    qrCodeData: Joi.string().required(),
    studentId: Joi.string().required(),
    location: Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
        accuracy: Joi.number().min(0).optional(),
    }).optional(),
    deviceInfo: Joi.string().optional(),
});

const closeSessionSchema = Joi.object({
    generateAttendanceRecord: Joi.boolean().default(true),
});

/**
 * Generate QR Code Session
 * POST /api/qr-attendance/generate
 * Access: Admin, CR, Instructor
 */
router.post(
    '/generate',
    authenticate,
    authorize('admin', 'cr', 'instructor'),
    validateBody(generateSessionSchema),
    generateQRSession
);

/**
 * Scan QR Code and Mark Attendance
 * POST /api/qr-attendance/scan
 * Access: All authenticated users (students via app)
 */
router.post(
    '/scan',
    authenticate,
    validateBody(scanQRSchema),
    scanQRCode
);

/**
 * Get Active Session
 * GET /api/qr-attendance/active/:sectionId/:courseId
 * Access: Admin, CR, Instructor
 */
router.get(
    '/active/:sectionId/:courseId',
    authenticate,
    authorize('admin', 'cr', 'instructor'),
    getActiveSession
);

/**
 * Close Session
 * PUT /api/qr-attendance/close/:sessionId
 * Access: Admin, CR (creator), Instructor
 */
router.put(
    '/close/:sessionId',
    authenticate,
    authorize('admin', 'cr', 'instructor'),
    validateBody(closeSessionSchema),
    closeSession
);

/**
 * Get Session Statistics
 * GET /api/qr-attendance/stats/:sessionId
 * Access: Admin, CR, Instructor
 */
router.get(
    '/stats/:sessionId',
    authenticate,
    authorize('admin', 'cr', 'instructor'),
    getSessionStats
);

/**
 * Get Session History
 * GET /api/qr-attendance/history
 * Access: Admin, CR, Instructor
 */
router.get(
    '/history',
    authenticate,
    authorize('admin', 'cr', 'instructor'),
    getSessionHistory
);

export default router;
