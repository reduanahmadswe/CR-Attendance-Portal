import { Router } from 'express';
import announcementRoutes from './announcementRoutes';
import attendanceRoutes from './attendanceRoutes';
import authRoutes from './authRoutes';
import courseRoutes from './courseRoutes';
import qrCodeRoutes from './qrCodeRoutes';
import sectionRoutes from './sectionRoutes';
import studentRoutes from './studentRoutes';
import userRoutes from './userRoutes';

const router = Router();

// Mount all routes
router.use('/auth', authRoutes);
router.use('/sections', sectionRoutes);
router.use('/students', studentRoutes);
router.use('/courses', courseRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/users', userRoutes);
router.use('/announcements', announcementRoutes);
router.use('/qr-attendance', qrCodeRoutes);

export { default as announcementRoutes } from './announcementRoutes';
export { default as attendanceRoutes } from './attendanceRoutes';
export { default as authRoutes } from './authRoutes';
export { default as courseRoutes } from './courseRoutes';
export { default as qrCodeRoutes } from './qrCodeRoutes';
export { default as sectionRoutes } from './sectionRoutes';
export { default as studentRoutes } from './studentRoutes';
export { default as userRoutes } from './userRoutes';
export { router };

