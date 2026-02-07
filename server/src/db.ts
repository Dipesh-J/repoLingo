/**
 * MongoDB connection module
 */

import mongoose from 'mongoose';
import { config } from './config.js';

let isConnected = false;

export async function connectDB(): Promise<void> {
    if (isConnected) {
        console.log('MongoDB already connected');
        return;
    }

    if (!config.mongodbUri) {
        console.error('MONGODB_URI is not defined in environment variables');
        if (config.isProd) {
            throw new Error('MONGODB_URI is required in production');
        }
        console.log('Running in fallback mode (in-memory storage)');
        return;
    }

    try {
        await mongoose.connect(config.mongodbUri);
        isConnected = true;
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

export function isDBConnected(): boolean {
    return isConnected && mongoose.connection.readyState === 1;
}

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
    isConnected = true;
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
    isConnected = true;
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    isConnected = false;
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
});
