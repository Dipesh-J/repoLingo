import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { config } from './config.js';
import router from './routes.js';
import { setupListeners } from './handlers.js';
import { connectDB } from './db.js';

const app = express();

// Build CORS origins list
const corsOrigins = Array.from(new Set([
    config.frontendUrl,
    ...config.corsOrigins
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

if (config.isProd) {
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
    
    app.listen(config.port, () => {
        console.log(`Server is running on port ${config.port}`);
        console.log(`Frontend URL: ${config.frontendUrl}`);
    });
}

start().catch((error) => {
    console.error(error);
    if (config.isProd) {
        process.exit(1);
    }
});
