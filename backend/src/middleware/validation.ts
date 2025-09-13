import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import { AppError } from '../utils/errorHandler';

export const validate = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const firstError = error.details?.[0];
            res.status(400).json({
                success: false,
                error: firstError?.message || 'Validation failed',
                field: firstError?.path?.join('.') || 'unknown',
                debug: process.env.NODE_ENV === 'development' ? {
                    value: firstError?.context?.value,
                    fullValidationErrors: error.details
                } : undefined
            });
            return;
        }

        next();
    };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.query, { abortEarly: false });

        if (error) {
            const errors = error.details.map((detail) => detail.message);
            throw new AppError(`Query validation error: ${errors.join(', ')}`, 400);
        }

        next();
    };
};

// Common validation schemas
export const schemas = {
    // User schemas
    userLogin: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    }),

    userCreate: Joi.object({
        name: Joi.string().trim().max(100).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid('admin', 'cr', 'instructor', 'viewer').default('cr'),
        sectionId: Joi.string().when('role', {
            is: 'cr',
            then: Joi.required(),
            otherwise: Joi.optional(),
        }),
    }),

    userUpdate: Joi.object({
        name: Joi.string().trim().max(100).optional(),
        email: Joi.string().email().optional(),
        role: Joi.string().valid('admin', 'cr', 'instructor', 'viewer').optional(),
        sectionId: Joi.string().when('role', {
            is: 'cr',
            then: Joi.required(),
            otherwise: Joi.optional(),
        }),
    }),

    // Section schemas
    sectionCreate: Joi.object({
        name: Joi.string().trim().max(100).required(),
        code: Joi.string().trim().max(20).optional(),
        description: Joi.string().trim().max(500).optional(),
    }),

    sectionUpdate: Joi.object({
        name: Joi.string().trim().max(100).optional(),
        code: Joi.string().trim().max(20).optional(),
        description: Joi.string().trim().max(500).optional(),
    }),

    // Course schemas
    courseCreate: Joi.object({
        name: Joi.string().trim().max(100).required(),
        code: Joi.string().trim().max(20).optional(),
        semester: Joi.string().trim().max(20).optional(),
    }),

    // Student schemas
    studentCreate: Joi.object({
        studentId: Joi.string().trim().max(20).required(),
        name: Joi.string().trim().max(100).required(),
        email: Joi.string().email().required(),
        courses: Joi.array().items(
            Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid course ID format')
        ).min(1).required().messages({
            'array.min': 'Student must be assigned to at least one course',
            'any.required': 'Course assignment is required'
        }),
    }),

    studentsCreateBatch: Joi.object({
        students: Joi.array().items(
            Joi.object({
                studentId: Joi.string().trim().max(20).required(),
                name: Joi.string().trim().max(100).required(),
                email: Joi.string().email().required(),
                courses: Joi.array().items(
                    Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid course ID format')
                ).min(1).required().messages({
                    'array.min': 'Student must be assigned to at least one course',
                    'any.required': 'Course assignment is required'
                }),
            })
        ).required(),
    }),

    // Attendance schemas
    attendanceCreate: Joi.object({
        sectionId: Joi.string().required(),
        courseId: Joi.string().required(),
        date: Joi.date().required(),
        attendees: Joi.array().items(
            Joi.object({
                studentId: Joi.string().required(),
                status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
                note: Joi.string().trim().max(200).optional(),
            })
        ).required(),
    }),

    // Pagination and filtering schemas
    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(1000).default(10),
        sortBy: Joi.string().optional(),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    }),

    attendanceFilters: Joi.object({
        sectionId: Joi.string().optional(),
        courseId: Joi.string().optional(),
        from: Joi.date().optional(),
        to: Joi.date().optional(),
        takenBy: Joi.string().optional(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(1000).default(10),
    }),
};