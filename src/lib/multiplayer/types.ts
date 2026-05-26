import { Player } from '../../data/players';
import { Team } from '../../data/teams';
import { AuctionStatus, RoomGameState, RoomWinner } from '../auctionLogic';
import { asFirebaseArray } from './sanitizeForFirebase';

export interface ClientPlayer {
  id: string;
  name: string;
  teamId: string | null;
  isHost: boolean;
}

export interface RoomSnapshot extends RoomGameState {
  clients: ClientPlayer[];
}

export type MultiplayerEventMap = {
  room_created: RoomSnapshot;
  room_joined: RoomSnapshot;
  join_error: string;
  claim_error: string;
  bid_error: string;
  player_joined: { clients: ClientPlayer[]; logs: string[] };
  player_left: { clients: ClientPlayer[]; logs: string[]; hostId: string };
  team_claimed: { clients: ClientPlayer[]; logs: string[] };
  state_update: RoomSnapshot;
  bid_placed: {
    currentBid: number;
    currentBidderId: string | null;
    timer: number;
    logs: string[];
  };
  timer_tick: {
    timer: number;
    currentBid: number;
    currentBidderId: string | null;
    logs: string[];
    aiBidMade: boolean;
  };
  timer_end: {
    players: Player[];
    teams: Team[];
    auctionStatus: AuctionStatus;
    lastWinner: RoomWinner | null;
    logs: string[];
  };
  auction_paused: { isPaused: boolean; logs: string[] };
  auction_resumed: { isPaused: boolean; logs: string[] };
};

export type MultiplayerEvent = keyof MultiplayerEventMap;

export interface FirebaseRoomRecord {
  game: RoomGameState;
  clients: Record<string, ClientPlayer>;
}

export function toRoomSnapshot(record: FirebaseRoomRecord | null | undefined): RoomSnapshot {
  const clients = Object.values(record?.clients || {}).filter(Boolean);
  const game = record?.game;

  if (!game) {
    return {
      code: '',
      hostId: '',
      started: false,
      isPaused: true,
      auctionStatus: 'idle',
      players: [],
      teams: [],
      currentPlayerIndex: 0,
      currentBid: 0,
      currentBidderId: null,
      timer: 10,
      logs: [],
      lastWinner: null,
      clients,
    };
  }

  const players = asFirebaseArray<Player>(game.players as Player[] | Record<string, Player>);
  const teams = asFirebaseArray<Team>(game.teams as Team[] | Record<string, Team>).map(
    (t) => ({ ...t, players: asFirebaseArray<Player>(t.players as Player[] | Record<string, Player>) })
  );

  return {
    ...game,
    code: game.code ?? '',
    hostId: game.hostId ?? '',
    started: game.started ?? false,
    isPaused: game.isPaused ?? false,
    auctionStatus: game.auctionStatus ?? 'idle',
    players,
    teams,
    currentPlayerIndex: game.currentPlayerIndex ?? 0,
    currentBid: game.currentBid ?? 0,
    currentBidderId: game.currentBidderId ?? null,
    timer: game.timer ?? 10,
    logs: asFirebaseArray<string>(game.logs as string[] | Record<string, string>),
    lastWinner: game.lastWinner ?? null,
    clients,
  };
}

export interface IMultiplayerService {
  readonly clientId: string;
  readonly mode: 'firebase' | 'socket';
  on<E extends MultiplayerEvent>(
    event: E,
    handler: (payload: MultiplayerEventMap[E]) => void
  ): void;
  off<E extends MultiplayerEvent>(
    event: E,
    handler: (payload: MultiplayerEventMap[E]) => void
  ): void;
  connect(): void;
  createRoom(hostName: string, players: Player[], teams: Team[]): Promise<void>;
  joinRoom(roomCode: string, playerName: string, forceRejoin?: boolean): Promise<void>;
  claimTeam(roomCode: string, teamId: string | null): Promise<void>;
  startAuction(roomCode: string): Promise<void>;
  pauseAuction(roomCode: string): Promise<void>;
  resumeAuction(roomCode: string): Promise<void>;
  placeBid(roomCode: string, teamId: string): Promise<void>;
  skipPlayer(roomCode: string): Promise<void>;
  nextPlayer(roomCode: string, overrideName?: string, overrideBasePrice?: number): Promise<void>;
  forceSell(roomCode: string, teamId: string, amount: number): Promise<void>;
  resetAuction(roomCode: string, players: Player[], teams: Team[]): Promise<void>;
  leaveRoom(roomCode: string | null): Promise<void>;
  /** Subscribe to client id changes (socket connect / firebase local id). Returns unsubscribe. */
  watchClientId(onChange: (id: string) => void): () => void;
  setClientId(id: string | null): void;
}
