import { createContext, useContext, useState, type ReactNode } from 'react';
import { TODAY, daysUntil } from '../../lib/clock';
import type { NudgeRecord, NudgeTemplate, PersonId } from '../../lib/types';

const COOLDOWN_DAYS = 7;

// Seeded so the disabled cooldown state is visible without clicking anything.
// Deliberately not any of the 8 named Engineering members or Ravi — every "Verify"
// step in the plan requires those buttons to be enabled at load.
const SEED_NUDGES: NudgeRecord[] = [
  { personId: 'bianca-alves', template: 'unclaimed_gift', sentAt: '2026-08-25' },
  { personId: 'marta-djuric', template: 'unused_budget', sentAt: '2026-08-27' },
];

interface NudgeContextValue {
  sendNudge: (personIds: PersonId[], template: NudgeTemplate) => void;
  canNudge: (personId: PersonId) => boolean;
}

const NudgeContext = createContext<NudgeContextValue | null>(null);

export function NudgeProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<NudgeRecord[]>(SEED_NUDGES);

  function canNudge(personId: PersonId): boolean {
    return !records.some((r) => r.personId === personId && daysUntil(r.sentAt) >= -COOLDOWN_DAYS);
  }

  function sendNudge(personIds: PersonId[], template: NudgeTemplate) {
    const sentAt = TODAY.toISOString().slice(0, 10);
    setRecords((prev) => [...prev, ...personIds.map((personId) => ({ personId, template, sentAt }))]);

    // Real Slack DM. Only one seeded employee has a slack_user_id, so the
    // recipient is fixed for the demo. Failure leaves the toast behaviour intact.
    fetch('/api/nudge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: 'wei', suggestedTo: 'priya' }),
    }).catch(() => {});
  }

  return <NudgeContext.Provider value={{ sendNudge, canNudge }}>{children}</NudgeContext.Provider>;
}

export function useNudge(): NudgeContextValue {
  const ctx = useContext(NudgeContext);
  if (!ctx) throw new Error('useNudge must be used within a NudgeProvider');
  return ctx;
}
