/**
 * Automated Backup Scheduler
 * 
 * This module handles automated database backups on a schedule.
 * Uses a simple interval-based approach (no external cron library needed).
 * 
 * Can be started as a standalone process or imported into the main app.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { createJSONBackup, cleanupOldBackups, getBackupStats } from '../utils/backupService';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cr-attendance-portal';

// Backup schedule configuration
const BACKUP_CONFIG = {
    // Interval in milliseconds (default: 24 hours)
    interval: parseInt(process.env.BACKUP_INTERVAL_MS || String(24 * 60 * 60 * 1000), 10),
    
    // Time of day to run backup (24-hour format, e.g., "02:00" for 2 AM)
    scheduledTime: process.env.BACKUP_SCHEDULED_TIME || '02:00',
    
    // Retention period in days
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
    
    // Enable/disable scheduled backups
    enabled: process.env.BACKUP_ENABLED !== 'false',
};

let backupTimer: NodeJS.Timeout | null = null;
let isConnected = false;

/**
 * Calculate milliseconds until next scheduled time
 */
function getMillisecondsUntilScheduledTime(): number {
    const [hours, minutes] = BACKUP_CONFIG.scheduledTime.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date(now);
    
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    // If scheduled time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    return scheduledTime.getTime() - now.getTime();
}

/**
 * Run scheduled backup
 */
async function runScheduledBackup() {
    console.log('');
    console.log('═'.repeat(60));
    console.log('📅 Scheduled Backup Started');
    console.log('═'.repeat(60));
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    console.log('');

    try {
        // Create backup
        const backup = await createJSONBackup({
            type: 'scheduled',
            triggeredBy: 'scheduler',
            retentionDays: BACKUP_CONFIG.retentionDays,
        });

        console.log(`✅ Backup completed: ${backup.backupId}`);
        console.log(`   File: ${backup.filePath}`);
        console.log(`   Size: ${formatBytes(backup.fileSize || 0)}`);

        // Cleanup old backups
        console.log('');
        console.log('🧹 Cleaning up old backups...');
        const deletedCount = await cleanupOldBackups();
        console.log(`   Deleted ${deletedCount} expired backups`);

        // Show stats
        const stats = await getBackupStats();
        console.log('');
        console.log('📊 Backup Statistics:');
        console.log(`   Total: ${stats.totalBackups}`);
        console.log(`   Completed: ${stats.completedBackups}`);
        console.log(`   Total Size: ${formatBytes(stats.totalSize)}`);

    } catch (error) {
        console.error('❌ Scheduled backup failed:', error);
    }

    console.log('');
    console.log('═'.repeat(60));
    console.log(`📅 Next backup in ${formatDuration(BACKUP_CONFIG.interval)}`);
    console.log('═'.repeat(60));
}

/**
 * Start the backup scheduler
 */
export async function startBackupScheduler(): Promise<void> {
    if (!BACKUP_CONFIG.enabled) {
        console.log('⚠️ Backup scheduler is disabled');
        return;
    }

    console.log('🚀 Starting Backup Scheduler');
    console.log(`   Scheduled Time: ${BACKUP_CONFIG.scheduledTime}`);
    console.log(`   Interval: ${formatDuration(BACKUP_CONFIG.interval)}`);
    console.log(`   Retention: ${BACKUP_CONFIG.retentionDays} days`);
    console.log('');

    // Calculate time until first backup
    const msUntilFirstBackup = getMillisecondsUntilScheduledTime();
    console.log(`📅 First backup in ${formatDuration(msUntilFirstBackup)}`);

    // Schedule first backup
    backupTimer = setTimeout(async () => {
        await runScheduledBackup();

        // Set up recurring interval
        backupTimer = setInterval(async () => {
            await runScheduledBackup();
        }, BACKUP_CONFIG.interval);
    }, msUntilFirstBackup);
}

/**
 * Stop the backup scheduler
 */
export function stopBackupScheduler(): void {
    if (backupTimer) {
        clearTimeout(backupTimer);
        clearInterval(backupTimer);
        backupTimer = null;
        console.log('⏹️ Backup scheduler stopped');
    }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration in milliseconds to human readable
 */
function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
}

/**
 * Main function for standalone execution
 */
async function main() {
    console.log('═'.repeat(60));
    console.log('📦 CR Attendance Portal - Backup Scheduler');
    console.log('═'.repeat(60));
    console.log('');

    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        isConnected = true;
        console.log('✅ Connected to MongoDB');
        console.log(`📁 Database: ${mongoose.connection.db.databaseName}`);
        console.log('');

        // Start scheduler
        await startBackupScheduler();

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('');
            console.log('🛑 Shutting down...');
            stopBackupScheduler();
            if (isConnected) {
                await mongoose.disconnect();
                console.log('🔌 Disconnected from MongoDB');
            }
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('');
            console.log('🛑 Shutting down...');
            stopBackupScheduler();
            if (isConnected) {
                await mongoose.disconnect();
                console.log('🔌 Disconnected from MongoDB');
            }
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Failed to start backup scheduler:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}
