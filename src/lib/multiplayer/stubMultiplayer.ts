import { Player } from '../../data/players';
import { Team } from '../../data/teams';
import { PRODUCTION_FIREBASE_SETUP_MESSAGE } from './host';
import { IMultiplayerService, MultiplayerEvent, MultiplayerEventMap } from './types';

type Listener = (...args: unknown[]) => void;

/** Used on Vercel when Firebase env vars are missing — Socket.io cannot run there. */
export class StubMultiplayerService implements IMultiplayerService {
  readonly mode = 'socket' as const;
  private listeners = new Map<MultiplayerEvent, Set<Listener>>();

  get clientId(): string {
    return '';
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

  connect(): void {}

  watchClientId(): () => void {
    return () => {};
  }

  private fail(): void {
    this.emit('join_error', PRODUCTION_FIREBASE_SETUP_MESSAGE);
  }

  async createRoom(): Promise<void> {
    this.fail();
  }

  async joinRoom(): Promise<void> {
    this.fail();
  }

  async claimTeam(): Promise<void> {
    this.fail();
  }

  async startAuction(): Promise<void> {}
  async pauseAuction(): Promise<void> {}
  async resumeAuction(): Promise<void> {}
  async placeBid(): Promise<void> {
    this.emit('bid_error', PRODUCTION_FIREBASE_SETUP_MESSAGE);
  }
  async skipPlayer(): Promise<void> {}
  async nextPlayer(): Promise<void> {}
  async forceSell(): Promise<void> {}
  async resetAuction(): Promise<void> {}
  async leaveRoom(): Promise<void> {}
}

let stub: StubMultiplayerService | null = null;

export function getStubMultiplayerService(): StubMultiplayerService {
  if (!stub) stub = new StubMultiplayerService();
  return stub;
}
