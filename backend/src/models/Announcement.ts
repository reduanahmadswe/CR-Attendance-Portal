import mongoose, { Document, Schema } from 'mongoose';

export type AnnouncementType = 
    | 'quiz-1'
    | 'quiz-2' 
    | 'quiz-3'
    | 'quiz-4'
    | 'presentation' 
    | 'midterm' 
    | 'final' 
    | 'assignment' 
    | 'class_cancel' 
    | 'class_reschedule';

export interface IAnnouncementDetails {
    topic?: string;
    slideLink?: string;
    time?: Date;
    room?: string;
}

export interface IAnnouncement extends Document {
    _id: string;
    title: string;
    type: AnnouncementType;
    message?: string;
    courseId: mongoose.Types.ObjectId;
    sectionId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    sendEmail: boolean;
    emailSent: boolean;
    emailSentAt?: Date;
    emailRecipients?: string[];
    details?: IAnnouncementDetails;
    createdAt: Date;
    updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        type: {
            type: String,
            enum: ['quiz-1', 'quiz-2', 'quiz-3', 'quiz-4', 'presentation', 'midterm', 'final', 'assignment', 'class_cancel', 'class_reschedule'],
            required: true,
        },
        message: {
            type: String,
            required: false,
            trim: true,
            maxlength: 2000,
        },
        courseId: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
            index: true,
        },
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            required: true,
            index: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        sendEmail: {
            type: Boolean,
            default: false,
        },
        emailSent: {
            type: Boolean,
            default: false,
        },
        emailSentAt: {
            type: Date,
        },
        emailRecipients: [{
            type: String,
        }],
        details: {
            topic: {
                type: String,
                trim: true,
                maxlength: 200,
            },
            slideLink: {
                type: String,
                trim: true,
                maxlength: 500,
            },
            time: {
                type: Date,
            },
            room: {
                type: String,
                trim: true,
                maxlength: 100,
            },
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
announcementSchema.index({ courseId: 1, createdAt: -1 });
announcementSchema.index({ sectionId: 1, createdAt: -1 });
announcementSchema.index({ type: 1, createdAt: -1 });
announcementSchema.index({ createdBy: 1 });

// Validation: Details are required for certain types
announcementSchema.pre('save', function (next) {
    const typesRequiringDetails: AnnouncementType[] = [
        'quiz-1',
        'quiz-2', 
        'quiz-3',
        'quiz-4',
        'presentation', 
        'midterm', 
        'final', 
        'assignment'
    ];

    if (typesRequiringDetails.includes(this.type)) {
        // Check if details object exists and has the required fields with non-empty values
        const hasValidTopic = this.details?.topic && this.details.topic.trim().length > 0;
        const hasValidTime = this.details?.time !== null && this.details?.time !== undefined;
        const hasValidRoom = this.details?.room && this.details.room.trim().length > 0;

        if (!hasValidTopic || !hasValidTime || !hasValidRoom) {
            const error = new Error(
                `Announcements of type '${this.type}' must include details: topic, time, and room`
            );
            return next(error);
        }
    }
    next();
});

export const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
