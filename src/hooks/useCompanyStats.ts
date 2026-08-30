import { computeCompanyStats } from '../lib/derive';
import { mockPeople } from '../mock/people';
import { mockKudos } from '../mock/kudos';

export function useCompanyStats() {
  return computeCompanyStats(mockPeople, mockKudos);
}
