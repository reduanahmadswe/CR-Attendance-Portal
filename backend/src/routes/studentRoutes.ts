import { Router } from 'express';
import { studentController } from '../controllers';
import { authenticate, authorize } from '../middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Student CRUD (Admin only)
router.get('/:id', studentController.getStudent);
router.put('/:id', authorize('admin'), studentController.updateStudent);
router.delete('/:id', authorize('admin'), studentController.deleteStudent);

// Student course management (Admin only)
router.post('/:id/courses', authorize('admin'), studentController.addStudentToCourses);
router.delete('/:id/courses', authorize('admin'), studentController.removeStudentFromCourses);

export default router;