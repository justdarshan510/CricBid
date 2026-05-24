import { NextResponse } from 'next/server';
import { isFirebaseConfigured } from '@/lib/firebase';
import { roomStoreGet } from '@/lib/multiplayer/roomStore';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!isFirebaseConfigured()) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 503 });
  }

  const { code } = await params;
  const snapshot = await roomStoreGet(code.trim());
  if (!snapshot) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  return NextResponse.json({ snapshot });
}
