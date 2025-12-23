import { Schema, Query, Document } from 'mongoose';

/**
 * Soft Delete Plugin for Mongoose
 * Adds isDeleted, deletedAt, and deletedBy fields to schemas
 * Automatically filters out soft-deleted documents in queries
 */

export interface ISoftDeleteDocument extends Document {
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    restore(): Promise<this>;
    softDelete(deletedBy?: string): Promise<this>;
}

export interface ISoftDeleteModel<T extends ISoftDeleteDocument> {
    findDeleted(): Query<T[], T>;
    findWithDeleted(): Query<T[], T>;
    restoreById(id: string): Promise<T | null>;
    softDeleteById(id: string, deletedBy?: string): Promise<T | null>;
}

/**
 * Soft Delete Plugin - Add to any Mongoose schema
 */
export function softDeletePlugin(schema: Schema): void {
    // Add soft delete fields
    schema.add({
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        deletedBy: {
            type: String,
            default: null,
        },
    });

    // Pre-find middleware to exclude deleted documents by default
    schema.pre('find', function (this: Query<any, any>) {
        const query = this.getQuery();
        if (query.isDeleted === undefined && query.includeDeleted !== true) {
            this.where({ isDeleted: { $ne: true } });
        }
        // Remove the helper flag
        delete query.includeDeleted;
    });

    schema.pre('findOne', function (this: Query<any, any>) {
        const query = this.getQuery();
        if (query.isDeleted === undefined && query.includeDeleted !== true) {
            this.where({ isDeleted: { $ne: true } });
        }
        delete query.includeDeleted;
    });

    schema.pre('countDocuments', function (this: Query<any, any>) {
        const query = this.getQuery();
        if (query.isDeleted === undefined && query.includeDeleted !== true) {
            this.where({ isDeleted: { $ne: true } });
        }
        delete query.includeDeleted;
    });

    schema.pre('findOneAndUpdate', function (this: Query<any, any>) {
        const query = this.getQuery();
        if (query.isDeleted === undefined && query.includeDeleted !== true) {
            this.where({ isDeleted: { $ne: true } });
        }
        delete query.includeDeleted;
    });

    // Instance method: Soft delete a document
    schema.methods.softDelete = async function (deletedBy?: string): Promise<Document> {
        this.isDeleted = true;
        this.deletedAt = new Date();
        if (deletedBy) {
            this.deletedBy = deletedBy;
        }
        return this.save();
    };

    // Instance method: Restore a soft-deleted document
    schema.methods.restore = async function (): Promise<Document> {
        this.isDeleted = false;
        this.deletedAt = null;
        this.deletedBy = null;
        return this.save();
    };

    // Static method: Find only deleted documents
    schema.statics.findDeleted = function () {
        return this.find({ isDeleted: true, includeDeleted: true });
    };

    // Static method: Find all documents including deleted
    schema.statics.findWithDeleted = function () {
        return this.find({ includeDeleted: true });
    };

    // Static method: Soft delete by ID
    schema.statics.softDeleteById = async function (
        id: string,
        deletedBy?: string
    ): Promise<Document | null> {
        const doc = await this.findById(id);
        if (!doc) return null;
        return doc.softDelete(deletedBy);
    };

    // Static method: Restore by ID
    schema.statics.restoreById = async function (id: string): Promise<Document | null> {
        const doc = await this.findOne({ _id: id, isDeleted: true, includeDeleted: true });
        if (!doc) return null;
        return doc.restore();
    };
}

/**
 * Helper to apply soft delete to existing query
 */
export function withDeleted<T>(query: Query<T, any>): Query<T, any> {
    return query.where({ includeDeleted: true });
}

/**
 * Helper to find only deleted documents
 */
export function onlyDeleted<T>(query: Query<T, any>): Query<T, any> {
    return query.where({ isDeleted: true, includeDeleted: true });
}
