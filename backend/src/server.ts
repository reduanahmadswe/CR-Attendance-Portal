import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import { attendanceRoutes, authRoutes, courseRoutes, sectionRoutes, studentRoutes, userRoutes } from './routes';
import { checkAndSeed } from './scripts/seed';
import connectDB from './utils/database';
import { errorHandler } from './utils/errorHandler';

// Load environment variables
dotenv.config();

// Connect to database and auto-seed if empty
const initializeApp = async () => {
    await connectDB();

    // Auto-seed database if empty (only in development)
    if (process.env.NODE_ENV !== 'production') {
        await checkAndSeed();
    }
};

// Initialize database connection and seeding
initializeApp();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More requests in development
    message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting only in production or if specifically enabled
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMIT === 'true') {
    app.use('/api/', limiter);
}

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 10 : 100, // More auth requests in development
    message: 'Too many authentication attempts, please try again later.',
});

if (process.env.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMIT === 'true') {
    app.use('/api/auth/', authLimiter);
}

// CORS configuration - must be before other middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, direct server calls, etc.)
        if (!origin) {
            console.log('[CORS] Request with no origin - allowing');
            return callback(null, true);
        }

        const allowedOrigins = process.env.NODE_ENV === 'production'
            ? [process.env.FRONTEND_URL || 'http://localhost:5173']
            : [
                'http://localhost:5173',
                'http://localhost:5174',
                'http://localhost:3000',
                'http://127.0.0.1:5173',
                'http://127.0.0.1:5174',
                'http://127.0.0.1:3000'
            ];

        if (allowedOrigins.includes(origin)) {
            console.log(`[CORS] Origin ${origin} - allowed`);
            callback(null, true);
        } else {
            const isDevMode = process.env.NODE_ENV === 'development';
            console.log(`[CORS] Origin ${origin} - ${isDevMode ? 'allowed (dev mode)' : 'blocked'}`);
            callback(null, isDevMode); // Allow all in development
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Cache-Control',
        'X-File-Name'
    ],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200,
    // Additional options for better CORS handling
    maxAge: 86400, // Cache preflight response for 24 hours
    preflightContinue: false
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
});

// Debug middleware for CORS (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        // Only log if there are actual CORS issues
        const origin = req.headers.origin;
        if (!origin && req.method !== 'GET') {
            console.log(`[CORS] ${req.method} ${req.path} - No origin header`);
        } else if (origin && req.method === 'OPTIONS') {
            console.log(`[CORS] Preflight ${req.path} - Origin: ${origin}`);
        }
        next();
    });
}

// Enhanced manual CORS headers as fallback
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:3000'
    ];

    // Always set CORS headers for better compatibility
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        // For requests without origin (server-to-server, mobile apps, etc.)
        res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (process.env.NODE_ENV === 'development') {
        // Allow any origin in development
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name');
    res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache for 24 hours

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        console.log(`[CORS] Preflight request from ${origin || 'unknown origin'}`);
        res.status(200).end();
        return;
    }

    next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'CR Attendance Portal API is running',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', userRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../public')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
    });
}

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// Error handling middleware
app.use(errorHandler);

// For Vercel deployment
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 4000;

    const server = app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
        console.log(`Unhandled Rejection: ${err.message}`);
        server.close(() => {
            process.exit(1);
        });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
        console.log(`Uncaught Exception: ${err.message}`);
        process.exit(1);
    });
}

export default app;