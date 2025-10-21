import { Router } from 'express';
import {
    createAnnouncement,
    deleteAnnouncement,
    getAnnouncementById,
    getAnnouncements,
    getAnnouncementStats,
    updateAnnouncement,
} from '../controllers/announcementController';
import { authenticate, authorize } from '../middleware/auth';
import { schemas, validate, validateQuery } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/announcements
 * @desc    Create a new announcement
 * @access  CR, Instructor, Admin
 */
router.post(
    '/',
    authorize('admin', 'cr', 'instructor'),
    validate(schemas.announcementCreate),
    createAnnouncement
);

/**
 * @route   GET /api/announcements
 * @desc    Get all announcements with filters
 * @access  CR, Instructor, Admin, Viewer
 */
router.get(
    '/',
    validateQuery(schemas.announcementFilters),
    getAnnouncements
);

/**
 * @route   GET /api/announcements/stats
 * @desc    Get announcement statistics
 * @access  CR, Instructor, Admin
 */
router.get(
    '/stats',
    authorize('admin', 'cr', 'instructor'),
    getAnnouncementStats
);

/**
 * @route   GET /api/announcements/:id
 * @desc    Get announcement by ID
 * @access  CR, Instructor, Admin, Viewer
 */
router.get('/:id', getAnnouncementById);

/**
 * @route   PUT /api/announcements/:id
 * @desc    Update announcement
 * @access  Admin, Creator only
 */
router.put(
    '/:id',
    authorize('admin', 'cr', 'instructor'),
    validate(schemas.announcementUpdate),
    updateAnnouncement
);

/**
 * @route   DELETE /api/announcements/:id
 * @desc    Delete announcement
 * @access  Admin, Creator only
 */
router.delete(
    '/:id',
    authorize('admin', 'cr', 'instructor'),
    deleteAnnouncement
);

export default router;
