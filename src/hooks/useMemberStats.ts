import { computeTeamMemberStats } from '../lib/derive';
import type { Kudo, Person, TeamId } from '../lib/types';

/** Members of one team, sorted by usage ascending. */
export function useMemberStats(teamId: TeamId, people: Person[], kudos: Kudo[]) {
  return computeTeamMemberStats(teamId, people, kudos);
}
