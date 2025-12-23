/**
 * Migration: Create Backup Metadata Collection
 * 
 * This migration creates a backup_metadata collection for tracking
 * database backups and their status.
 */

module.exports = {
    async up(db) {
        console.log('🚀 Starting migration: Create backup metadata collection');
        
        try {
            // Create backup_metadata collection
            await db.createCollection('backup_metadata', {
                validator: {
                    $jsonSchema: {
                        bsonType: 'object',
                        required: ['backupId', 'type', 'status', 'startedAt'],
                        properties: {
                            backupId: {
                                bsonType: 'string',
                                description: 'Unique backup identifier'
                            },
                            type: {
                                bsonType: 'string',
                                enum: ['full', 'incremental', 'collections', 'scheduled', 'manual'],
                                description: 'Type of backup'
                            },
                            status: {
                                bsonType: 'string',
                                enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
                                description: 'Status of the backup'
                            },
                            startedAt: {
                                bsonType: 'date',
                                description: 'When the backup started'
                            },
                            completedAt: {
                                bsonType: 'date',
                                description: 'When the backup completed'
                            },
                            filePath: {
                                bsonType: 'string',
                                description: 'Path to the backup file'
                            },
                            fileSize: {
                                bsonType: 'long',
                                description: 'Size of the backup file in bytes'
                            },
                            collections: {
                                bsonType: 'array',
                                description: 'Collections included in backup'
                            },
                            documentCount: {
                                bsonType: 'object',
                                description: 'Document count per collection'
                            },
                            checksum: {
                                bsonType: 'string',
                                description: 'MD5 checksum of backup file'
                            },
                            errorMessage: {
                                bsonType: 'string',
                                description: 'Error message if backup failed'
                            },
                            triggeredBy: {
                                bsonType: 'string',
                                enum: ['scheduler', 'manual', 'api'],
                                description: 'What triggered the backup'
                            },
                            performedBy: {
                                bsonType: ['string', 'objectId', 'null'],
                                description: 'User who initiated manual backup'
                            },
                            retentionDays: {
                                bsonType: 'int',
                                description: 'Number of days to retain this backup'
                            },
                            isEncrypted: {
                                bsonType: 'bool',
                                description: 'Whether backup is encrypted'
                            },
                            compressionType: {
                                bsonType: 'string',
                                enum: ['none', 'gzip', 'zip'],
                                description: 'Compression type used'
                            },
                            metadata: {
                                bsonType: 'object',
                                description: 'Additional metadata'
                            }
                        }
                    }
                }
            });
            
            console.log('✅ Created backup_metadata collection with validation');
            
            // Create indexes
            const backupMetadata = db.collection('backup_metadata');
            
            await backupMetadata.createIndex(
                { backupId: 1 },
                { name: 'idx_backupId', unique: true, background: true }
            );
            
            await backupMetadata.createIndex(
                { startedAt: -1 },
                { name: 'idx_startedAt', background: true }
            );
            
            await backupMetadata.createIndex(
                { status: 1, startedAt: -1 },
                { name: 'idx_status_time', background: true }
            );
            
            await backupMetadata.createIndex(
                { type: 1, startedAt: -1 },
                { name: 'idx_type_time', background: true }
            );
            
            console.log('✅ Created indexes for backup_metadata');
            
        } catch (error) {
            if (error.code === 48) {
                console.log('⚠️ Collection backup_metadata already exists');
            } else {
                throw error;
            }
        }
        
        console.log('✅ Migration completed: Backup metadata collection created');
    },
    
    async down(db) {
        console.log('🔄 Rolling back migration: Drop backup metadata collection');
        
        try {
            await db.dropCollection('backup_metadata');
            console.log('✅ Dropped backup_metadata collection');
        } catch (error) {
            if (error.code === 26) {
                console.log('⚠️ Collection backup_metadata does not exist');
            } else {
                throw error;
            }
        }
        
        console.log('✅ Rollback completed');
    }
};
