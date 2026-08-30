import { computeCompanyStats } from '../lib/derive';
import type { Kudo, Person } from '../lib/types';

export function useCompanyStats(people: Person[], kudos: Kudo[]) {
  return computeCompanyStats(people, kudos);
}
