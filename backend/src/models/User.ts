import bcrypt from 'bcryptjs';
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    _id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: 'admin' | 'cr' | 'instructor' | 'viewer';
    sectionId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['admin', 'cr', 'instructor', 'viewer'],
            required: true,
            default: 'cr',
        },
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            required: function (this: IUser) {
                return this.role === 'cr';
            },
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1, sectionId: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.passwordHash;
    return userObject;
};

export const User = mongoose.model<IUser>('User', userSchema);