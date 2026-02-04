/**
 * Authentication and authorization middleware
 */

import type { Request, Response, NextFunction } from 'express';
import { getUserFromSession, type User } from './store.js';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: User;
            rawBody?: Buffer;
        }
    }
}

/**
 * Middleware that requires authentication.
 * Returns 401 if not authenticated.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const sessionId = req.cookies?.session;

    if (!sessionId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    const user = await getUserFromSession(sessionId);

    if (!user) {
        res.clearCookie('session', { path: '/' });
        res.status(401).json({ error: 'Session expired' });
        return;
    }

    // Attach user to request
    req.user = user;
    next();
}

/**
 * Middleware that optionally loads user if authenticated.
 * Does not reject unauthenticated requests.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
    const sessionId = req.cookies?.session;

    if (sessionId) {
        const user = await getUserFromSession(sessionId);
        if (user) {
            req.user = user;
        }
    }

    next();
}
