/**
 * Authentication and authorization middleware
 * Supports both cookie-based sessions and JWT tokens for cross-origin auth
 */

import type { Request, Response, NextFunction } from 'express';
import { getUserFromSession, getUserById, type User } from './store.js';
import { extractTokenFromHeader, verifyToken } from './jwt.js';
import { config } from './config.js';
import { isTokenExpired, refreshUserToken } from './auth.js';

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
 * Try to authenticate user from JWT token in Authorization header
 */
async function getUserFromToken(req: Request): Promise<User | undefined> {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) return undefined;
    
    const payload = verifyToken(token);
    if (!payload) return undefined;
    
    return getUserById(payload.userId);
}

/**
 * Try to authenticate user from session cookie
 */
async function getUserFromCookie(req: Request): Promise<User | undefined> {
    const sessionId = req.cookies?.session;
    if (!sessionId) return undefined;
    
    return getUserFromSession(sessionId);
}

/**
 * Map to track in-flight token refresh operations per user.
 * Prevents concurrent requests from triggering multiple refreshes.
 */
const refreshInProgress = new Map<string, Promise<User | null>>();

/**
 * Middleware that requires authentication.
 * Supports both JWT tokens (Authorization header) and session cookies.
 * Automatically refreshes GitHub access tokens if they are about to expire.
 * Uses deduplication to prevent concurrent refresh race conditions.
 * Returns 401 if not authenticated.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    // First try JWT token (for cross-origin requests)
    let user = await getUserFromToken(req);
    
    // Fall back to cookie-based session
    if (!user) {
        user = await getUserFromCookie(req);
    }

    if (!user) {
        // Clear cookie if it exists but is invalid
        if (req.cookies?.session) {
            res.clearCookie('session', { 
                path: '/',
                sameSite: config.isProd ? 'none' : 'lax',
                secure: config.isProd
            });
        }
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    // Check if token is about to expire and refresh if needed
    if (isTokenExpired(user)) {
        console.log(`Token expired or expiring soon for user: ${user.login}, attempting refresh...`);
        
        let refreshedUser: User | null;
        
        // Check if a refresh is already in progress for this user
        const existingRefresh = refreshInProgress.get(user.id);
        if (existingRefresh) {
            // Wait for the existing refresh to complete
            console.log(`Waiting for existing refresh for user: ${user.login}`);
            refreshedUser = await existingRefresh;
        } else {
            // Start a new refresh and store the promise
            const refreshPromise = refreshUserToken(user);
            refreshInProgress.set(user.id, refreshPromise);
            
            try {
                refreshedUser = await refreshPromise;
            } finally {
                // Always remove from map when done (success or failure)
                refreshInProgress.delete(user.id);
            }
        }
        
        if (refreshedUser) {
            // Use refreshed user with new access token
            user = refreshedUser;
        } else {
            // Refresh failed - user needs to re-authenticate
            console.error(`Token refresh failed for user: ${user.login}`);
            res.status(401).json({ 
                error: 'Token expired', 
                tokenExpired: true,
                message: 'Your session has expired. Please log in again.'
            });
            return;
        }
    }

    // Attach user to request
    req.user = user;
    next();
}

/**
 * Middleware that optionally loads user if authenticated.
 * Supports both JWT tokens (Authorization header) and session cookies.
 * Does not reject unauthenticated requests.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
    // First try JWT token (for cross-origin requests)
    let user = await getUserFromToken(req);
    
    // Fall back to cookie-based session
    if (!user) {
        user = await getUserFromCookie(req);
    }

    if (user) {
        req.user = user;
    }

    next();
}
