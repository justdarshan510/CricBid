export type PersistedMultiplayerSession = {
  uid: string;
  roomCode: string;
  playerName: string;
  teamId: string | null;
};

const STORAGE_KEY = 'cricbid_multiplayer_session_v1';

export function readPersistedMultiplayerSession(): PersistedMultiplayerSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedMultiplayerSession;
  } catch {
    return null;
  }
}

export function writePersistedMultiplayerSession(session: PersistedMultiplayerSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearPersistedMultiplayerSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

