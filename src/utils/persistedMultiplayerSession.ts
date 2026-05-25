export interface PersistedSession {
  uid: string;
  roomCode: string;
  playerName: string;
  teamId: string | null;
}

const STORAGE_KEY = 'cricbid_multiplayer_session';

export function writePersistedMultiplayerSession(session: PersistedSession | null): void {
  if (typeof window === 'undefined') return;
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
}

export function readPersistedMultiplayerSession(): PersistedSession | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function clearPersistedMultiplayerSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
