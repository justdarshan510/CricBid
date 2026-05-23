import { Player } from '../../data/players';
import { Team } from '../../data/teams';
import { getClientId } from '../../utils/clientId';
import { diffRoomSnapshots } from './roomDiff';
import {
  IMultiplayerService,
  MultiplayerEvent,
  MultiplayerEventMap,
  RoomSnapshot,
} from './types';

type Listener = (...args: unknown[]) => void;

async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data as T;
}

export class ApiMultiplayerService implements IMultiplayerService {
  readonly mode = 'firebase' as const; // same client UX as firebase (polling)
  private listeners = new Map<MultiplayerEvent, Set<Listener>>();
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private prevSnapshot: RoomSnapshot | null = null;
  private activeRoomCode: string | null = null;
  private _clientId: string | null = null;

  get clientId(): string {
    if (typeof window === 'undefined') return '';
    if (!this._clientId) this._clientId = getClientId();
    return this._clientId;
  }

  watchClientId(onChange: (id: string) => void): () => void {
    if (typeof window !== 'undefined') onChange(this.clientId);
    return () => {};
  }

  on<E extends MultiplayerEvent>(
    event: E,
    handler: (payload: MultiplayerEventMap[E]) => void
  ): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler as Listener);
  }

  off<E extends MultiplayerEvent>(
    event: E,
    handler: (payload: MultiplayerEventMap[E]) => void
  ): void {
    this.listeners.get(event)?.delete(handler as Listener);
  }

  private emit<E extends MultiplayerEvent>(event: E, payload: MultiplayerEventMap[E]): void {
    this.listeners.get(event)?.forEach((h) => {
      (h as (p: MultiplayerEventMap[E]) => void)(payload);
    });
  }

  connect(): void {}

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private applySnapshot(
    next: RoomSnapshot,
    initialEvent: 'room_created' | 'room_joined' | null
  ): void {
    diffRoomSnapshots(this.prevSnapshot, next, initialEvent, (e, p) => this.emit(e, p));
    this.prevSnapshot = next;

    const isHost = next.hostId === this.clientId;
    if (isHost && next.started && next.auctionStatus === 'bidding' && !next.isPaused) {
      this.startHostTicks(next.code);
    } else {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }
  }

  private startPolling(code: string): void {
    this.stopPolling();
    this.activeRoomCode = code;

    this.pollInterval = setInterval(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/multiplayer/rooms/${code}`);
          if (!res.ok) return;
          const { snapshot } = (await res.json()) as { snapshot: RoomSnapshot };
          this.applySnapshot(snapshot, null);
        } catch {
          /* ignore transient poll errors */
        }
      })();
    }, 900);
  }

  private startHostTicks(code: string): void {
    if (this.timerInterval) return;
    this.timerInterval = setInterval(() => {
      void apiPost<{ snapshot: RoomSnapshot }>(`/api/multiplayer/rooms/${code}/action`, {
        action: 'tick',
        clientId: this.clientId,
      })
        .then((data) => {
          this.applySnapshot(data.snapshot, null);
        })
        .catch(() => {});
    }, 1000);
  }

  async createRoom(hostName: string, players: Player[], teams: Team[]): Promise<void> {
    try {
      const { snapshot } = await apiPost<{ snapshot: RoomSnapshot }>(
        '/api/multiplayer/rooms',
        { hostName, clientId: this.clientId, players, teams }
      );
      this.prevSnapshot = null;
      this.applySnapshot(snapshot, 'room_created');
      this.startPolling(snapshot.code);
    } catch (err) {
      this.emit('join_error', err instanceof Error ? err.message : 'Failed to create room');
    }
  }

  async joinRoom(roomCode: string, playerName: string): Promise<void> {
    try {
      const { snapshot } = await apiPost<{ snapshot: RoomSnapshot }>(
        `/api/multiplayer/rooms/${roomCode.trim()}/join`,
        { playerName, clientId: this.clientId }
      );
      this.prevSnapshot = null;
      this.applySnapshot(snapshot, 'room_joined');
      this.startPolling(snapshot.code);
    } catch (err) {
      this.emit('join_error', err instanceof Error ? err.message : 'Failed to join room');
    }
  }

  private async action(
    roomCode: string,
    action: string,
    payload: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      const { snapshot } = await apiPost<{ snapshot: RoomSnapshot }>(
        `/api/multiplayer/rooms/${roomCode}/action`,
        { action, clientId: this.clientId, payload }
      );
      this.applySnapshot(snapshot, null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      if (action === 'place_bid') this.emit('bid_error', msg);
      else if (action === 'claim_team') this.emit('claim_error', msg);
    }
  }

  async claimTeam(roomCode: string, teamId: string | null): Promise<void> {
    await this.action(roomCode, 'claim_team', { teamId });
  }

  async startAuction(roomCode: string): Promise<void> {
    await this.action(roomCode, 'start_auction');
  }

  async pauseAuction(roomCode: string): Promise<void> {
    await this.action(roomCode, 'pause_auction');
  }

  async resumeAuction(roomCode: string): Promise<void> {
    await this.action(roomCode, 'resume_auction');
  }

  async placeBid(roomCode: string, teamId: string): Promise<void> {
    await this.action(roomCode, 'place_bid', { teamId });
  }

  async skipPlayer(roomCode: string): Promise<void> {
    await this.action(roomCode, 'skip_player');
  }

  async nextPlayer(
    roomCode: string,
    overrideName?: string,
    overrideBasePrice?: number
  ): Promise<void> {
    await this.action(roomCode, 'next_player', { overrideName, overrideBasePrice });
  }

  async forceSell(roomCode: string, teamId: string, amount: number): Promise<void> {
    await this.action(roomCode, 'force_sell', { teamId, amount });
  }

  async resetAuction(
    roomCode: string,
    players: Player[],
    teams: Team[]
  ): Promise<void> {
    await this.action(roomCode, 'reset_auction', { players, teams });
  }

  async leaveRoom(roomCode: string | null): Promise<void> {
    this.stopPolling();
    this.prevSnapshot = null;
    this.activeRoomCode = null;
    if (roomCode) {
      try {
        await apiPost(`/api/multiplayer/rooms/${roomCode}/action`, {
          action: 'leave',
          clientId: this.clientId,
        });
      } catch {
        /* ignore */
      }
    }
  }
}

let apiService: ApiMultiplayerService | null = null;

export function getApiMultiplayerService(): ApiMultiplayerService {
  if (!apiService) apiService = new ApiMultiplayerService();
  return apiService;
}
