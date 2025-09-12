import { Request, Response } from 'express';
import { User } from '../models';
import { ApiResponse } from '../types';
import { AppError, asyncHandler } from '../utils/errorHandler';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+passwordHash').populate('sectionId', 'name code');

    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const tokens = generateTokens({
        userId: user._id,
        email: user.email,
        role: user.role,
        ...(user.sectionId && { sectionId: user.sectionId.toString() }),
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Remove password from user object
    const userResponse = user.toJSON();

    const response: ApiResponse<{ user: any; accessToken: string }> = {
        success: true,
        data: {
            user: userResponse,
            accessToken: tokens.accessToken,
        },
        message: 'Login successful',
    };

    res.status(200).json(response);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        throw new AppError('Refresh token not found', 401);
    }

    try {
        const decoded = verifyRefreshToken(refreshToken);

        // Verify user still exists
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new AppError('User not found', 401);
        }

        // Generate new tokens
        const tokens = generateTokens({
            userId: user._id,
            email: user.email,
            role: user.role,
            ...(user.sectionId && { sectionId: user.sectionId.toString() }),
        });

        // Set new refresh token as httpOnly cookie
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        const response: ApiResponse<{ accessToken: string }> = {
            success: true,
            data: {
                accessToken: tokens.accessToken,
            },
            message: 'Token refreshed successfully',
        };

        res.status(200).json(response);
    } catch (error) {
        throw new AppError('Invalid refresh token', 401);
    }
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    const response: ApiResponse = {
        success: true,
        message: 'Logout successful',
    };

    res.status(200).json(response);
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.user?.userId).populate('sectionId', 'name code');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    const response: ApiResponse<any> = {
        success: true,
        data: user,
    };

    res.status(200).json(response);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const { name, email } = req.body;

    const user = await User.findById(req.user?.userId);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    const response: ApiResponse<any> = {
        success: true,
        data: user,
        message: 'Profile updated successfully',
    };

    res.status(200).json(response);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user?.userId).select('+passwordHash');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Verify current password
    if (!(await user.comparePassword(currentPassword))) {
        throw new AppError('Current password is incorrect', 400);
    }

    // Update password
    user.passwordHash = newPassword;
    await user.save();

    const response: ApiResponse = {
        success: true,
        message: 'Password changed successfully',
    };

    res.status(200).json(response);
});