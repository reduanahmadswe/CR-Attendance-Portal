/**
 * Database Backup Script
 * 
 * Run this script to create a manual backup of the database.
 * Can also be scheduled via cron job or Windows Task Scheduler.
 * 
 * Usage:
 *   npm run backup              # Create full backup
 *   npm run backup -- --type=full
 *   npm run backup -- --collections=users,students
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { createJSONBackup, cleanupOldBackups, getBackupStats, listBackups } from '../utils/backupService';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cr-attendance-portal';

interface BackupOptions {
    type: 'full' | 'collections';
    collections?: string[];
    cleanup: boolean;
}

function parseArgs(): BackupOptions {
    const args = process.argv.slice(2);
    const options: BackupOptions = {
        type: 'full',
        cleanup: true,
    };

    for (const arg of args) {
        if (arg.startsWith('--type=')) {
            const type = arg.split('=')[1];
            if (type === 'full' || type === 'collections') {
                options.type = type;
            }
        } else if (arg.startsWith('--collections=')) {
            options.collections = arg.split('=')[1]?.split(',');
            options.type = 'collections';
        } else if (arg === '--no-cleanup') {
            options.cleanup = false;
        }
    }

    return options;
}

async function runBackup() {
    console.log('═'.repeat(60));
    console.log('📦 CR Attendance Portal - Database Backup');
    console.log('═'.repeat(60));
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log('');

    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        console.log(`📁 Database: ${mongoose.connection.db.databaseName}`);
        console.log('');

        const options = parseArgs();

        // Show current stats
        const statsBefore = await getBackupStats();
        console.log('📊 Current Backup Statistics:');
        console.log(`   Total Backups: ${statsBefore.totalBackups}`);
        console.log(`   Completed: ${statsBefore.completedBackups}`);
        console.log(`   Failed: ${statsBefore.failedBackups}`);
        console.log(`   Total Size: ${formatBytes(statsBefore.totalSize)}`);
        if (statsBefore.lastBackup) {
            console.log(`   Last Backup: ${statsBefore.lastBackup.toISOString()}`);
        }
        console.log('');

        // Create backup
        console.log('🚀 Creating backup...');
        console.log(`   Type: ${options.type}`);
        if (options.collections) {
            console.log(`   Collections: ${options.collections.join(', ')}`);
        }
        console.log('');

        const backup = await createJSONBackup({
            type: options.type,
            triggeredBy: 'manual',
            collections: options.collections,
        });

        console.log('');
        console.log('✅ Backup created successfully!');
        console.log(`   Backup ID: ${backup.backupId}`);
        console.log(`   File: ${backup.filePath}`);
        console.log(`   Size: ${formatBytes(backup.fileSize || 0)}`);
        console.log(`   Checksum: ${backup.checksum}`);
        console.log('');

        // Cleanup old backups
        if (options.cleanup) {
            console.log('🧹 Cleaning up old backups...');
            const deletedCount = await cleanupOldBackups();
            console.log(`   Deleted ${deletedCount} expired backups`);
            console.log('');
        }

        // List recent backups
        console.log('📋 Recent Backups:');
        const recentBackups = await listBackups({ limit: 5 });
        for (const b of recentBackups) {
            const status = b.status === 'completed' ? '✅' : b.status === 'failed' ? '❌' : '⏳';
            console.log(`   ${status} ${b.backupId} - ${b.startedAt.toISOString()} - ${formatBytes(b.fileSize || 0)}`);
        }

    } catch (error) {
        console.error('');
        console.error('❌ Backup failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('');
        console.log('🔌 Disconnected from MongoDB');
        console.log('═'.repeat(60));
        console.log(`⏰ Completed at: ${new Date().toISOString()}`);
        console.log('═'.repeat(60));
    }
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the backup
runBackup();
