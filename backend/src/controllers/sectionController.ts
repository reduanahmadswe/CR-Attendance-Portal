import { Request, Response } from 'express';
import { Course, Section, Student, User } from '../models';
import { ApiResponse, PaginatedResponse } from '../types';
import { AppError, asyncHandler } from '../utils/errorHandler';

export const createSection = asyncHandler(async (req: Request, res: Response) => {
    const { name, code, description } = req.body;

    const section = await Section.create({
        name,
        code,
        description,
    });

    const response: ApiResponse<any> = {
        success: true,
        data: section,
        message: 'Section created successfully',
    };

    res.status(201).json(response);
});

export const getSections = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const sortField = sortBy as string;
    const sortDirection = (sortOrder === 'asc' ? 1 : -1) as 1 | -1;

    const [sections, total] = await Promise.all([
        Section.find()
            .sort({ [sortField]: sortDirection })
            .skip(skip)
            .limit(Number(limit)),
        Section.countDocuments(),
    ]);

    const response: ApiResponse<PaginatedResponse<any>> = {
        success: true,
        data: {
            data: sections,
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

export const getSection = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const section = await Section.findById(id);

    if (!section) {
        throw new AppError('Section not found', 404);
    }

    const response: ApiResponse<any> = {
        success: true,
        data: section,
    };

    res.status(200).json(response);
});

export const updateSection = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, code, description } = req.body;

    const section = await Section.findByIdAndUpdate(
        id,
        { name, code, description },
        { new: true, runValidators: true }
    );

    if (!section) {
        throw new AppError('Section not found', 404);
    }

    const response: ApiResponse<any> = {
        success: true,
        data: section,
        message: 'Section updated successfully',
    };

    res.status(200).json(response);
});

export const deleteSection = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    console.log('[DELETE SECTION] Attempting to delete section:', id);

    const section = await Section.findById(id);

    if (!section) {
        console.log('[DELETE SECTION] Section not found:', id);
        throw new AppError('Section not found', 404);
    }

    console.log('[DELETE SECTION] Section found:', { id: section._id, name: section.name });

    // Check if section has courses or students
    const [courseCount, studentCount, userCount] = await Promise.all([
        Course.countDocuments({ sectionId: id }),
        Student.countDocuments({ sectionId: id }),
        User.countDocuments({ sectionId: id }),
    ]);

    console.log('[DELETE SECTION] Related data counts:', {
        courses: courseCount,
        students: studentCount,
        users: userCount
    });

    if (courseCount > 0 || studentCount > 0 || userCount > 0) {
        const errorMessage = `Cannot delete section "${section.name}". It has ${courseCount} course(s), ${studentCount} student(s), and ${userCount} user(s) assigned. Please remove all related data first.`;
        console.log('[DELETE SECTION] Cannot delete - has dependencies:', errorMessage);
        throw new AppError(errorMessage, 400);
    }

    await Section.findByIdAndDelete(id);
    console.log('[DELETE SECTION] Section deleted successfully:', id);

    const response: ApiResponse = {
        success: true,
        message: 'Section deleted successfully',
    };

    res.status(200).json(response);
});

export const getSectionCourses = asyncHandler(async (req: Request, res: Response) => {
    const { sectionId } = req.params;
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = req.query;

    // Verify section exists
    const section = await Section.findById(sectionId);
    if (!section) {
        throw new AppError('Section not found', 404);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortField = sortBy as string;
    const sortDirection = (sortOrder === 'asc' ? 1 : -1) as 1 | -1;

    const [courses, total] = await Promise.all([
        Course.find({ sectionId })
            .sort({ [sortField]: sortDirection })
            .skip(skip)
            .limit(Number(limit)),
        Course.countDocuments({ sectionId }),
    ]);

    const response: ApiResponse<PaginatedResponse<any>> = {
        success: true,
        data: {
            data: courses,
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

export const getSectionStudents = asyncHandler(async (req: Request, res: Response) => {
    const { sectionId } = req.params;
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = req.query;

    // Verify section exists
    const section = await Section.findById(sectionId);
    if (!section) {
        throw new AppError('Section not found', 404);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortField = sortBy as string;
    const sortDirection = (sortOrder === 'asc' ? 1 : -1) as 1 | -1;

    const [students, total] = await Promise.all([
        Student.find({ sectionId })
            .populate('courses', 'name code')
            .sort({ [sortField]: sortDirection })
            .skip(skip)
            .limit(Number(limit)),
        Student.countDocuments({ sectionId }),
    ]);

    const response: ApiResponse<PaginatedResponse<any>> = {
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