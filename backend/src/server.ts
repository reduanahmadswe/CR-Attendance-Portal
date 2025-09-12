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
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 5 auth requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
});
app.use('/api/auth/', authLimiter);

// CORS configuration - must be before other middleware
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200
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
        console.log(`[CORS] ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
        if (req.method === 'OPTIONS') {
            console.log('[CORS] Preflight request received');
        }
        next();
    });
}

// Manual CORS headers as fallback
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000'
    ];

    if (allowedOrigins.includes(origin || '')) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

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

export default app;