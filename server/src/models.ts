/**
 * Mongoose models for MongoDB persistence
 */

import mongoose, { Schema, Document } from 'mongoose';

// ==================== User Model ====================

export interface IUser extends Document {
    githubId: number;
    login: string;
    name: string | null;
    email: string | null;
    avatarUrl: string;
    accessToken: string;
    createdAt: Date;
    lastLoginAt: Date;
}

const UserSchema = new Schema<IUser>({
    githubId: { type: Number, required: true, unique: true, index: true },
    login: { type: String, required: true },
    name: { type: String, default: null },
    email: { type: String, default: null },
    avatarUrl: { type: String, required: true },
    accessToken: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);

// ==================== Session Model ====================

export interface ISession extends Document {
    sessionId: string;
    userId: mongoose.Types.ObjectId;
    createdAt: Date;
    expiresAt: Date;
}

const SessionSchema = new Schema<ISession>({
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
});

// TTL index to auto-delete expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel = mongoose.model<ISession>('Session', SessionSchema);

// ==================== User Preferences Model ====================

export interface IUserPreferences extends Document {
    userId: mongoose.Types.ObjectId;
    defaultTargetLanguage: string;
    autoTranslate: boolean;
    emailNotifications: boolean;
}

const UserPreferencesSchema = new Schema<IUserPreferences>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    defaultTargetLanguage: { type: String, default: 'en' },
    autoTranslate: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: false }
});

export const UserPreferencesModel = mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema);

// ==================== Translation Record Model ====================

export interface ITranslationRecord extends Document {
    userId: mongoose.Types.ObjectId;
    owner: string;
    repo: string;
    prNumber: number;
    prTitle: string;
    sourceLanguage: string;
    targetLanguage: string;
    contentType: 'description' | 'comment';
    translatedAt: Date;
}

const TranslationRecordSchema = new Schema<ITranslationRecord>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    prNumber: { type: Number, required: true },
    prTitle: { type: String, required: true },
    sourceLanguage: { type: String, required: true },
    targetLanguage: { type: String, required: true },
    contentType: { type: String, enum: ['description', 'comment'], required: true },
    translatedAt: { type: Date, default: Date.now, index: true }
});

// Compound index for efficient queries
TranslationRecordSchema.index({ userId: 1, translatedAt: -1 });

export const TranslationRecordModel = mongoose.model<ITranslationRecord>('TranslationRecord', TranslationRecordSchema);
