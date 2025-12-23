# Database Management Guide

This guide covers database migrations, soft delete functionality, and automated backups for the CR Attendance Portal.

## Table of Contents

1. [Database Migrations](#database-migrations)
2. [Soft Delete](#soft-delete)
3. [Automated Backups](#automated-backups)
4. [API Endpoints](#api-endpoints)

---

## Database Migrations

We use a custom migration system to manage database schema changes.

### Migration Commands

```bash
# Run all pending migrations
npm run migrate

# Check migration status
npm run migrate:status

# Rollback last migration
npm run migrate:down
```

### Creating a New Migration

Create a new file in `backend/migrations/` with the naming convention:
```
YYYYMMDDHHMMSS-description.js
```

Example: `20231223150000-add-new-field.js`

### Migration File Structure

```javascript
module.exports = {
    async up(db) {
        // Apply migration
        await db.collection('users').updateMany(
            {},
            { $set: { newField: 'default' } }
        );
    },
    
    async down(db) {
        // Rollback migration
        await db.collection('users').updateMany(
            {},
            { $unset: { newField: '' } }
        );
    }
};
```

### Available Migrations

| Migration | Description |
|-----------|-------------|
| `20231223000001-add-soft-delete-fields.js` | Adds isDeleted, deletedAt, deletedBy fields |
| `20231223000002-add-audit-log-collection.js` | Creates audit_logs collection |
| `20231223000003-add-backup-metadata-collection.js` | Creates backup_metadata collection |

---

## Soft Delete

Soft delete allows you to mark records as deleted without permanently removing them from the database.

### How It Works

When you delete a record:
- `isDeleted` is set to `true`
- `deletedAt` is set to the current timestamp
- `deletedBy` stores the user ID who performed the deletion

### Affected Models

All main models support soft delete:
- User
- Section
- Course
- Student
- AttendanceRecord
- Announcement

### Usage

#### Soft Delete a Document
```typescript
// Via instance method
const section = await Section.findById(id);
await section.softDelete(userId);

// Via API
DELETE /api/sections/:id  // Soft delete (default)
DELETE /api/sections/:id?permanent=true  // Hard delete
```

#### Restore a Soft-Deleted Document
```typescript
// Via instance method
const section = await Section.findOne({ _id: id, isDeleted: true, includeDeleted: true });
await section.restore();

// Via API
POST /api/sections/:id/restore
```

#### Query Including Deleted Documents
```typescript
// Find all including deleted
const sections = await (Section as any).findWithDeleted();

// Find only deleted
const deletedSections = await (Section as any).findDeleted();

// Include deleted in regular query
const sections = await Section.find({ includeDeleted: true });
```

### API Endpoints for Soft Delete

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sections/:id` | DELETE | Soft delete section |
| `/api/sections/:id?permanent=true` | DELETE | Hard delete section |
| `/api/sections/:id/restore` | POST | Restore deleted section |
| `/api/sections/deleted` | GET | Get all deleted sections |

---

## Automated Backups

### Backup Commands

```bash
# Create a manual backup
npm run backup

# Create backup of specific collections
npm run backup -- --collections=users,students

# Start the backup scheduler (runs in background)
npm run backup:scheduler

# List available backups and restore
npm run restore

# Restore from specific backup
npm run restore -- --backup-id=backup-xxx
```

### Backup Configuration

Set these environment variables:

```env
# Backup directory (default: ./backups)
BACKUP_DIR=/path/to/backups

# Retention period in days (default: 30)
BACKUP_RETENTION_DAYS=30

# Enable/disable scheduled backups (default: true)
BACKUP_ENABLED=true

# Scheduled backup time (24-hour format, default: 02:00)
BACKUP_SCHEDULED_TIME=02:00

# Backup interval in milliseconds (default: 24 hours)
BACKUP_INTERVAL_MS=86400000
```

### Backup Types

| Type | Description |
|------|-------------|
| `full` | Complete database backup |
| `collections` | Backup specific collections |
| `scheduled` | Automated scheduled backup |
| `manual` | Manual backup via CLI or API |

### Backup Storage

Backups are stored as ZIP files containing:
- JSON files for each collection
- `backup-info.json` with metadata

Example backup structure:
```
backup-2023-12-23T02-00-00-000Z-abc123.zip
├── users.json
├── sections.json
├── courses.json
├── students.json
├── attendancerecords.json
├── announcements.json
├── audit_logs.json
└── backup-info.json
```

### Automatic Cleanup

Old backups are automatically deleted based on the retention policy. You can also manually trigger cleanup:

```bash
# Via API
POST /api/admin/backups/cleanup
```

---

## API Endpoints

### Backup Management (Admin Only)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/backups` | POST | Create new backup |
| `/api/admin/backups` | GET | List all backups |
| `/api/admin/backups/stats` | GET | Get backup statistics |
| `/api/admin/backups/cleanup` | POST | Clean up expired backups |
| `/api/admin/backups/:backupId` | GET | Get backup details |
| `/api/admin/backups/:backupId/download` | GET | Download backup file |
| `/api/admin/backups/:backupId/restore` | POST | Restore from backup |
| `/api/admin/backups/:backupId` | DELETE | Delete backup |

### Example API Requests

#### Create Backup
```bash
curl -X POST http://localhost:5000/api/admin/backups \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type": "full", "retentionDays": 30}'
```

#### List Backups
```bash
curl http://localhost:5000/api/admin/backups?status=completed&limit=10 \
  -H "Authorization: Bearer <token>"
```

#### Get Backup Statistics
```bash
curl http://localhost:5000/api/admin/backups/stats \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "success": true,
  "data": {
    "totalBackups": 15,
    "completedBackups": 14,
    "failedBackups": 1,
    "totalSize": 52428800,
    "lastBackup": "2023-12-23T02:00:00.000Z"
  }
}
```

#### Restore from Backup
```bash
curl -X POST http://localhost:5000/api/admin/backups/backup-xxx/restore \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"collections": ["users", "students"], "dropExisting": false}'
```

---

## Audit Logging

All database operations are automatically logged to the `audit_logs` collection.

### Logged Actions

- `create` - New document created
- `update` - Document updated
- `delete` - Document permanently deleted
- `soft_delete` - Document soft deleted
- `restore` - Soft-deleted document restored
- `login` - User login
- `logout` - User logout
- `password_change` - Password changed

### Audit Log Structure

```json
{
  "action": "soft_delete",
  "collectionName": "sections",
  "documentId": "507f1f77bcf86cd799439011",
  "performedBy": "507f1f77bcf86cd799439012",
  "performedAt": "2023-12-23T10:30:00.000Z",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "previousData": { ... },
  "newData": { ... }
}
```

### Audit Log Retention

Audit logs are automatically deleted after 1 year (365 days) via TTL index.

---

## Best Practices

1. **Regular Backups**: Enable scheduled backups in production
2. **Test Restores**: Periodically test backup restoration
3. **Monitor Backup Size**: Keep an eye on backup file sizes
4. **Secure Backup Storage**: Store backups in a secure location
5. **Use Soft Delete**: Prefer soft delete to prevent accidental data loss
6. **Review Audit Logs**: Regularly review audit logs for security

---

## Troubleshooting

### Backup Failed
- Check MongoDB connection
- Verify backup directory permissions
- Check disk space

### Restore Failed
- Verify backup file exists and is not corrupted
- Check backup checksum matches
- Ensure sufficient disk space

### Migration Failed
- Check MongoDB connection
- Review migration file syntax
- Check for duplicate index issues

For more help, check the logs or create an issue on GitHub.
