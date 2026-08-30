import { mockPeople } from '../../mock/people';
import { mockTeams } from '../../mock/teams';
import { useToast } from '../ui/Toast';
import { useNudge } from './NudgeContext';
import type { NudgeTemplate, PersonId } from '../../lib/types';

const BULK_CONFIRM_THRESHOLD = 5;

function describeTargets(personIds: PersonId[]): string {
  if (personIds.length === 1) {
    const person = mockPeople.find((p) => p.id === personIds[0]);
    return `Nudged ${person?.name ?? 'person'}`;
  }
  const teamIds = new Set(personIds.map((id) => mockPeople.find((p) => p.id === id)?.teamId));
  if (teamIds.size === 1) {
    const team = mockTeams.find((t) => t.id === [...teamIds][0]);
    return `Nudged ${personIds.length} people in ${team?.name ?? 'team'}`;
  }
  return `Nudged ${personIds.length} people`;
}

export function NudgeButton({
  personIds,
  template,
  label,
}: {
  personIds: PersonId[];
  template: NudgeTemplate;
  label?: string;
}) {
  const { sendNudge, canNudge } = useNudge();
  const { showToast } = useToast();

  const disabled = personIds.length === 0 || personIds.every((id) => !canNudge(id));

  function handleClick() {
    if (personIds.length > BULK_CONFIRM_THRESHOLD) {
      const ok = window.confirm(`Send a Slack reminder to ${personIds.length} people?`);
      if (!ok) return;
    }
    sendNudge(personIds, template);
    showToast(describeTargets(personIds));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-md border border-brand bg-brand-soft px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap text-brand disabled:cursor-not-allowed disabled:opacity-40"
    >
      ◈ {label ?? 'Nudge'}
    </button>
  );
}
