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

        // Use the user's access token to fetch their installations
        const response = await fetch('https://api.github.com/user/installations', {
            headers: {
                'Authorization': `Bearer ${user.accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'repoLingo'
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch installations:', response.status);
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

        // For each installation, fetch the repositories
        const installationsWithRepos = await Promise.all(
            data.installations.map(async (installation) => {
                try {
                    const reposResponse = await fetch(
                        `https://api.github.com/user/installations/${installation.id}/repositories`,
                        {
                            headers: {
                                'Authorization': `Bearer ${user.accessToken}`,
                                'Accept': 'application/vnd.github.v3+json',
                                'User-Agent': 'repoLingo'
                            }
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
                    console.error(`Error fetching repos for installation ${installation.id}:`, err);
                }

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

// Update user preferences
router.post('/api/preferences', requireAuth, async (req, res) => {
    const { defaultTargetLanguage, autoTranslate, emailNotifications } = req.body;

    const updated = await updatePreferences(req.user!.id, {
        defaultTargetLanguage,
        autoTranslate,
        emailNotifications
    });

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
    if (process.env.NODE_ENV === 'production') {
        res.status(404).json({ error: 'Not found' });
        return;
    }
    res.json(await getStoreStats());
});

// ==================== Existing Routes ====================

// Webhook Handler
router.post('/webhooks/github', async (req, res) => {
    const id = req.headers['x-github-delivery'] as string;
    const name = req.headers['x-github-event'] as any;
    const payload = req.body;

    try {
        await githubApp.webhooks.receive({
            id,
            name,
            payload,
        });
        res.status(200).send('Webhook processed');
    } catch (error) {
        console.error('Webhook processing failed:', error);
        res.status(500).send('Server Error');
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
            await addTranslationRecord({
                userId: req.user.id,
                owner: prInfo.owner,
                repo: prInfo.repo,
                prNumber: prInfo.number,
                prTitle: prInfo.title || 'Unknown PR',
                sourceLanguage: sourceLanguage || 'auto',
                targetLanguage,
                contentType: prInfo.contentType || 'description'
            });
        }

        res.json({ translation: translated });
    } catch (error) {
        console.error("Translation Error:", error);
        res.status(500).json({ error: "Translation failed" });
    }
});

export default router;
