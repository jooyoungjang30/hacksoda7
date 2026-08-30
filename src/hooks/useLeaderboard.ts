import { computeLeaderboard } from '../lib/derive';
import type { Kudo, Person, Team } from '../lib/types';

export function useLeaderboard(people: Person[], teams: Team[], kudos: Kudo[], limit: number) {
  return computeLeaderboard(people, teams, kudos, limit);
}
