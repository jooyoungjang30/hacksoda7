import { computePersonDetail, computePersonDirectory } from '../lib/relationships';
import type { Kudo, Person, PersonId, Team } from '../lib/types';

/** Every person, sorted by fewest connections first — the flagged cohort HR
 * needs to see surfaces before the well-connected majority. */
export function usePersonDirectory(people: Person[], teams: Team[], kudos: Kudo[]) {
  return computePersonDirectory(people, teams, kudos);
}

/** One person's full kudos history and reporting line, or undefined if the id
 * doesn't match anyone. */
export function usePersonDetail(personId: PersonId, people: Person[], kudos: Kudo[]) {
  return computePersonDetail(personId, people, kudos);
}
