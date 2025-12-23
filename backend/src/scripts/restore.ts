/**
 * Database Restore Script
 * 
 * Run this script to restore the database from a backup.
 * 
 * Usage:
 *   npm run restore -- --backup-id=backup-2023-12-23T10-00-00-000Z-abc123
 *   npm run restore -- --backup-id=backup-xxx --collections=users,students
 *   npm run restore -- --backup-id=backup-xxx --drop  # Drop existing data first
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { restoreFromJSONBackup, listBackups } from '../utils/backupService';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cr-attendance-portal';

interface RestoreOptions {
    backupId?: string;
    collections?: string[];
    dropExisting: boolean;
}

function parseArgs(): RestoreOptions {
    const args = process.argv.slice(2);
    const options: RestoreOptions = {
        dropExisting: false,
    };

    for (const arg of args) {
        if (arg.startsWith('--backup-id=')) {
            options.backupId = arg.split('=')[1];
        } else if (arg.startsWith('--collections=')) {
            options.collections = arg.split('=')[1]?.split(',');
        } else if (arg === '--drop') {
            options.dropExisting = true;
        }
    }

    return options;
}

async function runRestore() {
    console.log('═'.repeat(60));
    console.log('🔄 CR Attendance Portal - Database Restore');
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

        if (!options.backupId) {
            // List available backups
            console.log('📋 Available Backups:');
            console.log('');
            const backups = await listBackups({ status: 'completed', limit: 10 });
            
            if (backups.length === 0) {
                console.log('   No completed backups found.');
            } else {
                for (const b of backups) {
                    console.log(`   📦 ${b.backupId}`);
                    console.log(`      Created: ${b.startedAt.toISOString()}`);
                    console.log(`      Size: ${formatBytes(b.fileSize || 0)}`);
                    console.log(`      Collections: ${b.collections?.join(', ') || 'all'}`);
                    console.log('');
                }
            }
            
            console.log('');
            console.log('Usage: npm run restore -- --backup-id=<backup-id>');
            process.exit(0);
        }

        // Confirm restore operation
        console.log('⚠️  WARNING: This will restore data from backup!');
        console.log(`   Backup ID: ${options.backupId}`);
        if (options.collections) {
            console.log(`   Collections: ${options.collections.join(', ')}`);
        }
        if (options.dropExisting) {
            console.log('   ⚠️  DROP EXISTING DATA: Yes');
        }
        console.log('');

        // Perform restore
        console.log('🚀 Starting restore...');
        console.log('');

        await restoreFromJSONBackup(options.backupId, {
            collections: options.collections,
            dropExisting: options.dropExisting,
        });

        console.log('');
        console.log('✅ Restore completed successfully!');

    } catch (error) {
        console.error('');
        console.error('❌ Restore failed:', error);
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

// Run the restore
runRestore();
