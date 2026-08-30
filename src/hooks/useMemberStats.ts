import { computeTeamMemberStats } from '../lib/derive';
import { mockPeople } from '../mock/people';
import { mockKudos } from '../mock/kudos';
import type { TeamId } from '../lib/types';

/** Members of one team, sorted by usage ascending. */
export function useMemberStats(teamId: TeamId) {
  return computeTeamMemberStats(teamId, mockPeople, mockKudos);
}
