/**
 * GitHub OAuth authentication handlers
 */

import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createOAuthState, consumeOAuthState, createUser, createSession, deleteSession, getUserFromSession, getUserById, updateUserTokens, type User } from './store.js';
import { signToken, extractTokenFromHeader, verifyToken } from './jwt.js';
import { config } from './config.js';

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

/**
 * Redirect user to GitHub OAuth authorization page
 */
export async function initiateOAuth(req: Request, res: Response) {
    if (!config.githubClientId) {
        console.error('GITHUB_CLIENT_ID not configured');
        res.redirect(`${config.frontendUrl}?error=config`);
        return;
    }

    const state = uuidv4();
    try {
        await createOAuthState(state, new Date(Date.now() + OAUTH_STATE_TTL_MS));
    } catch (error) {
        console.error('Failed to create OAuth state:', error);
        res.redirect(`${config.frontendUrl}?error=server_error`);
        return;
    }

    const params = new URLSearchParams({
        client_id: config.githubClientId,
        redirect_uri: `${req.protocol}://${req.get('host')}/auth/github/callback`,
        scope: 'user:email read:user',
        state
    });

    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}

/**
 * Handle GitHub OAuth callback
 */
export async function handleOAuthCallback(req: Request, res: Response) {
    const { code, state, error } = req.query;

    // Handle OAuth errors
    if (error) {
        console.error('OAuth error from GitHub:', error);
        res.redirect(`${config.frontendUrl}?error=oauth_denied`);
        return;
    }

    // Validate state to prevent CSRF
    if (!state || typeof state !== 'string') {
        console.error('Invalid OAuth state');
        res.redirect(`${config.frontendUrl}?error=invalid_state`);
        return;
    }

    let stateValid = false;
    try {
        stateValid = await consumeOAuthState(state);
    } catch (error) {
        console.error('Failed to consume OAuth state:', error);
        res.redirect(`${config.frontendUrl}?error=server_error`);
        return;
    }

    if (!stateValid) {
        console.error('Invalid or expired OAuth state');
        res.redirect(`${config.frontendUrl}?error=invalid_state`);
        return;
    }

    if (!code || typeof code !== 'string') {
        console.error('No code in OAuth callback');
        res.redirect(`${config.frontendUrl}?error=no_code`);
        return;
    }

    if (!config.githubClientId || !config.githubClientSecret) {
        console.error('GitHub OAuth not configured');
        res.redirect(`${config.frontendUrl}?error=config`);
        return;
    }

    try {
        // Exchange code for access token with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        let tokenResponse: globalThis.Response;
        try {
            tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: config.githubClientId,
                    client_secret: config.githubClientSecret,
                    code
                }),
                signal: controller.signal
            });
        } catch (fetchError) {
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                console.error('Token exchange timed out');
                res.redirect(`${config.frontendUrl}?error=timeout`);
                return;
            }
            throw fetchError;
        } finally {
            clearTimeout(timeoutId);
        }

        const tokenData = await tokenResponse.json() as {
            access_token?: string;
            refresh_token?: string;
            expires_in?: number;
            error?: string;
            error_description?: string;
        };

        if (tokenData.error || !tokenData.access_token) {
            console.error('Token exchange failed:', tokenData.error_description || tokenData.error);
            res.redirect(`${config.frontendUrl}?error=token_exchange`);
            return;
        }

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token || null;
        // Calculate token expiry time (GitHub tokens expire in 8 hours by default)
        const tokenExpiresAt = tokenData.expires_in 
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : null;

        // Fetch user profile from GitHub with timeout
        const userController = new AbortController();
        const userTimeoutId = setTimeout(() => userController.abort(), 10000); // 10s timeout

        let userResponse: globalThis.Response;
        try {
            userResponse = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'repoLingo'
                },
                signal: userController.signal
            });
        } catch (fetchError) {
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                console.error('User fetch timed out');
                res.redirect(`${config.frontendUrl}?error=timeout`);
                return;
            }
            throw fetchError;
        } finally {
            clearTimeout(userTimeoutId);
        }

        if (!userResponse.ok) {
            console.error('Failed to fetch user profile:', userResponse.status);
            res.redirect(`${config.frontendUrl}?error=user_fetch`);
            return;
        }

        const githubUser = await userResponse.json() as {
            id: number;
            login: string;
            name: string | null;
            email: string | null;
            avatar_url: string;
        };

        // Create or update user in store
        const user = await createUser({
            githubId: githubUser.id,
            login: githubUser.login,
            name: githubUser.name,
            email: githubUser.email,
            avatarUrl: githubUser.avatar_url,
            accessToken,
            refreshToken,
            tokenExpiresAt
        });

        // Generate JWT token for cross-origin auth
        const token = signToken(user);

        // Also create session for same-origin cookie auth (backward compatibility)
        const session = await createSession(user.id);

        // Set session cookie (for same-origin scenarios)
        res.cookie('session', session.id, {
            httpOnly: true,
            secure: config.isProd,
            sameSite: config.isProd ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });

        // Redirect to dashboard with token in URL hash fragment
        // Hash fragment is not sent to server, making it more secure
        res.redirect(`${config.frontendUrl}/auth/callback#token=${token}`);

    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`${config.frontendUrl}?error=server_error`);
    }
}

/**
 * Logout - clear session
 */
export async function logout(req: Request, res: Response) {
    const sessionId = req.cookies?.session;

    if (sessionId) {
        await deleteSession(sessionId);
    }

    res.clearCookie('session', { 
        path: '/', 
        sameSite: config.isProd ? 'none' : 'lax',
        secure: config.isProd
    });
    res.redirect(config.frontendUrl);
}

/**
 * Get current user info
 * Supports both JWT tokens (Authorization header) and session cookies
 */
export async function getCurrentUser(req: Request, res: Response) {
    // First try JWT token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (token) {
        const payload = verifyToken(token);
        if (payload) {
            const user = await getUserById(payload.userId);
            if (user) {
                // Return user info (exclude sensitive fields)
                res.json({
                    id: user.id,
                    login: user.login,
                    name: user.name,
                    email: user.email,
                    avatarUrl: user.avatarUrl,
                    createdAt: user.createdAt
                });
                return;
            }
        }
        // Token is invalid
        res.status(401).json({ error: 'Invalid token' });
        return;
    }

    // Fall back to session cookie
    const sessionId = req.cookies?.session;

    if (!sessionId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }

    const user = await getUserFromSession(sessionId);

    if (!user) {
        res.clearCookie('session', { 
            path: '/', 
            sameSite: config.isProd ? 'none' : 'lax',
            secure: config.isProd
        });
        res.status(401).json({ error: 'Session expired' });
        return;
    }

    // Return user info (exclude sensitive fields)
    res.json({
        id: user.id,
        login: user.login,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
    });
}

/**
 * Get GitHub App installation URL
 */
export function getInstallUrl(): string {
    return `https://github.com/apps/${config.githubAppSlug}/installations/new`;
}

/**
 * Check if a user's access token is expired or about to expire
 * Returns true if token will expire within the next 5 minutes
 */
export function isTokenExpired(user: User): boolean {
    if (!user.tokenExpiresAt) {
        // No expiry set - assume it's a non-expiring token or unknown
        return false;
    }
    // Consider token expired if it expires within 5 minutes
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes
    return Date.now() + expiryBuffer >= user.tokenExpiresAt.getTime();
}

/**
 * Refresh a user's access token using their refresh token
 * Returns updated user on success, null if refresh fails
 */
export async function refreshUserToken(user: User): Promise<User | null> {
    if (!user.refreshToken) {
        console.error('No refresh token available for user:', user.id);
        return null;
    }

    if (!config.githubClientId || !config.githubClientSecret) {
        console.error('GitHub OAuth not configured for token refresh');
        return null;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        let response: globalThis.Response;
        try {
            response = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: config.githubClientId,
                    client_secret: config.githubClientSecret,
                    grant_type: 'refresh_token',
                    refresh_token: user.refreshToken
                }),
                signal: controller.signal
            });
        } catch (fetchError) {
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                console.error('Token refresh timed out');
                return null;
            }
            throw fetchError;
        } finally {
            clearTimeout(timeoutId);
        }

        const tokenData = await response.json() as {
            access_token?: string;
            refresh_token?: string;
            expires_in?: number;
            error?: string;
            error_description?: string;
        };

        if (tokenData.error || !tokenData.access_token) {
            console.error('Token refresh failed:', tokenData.error_description || tokenData.error);
            return null;
        }

        const newAccessToken = tokenData.access_token;
        const newRefreshToken = tokenData.refresh_token || user.refreshToken;
        const newTokenExpiresAt = tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : null;

        // Update tokens in database
        const updatedUser = await updateUserTokens(
            user.id,
            newAccessToken,
            newRefreshToken,
            newTokenExpiresAt
        );

        if (!updatedUser) {
            console.error('Failed to update user tokens in database');
            return null;
        }

        console.log(`Successfully refreshed tokens for user: ${user.login}`);
        return updatedUser;

    } catch (error) {
        console.error('Error refreshing user token:', error);
        return null;
    }
}