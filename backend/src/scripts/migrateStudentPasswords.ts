import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || '';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');

// Student Schema (minimal version for migration)
const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String },
  isPasswordDefault: { type: Boolean, default: true },
});

const Student = mongoose.model('Student', studentSchema);

/**
 * Migration Script: Set password = studentId for all existing students
 * 
 * This script will:
 * 1. Find all students without a password or with default password
 * 2. Set their password to their studentId (hashed with bcrypt)
 * 3. Mark isPasswordDefault = true
 */
async function migrateStudentPasswords() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    // Find all students
    console.log('🔍 Finding all students...');
    const students = await Student.find({});
    console.log(`📊 Found ${students.length} students in database\n`);

    if (students.length === 0) {
      console.log('ℹ️  No students found. Exiting...');
      await mongoose.disconnect();
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log('🔄 Starting password migration...\n');

    for (const student of students) {
      try {
        // Check if student already has a proper password
        if (student.password) {
          // Try to verify if current password is valid bcrypt hash
          const isValidHash = /^\$2[aby]\$\d{2}\$/.test(student.password);
          
          if (isValidHash) {
            console.log(`⏭️  Skipping ${student.studentId} (${student.name}) - Already has password`);
            skippedCount++;
            continue;
          }
        }

        // Hash the studentId as the default password
        const hashedPassword = await bcrypt.hash(student.studentId, BCRYPT_SALT_ROUNDS);

        // Update student with new password
        await Student.findByIdAndUpdate(student._id, {
          password: hashedPassword,
          isPasswordDefault: true,
        });

        console.log(`✅ Updated ${student.studentId} (${student.name}) - Password set to Student ID`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ Error updating ${student.studentId}:`, error);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Updated: ${updatedCount} students`);
    console.log(`⏭️  Skipped: ${skippedCount} students (already have password)`);
    console.log(`❌ Errors: ${errorCount} students`);
    console.log(`📊 Total: ${students.length} students`);
    console.log('='.repeat(60));

    if (updatedCount > 0) {
      console.log('\n✨ Students can now login with:');
      console.log('   Username: Their Student ID (e.g., CSE-2021-001)');
      console.log('   Password: Their Student ID (e.g., CSE-2021-001)');
      console.log('\n💡 They should change their password after first login!\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    console.log('🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Disconnected successfully');
  }
}

// Run the migration
console.log('\n' + '='.repeat(60));
console.log('🚀 Student Password Migration Script');
console.log('='.repeat(60));
console.log('📝 This script will set password = studentId for all students');
console.log('='.repeat(60) + '\n');

migrateStudentPasswords()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
