/**
 * Audit Service
 * 
 * Centralized service for logging all database operations.
 * Tracks creates, updates, deletes, soft deletes, and restores.
 */

import { Request } from 'express';
import { AuditLog, AuditAction } from '../models/AuditLog';

/**
 * Get client IP address from request
 */
function getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
        return ips?.trim() || 'unknown';
    }
    return req.socket.remoteAddress || 'unknown';
}

/**
 * Get user agent from request
 */
function getUserAgent(req: Request): string {
    return req.headers['user-agent'] || 'unknown';
}

/**
 * Log an audit action
 */
export async function logAudit(
    action: AuditAction,
    collectionName: string,
    documentId: string,
    performedBy: string,
    req?: Request,
    options?: {
        previousData?: Record<string, any>;
        newData?: Record<string, any>;
        metadata?: Record<string, any>;
    }
): Promise<void> {
    try {
        const auditOptions: {
            previousData?: Record<string, any>;
            newData?: Record<string, any>;
            ipAddress?: string;
            userAgent?: string;
            metadata?: Record<string, any>;
        } = {};

        if (options?.previousData) auditOptions.previousData = options.previousData;
        if (options?.newData) auditOptions.newData = options.newData;
        if (req) {
            auditOptions.ipAddress = getClientIP(req);
            auditOptions.userAgent = getUserAgent(req);
        }
        if (options?.metadata) auditOptions.metadata = options.metadata;

        await AuditLog.logAction(action, collectionName, documentId, performedBy, auditOptions);
    } catch (error) {
        // Don't throw - audit logging should not break main operations
        console.error('Failed to create audit log:', error);
    }
}

/**
 * Log create action
 */
export async function logCreate(
    collectionName: string,
    documentId: string,
    performedBy: string | undefined,
    newData: Record<string, any>,
    req?: Request
): Promise<void> {
    await logAudit('create', collectionName, documentId, performedBy || 'system', req, { newData });
}

/**
 * Log update action
 */
export async function logUpdate(
    collectionName: string,
    documentId: string,
    performedBy: string | undefined,
    previousData: Record<string, any>,
    newData: Record<string, any>,
    req?: Request
): Promise<void> {
    await logAudit('update', collectionName, documentId, performedBy || 'system', req, {
        previousData,
        newData,
    });
}

/**
 * Log delete action (hard delete)
 */
export async function logDelete(
    collectionName: string,
    documentId: string,
    performedBy: string | undefined,
    previousData: Record<string, any>,
    req?: Request
): Promise<void> {
    await logAudit('delete', collectionName, documentId, performedBy || 'system', req, { previousData });
}

/**
 * Log soft delete action
 */
export async function logSoftDelete(
    collectionName: string,
    documentId: string,
    performedBy: string | undefined,
    req?: Request
): Promise<void> {
    await logAudit('soft_delete', collectionName, documentId, performedBy || 'system', req);
}

/**
 * Log restore action
 */
export async function logRestore(
    collectionName: string,
    documentId: string,
    performedBy: string | undefined,
    req?: Request
): Promise<void> {
    await logAudit('restore', collectionName, documentId, performedBy || 'system', req);
}

/**
 * Log login action
 */
export async function logLogin(
    userId: string,
    email: string,
    req?: Request,
    success: boolean = true
): Promise<void> {
    await logAudit('login', 'users', userId, userId, req, {
        metadata: { email, success },
    });
}

/**
 * Log logout action
 */
export async function logLogout(
    userId: string,
    req?: Request
): Promise<void> {
    await logAudit('logout', 'users', userId, userId, req);
}

/**
 * Log password change action
 */
export async function logPasswordChange(
    userId: string,
    performedBy: string,
    req?: Request
): Promise<void> {
    await logAudit('password_change', 'users', userId, performedBy, req);
}

/**
 * Get audit logs for a specific document
 */
export async function getDocumentAuditLogs(
    collectionName: string,
    documentId: string,
    limit: number = 50
) {
    return AuditLog.find({ collectionName, documentId })
        .sort({ performedAt: -1 })
        .limit(limit)
        .exec();
}

/**
 * Get audit logs by user
 */
export async function getUserAuditLogs(
    performedBy: string,
    limit: number = 50
) {
    return AuditLog.find({ performedBy })
        .sort({ performedAt: -1 })
        .limit(limit)
        .exec();
}

/**
 * Get recent audit logs
 */
export async function getRecentAuditLogs(
    limit: number = 100,
    filters?: {
        action?: AuditAction;
        collectionName?: string;
    }
) {
    const query: Record<string, any> = {};
    if (filters?.action) query.action = filters.action;
    if (filters?.collectionName) query.collectionName = filters.collectionName;

    return AuditLog.find(query)
        .sort({ performedAt: -1 })
        .limit(limit)
        .exec();
}
