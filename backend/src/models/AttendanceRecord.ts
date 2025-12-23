import mongoose, { Document, Schema } from 'mongoose';
import { softDeletePlugin, ISoftDeleteDocument } from '../utils/softDelete';

export interface IAttendee {
    studentId: mongoose.Types.ObjectId;
    status: 'present' | 'absent' | 'late' | 'excused';
    note?: string;
}

export interface IAttendanceRecord extends Document, ISoftDeleteDocument {
    _id: string;
    sectionId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    date: Date;
    takenBy: mongoose.Types.ObjectId;
    attendees: IAttendee[];
    pdfUrl?: string;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

const attendeeSchema = new Schema<IAttendee>({
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'excused'],
        required: true,
        default: 'absent',
    },
    note: {
        type: String,
        trim: true,
        maxlength: 200,
    },
}, { _id: false });

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
    {
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            required: true,
        },
        courseId: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        takenBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        attendees: [attendeeSchema],
        pdfUrl: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Apply soft delete plugin
attendanceRecordSchema.plugin(softDeletePlugin);

// Index for faster queries
attendanceRecordSchema.index({ sectionId: 1, courseId: 1, date: 1 });
attendanceRecordSchema.index({ sectionId: 1, date: -1 });
attendanceRecordSchema.index({ courseId: 1, date: -1 });
attendanceRecordSchema.index({ takenBy: 1, date: -1 });

// Ensure only one attendance record per section, course, and date (only among non-deleted)
attendanceRecordSchema.index(
    { sectionId: 1, courseId: 1, date: 1, isDeleted: 1 },
    { unique: true }
);

export const AttendanceRecord = mongoose.model<IAttendanceRecord>(
    'AttendanceRecord',
    attendanceRecordSchema
);