import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import { User, Section, Course, Student, Announcement } from '../models';
import { generateAccessToken } from '../utils/jwt';

let mongoServer: MongoMemoryServer;
let adminToken: string;
let crToken: string;
let instructorToken: string;
let viewerToken: string;
let adminUser: any;
let crUser: any;
let instructorUser: any;
let viewerUser: any;
let section: any;
let course: any;
let students: any[];

beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test section
    section = await Section.create({
        name: 'Section A',
        code: 'SEC-A',
        description: 'Test section',
    });

    // Create test users
    adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        passwordHash: 'hashedpassword123',
        role: 'admin',
    });

    crUser = await User.create({
        name: 'CR User',
        email: 'cr@test.com',
        passwordHash: 'hashedpassword123',
        role: 'cr',
        sectionId: section._id,
    });

    instructorUser = await User.create({
        name: 'Instructor User',
        email: 'instructor@test.com',
        passwordHash: 'hashedpassword123',
        role: 'instructor',
    });

    viewerUser = await User.create({
        name: 'Viewer User',
        email: 'viewer@test.com',
        passwordHash: 'hashedpassword123',
        role: 'viewer',
    });

    // Generate tokens
    adminToken = generateAccessToken({
        userId: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role,
    });

    crToken = generateAccessToken({
        userId: crUser._id.toString(),
        email: crUser.email,
        role: crUser.role,
        sectionId: crUser.sectionId?.toString(),
    });

    instructorToken = generateAccessToken({
        userId: instructorUser._id.toString(),
        email: instructorUser.email,
        role: instructorUser.role,
    });

    viewerToken = generateAccessToken({
        userId: viewerUser._id.toString(),
        email: viewerUser.email,
        role: viewerUser.role,
    });

    // Create test course
    course = await Course.create({
        sectionId: section._id,
        name: 'Software Engineering',
        code: 'CSE301',
        semester: 'Spring 2025',
    });

    // Create test students
    students = await Student.create([
        {
            studentId: 'STU001',
            name: 'Student One',
            email: 'student1@test.com',
            sectionId: section._id,
            courses: [course._id],
        },
        {
            studentId: 'STU002',
            name: 'Student Two',
            email: 'student2@test.com',
            sectionId: section._id,
            courses: [course._id],
        },
    ]);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    // Clear announcements before each test
    await Announcement.deleteMany({});
});

describe('Announcement Module', () => {
    describe('POST /api/announcements', () => {
        it('should create a quiz announcement with all details', async () => {
            const announcementData = {
                title: 'Quiz 1 on Data Structures',
                type: 'quiz',
                message: 'Quiz will cover arrays, linked lists, and stacks.',
                courseId: course._id.toString(),
                sendEmail: false,
                topic: 'Arrays and Linked Lists',
                slideLink: 'https://example.com/slides',
                time: new Date('2025-11-01T10:00:00Z'),
                room: 'Room 301',
            };

            const response = await request(app)
                .post('/api/announcements')
                .set('Authorization', `Bearer ${crToken}`)
                .send(announcementData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.announcement.title).toBe(announcementData.title);
            expect(response.body.data.announcement.type).toBe('quiz');
            expect(response.body.data.announcement.details.topic).toBe(announcementData.topic);
            expect(response.body.data.announcement.details.room).toBe(announcementData.room);
            expect(response.body.data.textMessage).toBeDefined();
        });

        it('should create a class cancel announcement without details', async () => {
            const announcementData = {
                title: 'Class Cancelled - Nov 5',
                type: 'class_cancel',
                message: 'Due to university event, class is cancelled.',
                courseId: course._id.toString(),
                sendEmail: false,
            };

            const response = await request(app)
                .post('/api/announcements')
                .set('Authorization', `Bearer ${crToken}`)
                .send(announcementData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.announcement.type).toBe('class_cancel');
            expect(response.body.data.announcement.details).toBeUndefined();
        });

        it('should reject quiz announcement without required details', async () => {
            const announcementData = {
                title: 'Quiz without details',
                type: 'quiz',
                message: 'Missing required fields',
                courseId: course._id.toString(),
                sendEmail: false,
            };

            const response = await request(app)
                .post('/api/announcements')
                .set('Authorization', `Bearer ${crToken}`)
                .send(announcementData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject announcement from CR for different section', async () => {
            // Create another section and course
            const otherSection = await Section.create({
                name: 'Section B',
                code: 'SEC-B',
            });

            const otherCourse = await Course.create({
                sectionId: otherSection._id,
                name: 'Database Systems',
                code: 'CSE302',
            });

            const announcementData = {
                title: 'Unauthorized announcement',
                type: 'class_cancel',
                message: 'CR trying to announce for other section',
                courseId: otherCourse._id.toString(),
                sendEmail: false,
            };

            const response = await request(app)
                .post('/api/announcements')
                .set('Authorization', `Bearer ${crToken}`)
                .send(announcementData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should allow admin to create announcement', async () => {
            const announcementData = {
                title: 'Admin Announcement',
                type: 'midterm',
                message: 'Midterm exam announcement',
                courseId: course._id.toString(),
                sendEmail: false,
                topic: 'Full Syllabus',
                time: new Date('2025-12-01T09:00:00Z'),
                room: 'Exam Hall',
            };

            const response = await request(app)
                .post('/api/announcements')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(announcementData)
                .expect(201);

            expect(response.body.success).toBe(true);
        });

        it('should reject announcement from viewer', async () => {
            const announcementData = {
                title: 'Viewer Announcement',
                type: 'class_cancel',
                message: 'Viewers cannot create',
                courseId: course._id.toString(),
                sendEmail: false,
            };

            const response = await request(app)
                .post('/api/announcements')
                .set('Authorization', `Bearer ${viewerToken}`)
                .send(announcementData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/announcements', () => {
        beforeEach(async () => {
            // Create test announcements
            await Announcement.create([
                {
                    title: 'Quiz 1',
                    type: 'quiz',
                    message: 'Quiz on chapter 1',
                    courseId: course._id,
                    sectionId: section._id,
                    createdBy: crUser._id,
                    sendEmail: false,
                    details: {
                        topic: 'Chapter 1',
                        time: new Date(),
                        room: 'Room 301',
                    },
                },
                {
                    title: 'Class Cancelled',
                    type: 'class_cancel',
                    message: 'No class today',
                    courseId: course._id,
                    sectionId: section._id,
                    createdBy: crUser._id,
                    sendEmail: false,
                },
                {
                    title: 'Assignment 1',
                    type: 'assignment',
                    message: 'Submit by Friday',
                    courseId: course._id,
                    sectionId: section._id,
                    createdBy: instructorUser._id,
                    sendEmail: false,
                    details: {
                        topic: 'Topic A',
                        time: new Date(),
                        room: 'Online',
                    },
                },
            ]);
        });

        it('should get all announcements', async () => {
            const response = await request(app)
                .get('/api/announcements')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(3);
            expect(response.body.pagination.total).toBe(3);
        });

        it('should filter announcements by type', async () => {
            const response = await request(app)
                .get('/api/announcements')
                .query({ type: 'quiz' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].type).toBe('quiz');
        });

        it('should filter announcements by course', async () => {
            const response = await request(app)
                .get('/api/announcements')
                .query({ courseId: course._id.toString() })
                .set('Authorization', `Bearer ${crToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(3);
        });

        it('should paginate announcements', async () => {
            const response = await request(app)
                .get('/api/announcements')
                .query({ page: 1, limit: 2 })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(2);
            expect(response.body.pagination.pages).toBe(2);
        });

        it('should only show CR their section announcements', async () => {
            const response = await request(app)
                .get('/api/announcements')
                .set('Authorization', `Bearer ${crToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.every((a: any) => 
                a.sectionId._id.toString() === section._id.toString()
            )).toBe(true);
        });
    });

    describe('GET /api/announcements/:id', () => {
        let announcement: any;

        beforeEach(async () => {
            announcement = await Announcement.create({
                title: 'Test Announcement',
                type: 'quiz',
                message: 'Test message',
                courseId: course._id,
                sectionId: section._id,
                createdBy: crUser._id,
                sendEmail: false,
                details: {
                    topic: 'Test Topic',
                    time: new Date(),
                    room: 'Room 101',
                },
            });
        });

        it('should get announcement by id', async () => {
            const response = await request(app)
                .get(`/api/announcements/${announcement._id}`)
                .set('Authorization', `Bearer ${crToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Test Announcement');
            expect(response.body.data.details.topic).toBe('Test Topic');
        });

        it('should return 404 for non-existent announcement', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await request(app)
                .get(`/api/announcements/${fakeId}`)
                .set('Authorization', `Bearer ${crToken}`)
                .expect(404);
        });
    });

    describe('PUT /api/announcements/:id', () => {
        let announcement: any;

        beforeEach(async () => {
            announcement = await Announcement.create({
                title: 'Original Title',
                type: 'quiz',
                message: 'Original message',
                courseId: course._id,
                sectionId: section._id,
                createdBy: crUser._id,
                sendEmail: false,
                details: {
                    topic: 'Original Topic',
                    time: new Date(),
                    room: 'Room 101',
                },
            });
        });

        it('should update announcement by creator', async () => {
            const updateData = {
                title: 'Updated Title',
                message: 'Updated message',
            };

            const response = await request(app)
                .put(`/api/announcements/${announcement._id}`)
                .set('Authorization', `Bearer ${crToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Updated Title');
            expect(response.body.data.message).toBe('Updated message');
        });

        it('should update announcement by admin', async () => {
            const updateData = {
                title: 'Admin Updated',
            };

            const response = await request(app)
                .put(`/api/announcements/${announcement._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Admin Updated');
        });

        it('should reject update from non-creator', async () => {
            const updateData = {
                title: 'Unauthorized Update',
            };

            await request(app)
                .put(`/api/announcements/${announcement._id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(updateData)
                .expect(403);
        });
    });

    describe('DELETE /api/announcements/:id', () => {
        let announcement: any;

        beforeEach(async () => {
            announcement = await Announcement.create({
                title: 'To Delete',
                type: 'class_cancel',
                message: 'Will be deleted',
                courseId: course._id,
                sectionId: section._id,
                createdBy: crUser._id,
                sendEmail: false,
            });
        });

        it('should delete announcement by creator', async () => {
            const response = await request(app)
                .delete(`/api/announcements/${announcement._id}`)
                .set('Authorization', `Bearer ${crToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            const deleted = await Announcement.findById(announcement._id);
            expect(deleted).toBeNull();
        });

        it('should delete announcement by admin', async () => {
            await request(app)
                .delete(`/api/announcements/${announcement._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const deleted = await Announcement.findById(announcement._id);
            expect(deleted).toBeNull();
        });

        it('should reject delete from non-creator', async () => {
            await request(app)
                .delete(`/api/announcements/${announcement._id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(403);

            const notDeleted = await Announcement.findById(announcement._id);
            expect(notDeleted).not.toBeNull();
        });
    });

    describe('GET /api/announcements/stats', () => {
        beforeEach(async () => {
            await Announcement.create([
                {
                    title: 'Quiz 1',
                    type: 'quiz',
                    message: 'Quiz',
                    courseId: course._id,
                    sectionId: section._id,
                    createdBy: crUser._id,
                    sendEmail: true,
                    emailSent: true,
                    details: { topic: 'A', time: new Date(), room: 'R1' },
                },
                {
                    title: 'Quiz 2',
                    type: 'quiz',
                    message: 'Quiz',
                    courseId: course._id,
                    sectionId: section._id,
                    createdBy: crUser._id,
                    sendEmail: false,
                    details: { topic: 'B', time: new Date(), room: 'R2' },
                },
                {
                    title: 'Assignment',
                    type: 'assignment',
                    message: 'Assignment',
                    courseId: course._id,
                    sectionId: section._id,
                    createdBy: instructorUser._id,
                    sendEmail: true,
                    emailSent: true,
                    details: { topic: 'C', time: new Date(), room: 'R3' },
                },
            ]);
        });

        it('should get announcement statistics', async () => {
            const response = await request(app)
                .get('/api/announcements/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.total).toBe(3);
            expect(response.body.data.byType.length).toBeGreaterThan(0);
        });

        it('should get stats for specific course', async () => {
            const response = await request(app)
                .get('/api/announcements/stats')
                .query({ courseId: course._id.toString() })
                .set('Authorization', `Bearer ${crToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.total).toBe(3);
        });
    });
});
