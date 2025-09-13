import { Request, Response } from 'express';
import { Course, Section, Student } from '../models';
import { ApiResponse } from '../types';
import { AppError, asyncHandler } from '../utils/errorHandler';

export const createCourse = asyncHandler(async (req: Request, res: Response) => {
    const { sectionId } = req.params;
    const { name, code, semester } = req.body;

    // Verify section exists
    const section = await Section.findById(sectionId);
    if (!section) {
        throw new AppError('Section not found', 404);
    }

    const course = await Course.create({
        sectionId,
        name,
        code,
        semester,
    });

    const response: ApiResponse<any> = {
        success: true,
        data: course,
        message: 'Course created successfully',
    };

    res.status(201).json(response);
});

export const getCourse = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const course = await Course.findById(id).populate('sectionId', 'name code');

    if (!course) {
        throw new AppError('Course not found', 404);
    }

    const response: ApiResponse<any> = {
        success: true,
        data: course,
    };

    res.status(200).json(response);
});

export const updateCourse = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, code, semester } = req.body;

    const course = await Course.findByIdAndUpdate(
        id,
        { name, code, semester },
        { new: true, runValidators: true }
    );

    if (!course) {
        throw new AppError('Course not found', 404);
    }

    const response: ApiResponse<any> = {
        success: true,
        data: course,
        message: 'Course updated successfully',
    };

    res.status(200).json(response);
});

export const deleteCourse = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course) {
        throw new AppError('Course not found', 404);
    }

    // Remove course from all students
    await Student.updateMany(
        { courses: id },
        { $pull: { courses: id } }
    );

    await Course.findByIdAndDelete(id);

    const response: ApiResponse = {
        success: true,
        message: 'Course deleted successfully',
    };

    res.status(200).json(response);
});

export const getCourseStudents = asyncHandler(async (req: Request, res: Response) => {
    const { sectionId, courseId } = req.params;
    const { page = 1, limit = 1000, sortBy = 'name', sortOrder = 'asc' } = req.query;

    // Verify section and course exist
    const [section, course] = await Promise.all([
        Section.findById(sectionId),
        Course.findById(courseId),
    ]);

    if (!section) {
        throw new AppError('Section not found', 404);
    }

    if (!course) {
        throw new AppError('Course not found', 404);
    }

    // Verify course belongs to section
    if (course.sectionId.toString() !== sectionId) {
        throw new AppError('Course does not belong to this section', 400);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortField = sortBy as string;
    const sortDirection = (sortOrder === 'asc' ? 1 : -1) as 1 | -1;

    const [students, total] = await Promise.all([
        Student.find({
            sectionId,
            courses: courseId
        })
            .sort({ [sortField]: sortDirection })
            .skip(skip)
            .limit(Number(limit)),
        Student.countDocuments({
            sectionId,
            courses: courseId
        }),
    ]);

    const response: ApiResponse<any> = {
        success: true,
        data: {
            data: students,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        },
    };

    res.status(200).json(response);
});