import { useState } from 'react';
import { mockPeople } from '../../mock/people';
import { mockTeams } from '../../mock/teams';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../ui/Toast';
import { useNudge } from './NudgeContext';
import type { NudgeTemplate, PersonId } from '../../lib/types';

const BULK_CONFIRM_THRESHOLD = 5;

const TEMPLATE_SUMMARY: Record<NudgeTemplate, string> = {
  unused_budget: 'a reminder of how much Kudos budget they have left this year',
  unclaimed_gift: 'a reminder to claim the gift cards waiting for them',
};

function nameOf(id: PersonId): string {
  return mockPeople.find((p) => p.id === id)?.name ?? 'Unknown';
}

function describeTargets(personIds: PersonId[]): string {
  if (personIds.length === 1) return `Nudged ${nameOf(personIds[0])}`;
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
  const [confirming, setConfirming] = useState(false);

  // Anyone nudged in the last 7 days is skipped, so a bulk send can never message
  // the same person twice from two different sections.
  const recipients = personIds.filter((id) => canNudge(id));
  const skipped = personIds.length - recipients.length;
  const disabled = recipients.length === 0;

  function send() {
    sendNudge(recipients, template);
    showToast(describeTargets(recipients));
  }

  function handleClick() {
    if (recipients.length > BULK_CONFIRM_THRESHOLD) {
      setConfirming(true);
      return;
    }
    send();
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-md border border-brand bg-brand-soft px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap text-brand disabled:cursor-not-allowed disabled:opacity-40"
      >
        ◈ {label ?? 'Nudge'}
      </button>

      <ConfirmDialog
        open={confirming}
        title={`Send a Slack reminder to ${recipients.length} people?`}
        confirmLabel={`Send ${recipients.length} reminders`}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          send();
        }}
      >
        <p>
          Each person gets a direct message with {TEMPLATE_SUMMARY[template]}. This sends
          immediately and cannot be undone.
        </p>
        <ul className="mt-3 max-h-44 overflow-y-auto rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
          {recipients.map((id) => (
            <li key={id} className="py-0.5">
              {nameOf(id)}
            </li>
          ))}
        </ul>
        {skipped > 0 && (
          <p className="mt-2 text-[12px]">
            {skipped} {skipped === 1 ? 'person was' : 'people were'} nudged in the last 7 days
            and will be skipped.
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}
