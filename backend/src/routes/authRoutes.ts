import { Router } from 'express';
import { authController } from '../controllers';
import { authenticate, schemas, validate } from '../middleware';

const router = Router();

// Public routes
router.post('/login', validate(schemas.userLogin), authController.login);
router.post('/student/login', authController.studentLogin); // Student login endpoint
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);
router.put('/change-password', authController.changePassword);
router.put('/student/change-password', authController.studentChangePassword); // Student change password

export default router;