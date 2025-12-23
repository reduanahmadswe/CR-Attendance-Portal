/**
 * Migration: Add 2FA and password reset fields to users collection
 */

module.exports = {
    async up(db) {
        console.log('🚀 Starting migration: Add 2FA and password reset fields');

        // Add 2FA and password reset fields to all users
        const result = await db.collection('users').updateMany(
            {},
            {
                $set: {
                    twoFactorEnabled: false,
                },
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} users with 2FA fields`);

        // Create index for password reset token lookup
        await db.collection('users').createIndex(
            { passwordResetToken: 1 },
            { sparse: true, name: 'idx_password_reset_token' }
        );

        // Create index for password reset expiry cleanup
        await db.collection('users').createIndex(
            { passwordResetExpires: 1 },
            { sparse: true, expireAfterSeconds: 0, name: 'idx_password_reset_expires_ttl' }
        );

        console.log('✅ Created indexes for password reset fields');
        console.log('✅ Migration completed: 2FA and password reset fields added');
    },

    async down(db) {
        console.log('🔄 Starting rollback: Remove 2FA and password reset fields');

        // Remove 2FA and password reset fields
        await db.collection('users').updateMany(
            {},
            {
                $unset: {
                    twoFactorSecret: '',
                    twoFactorEnabled: '',
                    twoFactorBackupCodes: '',
                    passwordResetToken: '',
                    passwordResetExpires: '',
                },
            }
        );

        // Drop indexes
        try {
            await db.collection('users').dropIndex('idx_password_reset_token');
            await db.collection('users').dropIndex('idx_password_reset_expires_ttl');
        } catch (error) {
            console.log('Indexes may not exist, skipping drop');
        }

        console.log('✅ Rollback completed: 2FA and password reset fields removed');
    },
};
