import mongoose, { Document, Schema } from 'mongoose';

export type BackupType = 'full' | 'incremental' | 'collections' | 'scheduled' | 'manual';
export type BackupStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type TriggerType = 'scheduler' | 'manual' | 'api';
export type CompressionType = 'none' | 'gzip' | 'zip';

export interface IBackupMetadata extends Document {
    _id: string;
    backupId: string;
    type: BackupType;
    status: BackupStatus;
    startedAt: Date;
    completedAt?: Date;
    filePath?: string;
    fileSize?: number;
    collections?: string[];
    documentCount?: Record<string, number>;
    checksum?: string;
    errorMessage?: string;
    triggeredBy: TriggerType;
    performedBy?: string;
    retentionDays: number;
    isEncrypted: boolean;
    compressionType: CompressionType;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const backupMetadataSchema = new Schema<IBackupMetadata>(
    {
        backupId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['full', 'incremental', 'collections', 'scheduled', 'manual'],
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
            required: true,
            default: 'pending',
            index: true,
        },
        startedAt: {
            type: Date,
            required: true,
            default: Date.now,
            index: true,
        },
        completedAt: {
            type: Date,
        },
        filePath: {
            type: String,
            trim: true,
        },
        fileSize: {
            type: Number,
            min: 0,
        },
        collections: [{
            type: String,
        }],
        documentCount: {
            type: Schema.Types.Mixed,
        },
        checksum: {
            type: String,
            trim: true,
        },
        errorMessage: {
            type: String,
            trim: true,
        },
        triggeredBy: {
            type: String,
            enum: ['scheduler', 'manual', 'api'],
            required: true,
            default: 'manual',
        },
        performedBy: {
            type: String,
        },
        retentionDays: {
            type: Number,
            required: true,
            default: 30,
            min: 1,
            max: 365,
        },
        isEncrypted: {
            type: Boolean,
            default: false,
        },
        compressionType: {
            type: String,
            enum: ['none', 'gzip', 'zip'],
            default: 'gzip',
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes
backupMetadataSchema.index({ status: 1, startedAt: -1 });
backupMetadataSchema.index({ type: 1, startedAt: -1 });
backupMetadataSchema.index({ triggeredBy: 1, startedAt: -1 });

export const BackupMetadata = mongoose.model<IBackupMetadata>('BackupMetadata', backupMetadataSchema);
