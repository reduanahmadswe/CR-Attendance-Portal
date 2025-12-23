import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import archiver from 'archiver';
import { BackupMetadata, IBackupMetadata, BackupType, BackupStatus, TriggerType, CompressionType } from '../models/BackupMetadata';
import { AuditLog } from '../models/AuditLog';

const execAsync = promisify(exec);

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
const DEFAULT_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);
const MONGODB_URI = process.env.MONGODB_URI || '';

// Collections to backup
const COLLECTIONS_TO_BACKUP = [
    'users',
    'sections',
    'courses',
    'students',
    'attendancerecords',
    'attendancesessions',
    'announcements',
    'audit_logs'
];

/**
 * Ensure backup directory exists
 */
export function ensureBackupDir(): string {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    return BACKUP_DIR;
}

/**
 * Generate unique backup ID
 */
export function generateBackupId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = crypto.randomBytes(4).toString('hex');
    return `backup-${timestamp}-${random}`;
}

/**
 * Calculate MD5 checksum of a file
 */
export async function calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(filePath);
        
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

/**
 * Get document counts for all collections
 */
export async function getDocumentCounts(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    
    for (const collectionName of COLLECTIONS_TO_BACKUP) {
        try {
            const collection = mongoose.connection.db.collection(collectionName);
            counts[collectionName] = await collection.countDocuments({});
        } catch (error) {
            counts[collectionName] = 0;
        }
    }
    
    return counts;
}

/**
 * Export a collection to JSON
 */
async function exportCollectionToJSON(collectionName: string, outputDir: string): Promise<number> {
    const collection = mongoose.connection.db.collection(collectionName);
    const documents = await collection.find({}).toArray();
    
    const filePath = path.join(outputDir, `${collectionName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
    
    return documents.length;
}

/**
 * Create a JSON-based backup (Node.js native approach)
 */
export async function createJSONBackup(options: {
    type?: BackupType;
    triggeredBy?: TriggerType;
    performedBy?: string;
    retentionDays?: number;
    collections?: string[];
}): Promise<IBackupMetadata> {
    const backupId = generateBackupId();
    const startTime = new Date();
    
    // Create backup metadata record
    const metadata = await BackupMetadata.create({
        backupId,
        type: options.type || 'full',
        status: 'in_progress' as BackupStatus,
        startedAt: startTime,
        triggeredBy: options.triggeredBy || 'manual',
        performedBy: options.performedBy,
        retentionDays: options.retentionDays || DEFAULT_RETENTION_DAYS,
        isEncrypted: false,
        compressionType: 'zip' as CompressionType,
        collections: options.collections || COLLECTIONS_TO_BACKUP,
    });
    
    const backupDir = ensureBackupDir();
    const tempDir = path.join(backupDir, `temp-${backupId}`);
    const zipFilePath = path.join(backupDir, `${backupId}.zip`);
    
    try {
        // Create temp directory
        fs.mkdirSync(tempDir, { recursive: true });
        
        // Export each collection
        const documentCount: Record<string, number> = {};
        const collectionsToExport = options.collections || COLLECTIONS_TO_BACKUP;
        
        console.log(`📦 Starting backup: ${backupId}`);
        
        for (const collectionName of collectionsToExport) {
            try {
                const count = await exportCollectionToJSON(collectionName, tempDir);
                documentCount[collectionName] = count;
                console.log(`  ✅ ${collectionName}: ${count} documents`);
            } catch (error) {
                console.warn(`  ⚠️ ${collectionName}: Failed to export`, error);
                documentCount[collectionName] = 0;
            }
        }
        
        // Create backup info file
        const backupInfo = {
            backupId,
            createdAt: startTime.toISOString(),
            database: mongoose.connection.db.databaseName,
            collections: collectionsToExport,
            documentCount,
            version: '1.0.0',
        };
        fs.writeFileSync(
            path.join(tempDir, 'backup-info.json'),
            JSON.stringify(backupInfo, null, 2)
        );
        
        // Create ZIP archive
        await createZipArchive(tempDir, zipFilePath);
        
        // Calculate file size and checksum
        const stats = fs.statSync(zipFilePath);
        const checksum = await calculateChecksum(zipFilePath);
        
        // Cleanup temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });
        
        // Update metadata with success
        metadata.status = 'completed';
        metadata.completedAt = new Date();
        metadata.filePath = zipFilePath;
        metadata.fileSize = stats.size;
        metadata.documentCount = documentCount;
        metadata.checksum = checksum;
        await metadata.save();
        
        console.log(`✅ Backup completed: ${zipFilePath} (${formatBytes(stats.size)})`);
        
        // Log to audit
        await AuditLog.logAction(
            'create',
            'backup_metadata',
            backupId,
            options.performedBy || 'system',
            { newData: { backupId, filePath: zipFilePath, fileSize: stats.size } }
        );
        
        return metadata;
        
    } catch (error) {
        // Cleanup on failure
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        if (fs.existsSync(zipFilePath)) {
            fs.unlinkSync(zipFilePath);
        }
        
        // Update metadata with failure
        metadata.status = 'failed';
        metadata.completedAt = new Date();
        metadata.errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await metadata.save();
        
        console.error(`❌ Backup failed: ${error}`);
        throw error;
    }
}

/**
 * Create ZIP archive from directory
 */
function createZipArchive(sourceDir: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', () => resolve());
        archive.on('error', reject);
        
        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

/**
 * Create a mongodump-based backup (requires mongodump CLI)
 */
export async function createMongoDumpBackup(options: {
    type?: BackupType;
    triggeredBy?: TriggerType;
    performedBy?: string;
    retentionDays?: number;
}): Promise<IBackupMetadata | null> {
    const backupId = generateBackupId();
    const startTime = new Date();
    const backupDir = ensureBackupDir();
    const outputPath = path.join(backupDir, backupId);
    
    // Create backup metadata record
    const metadata = await BackupMetadata.create({
        backupId,
        type: options.type || 'full',
        status: 'in_progress' as BackupStatus,
        startedAt: startTime,
        triggeredBy: options.triggeredBy || 'manual',
        performedBy: options.performedBy,
        retentionDays: options.retentionDays || DEFAULT_RETENTION_DAYS,
        isEncrypted: false,
        compressionType: 'gzip' as CompressionType,
        collections: COLLECTIONS_TO_BACKUP,
    });
    
    try {
        // Build mongodump command
        const mongodumpCmd = `mongodump --uri="${MONGODB_URI}" --out="${outputPath}" --gzip`;
        
        console.log(`📦 Starting mongodump backup: ${backupId}`);
        await execAsync(mongodumpCmd);
        
        // Get document counts
        const documentCount = await getDocumentCounts();
        
        // Create tar.gz archive
        const archivePath = `${outputPath}.tar.gz`;
        await execAsync(`tar -czvf "${archivePath}" -C "${backupDir}" "${backupId}"`);
        
        // Get file stats
        const stats = fs.statSync(archivePath);
        const checksum = await calculateChecksum(archivePath);
        
        // Cleanup raw dump directory
        fs.rmSync(outputPath, { recursive: true, force: true });
        
        // Update metadata
        metadata.status = 'completed';
        metadata.completedAt = new Date();
        metadata.filePath = archivePath;
        metadata.fileSize = stats.size;
        metadata.documentCount = documentCount;
        metadata.checksum = checksum;
        await metadata.save();
        
        console.log(`✅ Mongodump backup completed: ${archivePath}`);
        
        return metadata;
        
    } catch (error) {
        // Mongodump not available, fall back to JSON backup
        if ((error as any).message?.includes('mongodump')) {
            console.log('⚠️ mongodump not available, falling back to JSON backup');
            metadata.status = 'cancelled';
            metadata.errorMessage = 'mongodump not available';
            await metadata.save();
            return null;
        }
        
        metadata.status = 'failed';
        metadata.completedAt = new Date();
        metadata.errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await metadata.save();
        
        throw error;
    }
}

/**
 * Restore from a JSON backup
 */
export async function restoreFromJSONBackup(backupId: string, options?: {
    collections?: string[];
    dropExisting?: boolean;
    performedBy?: string;
}): Promise<boolean> {
    const metadata = await BackupMetadata.findOne({ backupId });
    
    if (!metadata || metadata.status !== 'completed' || !metadata.filePath) {
        throw new Error(`Backup not found or not completed: ${backupId}`);
    }
    
    if (!fs.existsSync(metadata.filePath)) {
        throw new Error(`Backup file not found: ${metadata.filePath}`);
    }
    
    console.log(`🔄 Starting restore from backup: ${backupId}`);
    
    // Extract ZIP to temp directory
    const backupDir = ensureBackupDir();
    const tempDir = path.join(backupDir, `restore-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
        // Extract using archiver/unzipper
        await execAsync(`tar -xzf "${metadata.filePath}" -C "${tempDir}" 2>/dev/null || unzip -q "${metadata.filePath}" -d "${tempDir}"`);
        
        // Find JSON files
        const files = fs.readdirSync(tempDir);
        const collectionsToRestore = options?.collections || COLLECTIONS_TO_BACKUP;
        
        for (const collectionName of collectionsToRestore) {
            const jsonFile = path.join(tempDir, `${collectionName}.json`);
            
            if (fs.existsSync(jsonFile)) {
                const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
                const collection = mongoose.connection.db.collection(collectionName);
                
                if (options?.dropExisting) {
                    await collection.deleteMany({});
                }
                
                if (data.length > 0) {
                    await collection.insertMany(data);
                    console.log(`  ✅ ${collectionName}: Restored ${data.length} documents`);
                }
            }
        }
        
        // Cleanup
        fs.rmSync(tempDir, { recursive: true, force: true });
        
        // Log to audit
        await AuditLog.logAction(
            'restore',
            'backup_metadata',
            backupId,
            options?.performedBy || 'system',
            { metadata: { collectionsRestored: collectionsToRestore } }
        );
        
        console.log(`✅ Restore completed from backup: ${backupId}`);
        return true;
        
    } catch (error) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.error(`❌ Restore failed: ${error}`);
        throw error;
    }
}

/**
 * List all backups with optional filters
 */
export async function listBackups(filters?: {
    status?: BackupStatus;
    type?: BackupType;
    limit?: number;
}): Promise<IBackupMetadata[]> {
    const query: Record<string, any> = {};
    
    if (filters?.status) query.status = filters.status;
    if (filters?.type) query.type = filters.type;
    
    return BackupMetadata.find(query)
        .sort({ startedAt: -1 })
        .limit(filters?.limit || 50)
        .exec();
}

/**
 * Delete old backups based on retention policy
 */
export async function cleanupOldBackups(): Promise<number> {
    const now = new Date();
    let deletedCount = 0;
    
    // Find expired backups
    const expiredBackups = await BackupMetadata.find({
        status: 'completed',
    });
    
    for (const backup of expiredBackups) {
        const expirationDate = new Date(backup.startedAt);
        expirationDate.setDate(expirationDate.getDate() + backup.retentionDays);
        
        if (now > expirationDate) {
            // Delete file if exists
            if (backup.filePath && fs.existsSync(backup.filePath)) {
                fs.unlinkSync(backup.filePath);
            }
            
            // Mark as deleted (soft delete the metadata)
            await backup.deleteOne();
            deletedCount++;
            
            console.log(`🗑️ Deleted expired backup: ${backup.backupId}`);
        }
    }
    
    return deletedCount;
}

/**
 * Get backup statistics
 */
export async function getBackupStats(): Promise<{
    totalBackups: number;
    completedBackups: number;
    failedBackups: number;
    totalSize: number;
    lastBackup: Date | null;
}> {
    const [stats] = await BackupMetadata.aggregate([
        {
            $group: {
                _id: null,
                totalBackups: { $sum: 1 },
                completedBackups: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                failedBackups: {
                    $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                },
                totalSize: { $sum: { $ifNull: ['$fileSize', 0] } },
                lastBackup: { $max: '$completedAt' }
            }
        }
    ]);
    
    return {
        totalBackups: stats?.totalBackups || 0,
        completedBackups: stats?.completedBackups || 0,
        failedBackups: stats?.failedBackups || 0,
        totalSize: stats?.totalSize || 0,
        lastBackup: stats?.lastBackup || null,
    };
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
