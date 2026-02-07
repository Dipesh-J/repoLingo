import { Router } from 'express';
import { githubApp } from './github.js';
import { translateMarkdown } from './translation.js';
import { initiateOAuth, handleOAuthCallback, logout, getCurrentUser, getInstallUrl } from './auth.js';
import { requireAuth, optionalAuth } from './middleware.js';
import {
    getPreferences,
    updatePreferences,
    getTranslationHistory,
    getTranslationStats,
    addTranslationRecord,
    getStoreStats
} from './store.js';
import { config } from './config.js';

const router = Router();

// ==================== Auth Routes ====================

// Redirect to GitHub OAuth
router.get('/auth/github', initiateOAuth);

// Handle OAuth callback
router.get('/auth/github/callback', handleOAuthCallback);

// Logout
router.get('/auth/logout', logout);

// Get current user
router.get('/auth/me', getCurrentUser);

// ==================== Protected API Routes ====================

// Get user's app installations
router.get('/api/installations', requireAuth, async (req, res) => {
    try {
        const user = req.user!;

        // Use the user's access token to fetch their installations with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        let response: globalThis.Response;
        try {
            response = await fetch('https://api.github.com/user/installations', {
                headers: {
                    'Authorization': `Bearer ${user.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'repoLingo'
                },
                signal: controller.signal
            });
        } catch (fetchError) {
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                console.error('Installations fetch timed out');
                res.status(504).json({ error: 'Request timed out while fetching installations' });
                return;
            }
            throw fetchError;
        } finally {
            clearTimeout(timeoutId);
        }

        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            console.error('Failed to fetch installations:', response.status, errorBody);
            
            // If 401, the token is likely invalid (even after middleware refresh attempt)
            if (response.status === 401) {
                res.status(401).json({ 
                    error: 'GitHub token is invalid', 
                    tokenExpired: true,
                    message: 'Please log in again to reconnect your GitHub account.'
                });
                return;
            }
            
            res.status(response.status).json({ error: 'Failed to fetch installations' });
            return;
        }

        const data = await response.json() as {
            total_count: number;
            installations: Array<{
                id: number;
                account: {
                    login: string;
                    type: string;
                    avatar_url: string;
                };
                repository_selection: string;
            }>;
        };

        // For each installation, fetch the repositories with timeout
        const installationsWithRepos = await Promise.all(
            data.installations.map(async (installation) => {
                const repoController = new AbortController();
                const repoTimeoutId = setTimeout(() => repoController.abort(), 10000); // 10s timeout

                try {
                    const reposResponse = await fetch(
                        `https://api.github.com/user/installations/${installation.id}/repositories`,
                        {
                            headers: {
                                'Authorization': `Bearer ${user.accessToken}`,
                                'Accept': 'application/vnd.github.v3+json',
                                'User-Agent': 'repoLingo'
                            },
                            signal: repoController.signal
                        }
                    );

                    if (reposResponse.ok) {
                        const reposData = await reposResponse.json() as {
                            repositories: Array<{
                                id: number;
                                name: string;
                                full_name: string;
                                private: boolean;
                            }>;
                        };
                        return {
                            id: installation.id,
                            accountLogin: installation.account.login,
                            accountType: installation.account.type,
                            accountAvatarUrl: installation.account.avatar_url,
                            repositorySelection: installation.repository_selection,
                            repositories: reposData.repositories.map(r => ({
                                id: r.id,
                                name: r.name,
                                fullName: r.full_name,
                                private: r.private
                            }))
                        };
                    }
                } catch (err) {
                    if (err instanceof Error && err.name === 'AbortError') {
                        console.error(`Timeout fetching repos for installation ${installation.id}`);
                    } else {
                        console.error(`Error fetching repos for installation ${installation.id}:`, err);
                    }
                } finally {
                    clearTimeout(repoTimeoutId);
                }

                // Fallback: return installation with empty repositories on error/timeout
                return {
                    id: installation.id,
                    accountLogin: installation.account.login,
                    accountType: installation.account.type,
                    accountAvatarUrl: installation.account.avatar_url,
                    repositorySelection: installation.repository_selection,
                    repositories: []
                };
            })
        );

        res.json({
            totalCount: data.total_count,
            installations: installationsWithRepos,
            installUrl: getInstallUrl()
        });
    } catch (error) {
        console.error('Error fetching installations:', error);
        res.status(500).json({ error: 'Failed to fetch installations' });
    }
});

// Get user preferences
router.get('/api/preferences', requireAuth, async (req, res) => {
    const prefs = await getPreferences(req.user!.id);
    if (!prefs) {
        res.status(404).json({ error: 'Preferences not found' });
        return;
    }
    res.json(prefs);
});

// Allowed language codes (subset for validation)
const ALLOWED_LANGUAGES = new Set([
    'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi', 'nl', 
    'pl', 'tr', 'vi', 'th', 'id', 'ms', 'sv', 'da', 'no', 'fi', 'cs', 'sk', 'uk',
    'ro', 'hu', 'el', 'he', 'bg', 'hr', 'sr', 'sl', 'lt', 'lv', 'et', 'bn', 'ta',
    'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'ur', 'fa', 'sw', 'am', 'my', 'km', 'lo'
]);

// Update user preferences
router.post('/api/preferences', requireAuth, async (req, res) => {
    const { defaultTargetLanguage, autoTranslate, emailNotifications } = req.body;

    // Input validation
    const errors: string[] = [];

    // Validate defaultTargetLanguage
    if (defaultTargetLanguage !== undefined) {
        if (typeof defaultTargetLanguage !== 'string') {
            errors.push('defaultTargetLanguage must be a string');
        } else if (!ALLOWED_LANGUAGES.has(defaultTargetLanguage)) {
            errors.push(`defaultTargetLanguage must be a valid language code`);
        }
    }

    // Validate autoTranslate
    if (autoTranslate !== undefined && typeof autoTranslate !== 'boolean') {
        errors.push('autoTranslate must be a boolean');
    }

    // Validate emailNotifications
    if (emailNotifications !== undefined && typeof emailNotifications !== 'boolean') {
        errors.push('emailNotifications must be a boolean');
    }

    if (errors.length > 0) {
        res.status(400).json({ error: errors.join(', ') });
        return;
    }

    // Build sanitized update object with only allowed fields
    const sanitizedUpdates: {
        defaultTargetLanguage?: string;
        autoTranslate?: boolean;
        emailNotifications?: boolean;
    } = {};

    if (typeof defaultTargetLanguage === 'string' && ALLOWED_LANGUAGES.has(defaultTargetLanguage)) {
        sanitizedUpdates.defaultTargetLanguage = defaultTargetLanguage;
    }
    if (typeof autoTranslate === 'boolean') {
        sanitizedUpdates.autoTranslate = autoTranslate;
    }
    if (typeof emailNotifications === 'boolean') {
        sanitizedUpdates.emailNotifications = emailNotifications;
    }

    const updated = await updatePreferences(req.user!.id, sanitizedUpdates);

    if (!updated) {
        res.status(404).json({ error: 'User not found' });
        return;
    }

    res.json(updated);
});

// Get translation history
router.get('/api/history', requireAuth, async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const history = await getTranslationHistory(req.user!.id, limit);
    const stats = await getTranslationStats(req.user!.id);

    res.json({
        history,
        stats
    });
});

// Get install URL (public)
router.get('/api/install-url', (req, res) => {
    res.json({ url: getInstallUrl() });
});

// Debug endpoint (development only)
router.get('/api/debug/stats', async (req, res) => {
    if (config.isProd) {
        res.status(404).json({ error: 'Not found' });
        return;
    }
    res.json(await getStoreStats());
});

// ==================== Existing Routes ====================

// Webhook Handler
router.post('/webhooks/github', async (req, res) => {
    const id = req.header('x-github-delivery');
    const name = req.header('x-github-event');
    const signature = req.header('x-hub-signature-256');

    if (!id || !name || !signature) {
        res.status(400).send('Missing required webhook headers');
        return;
    }

    if (!req.rawBody) {
        res.status(400).send('Missing raw webhook payload');
        return;
    }

    const payload = req.rawBody.toString('utf8');

    try {
        await githubApp.webhooks.verifyAndReceive({
            id,
            name,
            payload,
            signature
        });
        res.status(200).send('Webhook processed');
    } catch (error) {
        const status = (error as { status?: number })?.status ?? 500;
        console.error('Webhook processing failed:', error);
        res.status(status).send(status === 400 ? 'Invalid webhook signature' : 'Server Error');
    }
});

// API: Get PR Content
router.get('/api/pr/:owner/:repo/:number', async (req, res) => {
    const { owner, repo, number } = req.params;
    try {
        // 1. Find Installation ID for this repo
        const installation = await githubApp.octokit.rest.apps.getRepoInstallation({
            owner,
            repo
        });

        // 2. Get Scoped Octokit
        const octokit = await githubApp.getInstallationOctokit(installation.data.id);

        // 3. Fetch PR
        const pr = await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number: parseInt(number)
        });

        res.json({
            title: pr.data.title,
            body: pr.data.body,
            url: pr.data.html_url,
            state: pr.data.state,
            number: pr.data.number,
            created_at: pr.data.created_at,
            user: {
                login: pr.data.user?.login,
                avatar_url: pr.data.user?.avatar_url
            },
            head: {
                ref: pr.data.head.ref,
                label: pr.data.head.label
            },
            base: {
                ref: pr.data.base.ref,
                label: pr.data.base.label
            }
        });
    } catch (error) {
        console.error("Error fetching PR:", error);
        res.status(404).json({ error: "PR not found or App not installed on this repo" });
    }
});

// API: Get PR Comments
router.get('/api/pr/:owner/:repo/:number/comments', async (req, res) => {
    const { owner, repo, number } = req.params;
    try {
        const installation = await githubApp.octokit.rest.apps.getRepoInstallation({ owner, repo });
        const octokit = await githubApp.getInstallationOctokit(installation.data.id);

        const comments = await octokit.rest.issues.listComments({
            owner,
            repo,
            issue_number: parseInt(number),
            per_page: 100
        });

        const formattedComments = comments.data.map((c: any) => ({
            id: c.id,
            user: {
                login: c.user?.login || 'Unknown',
                avatar_url: c.user?.avatar_url || ''
            },
            body: c.body,
            created_at: c.created_at
        }));

        res.json(formattedComments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
});

// API: Translate (with optional history tracking)
router.post('/api/translate', optionalAuth, async (req, res) => {
    const { text, targetLanguage, sourceLanguage, prInfo } = req.body;
    if (!text || !targetLanguage) {
        res.status(400).json({ error: "Missing text or targetLanguage" });
        return;
    }

    try {
        // sourceLanguage is optional - if not provided, will be auto-detected
        const translated = await translateMarkdown(text, targetLanguage, sourceLanguage);

        // Track translation if user is authenticated and PR info is provided
        if (req.user && prInfo) {
            // Validate prInfo before recording
            const owner = typeof prInfo.owner === 'string' ? prInfo.owner.trim() : '';
            const repo = typeof prInfo.repo === 'string' ? prInfo.repo.trim() : '';
            const prNumber = typeof prInfo.number === 'number' ? prInfo.number : parseInt(prInfo.number);
            
            if (!owner || !repo || !prNumber || isNaN(prNumber)) {
                console.warn('Invalid prInfo provided for translation history:', prInfo);
            } else {
                // Sanitize optional fields
                const prTitle = typeof prInfo.title === 'string' && prInfo.title.trim() 
                    ? prInfo.title.trim().slice(0, 200) 
                    : 'Unknown PR';
                const contentType = prInfo.contentType === 'comment' ? 'comment' : 'description';

                await addTranslationRecord({
                    userId: req.user.id,
                    owner,
                    repo,
                    prNumber,
                    prTitle,
                    sourceLanguage: sourceLanguage || 'auto',
                    targetLanguage,
                    contentType
                });
            }
        }

        res.json({ translation: translated });
    } catch (error) {
        console.error("Translation Error:", error);
        res.status(500).json({ error: "Translation failed" });
    }
});

export default router;
