import { NextResponse } from 'next/server';
import { getFirebaseConfigErrorMessage, isFirebaseConfigured } from '@/lib/firebase';
import { roomStoreGet } from '@/lib/multiplayer/roomStore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!isFirebaseConfigured()) {
    return NextResponse.json({ error: getFirebaseConfigErrorMessage() }, { status: 503 });
  }

  const { code } = await params;
  const snapshot = await roomStoreGet(code.trim());
  if (!snapshot) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  return NextResponse.json({ snapshot });
}
