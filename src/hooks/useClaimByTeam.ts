import { computeClaimByTeam } from '../lib/derive';
import { mockPeople } from '../mock/people';
import { mockKudos } from '../mock/kudos';

export function useClaimByTeam() {
  return computeClaimByTeam(mockPeople, mockKudos);
}
