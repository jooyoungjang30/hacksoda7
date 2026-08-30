import { computeLeaderboard } from '../lib/derive';
import { mockPeople } from '../mock/people';
import { mockKudos } from '../mock/kudos';

export function useLeaderboard(limit: number) {
  return computeLeaderboard(mockPeople, mockKudos, limit);
}
