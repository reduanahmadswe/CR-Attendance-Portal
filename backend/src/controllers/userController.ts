import { Request, Response } from 'express';
import { Section, User } from '../models';
import { ApiResponse, PaginatedResponse } from '../types';
import { AppError, asyncHandler } from '../utils/errorHandler';

export const createUser = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, role, sectionId } = req.body;

    // If role is CR, sectionId is required
    if (role === 'cr' && !sectionId) {
        throw new AppError('Section ID is required for CR role', 400);
    }

    // Verify section exists if sectionId is provided
    if (sectionId) {
        const section = await Section.findById(sectionId);
        if (!section) {
            throw new AppError('Section not found', 404);
        }
    }

    const user = await User.create({
        name,
        email,
        passwordHash: password, // Will be hashed by pre-save hook
        role,
        sectionId,
    });

    const userResponse = await User.findById(user._id).populate('sectionId', 'name code');

    const response: ApiResponse<any> = {
        success: true,
        data: userResponse,
        message: 'User created successfully',
    };

    res.status(201).json(response);
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, role, sectionId } = req.query;

    // Build filter
    const filter: any = {};
    if (role) filter.role = role;
    if (sectionId) filter.sectionId = sectionId;

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
        User.find(filter)
            .populate('sectionId', 'name code')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        User.countDocuments(filter),
    ]);

    const response: ApiResponse<PaginatedResponse<any>> = {
        success: true,
        data: {
            data: users,
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

export const getUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await User.findById(id).populate('sectionId', 'name code');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    const response: ApiResponse<any> = {
        success: true,
        data: user,
    };

    res.status(200).json(response);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, role, sectionId } = req.body;

    console.log('[UPDATE USER] Request params:', { id });
    console.log('[UPDATE USER] Request body:', { name, email, role, sectionId });

    const user = await User.findById(id);

    if (!user) {
        console.log('[UPDATE USER] User not found with id:', id);
        throw new AppError('User not found', 404);
    }

    console.log('[UPDATE USER] Found user:', { id: user._id, name: user.name, role: user.role });

    // If role is changing to CR, sectionId is required
    if (role === 'cr' && !sectionId) {
        throw new AppError('Section ID is required for CR role', 400);
    }

    // Verify section exists if sectionId is provided
    if (sectionId) {
        const section = await Section.findById(sectionId);
        if (!section) {
            throw new AppError('Section not found', 404);
        }
    }

    // If role is changing from CR to something else, remove sectionId
    const updateData: any = { name, email, role };
    if (role === 'cr') {
        updateData.sectionId = sectionId;
    } else if (user.role === 'cr' && role !== 'cr') {
        updateData.$unset = { sectionId: 1 };
    }

    const updatedUser = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    ).populate('sectionId', 'name code');

    const response: ApiResponse<any> = {
        success: true,
        data: updatedUser,
        message: 'User updated successfully',
    };

    res.status(200).json(response);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    const response: ApiResponse = {
        success: true,
        message: 'User deleted successfully',
    };

    res.status(200).json(response);
});

export const resetUserPassword = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    const user = await User.findById(id);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    await user.save();

    const response: ApiResponse = {
        success: true,
        message: 'Password reset successfully',
    };

    res.status(200).json(response);
});