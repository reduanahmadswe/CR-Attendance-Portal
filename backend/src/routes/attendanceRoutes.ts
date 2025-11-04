import { Router } from 'express';
import { attendanceController } from '../controllers';
import { authenticate, authorize, schemas, validate, validateQuery } from '../middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Student's own attendance records
router.get('/student/:studentId', attendanceController.getStudentAttendance);

// Attendance CRUD
router.post('/', authorize('admin', 'cr'), validate(schemas.attendanceCreate), attendanceController.createAttendance);
router.get('/', validateQuery(schemas.attendanceFilters), attendanceController.getAttendanceRecords);
router.get('/stats', validateQuery(schemas.attendanceFilters), attendanceController.getAttendanceStats);
router.get('/:id', attendanceController.getAttendanceRecord);
router.put('/:id', authorize('admin', 'cr'), attendanceController.updateAttendanceRecord);
router.delete('/:id', authorize('admin', 'cr'), attendanceController.deleteAttendanceRecord);

// PDF generation routes (allow both admin and cr)
router.get('/:id/pdf', authorize('admin', 'cr'), attendanceController.streamAttendancePDF);
router.get('/:id/download', authorize('admin', 'cr'), attendanceController.generateAttendancePDFEndpoint);

// Download all attendance records for a course as ZIP
router.get('/course/:courseId/download-zip', authorize('admin', 'cr'), attendanceController.downloadCourseAttendanceZip);

export default router;