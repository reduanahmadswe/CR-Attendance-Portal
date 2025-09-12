import { Router } from 'express';
import { courseController, sectionController, studentController } from '../controllers';
import { authenticate, authorize, authorizeSection, schemas, validate, validateQuery } from '../middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Section CRUD (Admin only)
router.post('/', authorize('admin'), validate(schemas.sectionCreate), sectionController.createSection);
router.get('/', validateQuery(schemas.pagination), sectionController.getSections);
router.get('/:id', sectionController.getSection);
router.put('/:id', authorize('admin'), validate(schemas.sectionUpdate), sectionController.updateSection);
router.delete('/:id', authorize('admin'), sectionController.deleteSection);

// Section courses (Admin and CR for their section)
router.get('/:sectionId/courses', authorizeSection, validateQuery(schemas.pagination), sectionController.getSectionCourses);
router.post('/:sectionId/courses', authorize('admin'), authorizeSection, validate(schemas.courseCreate), courseController.createCourse);

// Section students (Admin and CR for their section)
router.get('/:sectionId/students', authorizeSection, validateQuery(schemas.pagination), sectionController.getSectionStudents);
router.post('/:sectionId/students', authorize('admin'), authorizeSection, validate(schemas.studentCreate), studentController.createStudent);
router.post('/:sectionId/students/batch', authorize('admin'), authorizeSection, validate(schemas.studentsCreateBatch), studentController.createStudentsBatch);

// Course students for attendance (Admin and CR for their section)
router.get('/:sectionId/courses/:courseId/students', authorizeSection, validateQuery(schemas.pagination), courseController.getCourseStudents);

export default router;