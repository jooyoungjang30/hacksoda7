import type { PillTone } from '../../components/ui/Pill';
import type { PersonFlag } from '../../lib/types';

export const FLAG_LABEL: Record<Exclude<PersonFlag, null>, string> = {
  unreached: 'Unreached 90d',
  single_source: 'Single source',
  receive_only: 'Never given',
  manager_gap: 'No recent manager kudos',
  team_only: 'Team-only',
};

export const FLAG_TONE: Record<Exclude<PersonFlag, null>, PillTone> = {
  unreached: 'crit',
  single_source: 'crit',
  receive_only: 'warn',
  manager_gap: 'warn',
  team_only: 'warn',
};
