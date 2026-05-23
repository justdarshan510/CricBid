import { kv } from '@vercel/kv';

export function isKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export function getKv() {
  if (!isKvConfigured()) {
    throw new Error('Vercel KV is not configured');
  }
  return kv;
}

const ROOM_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export async function kvSetRoom(roomCode: string, value: unknown): Promise<void> {
  await getKv().set(`cricbid:room:${roomCode}`, value, { ex: ROOM_TTL_SECONDS });
}

export async function kvGetRoom<T>(roomCode: string): Promise<T | null> {
  return getKv().get<T>(`cricbid:room:${roomCode}`);
}

export async function kvDeleteRoom(roomCode: string): Promise<void> {
  await getKv().del(`cricbid:room:${roomCode}`);
}
