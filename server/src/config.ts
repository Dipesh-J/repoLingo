/**
 * Centralized configuration management
 * 
 * This file is the single source of truth for all environment variables.
 * All other files should import from here instead of using process.env directly.
 */

import dotenv from 'dotenv';

// Load environment variables from .env file (only needed in development)
dotenv.config();

// Helper to get required env var or throw in production
function getEnv(key: string, fallback?: string): string {
    const value = process.env[key];
    if (value !== undefined) return value;
    if (fallback !== undefined) return fallback;
    return '';
}

// Helper to decode PEM key - supports base64-encoded or escaped newlines
function decodePrivateKey(key: string): string {
    if (!key) return '';
    
    // If it already looks like a PEM key with proper headers, just fix newlines
    if (key.includes('-----BEGIN')) {
        return key.replace(/\\n/g, '\n');
    }
    
    // Otherwise, assume it's base64 encoded
    try {
        const decoded = Buffer.from(key, 'base64').toString('utf8');
        // Verify it decoded to a valid PEM
        if (decoded.includes('-----BEGIN')) {
            return decoded;
        }
    } catch (e) {
        console.error('Failed to decode private key from base64:', e);
    }
    
    // Last resort - return as-is with newline fixes
    return key.replace(/\\n/g, '\n');
}

// Determine environment
const nodeEnv = getEnv('NODE_ENV', 'development');
const isProd = nodeEnv === 'production';

// Build the config object
export const config = {
    // Environment
    nodeEnv,
    isProd,

    // Server
    port: parseInt(getEnv('PORT', '3000'), 10),

    // URLs
    frontendUrl: getEnv('FRONTEND_URL', 'http://localhost:5173'),
    dashboardUrl: getEnv('DASHBOARD_URL', 'http://localhost:5173'),
    corsOrigins: getEnv('CORS_ORIGINS', '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),

    // GitHub App
    appId: getEnv('APP_ID'),
    privateKey: decodePrivateKey(getEnv('PRIVATE_KEY')),
    webhookSecret: getEnv('WEBHOOK_SECRET', 'development'),
    githubAppSlug: getEnv('GITHUB_APP_SLUG', 'repo-lingo'),

    // GitHub OAuth
    githubClientId: getEnv('GITHUB_CLIENT_ID'),
    githubClientSecret: getEnv('GITHUB_CLIENT_SECRET'),

    // Database
    mongodbUri: getEnv('MONGODB_URI'),

    // External APIs
    lingoApiKey: getEnv('LINGO_API_KEY'),

    // Authentication
    jwtSecret: getEnv('JWT_SECRET', 'dev-jwt-secret-change-in-production'),
    jwtExpiry: '7d',
};

// Validate required environment variables in production
if (isProd) {
    const requiredInProd: (keyof typeof config)[] = [
        'appId',
        'privateKey',
        'webhookSecret',
        'githubClientId',
        'githubClientSecret',
        'lingoApiKey',
        'mongodbUri',
        'frontendUrl',
        'dashboardUrl',
        'jwtSecret',
    ];

    const missing = requiredInProd.filter((key) => !config[key]);

    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`);
        console.error('Please set these in your Cloud Run environment or .env file.');
        process.exit(1);
    }
}

// Also export individual values for convenience
export const {
    isProd: IS_PROD,
    port: PORT,
    frontendUrl: FRONTEND_URL,
    dashboardUrl: DASHBOARD_URL,
    appId: APP_ID,
    privateKey: PRIVATE_KEY,
    webhookSecret: WEBHOOK_SECRET,
    githubAppSlug: GITHUB_APP_SLUG,
    githubClientId: GITHUB_CLIENT_ID,
    githubClientSecret: GITHUB_CLIENT_SECRET,
    mongodbUri: MONGODB_URI,
    lingoApiKey: LINGO_API_KEY,
    jwtSecret: JWT_SECRET,
} = config;
