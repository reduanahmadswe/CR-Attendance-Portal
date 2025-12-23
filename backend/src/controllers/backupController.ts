import { Request, Response } from 'express';
import {
    createJSONBackup,
    listBackups,
    getBackupStats,
    cleanupOldBackups,
    restoreFromJSONBackup,
} from '../utils/backupService';
import { BackupMetadata } from '../models/BackupMetadata';
import { ApiResponse } from '../types';
import { AppError, asyncHandler } from '../utils/errorHandler';
import fs from 'fs';
import path from 'path';

/**
 * Create a new backup
 * POST /api/admin/backups
 */
export const createBackup = asyncHandler(async (req: Request, res: Response) => {
    const { type = 'manual', collections, retentionDays } = req.body;
    const performedBy = req.user?.userId || 'system';

    const backup = await createJSONBackup({
        type,
        triggeredBy: 'api',
        performedBy,
        collections,
        retentionDays,
    });

    const response: ApiResponse<any> = {
        success: true,
        data: backup,
        message: 'Backup created successfully',
    };

    res.status(201).json(response);
});

/**
 * Get all backups
 * GET /api/admin/backups
 */
export const getBackups = asyncHandler(async (req: Request, res: Response) => {
    const { status, type, limit } = req.query;

    const backups = await listBackups({
        status: status as any,
        type: type as any,
        limit: limit ? parseInt(limit as string, 10) : 50,
    });

    const response: ApiResponse<any> = {
        success: true,
        data: backups,
    };

    res.status(200).json(response);
});

/**
 * Get backup statistics
 * GET /api/admin/backups/stats
 */
export const getStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await getBackupStats();

    const response: ApiResponse<any> = {
        success: true,
        data: stats,
    };

    res.status(200).json(response);
});

/**
 * Get a single backup by ID
 * GET /api/admin/backups/:backupId
 */
export const getBackup = asyncHandler(async (req: Request, res: Response) => {
    const { backupId } = req.params;

    const backup = await BackupMetadata.findOne({ backupId });

    if (!backup) {
        throw new AppError('Backup not found', 404);
    }

    const response: ApiResponse<any> = {
        success: true,
        data: backup,
    };

    res.status(200).json(response);
});

/**
 * Download a backup file
 * GET /api/admin/backups/:backupId/download
 */
export const downloadBackup = asyncHandler(async (req: Request, res: Response) => {
    const { backupId } = req.params;

    const backup = await BackupMetadata.findOne({ backupId });

    if (!backup) {
        throw new AppError('Backup not found', 404);
    }

    if (backup.status !== 'completed' || !backup.filePath) {
        throw new AppError('Backup file not available', 400);
    }

    if (!fs.existsSync(backup.filePath)) {
        throw new AppError('Backup file not found on disk', 404);
    }

    const fileName = path.basename(backup.filePath);
    res.download(backup.filePath, fileName);
});

/**
 * Restore from a backup
 * POST /api/admin/backups/:backupId/restore
 */
export const restoreBackup = asyncHandler(async (req: Request, res: Response) => {
    const { backupId } = req.params;
    const { collections, dropExisting } = req.body;
    const performedBy = req.user?.userId || 'system';

    if (!backupId) {
        throw new AppError('Backup ID is required', 400);
    }

    await restoreFromJSONBackup(backupId, {
        collections,
        dropExisting,
        performedBy,
    });

    const response: ApiResponse<any> = {
        success: true,
        message: 'Restore completed successfully',
    };

    res.status(200).json(response);
});

/**
 * Delete a backup
 * DELETE /api/admin/backups/:backupId
 */
export const deleteBackup = asyncHandler(async (req: Request, res: Response) => {
    const { backupId } = req.params;

    const backup = await BackupMetadata.findOne({ backupId });

    if (!backup) {
        throw new AppError('Backup not found', 404);
    }

    // Delete file if exists
    if (backup.filePath && fs.existsSync(backup.filePath)) {
        fs.unlinkSync(backup.filePath);
    }

    // Delete metadata
    await backup.deleteOne();

    const response: ApiResponse<any> = {
        success: true,
        message: 'Backup deleted successfully',
    };

    res.status(200).json(response);
});

/**
 * Cleanup old backups
 * POST /api/admin/backups/cleanup
 */
export const cleanupBackups = asyncHandler(async (req: Request, res: Response) => {
    const deletedCount = await cleanupOldBackups();

    const response: ApiResponse<any> = {
        success: true,
        data: { deletedCount },
        message: `Cleaned up ${deletedCount} expired backups`,
    };

    res.status(200).json(response);
});
