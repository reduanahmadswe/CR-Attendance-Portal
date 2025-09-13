import { NextFunction, Request, Response } from 'express';
import connectDB from '../config/database';

// Database connection middleware for specific routes
export const ensureDbConnection = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Quick timeout for database connection
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Database connection timeout')), 3000);
        });

        await Promise.race([connectDB(), timeoutPromise]);
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        });
    }
};