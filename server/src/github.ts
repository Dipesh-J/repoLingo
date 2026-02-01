import { App } from 'octokit';
import dotenv from 'dotenv';

dotenv.config();

const appId = process.env.APP_ID;
const privateKey = process.env.PRIVATE_KEY;

if (!appId || !privateKey) {
  console.error("CRITICAL: APP_ID or PRIVATE_KEY missing in server/.env");
}

export const githubApp = new App({
  appId: appId || "0",
  privateKey: privateKey ? privateKey.replace(/\\n/g, '\n') : "INVALID_KEY",
  webhooks: {
    secret: process.env.WEBHOOK_SECRET || "development",
  },
});
