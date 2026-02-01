import { Router } from 'express';
import { githubApp } from './github.js';
import { translateMarkdown } from './translation.js';

const router = Router();

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

// API: Translate
router.post('/api/translate', async (req, res) => {
    const { text, targetLanguage, sourceLanguage } = req.body;
    if (!text || !targetLanguage) {
         res.status(400).json({ error: "Missing text or targetLanguage" });
         return;
    }

    try {
        // sourceLanguage is optional - if not provided, will be auto-detected
        const translated = await translateMarkdown(text, targetLanguage, sourceLanguage);
        res.json({ translation: translated });
    } catch (error) {
        console.error("Translation Error:", error);
        res.status(500).json({ error: "Translation failed" });
    }
});

export default router;
