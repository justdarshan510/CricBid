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
  'Live multiplayer needs Firebase. In the Firebase Console create a project and enable Realtime Database, then add all NEXT_PUBLIC_FIREBASE_* variables in Vercel → Settings → Environment Variables (see .env.example in the repo) and redeploy.';

export const LOCAL_SOCKET_SETUP_MESSAGE =
  'Cannot reach the game server. Run npm run dev (starts Socket.io and Next.js). Do not use npm run dev:next for multiplayer.';
