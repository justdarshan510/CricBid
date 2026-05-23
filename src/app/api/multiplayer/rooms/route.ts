import { NextResponse } from 'next/server';
import { isKvConfigured } from '@/lib/kv';
import { roomStoreCreate } from '@/lib/multiplayer/roomStore';

export async function POST(request: Request) {
  if (!isKvConfigured()) {
    return NextResponse.json(
      {
        error:
          'Vercel KV not linked. In Vercel: Storage → Create Database → KV → connect to this project → Redeploy.',
      },
      { status: 503 }
    );
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
