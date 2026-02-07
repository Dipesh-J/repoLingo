import { App } from 'octokit';
import { config } from './config.js';

if (!config.appId || !config.privateKey) {
  console.error("CRITICAL: APP_ID or PRIVATE_KEY missing in server/.env");
}

export const githubApp = new App({
  appId: config.appId || "0",
  privateKey: config.privateKey || "INVALID_KEY",
  webhooks: {
    secret: config.webhookSecret,
  },
});

