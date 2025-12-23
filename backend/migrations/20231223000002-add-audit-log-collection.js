/**
 * Migration: Create Audit Log Collection
 * 
 * This migration creates an audit_logs collection for tracking
 * all database operations including soft deletes and restores.
 */

module.exports = {
    async up(db) {
        console.log('🚀 Starting migration: Create audit log collection');
        
        try {
            // Create audit_logs collection with schema validation
            await db.createCollection('audit_logs', {
                validator: {
                    $jsonSchema: {
                        bsonType: 'object',
                        required: ['action', 'collectionName', 'documentId', 'performedBy', 'performedAt'],
                        properties: {
                            action: {
                                bsonType: 'string',
                                enum: ['create', 'update', 'delete', 'soft_delete', 'restore', 'bulk_delete', 'bulk_update'],
                                description: 'Type of action performed'
                            },
                            collectionName: {
                                bsonType: 'string',
                                description: 'Name of the collection affected'
                            },
                            documentId: {
                                bsonType: ['string', 'objectId'],
                                description: 'ID of the document affected'
                            },
                            performedBy: {
                                bsonType: ['string', 'objectId'],
                                description: 'User ID who performed the action'
                            },
                            performedAt: {
                                bsonType: 'date',
                                description: 'Timestamp of the action'
                            },
                            previousData: {
                                bsonType: 'object',
                                description: 'Previous state of the document'
                            },
                            newData: {
                                bsonType: 'object',
                                description: 'New state of the document'
                            },
                            ipAddress: {
                                bsonType: 'string',
                                description: 'IP address of the user'
                            },
                            userAgent: {
                                bsonType: 'string',
                                description: 'User agent string'
                            },
                            metadata: {
                                bsonType: 'object',
                                description: 'Additional metadata'
                            }
                        }
                    }
                }
            });
            
            console.log('✅ Created audit_logs collection with validation');
            
            // Create indexes for efficient querying
            const auditLogs = db.collection('audit_logs');
            
            await auditLogs.createIndex(
                { performedAt: -1 },
                { name: 'idx_performedAt', background: true }
            );
            
            await auditLogs.createIndex(
                { collectionName: 1, performedAt: -1 },
                { name: 'idx_collection_time', background: true }
            );
            
            await auditLogs.createIndex(
                { performedBy: 1, performedAt: -1 },
                { name: 'idx_user_time', background: true }
            );
            
            await auditLogs.createIndex(
                { action: 1, performedAt: -1 },
                { name: 'idx_action_time', background: true }
            );
            
            await auditLogs.createIndex(
                { documentId: 1 },
                { name: 'idx_documentId', background: true }
            );
            
            // TTL index to auto-delete logs older than 1 year (optional)
            await auditLogs.createIndex(
                { performedAt: 1 },
                { 
                    name: 'idx_ttl_1year',
                    expireAfterSeconds: 365 * 24 * 60 * 60, // 1 year
                    background: true 
                }
            );
            
            console.log('✅ Created indexes for audit_logs');
            
        } catch (error) {
            if (error.code === 48) {
                console.log('⚠️ Collection audit_logs already exists');
            } else {
                throw error;
            }
        }
        
        console.log('✅ Migration completed: Audit log collection created');
    },
    
    async down(db) {
        console.log('🔄 Rolling back migration: Drop audit log collection');
        
        try {
            await db.dropCollection('audit_logs');
            console.log('✅ Dropped audit_logs collection');
        } catch (error) {
            if (error.code === 26) {
                console.log('⚠️ Collection audit_logs does not exist');
            } else {
                throw error;
            }
        }
        
        console.log('✅ Rollback completed');
    }
};
