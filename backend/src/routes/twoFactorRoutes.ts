import { Router } from 'express';
import {
    setup2FA,
    verify2FA,
    disable2FA,
    validate2FAToken,
    get2FAStatus,
    regenerateBackupCodes,
} from '../controllers/twoFactorController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/auth/2fa/setup
 * @desc    Generate 2FA setup (secret + QR code)
 * @access  Private
 */
router.post('/setup', authenticate, setup2FA);

/**
 * @route   POST /api/auth/2fa/verify
 * @desc    Verify and enable 2FA with token from authenticator app
 * @access  Private
 */
router.post('/verify', authenticate, verify2FA);

/**
 * @route   POST /api/auth/2fa/disable
 * @desc    Disable 2FA (requires password + optional token)
 * @access  Private
 */
router.post('/disable', authenticate, disable2FA);

/**
 * @route   POST /api/auth/2fa/validate
 * @desc    Validate 2FA token during login (no auth required)
 * @access  Public
 */
router.post('/validate', validate2FAToken);

/**
 * @route   GET /api/auth/2fa/status
 * @desc    Get 2FA status for current user
 * @access  Private
 */
router.get('/status', authenticate, get2FAStatus);

/**
 * @route   POST /api/auth/2fa/backup-codes
 * @desc    Regenerate backup codes (requires password)
 * @access  Private
 */
router.post('/backup-codes', authenticate, regenerateBackupCodes);

export default router;
