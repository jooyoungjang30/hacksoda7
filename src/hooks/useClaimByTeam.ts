import { computeClaimByTeam } from '../lib/derive';
import type { Kudo, Person, Team } from '../lib/types';

export function useClaimByTeam(people: Person[], teams: Team[], kudos: Kudo[]) {
  return computeClaimByTeam(people, teams, kudos);
}
