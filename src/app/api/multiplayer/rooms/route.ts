import { NextResponse } from 'next/server';
import { isFirebaseConfigured } from '@/lib/firebase';
import { roomStoreCreate } from '@/lib/multiplayer/roomStore';

const FIREBASE_MISSING =
  'Firebase is not configured. Add all NEXT_PUBLIC_FIREBASE_* variables in Vercel → Settings → Environment Variables, then redeploy. See FIREBASE_SETUP.md.';

export async function POST(request: Request) {
  if (!isFirebaseConfigured()) {
    return NextResponse.json({ error: FIREBASE_MISSING }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { hostName, clientId, players, teams } = body;
    if (!hostName || !clientId || !players || !teams) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const snapshot = await roomStoreCreate(hostName, clientId, players, teams);
    return NextResponse.json({ snapshot });
  } catch (err) {
    console.error('[api] create room', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create room' },
      { status: 500 }
    );
  }
}
