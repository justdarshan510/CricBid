import {
  get,
  onDisconnect,
  onValue,
  ref,
  remove,
  runTransaction,
  set,
  update,
  type Unsubscribe,
} from 'firebase/database';
import { Player } from '../../data/players';
import { Team } from '../../data/teams';
import {
  applyBid,
  handleTimerEnd,
  nextPlayerState,
  RoomGameState,
  skipPlayerState,
  startAuctionState,
  validateBid,
  forceSellState,
} from '../auctionLogic';
import { getFirebaseDatabase, isFirebaseConfigured } from '../firebaseApp';
import { getClientId } from '../../utils/clientId';
import { compactPlayersForRoom, compactTeamsForRoom } from './compactPlayers';
import { asFirebaseArray, sanitizeForFirebase } from './sanitizeForFirebase';
import {
  ClientPlayer,
  FirebaseRoomRecord,
  IMultiplayerService,
  MultiplayerEvent,
  MultiplayerEventMap,
  toRoomSnapshot,
} from './types';

function firebaseErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code: string }).code);
    if (code === 'PERMISSION_DENIED') {
      return 'Firebase denied write access. Deploy database.rules.json or enable test mode in the Firebase console.';
    }
  }
  if (err instanceof Error) return err.message;
  return 'Unknown Firebase error';
}

function roomRef(roomCode: string) {
  return ref(getFirebaseDatabase(), `rooms/${roomCode}`);
}

function clientsRecord(clients: ClientPlayer[]): Record<string, ClientPlayer> {
  return Object.fromEntries(clients.map((c) => [c.id, c]));
}

function normalizeGame(game: any): RoomGameState {
  if (!game) return game;
  return {
    ...game,
    players: asFirebaseArray(game.players),
    teams: asFirebaseArray(game.teams).map((t: any) => ({
      ...t,
      players: asFirebaseArray(t?.players),
    })),
    logs: asFirebaseArray(game.logs),
  };
}

async function generateUniqueRoomCode(): Promise<string> {
  const db = getFirebaseDatabase();
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const snapshot = await get(ref(db, `rooms/${code}`));
    if (!snapshot.exists()) return code;
  }
  throw new Error('Could not generate a unique room code. Please try again.');
}

type Listener = (...args: unknown[]) => void;

class FirebaseMultiplayerService implements IMultiplayerService {
  readonly mode = 'firebase' as const;
  private listeners = new Map<MultiplayerEvent, Set<Listener>>();
  private roomUnsubscribe: Unsubscribe | null = null;
  private prevSnapshot: ReturnType<typeof toRoomSnapshot> | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private activeRoomCode: string | null = null;
  private _clientId: string | null = null;
  private clientIdListeners = new Set<(id: string) => void>();

  setClientId(id: string | null) {
    this._clientId = id;
    this.clientIdListeners.forEach((fn) => fn(this.clientId));
  }

  get clientId(): string {
    if (this._clientId) return this._clientId;
    if (typeof window === 'undefined') return '';
    return getClientId(); // Fallback to anonymous ID if not authenticated
  }

  watchClientId(onChange: (id: string) => void): () => void {
    this.clientIdListeners.add(onChange);
    if (typeof window !== 'undefined') {
      onChange(this.clientId);
    }
    return () => {
      this.clientIdListeners.delete(onChange);
    };
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
    // No-op: Firebase connects on first database operation.
  }

  private async readRoom(roomCode: string): Promise<FirebaseRoomRecord | null> {
    const snapshot = await get(roomRef(roomCode));
    if (!snapshot.exists()) return null;
    const record = snapshot.val() as FirebaseRoomRecord;
    if (!record?.game) return record;
    const snap = toRoomSnapshot(record);
    record.game = {
      ...record.game,
      players: snap.players,
      teams: snap.teams,
      logs: snap.logs,
      isPaused: snap.isPaused,
      auctionStatus: snap.auctionStatus,
    };
    return record;
  }

  private async writeGame(roomCode: string, game: RoomGameState): Promise<void> {
    await update(roomRef(roomCode), { game: sanitizeForFirebase(game) });
  }

  private async writeClients(
    roomCode: string,
    clients: ClientPlayer[]
  ): Promise<void> {
    await update(roomRef(roomCode), { clients: clientsRecord(clients) });
  }

  private async writeRoom(roomCode: string, record: FirebaseRoomRecord): Promise<void> {
    await set(roomRef(roomCode), sanitizeForFirebase(record));
  }

  private registerPresence(roomCode: string): void {
    const clientRef = ref(getFirebaseDatabase(), `rooms/${roomCode}/clients/${this.clientId}`);
    // Mark as offline on disconnect instead of removing — preserves teamId for rejoin
    const onlineRef = ref(getFirebaseDatabase(), `rooms/${roomCode}/clients/${this.clientId}/online`);
    onDisconnect(onlineRef).set(false);
    // Also mark as online right now
    set(onlineRef, true);
  }

  private stopHostTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private startHostTimer(roomCode: string): void {
    this.stopHostTimer();
    this.timerInterval = setInterval(() => {
      void this.tickTimer(roomCode);
    }, 1000);
  }

  private async tickTimer(roomCode: string): Promise<void> {
    try {
      const dbRef = ref(getFirebaseDatabase(), `rooms/${roomCode}/game`);
      await runTransaction(dbRef, (game) => {
        if (!game) return;
        if (game.hostId !== this.clientId) return;
        if (!game.started || game.isPaused || game.auctionStatus !== 'bidding') {
          return;
        }

        const normalized = normalizeGame(game);
        if (normalized.timer > 0) {
          normalized.timer = normalized.timer - 1;
        } else {
          const ended = handleTimerEnd(normalized);
          Object.assign(normalized, ended);
        }
        return sanitizeForFirebase(normalized);
      });
    } catch (err) {
      console.error('[multiplayer] tickTimer failed:', err);
    }
  }

  private subscribeRoom(roomCode: string, initialEvent: 'room_created' | 'room_joined'): void {
    this.unsubscribeRoom();
    this.activeRoomCode = roomCode;
    this.prevSnapshot = null;

    const unsubscribe = onValue(roomRef(roomCode), (snapshot) => {
      if (!snapshot.exists()) return;
      const record = snapshot.val() as FirebaseRoomRecord;
      const next = toRoomSnapshot(record);
      const prev = this.prevSnapshot;

      if (!prev) {
        this.emit(initialEvent, next);
        this.prevSnapshot = next;
        if (next.hostId === this.clientId && next.started && !next.isPaused) {
          this.startHostTimer(roomCode);
        }
        return;
      }

      const clientsChanged =
        JSON.stringify(prev.clients) !== JSON.stringify(next.clients);
      const clientCountIncreased = next.clients.length > prev.clients.length;
      const clientCountDecreased = next.clients.length < prev.clients.length;

      if (clientCountIncreased && clientsChanged) {
        this.emit('player_joined', { clients: next.clients, logs: next.logs });
      } else if (clientCountDecreased && clientsChanged) {
        this.emit('player_left', {
          clients: next.clients,
          logs: next.logs,
          hostId: next.hostId,
        });
      } else if (clientsChanged) {
        this.emit('team_claimed', { clients: next.clients, logs: next.logs });
      }

      if (prev.isPaused !== next.isPaused) {
        if (next.isPaused) {
          this.emit('auction_paused', { isPaused: true, logs: next.logs });
        } else {
          this.emit('auction_resumed', { isPaused: false, logs: next.logs });
        }
      }

      const bidChanged =
        prev.currentBid !== next.currentBid ||
        prev.currentBidderId !== next.currentBidderId;
      const timerOnly =
        prev.timer !== next.timer &&
        !bidChanged &&
        prev.auctionStatus === next.auctionStatus &&
        JSON.stringify(prev.players) === JSON.stringify(next.players);

      const majorStateChange =
        prev.auctionStatus !== next.auctionStatus ||
        prev.started !== next.started ||
        prev.isPaused !== next.isPaused ||
        prev.currentPlayerIndex !== next.currentPlayerIndex ||
        prev.currentBid !== next.currentBid ||
        prev.currentBidderId !== next.currentBidderId ||
        JSON.stringify(prev.players) !== JSON.stringify(next.players) ||
        JSON.stringify(prev.teams) !== JSON.stringify(next.teams) ||
        JSON.stringify(prev.lastWinner) !== JSON.stringify(next.lastWinner);

      if (
        bidChanged &&
        next.auctionStatus === 'bidding' &&
        (prev.auctionStatus === 'bidding' || prev.currentBid !== next.currentBid)
      ) {
        this.emit('bid_placed', {
          currentBid: next.currentBid,
          currentBidderId: next.currentBidderId,
          timer: next.timer,
          logs: next.logs,
        });
      } else if (timerOnly && next.auctionStatus === 'bidding') {
        this.emit('timer_tick', {
          timer: next.timer,
          currentBid: next.currentBid,
          currentBidderId: next.currentBidderId,
          logs: next.logs,
          aiBidMade: false,
        });
      }

      const splashTransition =
        (next.auctionStatus === 'sold_splash' || next.auctionStatus === 'unsold_splash') &&
        prev.auctionStatus === 'bidding';
      if (splashTransition) {
        this.emit('timer_end', {
          players: next.players,
          teams: next.teams,
          auctionStatus: next.auctionStatus,
          lastWinner: next.lastWinner,
          logs: next.logs,
        });
        this.stopHostTimer();
      }

      if (majorStateChange && !splashTransition) {
        this.emit('state_update', next);
      }

      if (next.hostId === this.clientId) {
        if (
          next.started &&
          next.auctionStatus === 'bidding' &&
          !next.isPaused &&
          !this.timerInterval
        ) {
          this.startHostTimer(roomCode);
        }
        if (next.isPaused || next.auctionStatus !== 'bidding') {
          this.stopHostTimer();
        }
      } else {
        this.stopHostTimer();
      }

      this.prevSnapshot = next;
    });

    this.roomUnsubscribe = unsubscribe;
  }

  unsubscribeRoom(): void {
    this.stopHostTimer();
    if (this.roomUnsubscribe) {
      this.roomUnsubscribe();
      this.roomUnsubscribe = null;
    }
    this.prevSnapshot = null;
    this.activeRoomCode = null;
  }

  async createRoom(hostName: string, players: Player[], teams: Team[]): Promise<void> {
    if (!isFirebaseConfigured()) {
      this.emit('join_error', 'Firebase is not configured for multiplayer.');
      return;
    }

    try {
      const roomCode = await generateUniqueRoomCode();
      const game: RoomGameState = {
        code: roomCode,
        hostId: this.clientId,
        started: false,
        isPaused: true,
        auctionStatus: 'idle',
        players: compactPlayersForRoom(players),
        teams: compactTeamsForRoom(teams),
        currentPlayerIndex: 0,
        currentBid: 0,
        currentBidderId: null,
        timer: 20,
        logs: [`Room created by ${hostName}. Room Code: ${roomCode}`],
        lastWinner: null,
      };

      const clients: ClientPlayer[] = [
        { id: this.clientId, name: hostName, teamId: null, isHost: true },
      ];

      await this.writeRoom(roomCode, { game, clients: clientsRecord(clients) });
      this.registerPresence(roomCode);
      this.subscribeRoom(roomCode, 'room_created');
    } catch (err) {
      console.error('[multiplayer] createRoom failed:', err);
      this.emit(
        'join_error',
        `Failed to create room: ${firebaseErrorMessage(err)}`
      );
    }
  }

  async joinRoom(roomCode: string, playerName: string, forceRejoin: boolean = false): Promise<void> {
    if (!isFirebaseConfigured()) {
      this.emit('join_error', 'Firebase is not configured for multiplayer.');
      return;
    }

    try {
      const normalized = roomCode.trim().toUpperCase();
      const record = await this.readRoom(normalized);
      if (!record) {
        this.emit('join_error', 'Room not found. Please verify the code.');
        return;
      }
      const clients = Object.values(record.clients || {}).filter(Boolean);
      const existingClient = clients.find((c) => c.id === this.clientId);

      // Block new players from joining started auctions, but allow rejoin
      if (record.game.started && !existingClient && !forceRejoin) {
        this.emit('join_error', 'Auction has already started in this room.');
        return;
      }

      let nextClients: ClientPlayer[];
      let logs = record.game.logs || [];
      
      if (existingClient) {
        // Existing client: preserve their team and host status
        nextClients = clients.map(c => 
          c.id === this.clientId ? { ...c, name: playerName } : c
        );
        logs = [...logs, `${playerName} rejoined the room.`];
      } else {
        // New client or returning client removed by onDisconnect
        nextClients = [
          ...clients,
          { id: this.clientId, name: playerName, teamId: null, isHost: false }
        ];
        logs = [...logs, `${playerName} ${forceRejoin ? 'rejoined' : 'joined'} the room.`];
      }

      await update(roomRef(normalized), {
        clients: clientsRecord(nextClients),
        'game/logs': logs,
      });

      this.registerPresence(normalized);
      this.subscribeRoom(normalized, 'room_joined');
    } catch (err) {
      console.error('[multiplayer] joinRoom failed:', err);
      this.emit('join_error', `Failed to join room: ${firebaseErrorMessage(err)}`);
    }
  }

  async claimTeam(roomCode: string, teamId: string | null): Promise<void> {
    const normalizedTeamId = teamId?.trim() ? teamId : null;
    try {
      const record = await this.readRoom(roomCode);
      if (!record) return;

      const clients = Object.values(record.clients || {}).filter(Boolean);
      const me = clients.find((c) => c.id === this.clientId);
      if (!me) return;

      if (normalizedTeamId) {
        const taken = clients.some((c) => c.id !== this.clientId && c.teamId === normalizedTeamId);
        if (taken) {
          this.emit('claim_error', 'Team is already taken by another player.');
          return;
        }
      }

      const updatedClients = clients.map((c) =>
        c.id === this.clientId ? { ...c, teamId: normalizedTeamId } : c
      );
      const teams = record.game?.teams ?? [];
      const teamName = normalizedTeamId
        ? teams.find((t) => t.id === normalizedTeamId)?.shortName ?? 'Unknown'
        : 'None';
      const logs = [...(record.game?.logs ?? []), `${me.name} selected team: ${teamName}`];

      await update(roomRef(roomCode), {
        clients: clientsRecord(updatedClients),
        'game/logs': logs,
      });
    } catch (err) {
      console.error('[multiplayer] claimTeam failed:', err);
      this.emit('claim_error', firebaseErrorMessage(err));
    }
  }

  async startAuction(roomCode: string): Promise<void> {
    try {
      const record = await this.readRoom(roomCode);
      if (!record) {
        this.emit('join_error', 'Room not found.');
        return;
      }
      if (record.game.hostId !== this.clientId) {
        this.emit('join_error', 'Only the host can start the auction.');
        return;
      }
      const game = startAuctionState({
        ...record.game,
        players: record.game.players ?? [],
        teams: record.game.teams ?? [],
        logs: record.game.logs ?? [],
      });
      await this.writeGame(roomCode, game);
      this.startHostTimer(roomCode);
    } catch (err) {
      console.error('[multiplayer] startAuction failed:', err);
      this.emit('join_error', firebaseErrorMessage(err));
    }
  }

  async pauseAuction(roomCode: string): Promise<void> {
    try {
      await update(ref(getFirebaseDatabase(), `rooms/${roomCode}/game`), { isPaused: true });
      this.stopHostTimer();
    } catch (err) {
      console.error('[multiplayer] pauseAuction failed:', err);
    }
  }

  async resumeAuction(roomCode: string): Promise<void> {
    try {
      await update(ref(getFirebaseDatabase(), `rooms/${roomCode}/game`), { isPaused: false });
    } catch (err) {
      console.error('[multiplayer] resumeAuction failed:', err);
    }
  }

  async placeBid(roomCode: string, teamId: string): Promise<void> {
    try {
      const record = await this.readRoom(roomCode);
      if (!record) {
        this.emit('bid_error', 'Room not found.');
        return;
      }

      const clients = Object.values(record.clients || {}).filter(Boolean);
      const me = clients.find((c) => c.id === this.clientId);
      if (!me) {
        this.emit('bid_error', 'You are not in this room. Rejoin from the lobby.');
        return;
      }

      const bidTeamId = me.teamId ?? teamId;
      if (!bidTeamId) {
        this.emit('bid_error', 'Claim a team in the lobby before bidding.');
        return;
      }

      const dbRef = ref(getFirebaseDatabase(), `rooms/${roomCode}/game`);
      await runTransaction(dbRef, (game) => {
        if (!game) return;
        const normalized = normalizeGame(game);
        const validation = validateBid(normalized, bidTeamId, bidTeamId);
        if (!validation.ok) {
          throw new Error(validation.error);
        }

        const nextGame = applyBid(normalized, bidTeamId, validation.nextBid, me.name);
        return sanitizeForFirebase(nextGame);
      });
    } catch (err) {
      console.error('[multiplayer] placeBid failed:', err);
      this.emit('bid_error', err instanceof Error ? err.message : firebaseErrorMessage(err));
    }
  }

  async skipPlayer(roomCode: string): Promise<void> {
    const record = await this.readRoom(roomCode);
    if (!record || record.game.hostId !== this.clientId) return;
    await this.writeGame(roomCode, skipPlayerState(record.game));
    this.stopHostTimer();
  }

  async nextPlayer(
    roomCode: string,
    overrideName?: string,
    overrideBasePrice?: number
  ): Promise<void> {
    const record = await this.readRoom(roomCode);
    if (!record || record.game.hostId !== this.clientId) return;
    const game = nextPlayerState(record.game, overrideName, overrideBasePrice);
    await this.writeGame(roomCode, game);
    if (game.auctionStatus === 'bidding' && !game.isPaused) {
      this.startHostTimer(roomCode);
    } else {
      this.stopHostTimer();
    }
  }

  async forceSell(roomCode: string, teamId: string, amount: number): Promise<void> {
    const record = await this.readRoom(roomCode);
    if (!record || record.game.hostId !== this.clientId) return;
    await this.writeGame(roomCode, forceSellState(record.game, teamId, amount));
    this.stopHostTimer();
  }

  async resetAuction(
    roomCode: string,
    initialPlayersList: Player[],
    initialTeamsList: Team[]
  ): Promise<void> {
    const record = await this.readRoom(roomCode);
    if (!record || record.game.hostId !== this.clientId) return;

    this.stopHostTimer();
    const clients = Object.values(record.clients || {})
      .filter(Boolean)
      .map((c) => ({ ...c, teamId: null }));

    const game: RoomGameState = {
      ...record.game,
      started: false,
      isPaused: true,
      auctionStatus: 'idle',
      players: compactPlayersForRoom(initialPlayersList),
      teams: compactTeamsForRoom(initialTeamsList),
      currentPlayerIndex: 0,
      currentBid: 0,
      currentBidderId: null,
      timer: 20,
      lastWinner: null,
      logs: ['Auction was reset by Host. Lobby is active.'],
    };

    await this.writeRoom(roomCode, { game, clients: clientsRecord(clients) });
  }

  async leaveRoom(roomCode: string | null): Promise<void> {
    this.unsubscribeRoom();
    if (!roomCode || !isFirebaseConfigured()) return;

    const record = await this.readRoom(roomCode);
    if (!record) return;

    const clients = Object.values(record.clients || {}).filter(
      (c) => c && c.id !== this.clientId
    );

    if (clients.length === 0) {
      await remove(roomRef(roomCode));
      return;
    }

    let hostId = record.game.hostId;
    let nextClients = clients;

    if (hostId === this.clientId) {
      const nextHost = clients[0];
      hostId = nextHost.id;
      nextClients = clients.map((c) => ({
        ...c,
        isHost: c.id === nextHost.id,
      }));
      record.game.logs = [...record.game.logs, `${nextHost.name} is now the host.`];
    }

    await update(roomRef(roomCode), {
      clients: clientsRecord(nextClients),
      'game/hostId': hostId,
      'game/logs': record.game.logs,
    });

    await remove(
      ref(getFirebaseDatabase(), `rooms/${roomCode}/clients/${this.clientId}`)
    );
  }
}

let service: FirebaseMultiplayerService | null = null;

export function getFirebaseMultiplayerService(): FirebaseMultiplayerService {
  if (!service) {
    service = new FirebaseMultiplayerService();
  }
  return service;
}
