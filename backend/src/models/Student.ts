import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
    _id: string;
    studentId: string;
    name: string;
    email: string;
    sectionId: mongoose.Types.ObjectId;
    courses: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
    {
        studentId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            maxlength: 20,
            uppercase: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            required: true,
        },
        courses: [{
            type: Schema.Types.ObjectId,
            ref: 'Course',
        }],
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
studentSchema.index({ studentId: 1 });
studentSchema.index({ sectionId: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ sectionId: 1, studentId: 1 });

// Ensure student email is unique within a section
studentSchema.index({ sectionId: 1, email: 1 }, { unique: true });

export const Student = mongoose.model<IStudent>('Student', studentSchema);