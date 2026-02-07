import { githubApp } from './github.js';
import { config } from './config.js';

// Setup Event Listeners
export function setupListeners() {
    githubApp.webhooks.on("pull_request.opened", async ({ octokit, payload }) => {
        console.log(`PR Opened: ${payload.pull_request.title}`);
        await createTranslationCheckRun(octokit, payload);
    });

    githubApp.webhooks.on("pull_request.synchronize", async ({ octokit, payload }) => {
        console.log(`PR Updated: ${payload.pull_request.title}`);
        await createTranslationCheckRun(octokit, payload);
    });
}

async function createTranslationCheckRun(octokit: any, payload: any) {
    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const head_sha = payload.pull_request.head.sha;

    try {
        await octokit.rest.checks.create({
            owner,
            repo,
            name: "Lingo Translator",
            head_sha,
            status: "completed",
            conclusion: "neutral",
            output: {
                title: "Translation Available",
                summary: "Click 'Details' to view this PR in other languages.",
                text: `[Open Translation Dashboard](${config.dashboardUrl}/translate/${owner}/${repo}/pr/${payload.number})`
            },
            details_url: `${config.dashboardUrl}/translate/${owner}/${repo}/pr/${payload.number}`
        });
        console.log("Check Run created successfully");
    } catch (error) {
        console.error("Error creating check run:", error);
    }
}
