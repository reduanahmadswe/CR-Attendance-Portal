import { Router } from 'express';
import attendanceRoutes from './attendanceRoutes';
import authRoutes from './authRoutes';
import courseRoutes from './courseRoutes';
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

export { default as attendanceRoutes } from './attendanceRoutes';
export { default as authRoutes } from './authRoutes';
export { default as courseRoutes } from './courseRoutes';
export { default as sectionRoutes } from './sectionRoutes';
export { default as studentRoutes } from './studentRoutes';
export { default as userRoutes } from './userRoutes';
export { router };

