import { io, Socket } from 'socket.io-client';
import { Player } from '../../data/players';
import { Team } from '../../data/teams';
import { LOCAL_SOCKET_SETUP_MESSAGE } from './host';
import {
  IMultiplayerService,
  MultiplayerEvent,
  MultiplayerEventMap,
} from './types';

type Listener = (...args: unknown[]) => void;

function socketOrigin(): string {
  if (typeof window === 'undefined') return '';
  return process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
}

export class SocketMultiplayerService implements IMultiplayerService {
  readonly mode = 'socket' as const;
  private socket: Socket | null = null;
  private listeners = new Map<MultiplayerEvent, Set<Listener>>();
  private activeRoomCode: string | null = null;

  get clientId(): string {
    return this.socket?.id ?? '';
  }

  watchClientId(onChange: (id: string) => void): () => void {
    const s = this.getSocket();
    const notify = () => {
      if (s.id) onChange(s.id);
    };
    s.on('connect', notify);
    notify();
    return () => {
      s.off('connect', notify);
    };
  }

  private getSocket(): Socket {
    if (!this.socket) {
      this.socket = io(socketOrigin(), {
        path: '/socket.io',
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 8,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
      });
      this.wireSocketEvents();
    }
    return this.socket;
  }

  private wireSocketEvents(): void {
    const s = this.socket!;
    const events: MultiplayerEvent[] = [
      'room_created',
      'room_joined',
      'join_error',
      'claim_error',
      'bid_error',
      'player_joined',
      'player_left',
      'team_claimed',
      'state_update',
      'bid_placed',
      'timer_tick',
      'timer_end',
      'auction_paused',
      'auction_resumed',
    ];
    for (const event of events) {
      s.on(event, (payload: unknown) => {
        this.emit(event, payload as MultiplayerEventMap[typeof event]);
      });
    }
  }

  on<E extends MultiplayerEvent>(
    event: E,
    handler: (payload: MultiplayerEventMap[E]) => void
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as Listener);
  }

  off<E extends MultiplayerEvent>(
    event: E,
    handler: (payload: MultiplayerEventMap[E]) => void
  ): void {
    this.listeners.get(event)?.delete(handler as Listener);
  }

  private emit<E extends MultiplayerEvent>(event: E, payload: MultiplayerEventMap[E]): void {
    this.listeners.get(event)?.forEach((handler) => {
      (handler as (p: MultiplayerEventMap[E]) => void)(payload);
    });
  }

  connect(): void {
    const s = this.getSocket();
    if (!s.connected) {
      s.connect();
    }
  }

  private waitForConnection(s: Socket): Promise<void> {
    if (s.connected) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('timeout')), 8000);
      s.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      s.once('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  private connectionErrorMessage(): string {
    return LOCAL_SOCKET_SETUP_MESSAGE;
  }

  async createRoom(hostName: string, players: Player[], teams: Team[]): Promise<void> {
    this.connect();
    const s = this.getSocket();
    try {
      await this.waitForConnection(s);
    } catch {
      this.emit('join_error', this.connectionErrorMessage());
      return;
    }

    this.activeRoomCode = null;
    s.emit('create_room', { hostName, players, teams });
  }

  async joinRoom(roomCode: string, playerName: string): Promise<void> {
    this.connect();
    const s = this.getSocket();
    try {
      await this.waitForConnection(s);
    } catch {
      this.emit('join_error', this.connectionErrorMessage());
      return;
    }
    this.activeRoomCode = roomCode.trim();
    s.emit('join_room', { roomCode: roomCode.trim(), playerName });
  }

  async claimTeam(roomCode: string, teamId: string | null): Promise<void> {
    this.getSocket().emit('claim_team', { roomCode, teamId });
  }

  async startAuction(roomCode: string): Promise<void> {
    this.getSocket().emit('start_auction', { roomCode });
  }

  async pauseAuction(roomCode: string): Promise<void> {
    this.getSocket().emit('pause_auction', { roomCode });
  }

  async resumeAuction(roomCode: string): Promise<void> {
    this.getSocket().emit('resume_auction', { roomCode });
  }

  async placeBid(roomCode: string, teamId: string): Promise<void> {
    this.getSocket().emit('place_bid', { roomCode, teamId });
  }

  async skipPlayer(roomCode: string): Promise<void> {
    this.getSocket().emit('skip_player', { roomCode });
  }

  async nextPlayer(
    roomCode: string,
    overrideName?: string,
    overrideBasePrice?: number
  ): Promise<void> {
    this.getSocket().emit('next_player', { roomCode, overrideName, overrideBasePrice });
  }

  async forceSell(roomCode: string, teamId: string, amount: number): Promise<void> {
    this.getSocket().emit('force_sell', { roomCode, teamId, amount });
  }

  async resetAuction(
    roomCode: string,
    initialPlayersList: Player[],
    initialTeamsList: Team[]
  ): Promise<void> {
    this.getSocket().emit('reset_auction', {
      roomCode,
      initialPlayersList,
      initialTeamsList,
    });
  }

  async leaveRoom(roomCode: string | null): Promise<void> {
    this.activeRoomCode = null;
    const s = this.getSocket();
    s.disconnect();
    s.connect();
  }
}

let socketService: SocketMultiplayerService | null = null;

export function getSocketMultiplayerService(): SocketMultiplayerService {
  if (!socketService) {
    socketService = new SocketMultiplayerService();
  }
  return socketService;
}
