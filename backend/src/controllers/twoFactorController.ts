import { Request, Response } from 'express';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import crypto from 'crypto';
import { User } from '../models/User';
import { ApiResponse } from '../types';
import { AppError, asyncHandler } from '../utils/errorHandler';

// Configure TOTP options
authenticator.options = {
    digits: 6,
    step: 30, // 30 seconds
    window: 1, // Allow 1 step before/after for clock drift
};

/**
 * Generate 2FA setup data (secret + QR code)
 * POST /api/auth/2fa/setup
 */
export const setup2FA = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        throw new AppError('User not authenticated', 401);
    }

    const user = await User.findById(userId).select('+twoFactorSecret +twoFactorEnabled');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (user.twoFactorEnabled) {
        throw new AppError('2FA is already enabled for this account', 400);
    }

    // Generate a new secret
    const secret = authenticator.generateSecret();

    // Create the otpauth URL for the authenticator app
    const appName = 'CR-Attendance-Portal';
    const otpauthUrl = authenticator.keyuri(user.email, appName, secret);

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Generate backup codes
    const backupCodes = generateBackupCodes(8);

    // Temporarily store the secret (not enabled yet until verified)
    user.twoFactorSecret = secret;
    user.twoFactorBackupCodes = backupCodes.map(code => hashBackupCode(code));
    await user.save();

    const response: ApiResponse<{
        secret: string;
        qrCode: string;
        backupCodes: string[];
        otpauthUrl: string;
    }> = {
        success: true,
        data: {
            secret,
            qrCode: qrCodeDataUrl,
            backupCodes, // Return plain codes for user to save
            otpauthUrl,
        },
        message: 'Scan the QR code with your authenticator app, then verify with a code',
    };

    res.status(200).json(response);
});

/**
 * Verify and enable 2FA
 * POST /api/auth/2fa/verify
 */
export const verify2FA = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { token } = req.body;

    if (!userId) {
        throw new AppError('User not authenticated', 401);
    }

    if (!token) {
        throw new AppError('Verification token is required', 400);
    }

    const user = await User.findById(userId).select('+twoFactorSecret +twoFactorEnabled');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (!user.twoFactorSecret) {
        throw new AppError('Please setup 2FA first', 400);
    }

    if (user.twoFactorEnabled) {
        throw new AppError('2FA is already enabled', 400);
    }

    // Verify the token
    const isValid = authenticator.verify({
        token: token.toString(),
        secret: user.twoFactorSecret,
    });

    if (!isValid) {
        throw new AppError('Invalid verification code. Please try again.', 400);
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save();

    const response: ApiResponse = {
        success: true,
        message: '2FA has been enabled successfully. Save your backup codes in a safe place!',
    };

    res.status(200).json(response);
});

/**
 * Disable 2FA
 * POST /api/auth/2fa/disable
 */
export const disable2FA = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { token, password } = req.body;

    if (!userId) {
        throw new AppError('User not authenticated', 401);
    }

    if (!password) {
        throw new AppError('Password is required to disable 2FA', 400);
    }

    const user = await User.findById(userId).select('+twoFactorSecret +twoFactorEnabled +passwordHash');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (!user.twoFactorEnabled) {
        throw new AppError('2FA is not enabled for this account', 400);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new AppError('Invalid password', 401);
    }

    // Verify 2FA token if provided
    if (token) {
        const isValid = authenticator.verify({
            token: token.toString(),
            secret: user.twoFactorSecret!,
        });

        if (!isValid) {
            throw new AppError('Invalid 2FA code', 400);
        }
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    (user as any).twoFactorSecret = null;
    (user as any).twoFactorBackupCodes = null;
    await user.save();

    const response: ApiResponse = {
        success: true,
        message: '2FA has been disabled successfully',
    };

    res.status(200).json(response);
});

/**
 * Validate 2FA token during login
 * POST /api/auth/2fa/validate
 */
export const validate2FAToken = asyncHandler(async (req: Request, res: Response) => {
    const { email, token, isBackupCode } = req.body;

    if (!email || !token) {
        throw new AppError('Email and token are required', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() })
        .select('+twoFactorSecret +twoFactorEnabled +twoFactorBackupCodes');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (!user.twoFactorEnabled) {
        throw new AppError('2FA is not enabled for this account', 400);
    }

    let isValid = false;

    if (isBackupCode) {
        // Check backup codes
        const hashedCode = hashBackupCode(token);
        const codeIndex = user.twoFactorBackupCodes?.findIndex(code => code === hashedCode);

        if (codeIndex !== undefined && codeIndex >= 0) {
            isValid = true;
            // Remove used backup code
            user.twoFactorBackupCodes?.splice(codeIndex, 1);
            await user.save();
        }
    } else {
        // Verify TOTP
        isValid = authenticator.verify({
            token: token.toString(),
            secret: user.twoFactorSecret!,
        });
    }

    if (!isValid) {
        throw new AppError('Invalid verification code', 400);
    }

    // Generate JWT tokens (reuse from auth controller)
    const jwt = await import('../utils/jwt');
    const tokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        ...(user.sectionId && { sectionId: user.sectionId.toString() }),
    };
    const accessToken = jwt.generateAccessToken(tokenPayload);

    const refreshToken = jwt.generateRefreshToken(tokenPayload);

    const response: ApiResponse<{
        user: any;
        accessToken: string;
        refreshToken: string;
    }> = {
        success: true,
        data: {
            user: user.toJSON(),
            accessToken,
            refreshToken,
        },
        message: '2FA verification successful',
    };

    res.status(200).json(response);
});

/**
 * Get 2FA status
 * GET /api/auth/2fa/status
 */
export const get2FAStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        throw new AppError('User not authenticated', 401);
    }

    const user = await User.findById(userId).select('twoFactorEnabled');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    const response: ApiResponse<{ enabled: boolean }> = {
        success: true,
        data: {
            enabled: user.twoFactorEnabled || false,
        },
    };

    res.status(200).json(response);
});

/**
 * Regenerate backup codes
 * POST /api/auth/2fa/backup-codes
 */
export const regenerateBackupCodes = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { password } = req.body;

    if (!userId) {
        throw new AppError('User not authenticated', 401);
    }

    if (!password) {
        throw new AppError('Password is required', 400);
    }

    const user = await User.findById(userId).select('+twoFactorEnabled +twoFactorBackupCodes +passwordHash');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (!user.twoFactorEnabled) {
        throw new AppError('2FA is not enabled', 400);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new AppError('Invalid password', 401);
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes(8);
    user.twoFactorBackupCodes = backupCodes.map(code => hashBackupCode(code));
    await user.save();

    const response: ApiResponse<{ backupCodes: string[] }> = {
        success: true,
        data: {
            backupCodes,
        },
        message: 'New backup codes generated. Save them in a safe place!',
    };

    res.status(200).json(response);
});

// Helper functions
function generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
        // Generate 8-character alphanumeric code
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        codes.push(code);
    }
    return codes;
}

function hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
}
