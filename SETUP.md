# 🛠️ Local Development Setup

This guide walks you through setting up repoLingo for local development.

> **Note:** For a quick demo, visit the [live application](https://repo-lingo-client.vercel.app/) instead.

---

## 📋 Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **GitHub Account**
- A **Lingo.dev API Key** ([get one here](https://lingo.dev))

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/repoLingo.git
cd repoLingo

# Install dependencies (uses npm workspaces)
npm install

# Set up environment variables
cp server/.env.example server/.env
# Edit server/.env with your credentials

# Start development servers
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |

---

## ⚙️ Environment Variables

Create a `.env` file in the `server/` directory:

```env
# ═══════════════════════════════════════════════════════════
# GitHub App Configuration
# ═══════════════════════════════════════════════════════════
APP_ID=<your-github-app-id>
PRIVATE_KEY=<your-github-app-private-key-with-\n-for-newlines>
WEBHOOK_SECRET=<your-webhook-secret>
GITHUB_APP_SLUG=repoLingo

# ═══════════════════════════════════════════════════════════
# GitHub OAuth (for user authentication)
# ═══════════════════════════════════════════════════════════
GITHUB_CLIENT_ID=<your-oauth-client-id>
GITHUB_CLIENT_SECRET=<your-oauth-client-secret>

# ═══════════════════════════════════════════════════════════
# Translation API
# ═══════════════════════════════════════════════════════════
LINGO_API_KEY=<your-lingo-dev-api-key>

# ═══════════════════════════════════════════════════════════
# URLs
# ═══════════════════════════════════════════════════════════
FRONTEND_URL=http://localhost:5173
DASHBOARD_URL=http://localhost:5173
PORT=3000

# ═══════════════════════════════════════════════════════════
# Webhook Proxy (for local development)
# ═══════════════════════════════════════════════════════════
WEBHOOK_PROXY_URL=<your-smee.io-url>
```

---

## 🔧 Creating a GitHub App

1. Go to **GitHub Settings** → **Developer Settings** → **GitHub Apps**
2. Click **New GitHub App**
3. Configure the following:

| Setting | Value |
|---------|-------|
| Homepage URL | `http://localhost:5173` |
| Callback URL | `http://localhost:3000/auth/github/callback` |
| Webhook URL | Your [smee.io](https://smee.io) proxy URL |
| Webhook Secret | Generate a secure secret |

4. Set **Permissions**:
   - Pull requests: **Read & Write**
   - Issues: **Read & Write**
   - Contents: **Read**

5. Generate a **Private Key** and download it
6. Note your **App ID**, **Client ID**, and **Client Secret**

---

## 📜 Available Scripts

### Root Commands

```bash
npm run dev          # Start client + server concurrently
npm run build        # Build all workspaces
npm run lint         # Lint all workspaces
```

### Client Commands

```bash
npm run dev --workspace=@repo-lingo/client      # Vite dev server (port 5173)
npm run build --workspace=@repo-lingo/client    # Production build
npm run preview --workspace=@repo-lingo/client  # Preview build
```

### Server Commands

```bash
npm run dev --workspace=@repo-lingo/server      # Dev server with hot reload
npm run build --workspace=@repo-lingo/server    # Compile TypeScript
npm run start --workspace=@repo-lingo/server    # Production server
npm run proxy --workspace=@repo-lingo/server    # Start webhook proxy
```

---

## 🔌 API Reference

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/github` | Initiate GitHub OAuth |
| `GET` | `/auth/github/callback` | OAuth callback handler |
| `GET` | `/auth/logout` | Clear session and logout |
| `GET` | `/auth/me` | Get current user info |

### Protected Endpoints (requires authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/installations` | List GitHub App installations |
| `GET` | `/api/preferences` | Get user preferences |
| `POST` | `/api/preferences` | Update user preferences |
| `GET` | `/api/history` | Get translation history |

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/pr/:owner/:repo/:number` | Fetch PR details |
| `GET` | `/api/pr/:owner/:repo/:number/comments` | Fetch PR comments |
| `POST` | `/api/translate` | Translate text |
| `GET` | `/api/install-url` | Get GitHub App install URL |
| `POST` | `/webhooks/github` | GitHub webhook handler |

---

## 🧪 Webhook Development

For local webhook testing:

```bash
# Terminal 1: Start the app
npm run dev

# Terminal 2: Start webhook proxy
cd server
npm run proxy
```

This uses [smee.io](https://smee.io/) to forward GitHub webhooks to your local server.

---

## 📁 Detailed Project Structure

```
repoLingo/
├── client/                 # React 19 + Vite 7 frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── CommentCard.tsx
│   │   │   ├── LanguageSelector.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── PRMetadataHeader.tsx
│   │   │   └── ...
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── TranslationPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── App.tsx
│   │   ├── languages.ts
│   │   └── index.css
│   └── public/
│
├── server/
│   └── src/
│       ├── index.ts        # Express app entry
│       ├── routes.ts       # API routes
│       ├── auth.ts         # OAuth handlers
│       ├── middleware.ts   # Auth middleware
│       ├── translation.ts  # Lingo.dev integration
│       ├── markdown.ts     # Code block protection
│       ├── github.ts       # GitHub App setup
│       └── store.ts        # Data store
│
└── package.json            # Workspace config
```

---

## ❓ Troubleshooting

### OAuth Callback Error
- Ensure your GitHub App callback URL matches `http://localhost:3000/auth/github/callback`

### Webhooks Not Received
- Make sure smee proxy is running (`npm run proxy`)
- Verify webhook URL in GitHub App settings

### Translation Fails
- Check your Lingo.dev API key is valid
- Ensure the translation endpoint is accessible

---

<p align="center">
  <a href="README.md">← Back to README</a>
</p>
