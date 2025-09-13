import { Router } from 'express';
import { authController } from '../controllers';
import { authenticate, ensureDbConnection, schemas, validate } from '../middleware';

const router = Router();

// Public routes (with database connection)
router.post('/login', ensureDbConnection, validate(schemas.userLogin), authController.login);
router.post('/refresh', ensureDbConnection, authController.refresh);
router.post('/logout', authController.logout);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/profile', ensureDbConnection, authController.getProfile);
router.put('/profile', ensureDbConnection, authController.updateProfile);
router.put('/change-password', ensureDbConnection, authController.changePassword);

export default router;