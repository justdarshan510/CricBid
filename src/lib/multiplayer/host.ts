/** True when the app runs on Vercel (or similar) without a local Socket.io server. */
export function isDeployedProduction(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
    return false;
  }
  return (
    host.endsWith('.vercel.app') ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
  );
}

export const PRODUCTION_FIREBASE_SETUP_MESSAGE =
  'Multiplayer storage not ready. In Vercel open your project → Storage → Create Database → KV → connect to CricBid → Redeploy. (Optional: add Firebase env vars instead — see FIREBASE_SETUP.md.)';

export const LOCAL_SOCKET_SETUP_MESSAGE =
  'Cannot reach the game server. Run npm run dev (starts Socket.io and Next.js). Do not use npm run dev:next for multiplayer.';
