import { useNavigate } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';
import { Money } from '../../components/ui/Money';
import { NudgeButton } from '../../components/nudge/NudgeButton';
import { paceStatusTone } from '../../components/ui/Pill';
import { Pill } from '../../components/ui/Pill';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { computeTeamMemberStats, paceLabel } from '../../lib/derive';
import { fiscalYearProgress } from '../../lib/clock';
import { percent, teamInitials } from '../../lib/format';
import type { Kudo, Person, Team, TeamStats } from '../../lib/types';

export function TeamUsageCard({
  stats,
  people,
  teams,
  kudos,
}: {
  stats: TeamStats;
  people: Person[];
  teams: Team[];
  kudos: Kudo[];
}) {
  const navigate = useNavigate();
  const tone = paceStatusTone(stats.paceStatus) as 'good' | 'warn' | 'crit';
  const pace = fiscalYearProgress();

  const nudgeTargets = computeTeamMemberStats(stats.team.id, people, kudos)
    .filter((m) => m.usageRatio < 1)
    .map((m) => m.person.id);

  return (
    <div className="rounded-[9px] border border-line p-[15px]">
      <div className="flex items-center gap-2">
        <Avatar initials={teamInitials(stats.team.id)} color={stats.team.color} />
        <div>
          <b className="text-[13.5px]">{stats.team.name}</b>
          <div className="text-[11px] text-muted">
            {stats.memberCount} members · <Money cents={stats.allowanceCents} /> allowance
          </div>
        </div>
        <span className="ml-auto text-[23px] font-bold tabular-nums">{percent(stats.usageRatio)}</span>
      </div>
      <div className="mt-3">
        <ProgressBar value={stats.usageRatio} pace={pace} tone={tone} />
      </div>
      <div className="mt-[11px] flex items-center gap-2">
        <Pill tone={tone}>{paceLabel(stats.usageRatio, pace)}</Pill>
        <span className="text-[11.5px] text-muted tabular-nums">
          <Money cents={stats.givenCents} /> given
        </span>
      </div>
      <div className="mt-[13px] flex gap-1.5">
        <button
          type="button"
          onClick={() => navigate(`/kudos/team/${stats.team.id}`)}
          className="flex-1 rounded-md border border-line px-2.5 py-1 text-center text-[11.5px] font-medium text-ink"
        >
          View team →
        </button>
        <NudgeButton
          personIds={nudgeTargets}
          template="unused_budget"
          label={`Nudge team · ${nudgeTargets.length}`}
          people={people}
          teams={teams}
        />
      </div>
    </div>
  );
}
