import { RoomSnapshot } from './types';
import { MultiplayerEvent, MultiplayerEventMap } from './types';

type Emit = <E extends MultiplayerEvent>(event: E, payload: MultiplayerEventMap[E]) => void;

export function diffRoomSnapshots(
  prev: RoomSnapshot | null,
  next: RoomSnapshot,
  initialEvent: 'room_created' | 'room_joined' | null,
  emit: Emit
): void {
  if (!prev) {
    if (initialEvent) emit(initialEvent, next);
    return;
  }

  const clientsChanged = JSON.stringify(prev.clients) !== JSON.stringify(next.clients);
  const clientCountIncreased = next.clients.length > prev.clients.length;
  const clientCountDecreased = next.clients.length < prev.clients.length;

  if (clientCountIncreased && clientsChanged) {
    emit('player_joined', { clients: next.clients, logs: next.logs });
  } else if (clientCountDecreased && clientsChanged) {
    emit('player_left', { clients: next.clients, logs: next.logs, hostId: next.hostId });
  } else if (clientsChanged) {
    emit('team_claimed', { clients: next.clients, logs: next.logs });
  }

  if (prev.isPaused !== next.isPaused) {
    if (next.isPaused) emit('auction_paused', { isPaused: true, logs: next.logs });
    else emit('auction_resumed', { isPaused: false, logs: next.logs });
  }

  const bidChanged =
    prev.currentBid !== next.currentBid || prev.currentBidderId !== next.currentBidderId;
  const timerOnly =
    prev.timer !== next.timer &&
    !bidChanged &&
    prev.auctionStatus === next.auctionStatus &&
    JSON.stringify(prev.players) === JSON.stringify(next.players);

  if (
    bidChanged &&
    next.auctionStatus === 'bidding' &&
    (prev.auctionStatus === 'bidding' || prev.currentBid !== next.currentBid)
  ) {
    emit('bid_placed', {
      currentBid: next.currentBid,
      currentBidderId: next.currentBidderId,
      timer: next.timer,
      logs: next.logs,
    });
  } else if (timerOnly && next.auctionStatus === 'bidding') {
    emit('timer_tick', {
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
    emit('timer_end', {
      players: next.players,
      teams: next.teams,
      auctionStatus: next.auctionStatus,
      lastWinner: next.lastWinner,
      logs: next.logs,
    });
    return;
  }

  const majorStateChange =
    prev.auctionStatus !== next.auctionStatus ||
    prev.started !== next.started ||
    prev.currentPlayerIndex !== next.currentPlayerIndex ||
    JSON.stringify(prev.players) !== JSON.stringify(next.players) ||
    JSON.stringify(prev.teams) !== JSON.stringify(next.teams) ||
    JSON.stringify(prev.lastWinner) !== JSON.stringify(next.lastWinner);

  if (majorStateChange) {
    emit('state_update', next);
  }
}
