import mongoose from 'mongoose';
import { envVars } from './env';

// Global connection promise to avoid multiple connections
let cachedConnection: typeof mongoose | null = null;
let connectionPromise: Promise<typeof mongoose> | null = null;

const connectDB = async (): Promise<typeof mongoose> => {
    // If we have a cached connection and it's connected, return it
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }

    // If there's already a connection attempt in progress, wait for it
    if (connectionPromise) {
        return connectionPromise;
    }

    // Create new connection promise
    connectionPromise = (async () => {
        try {
            const mongoUri = envVars.MONGO_URI;

            // Determine connection options based on URI type
            const isAtlas = mongoUri.includes('mongodb+srv://');
            const connectionOptions = isAtlas ? {
                maxPoolSize: 1, // Single connection for serverless
                serverSelectionTimeoutMS: 3000, // 3 seconds (reduced)
                socketTimeoutMS: 15000, // 15 seconds (reduced)
                connectTimeoutMS: 3000, // 3 seconds (reduced)
                bufferCommands: false, // Disable mongoose buffering
                heartbeatFrequencyMS: 10000, // 10 seconds heartbeat
                maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
                retryWrites: true,
                w: 'majority' as const,
            } : {
                // Local MongoDB options
                maxPoolSize: 10, // More connections for local dev
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                connectTimeoutMS: 10000,
                bufferCommands: true,
            };

            const connection = await mongoose.connect(mongoUri, connectionOptions);

            cachedConnection = connection;
            console.info(`✅ MongoDB connected: ${connection.connection.host}`);
            console.info(`📊 Database: ${connection.connection.name}`);
            console.info(`🔗 Connection type: ${isAtlas ? 'Atlas' : 'Local'}`);

            return connection;

        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            cachedConnection = null;
            connectionPromise = null; // Reset promise on failure
            throw error;
        }
    })();

    return connectionPromise;
};

export default connectDB;