/**
 * Migration: Add Soft Delete Fields to All Collections
 * 
 * This migration adds isDeleted, deletedAt, and deletedBy fields
 * to all existing documents in the database.
 */

module.exports = {
    async up(db) {
        console.log('🚀 Starting migration: Add soft delete fields');
        
        const collections = [
            'users',
            'sections',
            'courses',
            'students',
            'attendancerecords',
            'attendancesessions',
            'announcements'
        ];
        
        for (const collectionName of collections) {
            try {
                const collection = db.collection(collectionName);
                
                // Check if collection exists
                const exists = await collection.countDocuments({});
                console.log(`📦 Collection ${collectionName}: ${exists} documents found`);
                
                // Update all documents to add soft delete fields
                const result = await collection.updateMany(
                    { isDeleted: { $exists: false } },
                    {
                        $set: {
                            isDeleted: false,
                            deletedAt: null,
                            deletedBy: null
                        }
                    }
                );
                
                console.log(`✅ ${collectionName}: Updated ${result.modifiedCount} documents`);
                
                // Create index on isDeleted field for performance
                await collection.createIndex(
                    { isDeleted: 1 },
                    { name: 'idx_isDeleted', background: true }
                );
                console.log(`📇 ${collectionName}: Created isDeleted index`);
                
            } catch (error) {
                console.error(`❌ Error updating ${collectionName}:`, error.message);
            }
        }
        
        console.log('✅ Migration completed: Soft delete fields added');
    },
    
    async down(db) {
        console.log('🔄 Rolling back migration: Remove soft delete fields');
        
        const collections = [
            'users',
            'sections',
            'courses',
            'students',
            'attendancerecords',
            'attendancesessions',
            'announcements'
        ];
        
        for (const collectionName of collections) {
            try {
                const collection = db.collection(collectionName);
                
                // Remove soft delete fields
                const result = await collection.updateMany(
                    {},
                    {
                        $unset: {
                            isDeleted: '',
                            deletedAt: '',
                            deletedBy: ''
                        }
                    }
                );
                
                console.log(`✅ ${collectionName}: Rolled back ${result.modifiedCount} documents`);
                
                // Drop the index
                try {
                    await collection.dropIndex('idx_isDeleted');
                    console.log(`📇 ${collectionName}: Dropped isDeleted index`);
                } catch (e) {
                    // Index might not exist
                }
                
            } catch (error) {
                console.error(`❌ Error rolling back ${collectionName}:`, error.message);
            }
        }
        
        console.log('✅ Rollback completed');
    }
};
