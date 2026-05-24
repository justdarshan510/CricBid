export const VOICE_PREF_KEY = 'cricbid_voice_enabled';

export function readVoiceEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(VOICE_PREF_KEY);
  if (stored === null) return true;
  return stored === 'true';
}

export function writeVoiceEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VOICE_PREF_KEY, String(enabled));
}
