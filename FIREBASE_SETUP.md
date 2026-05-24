# Firebase multiplayer setup (CricBid)

**Room codes on your Vercel URL require this setup.** Localhost can use `npm run dev` (Socket.io) without Firebase.

Multiplayer uses **Firebase Realtime Database** on Vercel (Socket.io does not run on Vercel).

## Quick: Vercel (5 minutes)

1. [Firebase Console](https://console.firebase.google.com) → **Create project** → **Realtime Database** → **Create** (start in **test mode** for now).
2. Project **Settings** (gear) → **Your apps** → **Web** (`</>`) → copy the config values.
3. [Vercel Dashboard](https://vercel.com) → your **CricBid** project → **Settings** → **Environment Variables**.
4. Add each variable from `.env.example` (all `NEXT_PUBLIC_FIREBASE_*`). Apply to **Production** and **Preview**.

### Old domain works, new Vercel domain does not

Each **Vercel project** has its own environment variables. A custom domain on project A does not share env with project B.

1. Open the **working** Vercel project → Settings → Environment Variables.
2. Copy all 7 `NEXT_PUBLIC_FIREBASE_*` values.
3. Open the **new** Vercel project (the one serving the new domain) → Settings → Environment Variables → paste the same keys and values.
4. For each variable, check **Production** and **Preview** (not Development only).
5. **Redeploy** the new project and disable **Use existing Build Cache**.

Check: open `https://YOUR-NEW-DOMAIN/api/multiplayer/status` — `configured` should be `true`.
5. **Deployments** → **Redeploy** the latest `main` branch (must rebuild after env changes).
6. Open `/lobby` on your live URL → **Create Room** — you should get a 6-digit code.

## 1. Create Firebase project

1. Open [Firebase Console](https://console.firebase.google.com) and create a project (or use an existing one).
2. Add a **Web app** and copy the config object.

## 2. Enable Realtime Database

1. In the console: **Build → Realtime Database → Create database**.
2. Start in **test mode** for development, or deploy rules from this repo:

   ```bash
   npx -y firebase-tools@latest deploy --only database
   ```

   (Requires `firebase init` linked to your project first.)

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in values from the Firebase web app config.

On **Vercel**: Project → Settings → Environment Variables → add the same `NEXT_PUBLIC_FIREBASE_*` keys for Production (and Preview if needed), then redeploy.

## 4. Run locally

```bash
npm install
npm run dev
```

Use `next dev` (not `server.js`). Socket.io is no longer used.

## Notes

- The **host** client runs the auction timer and writes ticks to Firebase.
- `database.rules.json` is open for demo use; tighten rules (auth, validation) before production traffic.
