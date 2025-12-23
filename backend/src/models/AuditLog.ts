import mongoose, { Document, Schema } from 'mongoose';

export type AuditAction = 
    | 'create' 
    | 'update' 
    | 'delete' 
    | 'soft_delete' 
    | 'restore' 
    | 'bulk_delete' 
    | 'bulk_update'
    | 'login'
    | 'logout'
    | 'password_change';

export interface IAuditLog extends Document {
    _id: string;
    action: AuditAction;
    collectionName: string;
    documentId: string;
    performedBy: string;
    performedAt: Date;
    previousData?: Record<string, any>;
    newData?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
    {
        action: {
            type: String,
            enum: ['create', 'update', 'delete', 'soft_delete', 'restore', 'bulk_delete', 'bulk_update', 'login', 'logout', 'password_change'],
            required: true,
            index: true,
        },
        collectionName: {
            type: String,
            required: true,
            index: true,
        },
        documentId: {
            type: String,
            required: true,
            index: true,
        },
        performedBy: {
            type: String,
            required: true,
            index: true,
        },
        performedAt: {
            type: Date,
            required: true,
            default: Date.now,
            index: true,
        },
        previousData: {
            type: Schema.Types.Mixed,
        },
        newData: {
            type: Schema.Types.Mixed,
        },
        ipAddress: {
            type: String,
            trim: true,
        },
        userAgent: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Compound indexes for common queries
auditLogSchema.index({ collectionName: 1, performedAt: -1 });
auditLogSchema.index({ performedBy: 1, performedAt: -1 });
auditLogSchema.index({ action: 1, performedAt: -1 });

// TTL index - automatically delete logs older than 1 year (365 days)
auditLogSchema.index(
    { performedAt: 1 },
    { expireAfterSeconds: 365 * 24 * 60 * 60 }
);

/**
 * Static method to create an audit log entry
 */
auditLogSchema.statics.logAction = async function (
    action: AuditAction,
    collectionName: string,
    documentId: string,
    performedBy: string,
    options?: {
        previousData?: Record<string, any>;
        newData?: Record<string, any>;
        ipAddress?: string;
        userAgent?: string;
        metadata?: Record<string, any>;
    }
) {
    return this.create({
        action,
        collectionName,
        documentId,
        performedBy,
        performedAt: new Date(),
        ...options,
    });
};

export interface IAuditLogModel extends mongoose.Model<IAuditLog> {
    logAction(
        action: AuditAction,
        collectionName: string,
        documentId: string,
        performedBy: string,
        options?: {
            previousData?: Record<string, any>;
            newData?: Record<string, any>;
            ipAddress?: string;
            userAgent?: string;
            metadata?: Record<string, any>;
        }
    ): Promise<IAuditLog>;
}

export const AuditLog = mongoose.model<IAuditLog, IAuditLogModel>('AuditLog', auditLogSchema);
