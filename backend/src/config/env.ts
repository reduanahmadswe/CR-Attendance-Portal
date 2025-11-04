import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
    NODE_ENV: 'development' | 'production';
    PORT: string;
    MONGO_URI: string;

    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;

    JWT_ACCESS_SECRET: string;
    JWT_ACCESS_EXPIRES: string;

    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRES: string;

    BCRYPT_SALT_ROUNDS: string;
    FRONTEND_URL: string | undefined;

    // QR Code Configuration
    QR_ENCRYPTION_KEY: string;

    // Email configuration
    EMAIL_HOST: string;
    EMAIL_PORT: string;
    EMAIL_SECURE: string;
    EMAIL_USER: string;
    EMAIL_PASSWORD: string;
    EMAIL_FROM: string;
    EMAIL_FROM_NAME: string;
}

const loadEnvVariables = (): EnvConfig => {
    const requiredEnvVariables: string[] = [
        'NODE_ENV',
        'PORT',
        'MONGO_URI',
        'JWT_SECRET',
        'JWT_EXPIRES_IN',
        'BCRYPT_SALT_ROUNDS',
    ];

    // Check for missing required variables (but don't throw in development)
    const missingVariables = requiredEnvVariables.filter((key) => !process.env[key]);

    if (missingVariables.length > 0 && process.env.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variables: ${missingVariables.join(', ')}`);
    }

    return {
        NODE_ENV: (process.env.NODE_ENV as 'development' | 'production') || 'development',
        PORT: process.env.PORT || '4000',
        MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/cr-attendance-portal',

        JWT_SECRET: process.env.JWT_SECRET || 'dev-super-secret-jwt-key-for-access-tokens-2025',
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30m',

        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev-super-secret-jwt-key-for-access-tokens-2025',
        JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || process.env.JWT_EXPIRES_IN || '30m',

        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-super-secret-refresh-key-for-refresh-tokens-2025',
        JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',

        BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS || '12',
        FRONTEND_URL: process.env.FRONTEND_URL || undefined,

        // QR Code configuration
        QR_ENCRYPTION_KEY: process.env.QR_ENCRYPTION_KEY || 'dev-qr-encryption-key-32chars',

        // Email configuration
        EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
        EMAIL_PORT: process.env.EMAIL_PORT || '587',
        EMAIL_SECURE: process.env.EMAIL_SECURE || 'false',
        EMAIL_USER: process.env.EMAIL_USER || '',
        EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
        EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@cr-attendance.com',
        EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'CR Attendance Portal',
    };
};

export const envVars = loadEnvVariables();