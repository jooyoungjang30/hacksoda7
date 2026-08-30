import { computeCompanyStats } from '../lib/derive';
import type { Kudo, Office, Person } from '../lib/types';

export function useCompanyStats(people: Person[], kudos: Kudo[], offices: Office[] = []) {
  return computeCompanyStats(people, kudos, offices);
}
