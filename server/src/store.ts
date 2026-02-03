/**
 * Data store with MongoDB persistence.
 * Falls back to in-memory storage if MongoDB is not connected.
 */

import { isDBConnected } from './db.js';
import { 
    UserModel, 
    SessionModel, 
    UserPreferencesModel, 
    TranslationRecordModel,
    type IUser,
    type ISession,
    type IUserPreferences,
    type ITranslationRecord
} from './models.js';
import mongoose from 'mongoose';

// ==================== Types (for API responses) ====================

export interface User {
    id: string;
    githubId: number;
    login: string;
    name: string | null;
    email: string | null;
    avatarUrl: string;
    accessToken: string;
    createdAt: Date;
    lastLoginAt: Date;
}

export interface Session {
    id: string;
    userId: string;
    createdAt: Date;
    expiresAt: Date;
}

export interface UserPreferences {
    userId: string;
    defaultTargetLanguage: string;
    autoTranslate: boolean;
    emailNotifications: boolean;
}

export interface TranslationRecord {
    id: string;
    userId: string;
    owner: string;
    repo: string;
    prNumber: number;
    prTitle: string;
    sourceLanguage: string;
    targetLanguage: string;
    contentType: 'description' | 'comment';
    translatedAt: Date;
}

// ==================== In-Memory Fallback Stores ====================

const memoryUsers = new Map<string, User>();
const memoryUsersByGithubId = new Map<number, string>();
const memorySessions = new Map<string, Session>();
const memoryPreferences = new Map<string, UserPreferences>();
const memoryTranslationHistory = new Map<string, TranslationRecord[]>();

// Session expiry time (7 days)
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// ==================== Helper Functions ====================

function toUser(doc: IUser): User {
    return {
        id: doc._id.toString(),
        githubId: doc.githubId,
        login: doc.login,
        name: doc.name,
        email: doc.email,
        avatarUrl: doc.avatarUrl,
        accessToken: doc.accessToken,
        createdAt: doc.createdAt,
        lastLoginAt: doc.lastLoginAt
    };
}

function toPreferences(doc: IUserPreferences): UserPreferences {
    return {
        userId: doc.userId.toString(),
        defaultTargetLanguage: doc.defaultTargetLanguage,
        autoTranslate: doc.autoTranslate,
        emailNotifications: doc.emailNotifications
    };
}

function toTranslationRecord(doc: ITranslationRecord): TranslationRecord {
    return {
        id: doc._id.toString(),
        userId: doc.userId.toString(),
        owner: doc.owner,
        repo: doc.repo,
        prNumber: doc.prNumber,
        prTitle: doc.prTitle,
        sourceLanguage: doc.sourceLanguage,
        targetLanguage: doc.targetLanguage,
        contentType: doc.contentType,
        translatedAt: doc.translatedAt
    };
}

// ==================== User Functions ====================

export async function createUser(data: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>): Promise<User> {
    if (isDBConnected()) {
        try {
            // Try to find existing user
            let userDoc = await UserModel.findOne({ githubId: data.githubId });
            
            if (userDoc) {
                // Update existing user
                userDoc.login = data.login;
                userDoc.name = data.name;
                userDoc.email = data.email;
                userDoc.avatarUrl = data.avatarUrl;
                userDoc.accessToken = data.accessToken;
                userDoc.lastLoginAt = new Date();
                await userDoc.save();
            } else {
                // Create new user
                userDoc = await UserModel.create({
                    githubId: data.githubId,
                    login: data.login,
                    name: data.name,
                    email: data.email,
                    avatarUrl: data.avatarUrl,
                    accessToken: data.accessToken
                });

                // Create default preferences
                await UserPreferencesModel.create({
                    userId: userDoc._id,
                    defaultTargetLanguage: 'en',
                    autoTranslate: false,
                    emailNotifications: false
                });
            }

            return toUser(userDoc);
        } catch (error) {
            console.error('MongoDB createUser error:', error);
            // Fall through to memory fallback
        }
    }

    // In-memory fallback
    const existingId = memoryUsersByGithubId.get(data.githubId);
    if (existingId) {
        const existing = memoryUsers.get(existingId)!;
        const updated: User = {
            ...existing,
            ...data,
            lastLoginAt: new Date()
        };
        memoryUsers.set(existingId, updated);
        return updated;
    }

    const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const user: User = {
        ...data,
        id,
        createdAt: new Date(),
        lastLoginAt: new Date()
    };
    memoryUsers.set(id, user);
    memoryUsersByGithubId.set(data.githubId, id);

    memoryPreferences.set(id, {
        userId: id,
        defaultTargetLanguage: 'en',
        autoTranslate: false,
        emailNotifications: false
    });

    return user;
}

export async function getUserById(id: string): Promise<User | undefined> {
    if (isDBConnected()) {
        try {
            const userDoc = await UserModel.findById(id);
            return userDoc ? toUser(userDoc) : undefined;
        } catch (error) {
            console.error('MongoDB getUserById error:', error);
        }
    }
    return memoryUsers.get(id);
}

export async function getUserByGithubId(githubId: number): Promise<User | undefined> {
    if (isDBConnected()) {
        try {
            const userDoc = await UserModel.findOne({ githubId });
            return userDoc ? toUser(userDoc) : undefined;
        } catch (error) {
            console.error('MongoDB getUserByGithubId error:', error);
        }
    }
    const id = memoryUsersByGithubId.get(githubId);
    return id ? memoryUsers.get(id) : undefined;
}

// ==================== Session Functions ====================

export async function createSession(userId: string): Promise<Session> {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);

    if (isDBConnected()) {
        try {
            await SessionModel.create({
                sessionId,
                userId: new mongoose.Types.ObjectId(userId),
                expiresAt
            });

            return {
                id: sessionId,
                userId,
                createdAt: new Date(),
                expiresAt
            };
        } catch (error) {
            console.error('MongoDB createSession error:', error);
        }
    }

    // In-memory fallback
    const session: Session = {
        id: sessionId,
        userId,
        createdAt: new Date(),
        expiresAt
    };
    memorySessions.set(sessionId, session);
    return session;
}

export async function getSession(sessionId: string): Promise<Session | undefined> {
    if (isDBConnected()) {
        try {
            const sessionDoc = await SessionModel.findOne({ 
                sessionId,
                expiresAt: { $gt: new Date() }
            });
            
            if (sessionDoc) {
                return {
                    id: sessionDoc.sessionId,
                    userId: sessionDoc.userId.toString(),
                    createdAt: sessionDoc.createdAt,
                    expiresAt: sessionDoc.expiresAt
                };
            }
            return undefined;
        } catch (error) {
            console.error('MongoDB getSession error:', error);
        }
    }

    // In-memory fallback
    const session = memorySessions.get(sessionId);
    if (!session) return undefined;

    if (new Date() > session.expiresAt) {
        memorySessions.delete(sessionId);
        return undefined;
    }

    return session;
}

export async function deleteSession(sessionId: string): Promise<boolean> {
    if (isDBConnected()) {
        try {
            const result = await SessionModel.deleteOne({ sessionId });
            return result.deletedCount > 0;
        } catch (error) {
            console.error('MongoDB deleteSession error:', error);
        }
    }
    return memorySessions.delete(sessionId);
}

export async function getUserFromSession(sessionId: string): Promise<User | undefined> {
    const session = await getSession(sessionId);
    if (!session) return undefined;
    return getUserById(session.userId);
}

// ==================== Preferences Functions ====================

export async function getPreferences(userId: string): Promise<UserPreferences | undefined> {
    if (isDBConnected()) {
        try {
            const prefsDoc = await UserPreferencesModel.findOne({ 
                userId: new mongoose.Types.ObjectId(userId) 
            });
            return prefsDoc ? toPreferences(prefsDoc) : undefined;
        } catch (error) {
            console.error('MongoDB getPreferences error:', error);
        }
    }
    return memoryPreferences.get(userId);
}

export async function updatePreferences(
    userId: string, 
    updates: Partial<Omit<UserPreferences, 'userId'>>
): Promise<UserPreferences | undefined> {
    if (isDBConnected()) {
        try {
            const prefsDoc = await UserPreferencesModel.findOneAndUpdate(
                { userId: new mongoose.Types.ObjectId(userId) },
                { $set: updates },
                { new: true }
            );
            return prefsDoc ? toPreferences(prefsDoc) : undefined;
        } catch (error) {
            console.error('MongoDB updatePreferences error:', error);
        }
    }

    // In-memory fallback
    const existing = memoryPreferences.get(userId);
    if (!existing) return undefined;

    const updated: UserPreferences = { ...existing, ...updates };
    memoryPreferences.set(userId, updated);
    return updated;
}

// ==================== Translation History Functions ====================

export async function addTranslationRecord(
    record: Omit<TranslationRecord, 'id' | 'translatedAt'>
): Promise<TranslationRecord> {
    if (isDBConnected()) {
        try {
            const doc = await TranslationRecordModel.create({
                userId: new mongoose.Types.ObjectId(record.userId),
                owner: record.owner,
                repo: record.repo,
                prNumber: record.prNumber,
                prTitle: record.prTitle,
                sourceLanguage: record.sourceLanguage,
                targetLanguage: record.targetLanguage,
                contentType: record.contentType
            });
            return toTranslationRecord(doc);
        } catch (error) {
            console.error('MongoDB addTranslationRecord error:', error);
        }
    }

    // In-memory fallback
    const id = `trans_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fullRecord: TranslationRecord = {
        ...record,
        id,
        translatedAt: new Date()
    };

    const userHistory = memoryTranslationHistory.get(record.userId) || [];
    userHistory.unshift(fullRecord);

    if (userHistory.length > 100) {
        userHistory.pop();
    }

    memoryTranslationHistory.set(record.userId, userHistory);
    return fullRecord;
}

export async function getTranslationHistory(userId: string, limit = 20): Promise<TranslationRecord[]> {
    if (isDBConnected()) {
        try {
            const docs = await TranslationRecordModel
                .find({ userId: new mongoose.Types.ObjectId(userId) })
                .sort({ translatedAt: -1 })
                .limit(limit);
            return docs.map(toTranslationRecord);
        } catch (error) {
            console.error('MongoDB getTranslationHistory error:', error);
        }
    }

    // In-memory fallback
    const history = memoryTranslationHistory.get(userId) || [];
    return history.slice(0, limit);
}

export async function getTranslationStats(userId: string): Promise<{
    total: number;
    byLanguage: Record<string, number>;
    byRepo: Record<string, number>;
}> {
    if (isDBConnected()) {
        try {
            const userObjectId = new mongoose.Types.ObjectId(userId);

            // Get total count
            const total = await TranslationRecordModel.countDocuments({ userId: userObjectId });

            // Aggregate by language
            const langAgg = await TranslationRecordModel.aggregate([
                { $match: { userId: userObjectId } },
                { $group: { _id: '$targetLanguage', count: { $sum: 1 } } }
            ]);
            const byLanguage: Record<string, number> = {};
            for (const item of langAgg) {
                byLanguage[item._id] = item.count;
            }

            // Aggregate by repo
            const repoAgg = await TranslationRecordModel.aggregate([
                { $match: { userId: userObjectId } },
                { $group: { _id: { $concat: ['$owner', '/', '$repo'] }, count: { $sum: 1 } } }
            ]);
            const byRepo: Record<string, number> = {};
            for (const item of repoAgg) {
                byRepo[item._id] = item.count;
            }

            return { total, byLanguage, byRepo };
        } catch (error) {
            console.error('MongoDB getTranslationStats error:', error);
        }
    }

    // In-memory fallback
    const history = memoryTranslationHistory.get(userId) || [];

    const byLanguage: Record<string, number> = {};
    const byRepo: Record<string, number> = {};

    for (const record of history) {
        byLanguage[record.targetLanguage] = (byLanguage[record.targetLanguage] || 0) + 1;
        const repoKey = `${record.owner}/${record.repo}`;
        byRepo[repoKey] = (byRepo[repoKey] || 0) + 1;
    }

    return {
        total: history.length,
        byLanguage,
        byRepo
    };
}

// ==================== Debug/Admin Functions ====================

export async function getStoreStats(): Promise<{
    users: number;
    sessions: number;
    preferences: number;
    translationRecords: number;
    usingMongoDB: boolean;
}> {
    if (isDBConnected()) {
        try {
            const [users, sessions, preferences, translationRecords] = await Promise.all([
                UserModel.countDocuments(),
                SessionModel.countDocuments(),
                UserPreferencesModel.countDocuments(),
                TranslationRecordModel.countDocuments()
            ]);

            return {
                users,
                sessions,
                preferences,
                translationRecords,
                usingMongoDB: true
            };
        } catch (error) {
            console.error('MongoDB getStoreStats error:', error);
        }
    }

    return {
        users: memoryUsers.size,
        sessions: memorySessions.size,
        preferences: memoryPreferences.size,
        translationRecords: Array.from(memoryTranslationHistory.values())
            .reduce((sum, arr) => sum + arr.length, 0),
        usingMongoDB: false
    };
}
