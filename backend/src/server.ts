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
initializeApp();

const app = express();

// Trust proxy for Vercel deployment
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    message: 'Too many requests from this IP, please try again later.',
});
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMIT === 'true') {
    app.use('/api/', limiter);
}

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 10 : 100,
    message: 'Too many authentication attempts, please try again later.',
});
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMIT === 'true') {
    app.use('/api/auth/', authLimiter);
}

// ✅ CORS configuration (single, clean version)
const allowedOrigins = [
    process.env.FRONTEND_URL || 'https://diucrportal.vercel.app',
    'https://diucrportal.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // Allow requests with no origin (Postman, curl etc.)
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // Allow all Vercel deployment URLs for development
        if (origin.endsWith('.vercel.app') || origin.endsWith('-reduan-ahmads-projects.vercel.app')) {
            return callback(null, true);
        }
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true); // Allow all in dev
        }
        return callback(new Error('CORS blocked'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control'],
    exposedHeaders: ['Set-Cookie'],
}));

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

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'CR Attendance Portal API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

// Serve static files only in production
if (process.env.NODE_ENV === 'production') {
    const fs = require('fs');
    const publicPath = path.join(__dirname, '../public');
    if (fs.existsSync(publicPath)) {
        app.use(express.static(publicPath));
        app.get('*', (req, res) => {
            const indexPath = path.resolve(publicPath, 'index.html');
            if (fs.existsSync(indexPath)) {
                res.sendFile(indexPath);
            } else {
                res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
            }
        });
    }
}

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error handling middleware
app.use(errorHandler);

// For local development (not Vercel)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 4000;
    const server = app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

    process.on('unhandledRejection', (err: Error) => {
        console.log(`Unhandled Rejection: ${err.message}`);
        server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err: Error) => {
        console.log(`Uncaught Exception: ${err.message}`);
        process.exit(1);
    });
}

export default app;
