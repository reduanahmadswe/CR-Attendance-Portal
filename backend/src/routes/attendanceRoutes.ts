import { Router } from 'express';
import { attendanceController } from '../controllers';
import { authenticate, authorize, schemas, validate, validateQuery } from '../middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Attendance CRUD
router.post('/', authorize('admin', 'cr'), validate(schemas.attendanceCreate), attendanceController.createAttendance);
router.get('/', validateQuery(schemas.attendanceFilters), attendanceController.getAttendanceRecords);
router.get('/stats', validateQuery(schemas.attendanceFilters), attendanceController.getAttendanceStats);
router.get('/:id', attendanceController.getAttendanceRecord);
router.put('/:id', authorize('admin', 'cr'), attendanceController.updateAttendanceRecord);
router.delete('/:id', authorize('admin', 'cr'), attendanceController.deleteAttendanceRecord);

// PDF generation routes
router.get('/:id/pdf', attendanceController.streamAttendancePDF);
router.get('/:id/download', attendanceController.generateAttendancePDFEndpoint);

export default router;