import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation {
    latitude: number;
    longitude: number;
    accuracy?: number;
    radius?: number; // in meters
}

export interface IAttendanceSession extends Document {
    _id: string;
    sessionId: string; // Unique session identifier
    sectionId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    date: Date;
    startTime: Date;
    endTime: Date;
    qrCode: string; // Base64 encoded QR code image
    qrCodeData: string; // Encrypted data in QR code
    location?: ILocation;
    expiresAt: Date;
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
    attendedStudents: Array<{
        studentId: mongoose.Types.ObjectId;
        scannedAt: Date;
        location?: ILocation;
        deviceInfo?: string;
    }>;
    maxDuration: number; // in minutes
    allowedRadius: number; // in meters for geofencing
    antiCheatEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    
    // Methods
    hasStudentAttended(studentId: string): boolean;
    addStudentAttendance(studentId: string, location?: ILocation, deviceInfo?: string): Promise<IAttendanceSession>;
}

const locationSchema = new Schema<ILocation>({
    latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
    },
    longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
    },
    accuracy: {
        type: Number,
        min: 0,
    },
    radius: {
        type: Number,
        default: 100, // 100 meters default
        min: 10,
        max: 1000,
    },
}, { _id: false });

const attendanceSessionSchema = new Schema<IAttendanceSession>(
    {
        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            required: true,
            index: true,
        },
        courseId: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
            index: true,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        startTime: {
            type: Date,
            required: true,
            default: Date.now,
        },
        endTime: {
            type: Date,
            required: true,
        },
        qrCode: {
            type: String,
            required: true,
        },
        qrCodeData: {
            type: String,
            required: true,
        },
        location: locationSchema,
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        attendedStudents: [{
            studentId: {
                type: Schema.Types.ObjectId,
                ref: 'Student',
                required: true,
            },
            scannedAt: {
                type: Date,
                required: true,
                default: Date.now,
            },
            location: locationSchema,
            deviceInfo: {
                type: String,
            },
        }],
        maxDuration: {
            type: Number,
            required: true,
            default: 15, // 15 minutes default
            min: 5,
            max: 120,
        },
        allowedRadius: {
            type: Number,
            required: true,
            default: 100, // 100 meters default
            min: 10,
            max: 1000,
        },
        antiCheatEnabled: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
attendanceSessionSchema.index({ sectionId: 1, courseId: 1, date: 1 });
attendanceSessionSchema.index({ isActive: 1, expiresAt: 1 });
attendanceSessionSchema.index({ createdBy: 1, date: -1 });
attendanceSessionSchema.index({ sessionId: 1, isActive: 1 });

// Ensure only one active session per section, course, and date
attendanceSessionSchema.index(
    { sectionId: 1, courseId: 1, date: 1, isActive: 1 },
    { 
        unique: true,
        partialFilterExpression: { isActive: true }
    }
);

// Automatically deactivate expired sessions
attendanceSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if session is still valid
attendanceSessionSchema.methods.isValid = function(): boolean {
    return this.isActive && new Date() < this.expiresAt;
};

// Method to check if student already attended
attendanceSessionSchema.methods.hasStudentAttended = function(studentId: string): boolean {
    return this.attendedStudents.some(
        (attendance: { studentId: mongoose.Types.ObjectId; scannedAt: Date; location?: ILocation; deviceInfo?: string }) => 
            attendance.studentId.toString() === studentId
    );
};

// Method to add student attendance
attendanceSessionSchema.methods.addStudentAttendance = function(
    studentId: string,
    location?: ILocation,
    deviceInfo?: string
) {
    if (this.hasStudentAttended(studentId)) {
        throw new Error('Student has already marked attendance for this session');
    }

    this.attendedStudents.push({
        studentId: new mongoose.Types.ObjectId(studentId),
        scannedAt: new Date(),
        location,
        deviceInfo,
    });

    return this.save();
};

export const AttendanceSession = mongoose.model<IAttendanceSession>(
    'AttendanceSession',
    attendanceSessionSchema
);
