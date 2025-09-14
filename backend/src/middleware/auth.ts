import { NextFunction, Request, Response } from 'express';
import { User } from '../models';
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
        const user = await User.findById(decoded.userId).select('-passwordHash');

        if (!user) {
            throw new AppError('User not found', 401);
        }

        // Add user info to request
        req.user = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            ...(user.sectionId && { sectionId: user.sectionId.toString() }),
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