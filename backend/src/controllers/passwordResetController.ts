import { Request, Response } from 'express';
import crypto from 'crypto';
import { User } from '../models/User';
import { ApiResponse } from '../types';
import { AppError, asyncHandler } from '../utils/errorHandler';
import { sendPasswordResetEmail, sendPasswordChangedEmail } from '../utils/emailService';

/**
 * Request password reset - sends email with reset link
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        throw new AppError('Email is required', 400);
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    const successResponse: ApiResponse = {
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
    };

    if (!user) {
        // Don't reveal that user doesn't exist
        res.status(200).json(successResponse);
        return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token before storing (security best practice)
    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set reset token and expiry (1 hour)
    (user as any).passwordResetToken = hashedToken;
    (user as any).passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send email with unhashed token (user receives this)
    const emailSent = await sendPasswordResetEmail(user.email, resetToken, user.name);

    if (!emailSent) {
        // Clear the token if email failed
        (user as any).passwordResetToken = null;
        (user as any).passwordResetExpires = null;
        await user.save();
        
        throw new AppError('Failed to send reset email. Please try again later.', 500);
    }

    console.log(`🔑 Password reset requested for: ${user.email}`);

    res.status(200).json(successResponse);
});

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, password, confirmPassword } = req.body;

    if (!token) {
        throw new AppError('Reset token is required', 400);
    }

    if (!password || !confirmPassword) {
        throw new AppError('Password and confirmation are required', 400);
    }

    if (password !== confirmPassword) {
        throw new AppError('Passwords do not match', 400);
    }

    if (password.length < 6) {
        throw new AppError('Password must be at least 6 characters', 400);
    }

    // Hash the provided token to compare with stored hash
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() }, // Token not expired
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
    }

    // Update password
    user.passwordHash = password; // Will be hashed by pre-save hook
    (user as any).passwordResetToken = null;
    (user as any).passwordResetExpires = null;
    await user.save();

    // Send confirmation email
    await sendPasswordChangedEmail(user.email, user.name);

    console.log(`✅ Password reset successful for: ${user.email}`);

    const response: ApiResponse = {
        success: true,
        message: 'Password has been reset successfully. You can now login with your new password.',
    };

    res.status(200).json(response);
});

/**
 * Validate reset token (check if valid before showing reset form)
 * GET /api/auth/validate-reset-token/:token
 */
export const validateResetToken = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;

    if (!token) {
        throw new AppError('Reset token is required', 400);
    }

    // Hash the provided token
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    // Check if token exists and is not expired
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
    }).select('email');

    if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
    }

    const response: ApiResponse<{ valid: boolean; email: string }> = {
        success: true,
        data: {
            valid: true,
            email: maskEmail(user.email),
        },
        message: 'Token is valid',
    };

    res.status(200).json(response);
});

/**
 * Change password (for logged-in users)
 * POST /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!userId) {
        throw new AppError('User not authenticated', 401);
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
        throw new AppError('All password fields are required', 400);
    }

    if (newPassword !== confirmPassword) {
        throw new AppError('New passwords do not match', 400);
    }

    if (newPassword.length < 6) {
        throw new AppError('New password must be at least 6 characters', 400);
    }

    if (currentPassword === newPassword) {
        throw new AppError('New password must be different from current password', 400);
    }

    const user = await User.findById(userId).select('+passwordHash');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    await user.save();

    // Send confirmation email
    await sendPasswordChangedEmail(user.email, user.name);

    console.log(`✅ Password changed for: ${user.email}`);

    const response: ApiResponse = {
        success: true,
        message: 'Password changed successfully',
    };

    res.status(200).json(response);
});

// Helper function to mask email for privacy
function maskEmail(email: string): string {
    const parts = email.split('@');
    const localPart = parts[0] || '';
    const domain = parts[1] || '';
    if (localPart.length <= 2) {
        return `${localPart[0] || ''}***@${domain}`;
    }
    return `${localPart[0]}${localPart[1]}***@${domain}`;
}
