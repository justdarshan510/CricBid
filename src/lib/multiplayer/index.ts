import { isFirebaseConfigured } from '../firebase';
import { getFirebaseMultiplayerService } from './firebaseMultiplayer';
import { isDeployedProduction } from './host';
import { getSocketMultiplayerService } from './socketMultiplayer';
import { getStubMultiplayerService } from './stubMultiplayer';
import type { IMultiplayerService } from './types';

export type { IMultiplayerService, MultiplayerEvent, MultiplayerEventMap, RoomSnapshot } from './types';
export { PRODUCTION_FIREBASE_SETUP_MESSAGE, LOCAL_SOCKET_SETUP_MESSAGE } from './host';

export function getMultiplayerMode(): 'firebase' | 'socket' {
  if (isFirebaseConfigured()) return 'firebase';
  return 'socket';
}

/** SSR-safe: do not branch on `window` (causes hydration mismatch). */
export function isMultiplayerConfigured(): boolean {
  return isFirebaseConfigured() || true;
}

/** Firebase Realtime Database on live deploy; Socket.io for local dev without Firebase. */
export function getMultiplayerService(): IMultiplayerService {
  if (isFirebaseConfigured()) {
    return getFirebaseMultiplayerService();
  }
  if (typeof window !== 'undefined' && isDeployedProduction()) {
    return getStubMultiplayerService();
  }
  return getSocketMultiplayerService();
}
