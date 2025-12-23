import mongoose, { Document, Schema } from 'mongoose';
import { softDeletePlugin, ISoftDeleteDocument } from '../utils/softDelete';

export interface ICourse extends Document, ISoftDeleteDocument {
    _id: string;
    sectionId: mongoose.Types.ObjectId;
    name: string;
    code?: string;
    semester?: string;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
    {
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        code: {
            type: String,
            trim: true,
            maxlength: 20,
            uppercase: true,
        },
        semester: {
            type: String,
            trim: true,
            maxlength: 20,
        },
    },
    {
        timestamps: true,
    }
);

// Apply soft delete plugin
courseSchema.plugin(softDeletePlugin);

// Index for faster queries
courseSchema.index({ sectionId: 1 });
courseSchema.index({ sectionId: 1, name: 1 });
courseSchema.index({ code: 1 });

// Ensure course name is unique within a section (only among non-deleted)
courseSchema.index({ sectionId: 1, name: 1, isDeleted: 1 }, { unique: true });

export const Course = mongoose.model<ICourse>('Course', courseSchema);