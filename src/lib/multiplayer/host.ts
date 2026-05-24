export const PRODUCTION_FIREBASE_SETUP_MESSAGE =
  'Firebase is not configured on this deployment. In Vercel → Settings → Environment Variables, add all NEXT_PUBLIC_FIREBASE_* keys from .env.example, then redeploy. See FIREBASE_SETUP.md.';

export const LOCAL_SOCKET_SETUP_MESSAGE =
  'Cannot reach the game server. Run npm run dev (starts Socket.io and Next.js). Do not use npm run dev:next for multiplayer.';

/** True when the app runs on the public internet (not local dev). */
export function isDeployedProduction(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.local') ||
    host.startsWith('192.168.') ||
    host.startsWith('10.')
  ) {
    return false;
  }
  return true;
}
