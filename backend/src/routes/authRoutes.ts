import { Router } from 'express';
import { authController } from '../controllers';
import { authenticate, schemas, validate } from '../middleware';
import {
    forgotPassword,
    resetPassword,
    validateResetToken,
    changePassword,
} from '../controllers/passwordResetController';
import twoFactorRoutes from './twoFactorRoutes';

const router = Router();

// Public routes
router.post('/login', validate(schemas.userLogin), authController.login);
router.post('/student/login', authController.studentLogin); // Student login endpoint
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Password reset routes (public)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/validate-reset-token/:token', validateResetToken);

// 2FA routes (mounted at /api/auth/2fa)
router.use('/2fa', twoFactorRoutes);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);
router.put('/change-password', changePassword); // Use the new controller
router.put('/student/change-password', authController.studentChangePassword); // Student change password

export default router;