import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
    try {
        const mongoURI = process.env.MONGO_URI;

        if (!mongoURI) {
            throw new Error('MONGO_URI environment variable is not defined');
        }

        const conn = await mongoose.connect(mongoURI, {
            retryWrites: true,
            w: 'majority',
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);

    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        // Don't exit in serverless environment
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    }
};

export default connectDB;