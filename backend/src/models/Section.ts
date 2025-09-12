import mongoose, { Document, Schema } from 'mongoose';

export interface ISection extends Document {
    _id: string;
    name: string;
    code?: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const sectionSchema = new Schema<ISection>(
    {
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
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
sectionSchema.index({ name: 1 });
sectionSchema.index({ code: 1 });

// Ensure section name is unique
sectionSchema.index({ name: 1 }, { unique: true });

export const Section = mongoose.model<ISection>('Section', sectionSchema);