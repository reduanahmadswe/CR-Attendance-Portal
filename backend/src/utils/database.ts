import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
    const mongoURI = process.env.MONGO_URI;

    try {
        if (!mongoURI) {
            throw new Error('MONGO_URI environment variable is not defined');
        }

        // Skip if already connected
        if (mongoose.connection.readyState === 1) {
            console.log('MongoDB already connected');
            return;
        }

        // Close existing connections if in connecting state
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        // Determine connection options based on URI type
        const isAtlas = mongoURI.includes('mongodb+srv://');
        const connectionOptions = isAtlas ? {
            retryWrites: true,
            w: 'majority' as const,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            maxIdleTimeMS: 30000,
            heartbeatFrequencyMS: 30000,
            bufferCommands: true
        } : {
            // Local MongoDB options
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            bufferCommands: true
        };

        const conn = await mongoose.connect(mongoURI, connectionOptions);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);

    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        console.error('MongoDB URI provided:', !!mongoURI);
        console.error('Connection type:', mongoURI?.includes('mongodb+srv://') ? 'Atlas' : 'Local');

        // Don't exit in serverless environment
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
        throw error; // Re-throw to handle in calling code
    }
};

export default connectDB;