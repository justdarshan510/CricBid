import { Player } from '../../data/players';
import { Team } from '../../data/teams';
import {
  applyBid,
  forceSellState,
  handleTimerEnd,
  nextPlayerState,
  skipPlayerState,
  startAuctionState,
  validateBid,
} from '../auctionLogic';
import { isKvConfigured, kvDeleteRoom, kvGetRoom, kvSetRoom } from '../kv';
import { compactPlayersForRoom, compactTeamsForRoom } from './compactPlayers';
import { ClientPlayer, FirebaseRoomRecord, toRoomSnapshot } from './types';

function clientsRecord(clients: ClientPlayer[]): Record<string, ClientPlayer> {
  return Object.fromEntries(clients.map((c) => [c.id, c]));
}

async function generateUniqueRoomCode(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const existing = await kvGetRoom<FirebaseRoomRecord>(code);
    if (!existing) return code;
  }
  throw new Error('Could not generate a unique room code. Please try again.');
}

export async function roomStoreCreate(
  hostName: string,
  clientId: string,
  players: Player[],
  teams: Team[]
) {
  if (!isKvConfigured()) throw new Error('KV_NOT_CONFIGURED');

  const roomCode = await generateUniqueRoomCode();
  const record: FirebaseRoomRecord = {
    game: {
      code: roomCode,
      hostId: clientId,
      started: false,
      isPaused: true,
      auctionStatus: 'idle',
      players: compactPlayersForRoom(players),
      teams: compactTeamsForRoom(teams),
      currentPlayerIndex: 0,
      currentBid: 0,
      currentBidderId: null,
      timer: 10,
      logs: [`Room created by ${hostName}. Room Code: ${roomCode}`],
      lastWinner: null,
    },
    clients: clientsRecord([
      { id: clientId, name: hostName, teamId: null, isHost: true },
    ]),
  };

  await kvSetRoom(roomCode, record);
  return toRoomSnapshot(record);
}

export async function roomStoreJoin(roomCode: string, playerName: string, clientId: string) {
  const record = await kvGetRoom<FirebaseRoomRecord>(roomCode);
  if (!record) throw new Error('Room not found. Please verify the code.');
  if (record.game.started) throw new Error('Auction has already started in this room.');

  const clients = Object.values(record.clients || {}).filter(Boolean);
  const nextClients: ClientPlayer[] = [
    ...clients.filter((c) => c.id !== clientId),
    { id: clientId, name: playerName, teamId: null, isHost: false },
  ];
  record.clients = clientsRecord(nextClients);
  record.game.logs = [...record.game.logs, `${playerName} joined the room.`];
  await kvSetRoom(roomCode, record);
  return toRoomSnapshot(record);
}

export async function roomStoreGet(roomCode: string) {
  const record = await kvGetRoom<FirebaseRoomRecord>(roomCode);
  if (!record) return null;
  return toRoomSnapshot(record);
}

async function load(roomCode: string): Promise<FirebaseRoomRecord> {
  const record = await kvGetRoom<FirebaseRoomRecord>(roomCode);
  if (!record) throw new Error('Room not found');
  return record;
}

async function save(roomCode: string, record: FirebaseRoomRecord) {
  await kvSetRoom(roomCode, record);
}

export async function roomStoreClaimTeam(
  roomCode: string,
  clientId: string,
  teamId: string | null
) {
  const record = await load(roomCode);
  const me = record.clients[clientId];
  if (!me) throw new Error('Not in room');

  if (teamId) {
    const taken = Object.values(record.clients).some(
      (c) => c && c.id !== clientId && c.teamId === teamId
    );
    if (taken) throw new Error('Team is already taken by another player.');
  }

  record.clients[clientId] = { ...me, teamId };
  const teamName = teamId
    ? record.game.teams.find((t) => t.id === teamId)?.shortName ?? 'Unknown'
    : 'None';
  record.game.logs = [...record.game.logs, `${me.name} selected team: ${teamName}`];
  await save(roomCode, record);
  return toRoomSnapshot(record);
}

export async function roomStoreStartAuction(roomCode: string, clientId: string) {
  const record = await load(roomCode);
  if (record.game.hostId !== clientId) throw new Error('Only host can start');
  record.game = startAuctionState(record.game);
  await save(roomCode, record);
  return toRoomSnapshot(record);
}

export async function roomStorePause(roomCode: string, clientId: string) {
  const record = await load(roomCode);
  if (record.game.hostId !== clientId) throw new Error('Only host');
  record.game.isPaused = true;
  await save(roomCode, record);
  return toRoomSnapshot(record);
}

export async function roomStoreResume(roomCode: string, clientId: string) {
  const record = await load(roomCode);
  if (record.game.hostId !== clientId) throw new Error('Only host');
  record.game.isPaused = false;
  await save(roomCode, record);
  return toRoomSnapshot(record);
}

export async function roomStorePlaceBid(
  roomCode: string,
  clientId: string,
  teamId: string
) {
  const record = await load(roomCode);
  const me = record.clients[clientId];
  if (!me) throw new Error('Not in room');

  const validation = validateBid(record.game, teamId, me.teamId);
  if (!validation.ok) throw new Error(validation.error);

  record.game = applyBid(record.game, teamId, validation.nextBid, me.name);
  await save(roomCode, record);
  return toRoomSnapshot(record);
}

export async function roomStoreSkip(roomCode: string, clientId: string) {
  const record = await load(roomCode);
  if (record.game.hostId !== clientId) throw new Error('Only host');
  record.game = skipPlayerState(record.game);
  await save(roomCode, record);
  return toRoomSnapshot(record);
}

export async function roomStoreNext(
  roomCode: string,
  clientId: string,
  overrideName?: string,
  overrideBasePrice?: number
) {
  const record = await load(roomCode);
  if (record.game.hostId !== clientId) throw new Error('Only host');
  record.game = nextPlayerState(record.game, overrideName, overrideBasePrice);
  await save(roomCode, record);
  return toRoomSnapshot(record);
}

export async function roomStoreForceSell(
  roomCode: string,
  clientId: string,
  teamId: string,
  amount: number
) {
  const record = await load(roomCode);
  if (record.game.hostId !== clientId) throw new Error('Only host');
  record.game = forceSellState(record.game, teamId, amount);
  await save(roomCode, record);
  return toRoomSnapshot(record);
}

export async function roomStoreReset(
  roomCode: string,
  clientId: string,
  players: Player[],
  teams: Team[]
) {
  const record = await load(roomCode);
  if (record.game.hostId !== clientId) throw new Error('Only host');

  Object.values(record.clients).forEach((c) => {
    if (c) c.teamId = null;
  });
  record.game = {
    ...record.game,
    started: false,
    isPaused: true,
    auctionStatus: 'idle',
    players: compactPlayersForRoom(players),
    teams: compactTeamsForRoom(teams),
    currentPlayerIndex: 0,
    currentBid: 0,
    currentBidderId: null,
    timer: 10,
    lastWinner: null,
    logs: ['Auction was reset by Host. Lobby is active.'],
  };
  await save(roomCode, record);
  return toRoomSnapshot(record);
}

export async function roomStoreTick(roomCode: string, clientId: string) {
  const record = await load(roomCode);
  if (record.game.hostId !== clientId) throw new Error('Only host');
  const { game } = record;
  if (!game.started || game.isPaused || game.auctionStatus !== 'bidding') {
    return toRoomSnapshot(record);
  }

  if (game.timer > 0) {
    record.game = { ...game, timer: game.timer - 1 };
  } else {
    record.game = handleTimerEnd(game);
  }
  await save(roomCode, record);
  return toRoomSnapshot(record);
}

export async function roomStoreLeave(roomCode: string, clientId: string) {
  const record = await kvGetRoom<FirebaseRoomRecord>(roomCode);
  if (!record) return;

  delete record.clients[clientId];
  const clients = Object.values(record.clients).filter(Boolean);

  if (clients.length === 0) {
    await kvDeleteRoom(roomCode);
    return;
  }

  if (record.game.hostId === clientId) {
    const nextHost = clients[0];
    record.game.hostId = nextHost.id;
    record.clients = clientsRecord(
      clients.map((c) => ({ ...c, isHost: c.id === nextHost.id }))
    );
    record.game.logs = [...record.game.logs, `${nextHost.name} is now the host.`];
  }

  await save(roomCode, record);
}
