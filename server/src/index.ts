import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import router from './routes.js';
import { setupListeners } from './handlers.js';
import { connectDB } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
    const requiredEnv = [
        'APP_ID',
        'PRIVATE_KEY',
        'WEBHOOK_SECRET',
        'GITHUB_CLIENT_ID',
        'GITHUB_CLIENT_SECRET',
        'LINGO_API_KEY',
        'MONGODB_URI',
        'FRONTEND_URL',
        'DASHBOARD_URL',
        'JWT_SECRET'
    ];
    const missing = requiredEnv.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }
}

const corsOrigins = Array.from(new Set([
    FRONTEND_URL,
    ...(process.env.CORS_ORIGINS ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
]));

function matchWildcard(origin: string, pattern: string): boolean {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    const regex = new RegExp(`^${escaped}$`);
    return regex.test(origin);
}

function isOriginAllowed(origin?: string): boolean {
    if (!origin) return true;
    if (corsOrigins.includes(origin)) return true;
    return corsOrigins.some((pattern) => pattern.includes('*') && matchWildcard(origin, pattern));
}

setupListeners();

// CORS with credentials support for auth cookies
app.use(cors({
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

if (isProd) {
    app.set('trust proxy', 1);
}

app.use(cookieParser());
app.use(express.json({
    verify: (req, _res, buf) => {
        if ((req as any).originalUrl?.startsWith('/webhooks/github')) {
            (req as any).rawBody = buf;
        }
    }
}));

app.get('/healthz', (req, res) => {
    res.json({ status: 'ok' });
});

app.use(router);

app.get('/', (req, res) => {
    res.send('Lingo Translator Server Running');
});

// Start server with MongoDB connection
async function start() {
    await connectDB();
    
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Frontend URL: ${FRONTEND_URL}`);
    });
}

start().catch((error) => {
    console.error(error);
    if (isProd) {
        process.exit(1);
    }
});
