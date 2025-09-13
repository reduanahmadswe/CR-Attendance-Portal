import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Course, Section, Student, User } from '../models';

// Load environment variables
dotenv.config();

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/cr-attendance-portal';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected for seeding');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

export const seedData = async () => {
    try {
        // Check if data already exists
        const existingUsers = await User.countDocuments();
        if (existingUsers > 0) {
            console.log('📊 Database already has data. Skipping seeding.');
            return;
        }

        console.log('🌱 Starting database seeding...');

        // Create sections
        const sections = await Section.insertMany([
            {
                name: 'CSE-3A',
                code: 'CSE3A',
                description: 'Computer Science Engineering Section A - 3rd Year',
            },
            {
                name: 'CSE-3B',
                code: 'CSE3B',
                description: 'Computer Science Engineering Section B - 3rd Year',
            },
            {
                name: 'EEE-2A',
                code: 'EEE2A',
                description: 'Electrical and Electronics Engineering Section A - 2nd Year',
            },
        ]);

        console.log('Created sections');

        // Ensure we have the sections we need
        if (sections.length < 3) {
            throw new Error('Failed to create all required sections');
        }

        // Extract section IDs for easier reference
        const [cse3aSection, cse3bSection, eee2aSection] = sections;

        // Validate sections were created successfully
        if (!cse3aSection || !cse3bSection || !eee2aSection) {
            throw new Error('Failed to create all required sections');
        }

        // Create admin users
        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@university.edu',
            passwordHash: 'admin123456', // Will be hashed automatically
            role: 'admin',
        });

        // Create additional admin user for production with expected credentials
        const productionAdmin = await User.create({
            name: 'Production Admin',
            email: 'admin@admin.com',
            passwordHash: 'admin123', // Will be hashed automatically
            role: 'admin',
        });

        // Create CR users
        const crUser1 = await User.create({
            name: 'John Doe',
            email: 'john.cr@university.edu',
            passwordHash: 'cr123456',
            role: 'cr',
            sectionId: cse3aSection._id, // CSE-3A
        });

        const crUser2 = await User.create({
            name: 'Jane Smith',
            email: 'jane.cr@university.edu',
            passwordHash: 'cr123456',
            role: 'cr',
            sectionId: cse3bSection._id, // CSE-3B
        });

        const crUsers = [crUser1, crUser2];

        console.log('Created users');

        // Create courses for CSE-3A
        const cse3aCourses = await Course.insertMany([
            {
                sectionId: cse3aSection._id,
                name: 'Software Engineering',
                code: 'CSE301',
                semester: 'Fall 2025',
            },
            {
                sectionId: cse3aSection._id,
                name: 'Database Management Systems',
                code: 'CSE302',
                semester: 'Fall 2025',
            },
            {
                sectionId: cse3aSection._id,
                name: 'Computer Networks',
                code: 'CSE303',
                semester: 'Fall 2025',
            },
        ]);

        // Create courses for CSE-3B
        const cse3bCourses = await Course.insertMany([
            {
                sectionId: cse3bSection._id,
                name: 'Software Engineering',
                code: 'CSE301',
                semester: 'Fall 2025',
            },
            {
                sectionId: cse3bSection._id,
                name: 'Database Management Systems',
                code: 'CSE302',
                semester: 'Fall 2025',
            },
            {
                sectionId: cse3bSection._id,
                name: 'Operating Systems',
                code: 'CSE304',
                semester: 'Fall 2025',
            },
        ]);

        // Create courses for EEE-2A
        const eee2aCourses = await Course.insertMany([
            {
                sectionId: eee2aSection._id,
                name: 'Circuit Analysis',
                code: 'EEE201',
                semester: 'Fall 2025',
            },
            {
                sectionId: eee2aSection._id,
                name: 'Digital Electronics',
                code: 'EEE202',
                semester: 'Fall 2025',
            },
        ]);

        console.log('Created courses');

        // Create students for CSE-3A
        const cse3aStudents = await Student.insertMany([
            {
                studentId: '2021CSE001',
                name: 'Alice Johnson',
                email: 'alice.johnson@student.edu',
                sectionId: cse3aSection._id,
                courses: cse3aCourses.map(c => c._id),
            },
            {
                studentId: '2021CSE002',
                name: 'Bob Wilson',
                email: 'bob.wilson@student.edu',
                sectionId: cse3aSection._id,
                courses: cse3aCourses.map(c => c._id),
            },
            {
                studentId: '2021CSE003',
                name: 'Charlie Brown',
                email: 'charlie.brown@student.edu',
                sectionId: cse3aSection._id,
                courses: cse3aCourses.map(c => c._id),
            },
            {
                studentId: '2021CSE004',
                name: 'Diana Miller',
                email: 'diana.miller@student.edu',
                sectionId: cse3aSection._id,
                courses: cse3aCourses.map(c => c._id),
            },
            {
                studentId: '2021CSE005',
                name: 'Edward Davis',
                email: 'edward.davis@student.edu',
                sectionId: cse3aSection._id,
                courses: cse3aCourses.map(c => c._id),
            },
        ]);

        // Create students for CSE-3B
        const cse3bStudents = await Student.insertMany([
            {
                studentId: '2021CSE006',
                name: 'Fiona Green',
                email: 'fiona.green@student.edu',
                sectionId: cse3bSection._id,
                courses: cse3bCourses.map(c => c._id),
            },
            {
                studentId: '2021CSE007',
                name: 'George White',
                email: 'george.white@student.edu',
                sectionId: cse3bSection._id,
                courses: cse3bCourses.map(c => c._id),
            },
            {
                studentId: '2021CSE008',
                name: 'Helen Black',
                email: 'helen.black@student.edu',
                sectionId: cse3bSection._id,
                courses: cse3bCourses.map(c => c._id),
            },
        ]);

        // Create students for EEE-2A
        const eee2aStudents = await Student.insertMany([
            {
                studentId: '2022EEE001',
                name: 'Ivan Gray',
                email: 'ivan.gray@student.edu',
                sectionId: eee2aSection._id,
                courses: eee2aCourses.map(c => c._id),
            },
            {
                studentId: '2022EEE002',
                name: 'Julia Red',
                email: 'julia.red@student.edu',
                sectionId: eee2aSection._id,
                courses: eee2aCourses.map(c => c._id),
            },
        ]);

        console.log('Created students');

        console.log('\n=== Seed Data Summary ===');
        console.log('Admin Accounts:');
        console.log(`Development Admin - Email: ${adminUser.email}, Password: admin123456`);
        console.log(`Production Admin - Email: ${productionAdmin.email}, Password: admin123`);
        console.log('\nCR Accounts:');
        crUsers.forEach((cr, index) => {
            const section = sections[index];
            if (section) {
                console.log(`- ${cr.name} (${cr.email}) - Section: ${section.name} - Password: cr123456`);
            }
        });

        console.log('\nSections Created:');
        sections.forEach(section => {
            console.log(`- ${section.name} (${section.code})`);
        });

        console.log('\nCourses Created:');
        [...cse3aCourses, ...cse3bCourses, ...eee2aCourses].forEach(course => {
            console.log(`- ${course.name} (${course.code})`);
        });

        console.log(`\nTotal Students: ${cse3aStudents.length + cse3bStudents.length + eee2aStudents.length}`);

        console.log('\n=== Seeding completed successfully! ===');
        return true;
    } catch (error) {
        console.error('Error seeding data:', error);
        return false;
    }
};

// Check if database is empty and needs seeding
export const checkAndSeed = async () => {
    try {
        const userCount = await User.countDocuments();
        const sectionCount = await Section.countDocuments();

        if (userCount === 0 && sectionCount === 0) {
            console.log('🌱 Database is empty. Starting auto-seed...');
            const success = await seedData();
            if (success) {
                console.log('✅ Auto-seeding completed successfully!');
            } else {
                console.log('❌ Auto-seeding failed!');
            }
        } else {
            console.log('📊 Database already has data. Skipping auto-seed.');
        }
    } catch (error) {
        console.error('Error checking database status:', error);
    }
};

const main = async () => {
    await connectDB();
    await seedData();
    await mongoose.connection.close();
    process.exit(0);
};

// Only run main if script is executed directly
if (require.main === module) {
    main();
}