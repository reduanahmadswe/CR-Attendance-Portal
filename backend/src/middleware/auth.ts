import { NextFunction, Request, Response } from 'express';
import { Student, User } from '../models';
import { JWTPayload } from '../types';
import { AppError, asyncHandler } from '../utils/errorHandler';
import { verifyAccessToken } from '../utils/jwt';

// Extend Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                role: string;
                sectionId?: string;
            };
        }
    }
}

export const authenticate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('Access token is required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
        const decoded = verifyAccessToken(token) as JWTPayload;

        // Verify user still exists and is active
        // Check if it's a student or regular user based on role in token
        let userExists;
        let userEmail;
        let userRole;
        let userId;
        let sectionId;

        if (decoded.role === 'student') {
            // For students, check Student model
            const student = await Student.findById(decoded.userId).select('-password');
            
            if (!student) {
                throw new AppError('Student not found', 401);
            }

            userExists = true;
            userId = student._id.toString();
            userEmail = student.email;
            userRole = 'student';
            sectionId = student.sectionId?.toString();
        } else {
            // For admin/cr/instructor/viewer, check User model
            const user = await User.findById(decoded.userId).select('-passwordHash');
            
            if (!user) {
                throw new AppError('User not found', 401);
            }

            userExists = true;
            userId = user._id.toString();
            userEmail = user.email;
            userRole = user.role;
            sectionId = user.sectionId?.toString();
        }

        if (!userExists) {
            throw new AppError('User not found', 401);
        }

        // Add user info to request
        req.user = {
            userId: userId,
            email: userEmail,
            role: userRole,
            ...(sectionId && { sectionId }),
        };

        console.log('Auth middleware - User set:', {
            userId: req.user.userId,
            email: req.user.email,
            role: req.user.role
        });

        next();
    } catch (error) {
        throw new AppError('Invalid or expired token', 401);
    }
});

export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            throw new AppError('Authentication required', 401);
        }

        if (!roles.includes(req.user.role)) {
            throw new AppError(`Access denied. Required roles: ${roles.join(', ')}`, 403);
        }

        next();
    };
};

export const authorizeSection = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        throw new AppError('Authentication required', 401);
    }

    // Admin can access all sections
    if (req.user.role === 'admin') {
        return next();
    }

    // CR can only access their own section
    if (req.user.role === 'cr') {
        const sectionId = req.params.sectionId || req.body.sectionId;

        if (!sectionId) {
            throw new AppError('Section ID is required', 400);
        }

        if (req.user.sectionId !== sectionId) {
            throw new AppError('Access denied. You can only access your assigned section', 403);
        }
    }

    next();
};