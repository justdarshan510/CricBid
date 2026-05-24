import { Player } from '../../data/players';
import { Team } from '../../data/teams';
import { sanitizeForFirebase } from './sanitizeForFirebase';

/** Smaller Firebase payload — images are restored client-side from initialPlayers. */
export function compactPlayersForRoom(players: Player[]): Player[] {
  return sanitizeForFirebase(
    players.map(({ image: _image, ...rest }) => rest)
  );
}

export function compactTeamsForRoom(teams: Team[]): Team[] {
  return sanitizeForFirebase(
    teams.map((t) => ({
      ...t,
      players: compactPlayersForRoom(t.players ?? []),
    }))
  );
}
