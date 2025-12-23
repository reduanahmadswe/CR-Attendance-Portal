/**
 * Run Database Migrations
 * 
 * This script runs pending database migrations.
 * 
 * Usage:
 *   npm run migrate           # Run all pending migrations
 *   npm run migrate:status    # Check migration status
 *   npm run migrate:down      # Rollback last migration
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cr-attendance-portal';
const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');
const CHANGELOG_COLLECTION = 'migrations_changelog';

interface MigrationEntry {
    fileName: string;
    appliedAt: Date;
}

async function getMigrationsCollection() {
    return mongoose.connection.db.collection(CHANGELOG_COLLECTION);
}

async function getAppliedMigrations(): Promise<string[]> {
    const collection = await getMigrationsCollection();
    const entries = await collection.find({}).sort({ appliedAt: 1 }).toArray();
    return entries.map((e) => e.fileName);
}

async function getPendingMigrations(): Promise<string[]> {
    const applied = await getAppliedMigrations();
    const files = fs.readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.js'))
        .sort();
    return files.filter((f) => !applied.includes(f));
}

async function runMigration(fileName: string, direction: 'up' | 'down') {
    const filePath = path.join(MIGRATIONS_DIR, fileName);
    const migration = require(filePath);

    console.log(`${direction === 'up' ? '⬆️' : '⬇️'} Running ${direction}: ${fileName}`);

    const db = mongoose.connection.db;
    await migration[direction](db);

    const collection = await getMigrationsCollection();

    if (direction === 'up') {
        await collection.insertOne({
            fileName,
            appliedAt: new Date(),
        });
    } else {
        await collection.deleteOne({ fileName });
    }

    console.log(`✅ Completed: ${fileName}`);
}

async function migrateUp() {
    const pending = await getPendingMigrations();

    if (pending.length === 0) {
        console.log('✅ No pending migrations');
        return;
    }

    console.log(`📋 Found ${pending.length} pending migration(s)`);
    console.log('');

    for (const fileName of pending) {
        await runMigration(fileName, 'up');
    }

    console.log('');
    console.log('✅ All migrations completed');
}

async function migrateDown() {
    const applied = await getAppliedMigrations();

    if (applied.length === 0) {
        console.log('✅ No migrations to rollback');
        return;
    }

    const lastMigration = applied[applied.length - 1];
    if (!lastMigration) {
        console.log('✅ No migrations to rollback');
        return;
    }
    
    console.log(`📋 Rolling back: ${lastMigration}`);
    console.log('');

    await runMigration(lastMigration, 'down');

    console.log('');
    console.log('✅ Rollback completed');
}

async function showStatus() {
    const applied = await getAppliedMigrations();
    const pending = await getPendingMigrations();

    console.log('📊 Migration Status');
    console.log('═'.repeat(50));
    console.log('');

    console.log('✅ Applied Migrations:');
    if (applied.length === 0) {
        console.log('   (none)');
    } else {
        for (const fileName of applied) {
            console.log(`   ✓ ${fileName}`);
        }
    }
    console.log('');

    console.log('⏳ Pending Migrations:');
    if (pending.length === 0) {
        console.log('   (none)');
    } else {
        for (const fileName of pending) {
            console.log(`   • ${fileName}`);
        }
    }
    console.log('');
}

async function main() {
    const command = process.argv[2] || 'up';

    console.log('═'.repeat(60));
    console.log('🔄 CR Attendance Portal - Database Migrations');
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

        switch (command) {
            case 'up':
                await migrateUp();
                break;
            case 'down':
                await migrateDown();
                break;
            case 'status':
                await showStatus();
                break;
            default:
                console.log('Unknown command. Available commands: up, down, status');
        }

    } catch (error) {
        console.error('');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('');
        console.log('🔌 Disconnected from MongoDB');
        console.log('═'.repeat(60));
    }
}

main();
