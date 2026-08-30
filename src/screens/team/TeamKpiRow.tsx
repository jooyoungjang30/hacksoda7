import { Money } from '../../components/ui/Money';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { fiscalYearProgress } from '../../lib/clock';
import { percent } from '../../lib/format';
import type { MemberStats, TeamClaimRow, TeamStats } from '../../lib/types';

export function TeamKpiRow({
  team,
  members,
  claim,
}: {
  team: TeamStats;
  members: MemberStats[];
  claim: TeamClaimRow;
}) {
  const givingCount = members.filter((m) => m.givenCents > 0).length;

  return (
    <div className="grid grid-cols-3 gap-3.5">
      <div className="rounded-[10px] border border-line bg-white p-4">
        <div className="text-[10.5px] font-semibold tracking-wider text-muted uppercase">Team budget used</div>
        <div className="mt-[7px] mb-0.5 text-[29px] leading-none font-bold tracking-tight tabular-nums">
          {percent(team.usageRatio)}
        </div>
        <div className="text-[11.5px] text-muted">
          <Money cents={team.givenCents} /> of <Money cents={team.allowanceCents} />
        </div>
        <div className="mt-2.5">
          <ProgressBar value={team.usageRatio} pace={fiscalYearProgress()} tone="warn" />
        </div>
      </div>

      <div className="rounded-[10px] border border-line bg-white p-4">
        <div className="text-[10.5px] font-semibold tracking-wider text-muted uppercase">Members giving</div>
        <div className="mt-[7px] mb-0.5 text-[29px] leading-none font-bold tracking-tight">
          {givingCount}
          <span className="text-[17px] font-medium text-muted">/{team.memberCount}</span>
        </div>
        <div className="text-[11.5px] text-muted">
          {team.memberCount - givingCount} {team.memberCount - givingCount === 1 ? 'has' : 'have'} never sent kudos
        </div>
      </div>

      <div className="rounded-[10px] border border-line bg-white p-4">
        <div className="text-[10.5px] font-semibold tracking-wider text-muted uppercase">Received by team</div>
        <div className="mt-[7px] mb-0.5 text-[29px] leading-none font-bold tracking-tight tabular-nums">
          <Money cents={claim.receivedCents} />
        </div>
        <div className="text-[11.5px] text-muted">
          {percent(claim.claimRatio)} claimed · {claim.openCount} cards open
        </div>
      </div>
    </div>
  );
}
