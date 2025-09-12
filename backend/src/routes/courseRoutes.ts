import { Router } from 'express';
import { courseController } from '../controllers';
import { authenticate, authorize } from '../middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Course CRUD (Admin only)
router.get('/:id', courseController.getCourse);
router.put('/:id', authorize('admin'), courseController.updateCourse);
router.delete('/:id', authorize('admin'), courseController.deleteCourse);

export default router;