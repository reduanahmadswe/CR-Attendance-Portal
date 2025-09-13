import { NextFunction, Request, Response } from 'express';

export const globalErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('Global error handler:', err);

    // Default error
    let error = {
        statusCode: err.statusCode || 500,
        message: err.message || 'Internal Server Error',
    };

    // Body parsing errors (request size mismatch, etc.)
    if (err.type === 'request.size.invalid') {
        const message = 'Request content length mismatch';
        error = { statusCode: 400, message };
    }

    // JSON parsing errors
    if (err instanceof SyntaxError && 'body' in err) {
        const message = 'Invalid JSON in request body';
        error = { statusCode: 400, message };
    }

    // Raw body errors
    if (err.message && err.message.includes('request size did not match content length')) {
        const message = 'Request size validation failed';
        error = { statusCode: 400, message };
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = { statusCode: 404, message };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = { statusCode: 400, message };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
        error = { statusCode: 400, message };
    }

    // Prevent sending response if headers already sent
    if (res.headersSent) {
        console.error('Headers already sent, cannot send error response');
        return next(err);
    }

    res.status(error.statusCode).json({
        success: false,
        error: error.message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            originalError: err.message,
            errorType: err.type,
            errorCode: err.code
        }),
        timestamp: new Date().toISOString(),
    });
};