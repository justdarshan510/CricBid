import { NextResponse } from 'next/server';
import { getFirebaseConfigErrorMessage, isFirebaseConfigured } from '@/lib/firebase';
import { roomStoreJoin } from '@/lib/multiplayer/roomStore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!isFirebaseConfigured()) {
    return NextResponse.json({ error: getFirebaseConfigErrorMessage() }, { status: 503 });
  }

  try {
    const { code } = await params;
    const body = await request.json();
    const { playerName, clientId } = body;
    const snapshot = await roomStoreJoin(code.trim(), playerName, clientId);
    return NextResponse.json({ snapshot });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Join failed' },
      { status: 400 }
    );
  }
}
