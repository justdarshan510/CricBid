import { Player } from '../../data/players';
import { Team } from '../../data/teams';

/** Smaller Firebase payload — images are restored client-side from initialPlayers. */
export function compactPlayersForRoom(players: Player[]): Player[] {
  return players.map(({ image: _image, ...rest }) => rest);
}

export function compactTeamsForRoom(teams: Team[]): Team[] {
  return teams.map((t) => ({
    ...t,
    players: compactPlayersForRoom(t.players),
  }));
}
