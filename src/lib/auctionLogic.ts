import { Player } from '../data/players';
import { Team } from '../data/teams';

export type AuctionStatus =
  | 'idle'
  | 'bidding'
  | 'sold_splash'
  | 'unsold_splash'
  | 'completed';

export interface RoomWinner {
  player: Player;
  team: Team;
  price: number;
}

export interface RoomGameState {
  code: string;
  hostId: string;
  started: boolean;
  isPaused: boolean;
  auctionStatus: AuctionStatus;
  players: Player[];
  teams: Team[];
  currentPlayerIndex: number;
  currentBid: number;
  currentBidderId: string | null;
  timer: number;
  logs: string[];
  lastWinner: RoomWinner | null;
}

export function getNextBidAmount(currentBid: number, basePrice: number): number {
  if (currentBid === 0) return basePrice;
  if (currentBid < 2.0) return parseFloat((currentBid + 0.1).toFixed(2));
  if (currentBid < 5.0) return parseFloat((currentBid + 0.2).toFixed(2));
  if (currentBid < 10.0) return parseFloat((currentBid + 0.5).toFixed(2));
  if (currentBid < 20.0) return parseFloat((currentBid + 1.0).toFixed(2));
  return parseFloat((currentBid + 2.0).toFixed(2));
}

export function analyzeSquad(squad: Player[]) {
  const overseasCount = squad.filter((p) => p.overseas).length;
  return { overseasCount };
}

export function getActivePool(players: Player[]): Player[] {
  return players.filter((p) => p.status === 'pool' || p.status === 'active');
}

/** Player currently on the block (status `active`), with index fallback. */
export function getCurrentAuctionPlayer(
  players: Player[],
  currentPlayerIndex: number
): Player | null {
  const onBlock = players.find((p) => p.status === 'active');
  if (onBlock) return onBlock;
  const pool = getActivePool(players);
  return pool[currentPlayerIndex] ?? pool[0] ?? null;
}

export function activePlayerIndex(players: Player[], playerId: string): number {
  const pool = getActivePool(players);
  const idx = pool.findIndex((p) => p.id === playerId);
  return idx >= 0 ? idx : 0;
}

export function handleTimerEnd(room: RoomGameState): RoomGameState {
  const p = getCurrentAuctionPlayer(room.players, room.currentPlayerIndex);
  if (!p) return room;

  const next: RoomGameState = { ...room, logs: [...room.logs] };

  if (room.currentBidderId) {
    const winningTeam = room.teams.find((t) => t.id === room.currentBidderId);
    if (winningTeam) {
      next.lastWinner = { player: p, team: winningTeam, price: room.currentBid };
      next.auctionStatus = 'sold_splash';
      next.isPaused = true;
      next.players = room.players.map((pl) =>
        pl.id === p.id
          ? { ...pl, status: 'sold' as const, sold_to: winningTeam.id, sold_price: room.currentBid }
          : pl
      );
      next.teams = room.teams.map((t) =>
        t.id === winningTeam.id
          ? {
              ...t,
              purse: parseFloat((t.purse - room.currentBid).toFixed(2)),
              players: [
                ...t.players,
                {
                  ...p,
                  status: 'sold' as const,
                  sold_to: winningTeam.id,
                  sold_price: room.currentBid,
                },
              ],
            }
          : t
      );
      next.logs.unshift(
        `SOLD! ${p.name} bought by ${winningTeam.name} for ${room.currentBid.toFixed(2)} Cr!`
      );
    }
  } else {
    next.auctionStatus = 'unsold_splash';
    next.isPaused = true;
    next.players = room.players.map((pl) =>
      pl.id === p.id ? { ...pl, status: 'unsold' as const } : pl
    );
    next.logs.unshift(`PASSED: ${p.name} goes unsold.`);
  }

  return next;
}

export function validateBid(
  room: RoomGameState,
  teamId: string,
  clientTeamId: string | null
): { ok: true; nextBid: number } | { ok: false; error: string } {
  if (room.isPaused || room.auctionStatus !== 'bidding') {
    return { ok: false, error: 'Auction is not accepting bids.' };
  }

  const p = getCurrentAuctionPlayer(room.players, room.currentPlayerIndex);
  if (!p) return { ok: false, error: 'No player on the block.' };

  const nextBid = getNextBidAmount(room.currentBid, p.base_price);
  const team = room.teams.find((t) => t.id === teamId);
  if (!team) return { ok: false, error: 'Invalid team.' };
  if (clientTeamId !== teamId) {
    return { ok: false, error: 'You must claim the team before bidding.' };
  }

  const squadRep = analyzeSquad(team.players);
  if (p.overseas && squadRep.overseasCount >= 8) {
    return { ok: false, error: 'Overseas limit of 8 reached.' };
  }
  if (team.players.length >= 25) {
    return { ok: false, error: 'Squad limit of 25 reached.' };
  }
  if (team.purse < nextBid) {
    return { ok: false, error: 'Insufficient purse.' };
  }

  return { ok: true, nextBid };
}

export function applyBid(
  room: RoomGameState,
  teamId: string,
  nextBid: number,
  bidderName: string
): RoomGameState {
  const team = room.teams.find((t) => t.id === teamId)!;
  const timer = 20;
  const logs = [
    `${bidderName} (${team.shortName}) bids ${nextBid.toFixed(2)} Cr`,
    ...room.logs,
  ];
  return {
    ...room,
    currentBid: nextBid,
    currentBidderId: teamId,
    timer,
    logs,
  };
}

export function startAuctionState(room: RoomGameState): RoomGameState {
  const roomPlayers = room.players ?? [];
  const activePool = getActivePool(roomPlayers);
  const p = activePool[0];
  let players = roomPlayers;
  let logs = [...(room.logs ?? [])];

  if (p) {
    players = roomPlayers.map((pl) =>
      pl.id === p.id ? { ...pl, status: 'active' as const } : pl
    );
    logs.unshift(`Player under the hammer: ${p.name} (Base Price: ${p.base_price} Cr)`);
  }

  const hammerPlayer = p ? getCurrentAuctionPlayer(players, 0) : null;

  return {
    ...room,
    started: true,
    auctionStatus: 'bidding',
    isPaused: false,
    currentPlayerIndex: hammerPlayer ? activePlayerIndex(players, hammerPlayer.id) : 0,
    currentBid: 0,
    currentBidderId: null,
    timer: 20,
    lastWinner: null,
    players,
    logs,
  };
}

export function skipPlayerState(room: RoomGameState): RoomGameState {
  const p = getCurrentAuctionPlayer(room.players, room.currentPlayerIndex);
  if (!p) return room;

  return {
    ...room,
    auctionStatus: 'unsold_splash',
    isPaused: true,
    players: room.players.map((pl) =>
      pl.id === p.id ? { ...pl, status: 'unsold' as const } : pl
    ),
    logs: [`SKIPPED: ${p.name} marked unsold immediately.`, ...room.logs],
  };
}

export function nextPlayerState(
  room: RoomGameState,
  overrideName?: string,
  overrideBasePrice?: number
): RoomGameState {
  let players = [...room.players];
  let logs = [...room.logs];

  if (overrideName) {
    const cleanName = overrideName.toLowerCase().trim();
    const targetIndex = players.findIndex(
      (p) =>
        (p.status === 'pool' || p.status === 'unsold' || p.status === 'active') &&
        p.name.toLowerCase().includes(cleanName)
    );

    if (targetIndex !== -1) {
      const targetPlayer = { ...players[targetIndex] };
      targetPlayer.status = 'pool';
      if (overrideBasePrice !== undefined && !isNaN(overrideBasePrice)) {
        targetPlayer.base_price = overrideBasePrice;
      }
      players.splice(targetIndex, 1);
      let insertIndex = players.findIndex((p) => p.status === 'pool');
      if (insertIndex === -1) insertIndex = 0;
      players.splice(insertIndex, 0, targetPlayer);
      logs.unshift(`Voice Override: Bringing up ${targetPlayer.name} next!`);
    }
  }

  const remainingPool = getActivePool(players);

  if (remainingPool.length <= 1) {
    return {
      ...room,
      players,
      logs,
      auctionStatus: 'completed',
      isPaused: true,
    };
  }

  const nextP = remainingPool[0];
  if (nextP) {
    logs.unshift(`Player under the hammer: ${nextP.name} (Base Price: ${nextP.base_price} Cr)`);
    players = players.map((pl) =>
      pl.id === nextP.id ? { ...pl, status: 'active' as const } : pl
    );
  }

  const hammerPlayer = nextP ? getCurrentAuctionPlayer(players, 0) : null;

  return {
    ...room,
    players,
    logs,
    currentBid: 0,
    currentBidderId: null,
    timer: 20,
    auctionStatus: 'bidding',
    isPaused: false,
    lastWinner: null,
    currentPlayerIndex: hammerPlayer ? activePlayerIndex(players, hammerPlayer.id) : 0,
  };
}

export function forceSellState(
  room: RoomGameState,
  teamId: string,
  amount: number
): RoomGameState {
  const withBid = {
    ...room,
    currentBid: amount,
    currentBidderId: teamId,
    logs: ['Voice Action: Manual force sale initiated by Host.', ...room.logs],
  };
  return handleTimerEnd(withBid);
}
