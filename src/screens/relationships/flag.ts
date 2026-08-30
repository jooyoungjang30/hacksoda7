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

/** What the manager should actually do — differs by flag, since "recognise them"
 * doesn't fit every case (e.g. receive_only is about them never giving, not about
 * being under-recognised). team_only and manager_gap have no entry: team_only isn't
 * a manager-recognition issue, and manager_gap already states its own action inline. */
export function actionReason(flag: 'unreached' | 'single_source' | 'receive_only', firstName: string): string {
  switch (flag) {
    case 'unreached':
      return "find out what's going on";
    case 'single_source':
      return `make sure ${firstName}'s recognition doesn't depend on a single colleague`;
    case 'receive_only':
      return `encourage ${firstName} to start recognising others too`;
  }
}
