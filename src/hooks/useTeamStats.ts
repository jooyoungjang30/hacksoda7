import { computeTeamStats } from '../lib/derive';
import { mockPeople } from '../mock/people';
import { mockKudos } from '../mock/kudos';
import type { TeamId, TeamStats } from '../lib/types';

/** All teams (sorted usage ascending). */
export function useTeamStats(): TeamStats[];
/** A single team by id, or undefined if the id doesn't match any team. */
export function useTeamStats(teamId: TeamId): TeamStats | undefined;
export function useTeamStats(teamId?: TeamId): TeamStats[] | TeamStats | undefined {
  const stats = computeTeamStats(mockPeople, mockKudos);
  return teamId ? stats.find((t) => t.team.id === teamId) : stats;
}
