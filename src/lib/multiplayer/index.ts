import { isFirebaseConfiguredOnClient } from '../firebase';
import { getApiMultiplayerService } from './apiMultiplayer';
import { getFirebaseMultiplayerService } from './firebaseMultiplayer';
import { isDeployedProduction } from './host';
import { getSocketMultiplayerService } from './socketMultiplayer';
import type { IMultiplayerService } from './types';

export type { IMultiplayerService, MultiplayerEvent, MultiplayerEventMap, RoomSnapshot } from './types';
export { PRODUCTION_FIREBASE_SETUP_MESSAGE, LOCAL_SOCKET_SETUP_MESSAGE } from './host';

export function getMultiplayerMode(): 'firebase' | 'socket' {
  if (typeof window !== 'undefined' && isDeployedProduction()) return 'firebase';
  if (isFirebaseConfiguredOnClient()) return 'firebase';
  return 'socket';
}

export function isMultiplayerConfigured(): boolean {
  return true;
}

/**
 * Live Vercel: API routes → Firebase on server (works with runtime env vars).
 * Local + NEXT_PUBLIC Firebase: direct Realtime Database client.
 * Local without Firebase: Socket.io via npm run dev.
 */
export function getMultiplayerService(): IMultiplayerService {
  if (typeof window !== 'undefined' && isDeployedProduction()) {
    return getApiMultiplayerService();
  }
  if (isFirebaseConfiguredOnClient()) {
    return getFirebaseMultiplayerService();
  }
  return getSocketMultiplayerService();
}
