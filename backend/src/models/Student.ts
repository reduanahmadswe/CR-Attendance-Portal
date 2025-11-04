import mongoose, { Document, Schema } from 'mongoose';
import bcryptjs from 'bcryptjs';

export interface IStudent extends Document {
    _id: string;
    studentId: string;
    name: string;
    email: string;
    password: string;
    isPasswordDefault: boolean; // Track if using default password
    sectionId: mongoose.Types.ObjectId;
    courses: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
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
        password: {
            type: String,
            required: true,
            select: false, // Don't return password by default
        },
        isPasswordDefault: {
            type: Boolean,
            default: true,
        },
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            required: true,
        },
        courses: [{
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        }],
    },
    {
        timestamps: true,
    }
);

// Validation: Student must be assigned to at least one course
studentSchema.pre('save', function (next) {
    if (!this.courses || this.courses.length === 0) {
        const error = new Error('Student must be assigned to at least one course');
        return next(error);
    }
    next();
});

// Hash password before saving
studentSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcryptjs.genSalt(12);
        this.password = await bcryptjs.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// Method to compare password
studentSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    try {
        return await bcryptjs.compare(candidatePassword, this.password);
    } catch (error) {
        return false;
    }
};

// Index for faster queries
studentSchema.index({ studentId: 1 });
studentSchema.index({ sectionId: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ sectionId: 1, studentId: 1 });

// Ensure student email is unique within a section
studentSchema.index({ sectionId: 1, email: 1 }, { unique: true });

export const Student = mongoose.model<IStudent>('Student', studentSchema);