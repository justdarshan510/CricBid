import { isFirebaseConfigured } from '../firebase';
import { getApiMultiplayerService } from './apiMultiplayer';
import { getFirebaseMultiplayerService } from './firebaseMultiplayer';
import { isDeployedProduction } from './host';
import { getSocketMultiplayerService } from './socketMultiplayer';
import type { IMultiplayerService } from './types';

export type { IMultiplayerService, MultiplayerEvent, MultiplayerEventMap, RoomSnapshot } from './types';
export { PRODUCTION_FIREBASE_SETUP_MESSAGE, LOCAL_SOCKET_SETUP_MESSAGE } from './host';

export function getMultiplayerMode(): 'firebase' | 'socket' {
  if (isFirebaseConfigured()) return 'firebase';
  if (typeof window !== 'undefined' && isDeployedProduction()) return 'firebase';
  return 'socket';
}

/** SSR-safe: do not branch on `window` (causes hydration mismatch). */
export function isMultiplayerConfigured(): boolean {
  return true;
}

/** Live site: Firebase env → Firebase; else Vercel KV via API routes. Local: Socket.io. */
export function getMultiplayerService(): IMultiplayerService {
  if (isFirebaseConfigured()) {
    return getFirebaseMultiplayerService();
  }
  if (typeof window !== 'undefined' && isDeployedProduction()) {
    return getApiMultiplayerService();
  }
  return getSocketMultiplayerService();
}
