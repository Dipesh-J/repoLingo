/**
 * JWT token utilities for cross-origin authentication
 */

import jwt from 'jsonwebtoken';
import type { User } from './store.js';

// JWT secret - should be a strong random string in production
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
const JWT_EXPIRY = '7d'; // Token expires in 7 days

// Payload stored in the JWT
export interface JWTPayload {
    userId: string;
    login: string;
    iat?: number;
    exp?: number;
}

/**
 * Sign a JWT token for a user
 */
export function signToken(user: User): string {
    const payload: JWTPayload = {
        userId: user.id,
        login: user.login
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify and decode a JWT token
 * Returns null if token is invalid or expired
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch (error) {
        // Token is invalid or expired
        return null;
    }
}

/**
 * Extract token from Authorization header
 * Supports "Bearer <token>" format
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;

    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }

    return null;
}
