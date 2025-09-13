import { NextFunction, Request, Response } from 'express';

/**
 * Middleware to handle request validation and prevent content-length mismatches
 * Especially important for serverless environments like Vercel
 */
export const requestValidationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // Skip validation for GET requests and health checks
    if (req.method === 'GET' || req.path === '/api/health' || req.path === '/') {
        return next();
    }

    // Validate content-length for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentLength = req.headers['content-length'];
        const contentType = req.headers['content-type'];

        // If content-type suggests a body but no content-length, it might be problematic
        if (contentType && contentType.includes('application/json') && !contentLength) {
            console.warn(`Warning: ${req.method} request to ${req.path} has JSON content-type but no content-length`);
        }

        // If content-length is 0 but we expect a body for these endpoints
        if (contentLength === '0' && req.path.includes('/auth/login')) {
            res.status(400).json({
                success: false,
                error: 'Empty request body',
                message: 'Request body is required for this endpoint',
                timestamp: new Date().toISOString(),
            });
            return;
        }
    }

    // Add request ID for tracking
    const requestId = Math.random().toString(36).substring(7);
    req.headers['x-request-id'] = requestId;

    // Log request details for debugging
    console.log(`[${requestId}] ${req.method} ${req.path} - Content-Length: ${req.headers['content-length'] || 'none'}`);

    next();
};