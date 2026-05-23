import { NextResponse } from 'next/server';
import { isKvConfigured } from '@/lib/kv';
import { roomStoreGet } from '@/lib/multiplayer/roomStore';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!isKvConfigured()) {
    return NextResponse.json({ error: 'KV not configured' }, { status: 503 });
  }

  const { code } = await params;
  const snapshot = await roomStoreGet(code.trim());
  if (!snapshot) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  return NextResponse.json({ snapshot });
}
