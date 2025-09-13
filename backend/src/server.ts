/* eslint-disable no-console */
import { Server } from 'http';
import app from './app';
import connectDB from './config/database';
import { envVars } from './config/env';
import { checkAndSeed } from './scripts/seed';

let server: Server;

// Initialize database and seed data
const initializeApp = async () => {
    await connectDB();
    await checkAndSeed();
};

// Start server
const startServer = async () => {
    await initializeApp();

    server = app.listen(envVars.PORT, () => {
        console.log(`🚀 Server running on port ${envVars.PORT}`);
        console.log(`📊 Environment: ${envVars.NODE_ENV}`);
        console.log(`🔗 API Base URL: http://localhost:${envVars.PORT}/api`);
    });

    return server;
};

// Start the application for all environments
startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

/**
 * Process event handlers for graceful shutdown
 */

// Unhandled promise rejection
process.on('unhandledRejection', (error) => {
    console.log('Unhandled rejection detected .. server shutting down..', error);

    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }

    process.exit(1);
});

// Uncaught exception
process.on('uncaughtException', (error) => {
    console.log('Uncaught exception detected... server shutting down..', error);

    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }

    process.exit(1);
});

// Graceful shutdown (SIGTERM)
process.on('SIGTERM', (error) => {
    console.log('SIGTERM signal received... server shutting down..', error);

    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }

    process.exit(1);
});

export { app, server };

