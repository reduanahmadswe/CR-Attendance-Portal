import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { AttendanceRecord, Course, Section, Student, User } from '../models';

// Load environment variables
dotenv.config();

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/cr-attendance-portal';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected for clearing database');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

const clearDatabase = async () => {
    try {
        console.log('🗑️  Clearing database...');

        // Clear all collections
        await Promise.all([
            AttendanceRecord.deleteMany({}),
            Student.deleteMany({}),
            Course.deleteMany({}),
            Section.deleteMany({}),
            User.deleteMany({}),
        ]);

        console.log('✅ Database cleared successfully!');
        console.log('💡 Restart the server to trigger auto-seeding.');

    } catch (error) {
        console.error('❌ Error clearing database:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

const main = async () => {
    await connectDB();
    await clearDatabase();
};

main();