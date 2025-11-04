import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';

import connectDB from './config/database';
import { globalErrorHandler, notFoundHandler } from './middleware';
import { router } from './routes';

const app = express();

// Env setup
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Multiple allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://diucrportal.vercel.app',
  'https://*.vercel.app', // Allow all vercel apps for testing
  FRONTEND_URL,
].filter((origin, index, self) => self.indexOf(origin) === index); // Remove duplicates


app.set('trust proxy', 1);


app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));


const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
});
if (NODE_ENV === 'production') {
  app.use('/api/', limiter);
}

// CORS 
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Allow localhost and all vercel.app domains
    if (
      origin.includes('localhost') || 
      origin.endsWith('.vercel.app') ||
      allowedOrigins.includes(origin)
    ) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));

// Health checks
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CR Attendance Portal API is running successfully',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Health OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Preflight
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  
  // Allow localhost and all vercel.app domains
  if (origin && (
    origin.includes('localhost') || 
    origin.endsWith('.vercel.app') ||
    allowedOrigins.includes(origin)
  )) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// DB connection middleware (serverless safe)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// Routes
app.use('/api', router);

// Not found + error handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
