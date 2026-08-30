import { computeTeamStats } from '../lib/derive';
import type { Kudo, Person, Team, TeamId, TeamStats } from '../lib/types';

/** All teams (sorted usage ascending). */
export function useTeamStats(people: Person[], teams: Team[], kudos: Kudo[]): TeamStats[];
/** A single team by id, or undefined if the id doesn't match any team. */
export function useTeamStats(people: Person[], teams: Team[], kudos: Kudo[], teamId: TeamId): TeamStats | undefined;
export function useTeamStats(
  people: Person[],
  teams: Team[],
  kudos: Kudo[],
  teamId?: TeamId,
): TeamStats[] | TeamStats | undefined {
  const stats = computeTeamStats(people, teams, kudos);
  return teamId === undefined ? stats : stats.find((t) => t.team.id === teamId);
}
