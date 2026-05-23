# Vercel KV — one-click multiplayer (no Firebase required)

1. Open [Vercel Dashboard](https://vercel.com) → your **CricBid** project.
2. Go to **Storage** → **Create Database** → choose **KV** → name it (e.g. `cricbid-kv`).
3. When asked, **connect** the database to the CricBid project (Production + Preview).
4. **Deployments** → **Redeploy** the latest `main` branch (required after linking KV).
5. Open your live `/lobby` → **Create Room** — you should get a 6-digit code.

Vercel injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically. No manual copy/paste.

**Local testing with KV:** link the same KV store to a Vercel env pull, or use Firebase / `npm run dev` (Socket.io).
