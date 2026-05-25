export type PersistedAuthUser = {
  uid: string;
  name: string | null;
  email: string | null;
  photoURL: string | null;
};

const STORAGE_KEY = 'cricbid_auth_user';

export function readPersistedAuthUser(): PersistedAuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedAuthUser;
  } catch {
    return null;
  }
}

export function writePersistedAuthUser(user: PersistedAuthUser | null): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

