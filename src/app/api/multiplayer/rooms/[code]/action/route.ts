import { NextResponse } from 'next/server';
import { getFirebaseConfigErrorMessage, isFirebaseConfigured } from '@/lib/firebase';
import {
  roomStoreClaimTeam,
  roomStoreForceSell,
  roomStoreLeave,
  roomStoreNext,
  roomStorePause,
  roomStorePlaceBid,
  roomStoreReset,
  roomStoreResume,
  roomStoreSkip,
  roomStoreStartAuction,
  roomStoreTick,
} from '@/lib/multiplayer/roomStore';

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
    const roomCode = code.trim();
    const body = await request.json();
    const { action, clientId, payload = {} } = body;

    let snapshot;
    switch (action) {
      case 'claim_team':
        snapshot = await roomStoreClaimTeam(roomCode, clientId, payload.teamId ?? null);
        break;
      case 'start_auction':
        snapshot = await roomStoreStartAuction(roomCode, clientId);
        break;
      case 'pause_auction':
        snapshot = await roomStorePause(roomCode, clientId);
        break;
      case 'resume_auction':
        snapshot = await roomStoreResume(roomCode, clientId);
        break;
      case 'place_bid':
        snapshot = await roomStorePlaceBid(roomCode, clientId, payload.teamId);
        break;
      case 'skip_player':
        snapshot = await roomStoreSkip(roomCode, clientId);
        break;
      case 'next_player':
        snapshot = await roomStoreNext(
          roomCode,
          clientId,
          payload.overrideName,
          payload.overrideBasePrice
        );
        break;
      case 'force_sell':
        snapshot = await roomStoreForceSell(
          roomCode,
          clientId,
          payload.teamId,
          payload.amount
        );
        break;
      case 'reset_auction':
        snapshot = await roomStoreReset(
          roomCode,
          clientId,
          payload.players,
          payload.teams
        );
        break;
      case 'tick':
        snapshot = await roomStoreTick(roomCode, clientId);
        break;
      case 'leave':
        await roomStoreLeave(roomCode, clientId);
        return NextResponse.json({ ok: true });
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ snapshot });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Action failed' },
      { status: 400 }
    );
  }
}
