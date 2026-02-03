/**
 * GitHub OAuth authentication handlers
 */

import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createUser, createSession, deleteSession, getUserFromSession } from './store.js';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const GITHUB_APP_SLUG = process.env.GITHUB_APP_SLUG || 'repoLingo';

// State tokens to prevent CSRF (short-lived, in-memory)
const oauthStates = new Map<string, { createdAt: Date }>();

// Clean up old states every 5 minutes
setInterval(() => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    for (const [state, data] of oauthStates) {
        if (data.createdAt < fiveMinutesAgo) {
            oauthStates.delete(state);
        }
    }
}, 5 * 60 * 1000);

/**
 * Redirect user to GitHub OAuth authorization page
 */
export function initiateOAuth(req: Request, res: Response) {
    if (!GITHUB_CLIENT_ID) {
        console.error('GITHUB_CLIENT_ID not configured');
        res.redirect(`${FRONTEND_URL}?error=config`);
        return;
    }

    const state = uuidv4();
    oauthStates.set(state, { createdAt: new Date() });

    const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
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
        res.redirect(`${FRONTEND_URL}?error=oauth_denied`);
        return;
    }

    // Validate state to prevent CSRF
    if (!state || typeof state !== 'string' || !oauthStates.has(state)) {
        console.error('Invalid OAuth state');
        res.redirect(`${FRONTEND_URL}?error=invalid_state`);
        return;
    }
    oauthStates.delete(state);

    if (!code || typeof code !== 'string') {
        console.error('No code in OAuth callback');
        res.redirect(`${FRONTEND_URL}?error=no_code`);
        return;
    }

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        console.error('GitHub OAuth not configured');
        res.redirect(`${FRONTEND_URL}?error=config`);
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
                    client_id: GITHUB_CLIENT_ID,
                    client_secret: GITHUB_CLIENT_SECRET,
                    code
                }),
                signal: controller.signal
            });
        } catch (fetchError) {
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                console.error('Token exchange timed out');
                res.redirect(`${FRONTEND_URL}?error=timeout`);
                return;
            }
            throw fetchError;
        } finally {
            clearTimeout(timeoutId);
        }

        const tokenData = await tokenResponse.json() as {
            access_token?: string;
            error?: string;
            error_description?: string;
        };

        if (tokenData.error || !tokenData.access_token) {
            console.error('Token exchange failed:', tokenData.error_description || tokenData.error);
            res.redirect(`${FRONTEND_URL}?error=token_exchange`);
            return;
        }

        const accessToken = tokenData.access_token;

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
                res.redirect(`${FRONTEND_URL}?error=timeout`);
                return;
            }
            throw fetchError;
        } finally {
            clearTimeout(userTimeoutId);
        }

        if (!userResponse.ok) {
            console.error('Failed to fetch user profile:', userResponse.status);
            res.redirect(`${FRONTEND_URL}?error=user_fetch`);
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
            accessToken
        });

        // Create session
        const session = await createSession(user.id);

        // Set session cookie
        res.cookie('session', session.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });

        // Redirect to dashboard
        res.redirect(`${FRONTEND_URL}/dashboard`);

    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`${FRONTEND_URL}?error=server_error`);
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

    res.clearCookie('session', { path: '/' });
    res.redirect(FRONTEND_URL);
}

/**
 * Get current user info
 */
export async function getCurrentUser(req: Request, res: Response) {
    const sessionId = req.cookies?.session;

    if (!sessionId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }

    const user = await getUserFromSession(sessionId);

    if (!user) {
        res.clearCookie('session', { path: '/' });
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
    return `https://github.com/apps/${GITHUB_APP_SLUG}/installations/new`;
}
