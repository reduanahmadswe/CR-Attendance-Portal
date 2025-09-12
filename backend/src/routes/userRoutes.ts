import { Router } from 'express';
import { userController } from '../controllers';
import { authenticate, authorize, schemas, validate, validateQuery } from '../middleware';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// User management (Admin only)
router.post('/', validate(schemas.userCreate), userController.createUser);
router.get('/', validateQuery(schemas.pagination), userController.getUsers);
router.get('/:id', userController.getUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.put('/:id/reset-password', userController.resetUserPassword);

export default router;