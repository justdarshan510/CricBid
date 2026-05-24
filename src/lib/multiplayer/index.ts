import { isFirebaseConfiguredOnClient } from '../firebase';
import { getApiMultiplayerService } from './apiMultiplayer';
import { getFirebaseMultiplayerService } from './firebaseMultiplayer';
import { isDeployedProduction } from './host';
import { getSocketMultiplayerService } from './socketMultiplayer';
import type { IMultiplayerService } from './types';

export type { IMultiplayerService, MultiplayerEvent, MultiplayerEventMap, RoomSnapshot } from './types';
export { PRODUCTION_FIREBASE_SETUP_MESSAGE, LOCAL_SOCKET_SETUP_MESSAGE } from './host';

export function getMultiplayerMode(): 'firebase' | 'socket' {
  if (isFirebaseConfiguredOnClient()) return 'firebase';
  if (typeof window !== 'undefined' && isDeployedProduction()) return 'firebase';
  return 'socket';
}

export function isMultiplayerConfigured(): boolean {
  return true;
}

/**
 * Prefer direct Firebase client when NEXT_PUBLIC_* are in the build (after Vercel env + redeploy).
 * Fall back to API routes on live deploy only if client config is missing.
 * Local without Firebase: Socket.io via npm run dev.
 */
export function getMultiplayerService(): IMultiplayerService {
  if (isFirebaseConfiguredOnClient()) {
    return getFirebaseMultiplayerService();
  }
  if (typeof window !== 'undefined' && isDeployedProduction()) {
    return getApiMultiplayerService();
  }
  return getSocketMultiplayerService();
}
