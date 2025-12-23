import { Router } from 'express';
import {
    createBackup,
    getBackups,
    getStats,
    getBackup,
    downloadBackup,
    restoreBackup,
    deleteBackup,
    cleanupBackups,
} from '../controllers/backupController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All backup routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @route   POST /api/admin/backups
 * @desc    Create a new database backup
 * @access  Admin only
 */
router.post('/', createBackup);

/**
 * @route   GET /api/admin/backups
 * @desc    Get all backups with optional filters
 * @access  Admin only
 */
router.get('/', getBackups);

/**
 * @route   GET /api/admin/backups/stats
 * @desc    Get backup statistics
 * @access  Admin only
 */
router.get('/stats', getStats);

/**
 * @route   POST /api/admin/backups/cleanup
 * @desc    Clean up expired backups
 * @access  Admin only
 */
router.post('/cleanup', cleanupBackups);

/**
 * @route   GET /api/admin/backups/:backupId
 * @desc    Get a specific backup by ID
 * @access  Admin only
 */
router.get('/:backupId', getBackup);

/**
 * @route   GET /api/admin/backups/:backupId/download
 * @desc    Download a backup file
 * @access  Admin only
 */
router.get('/:backupId/download', downloadBackup);

/**
 * @route   POST /api/admin/backups/:backupId/restore
 * @desc    Restore database from a backup
 * @access  Admin only
 */
router.post('/:backupId/restore', restoreBackup);

/**
 * @route   DELETE /api/admin/backups/:backupId
 * @desc    Delete a backup
 * @access  Admin only
 */
router.delete('/:backupId', deleteBackup);

export default router;
