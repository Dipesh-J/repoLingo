/**
 * MongoDB connection module
 */

import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB(): Promise<void> {
    if (isConnected) {
        console.log('MongoDB already connected');
        return;
    }

    // Read URI lazily to ensure dotenv has been loaded
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        console.error('MONGODB_URI is not defined in environment variables');
        console.log('Running in fallback mode (in-memory storage)');
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI);
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
