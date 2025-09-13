import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';

import { envVars } from './config/env';

import { globalErrorHandler, notFoundHandler } from './middleware';
import { router } from './routes';

const app = express();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// Security middleware (simplified for serverless)
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
});

if (envVars.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMIT === 'true') {
    app.use('/api/', limiter);
}

// Auth rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: envVars.NODE_ENV === 'production' ? 10 : 100,
    message: 'Too many authentication attempts, please try again later.',
});

if (envVars.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMIT === 'true') {
    app.use('/api/auth/', authLimiter);
}

// CORS configuration
const allowedOrigins = [
    envVars.FRONTEND_URL || 'https://diucrportal.vercel.app',
    'https://diucrportal.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000'
];

// CORS configuration - simplified for better compatibility
app.use(cors({
    origin: true, // Allow all origins for testing
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    optionsSuccessStatus: 200
}));

// Body parsing middleware - simplified
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging middleware
if (envVars.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Health check - fast response without waiting for DB
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'CR Attendance Portal API is running successfully',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: envVars.NODE_ENV,
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
});

// Debug endpoint to check if API is responding
app.get('/ping', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Pong! API is responding',
        timestamp: new Date().toISOString(),
    });
});

// Handle preflight requests
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.sendStatus(200);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'CR Attendance Portal API is running',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
});

// Test POST endpoint for debugging
app.post('/api/test', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'POST request working',
        body: req.body,
        headers: req.headers,
        timestamp: new Date().toISOString(),
    });
});

// Simple health endpoint without DB
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'CR Attendance Portal API is running',
        timestamp: new Date().toISOString(),
        database: 'connection-on-demand',
    });
});

// API Routes (database connection handled in individual controllers)
app.use('/api', router);

// Error handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;