import { Avatar } from '../../components/ui/Avatar';
import { Card, CardHeader } from '../../components/ui/Card';
import { Money } from '../../components/ui/Money';
import { NudgeButton } from '../../components/nudge/NudgeButton';
import { Pill, paceStatusTone } from '../../components/ui/Pill';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { fiscalYearProgress } from '../../lib/clock';
import { percent, shortDate } from '../../lib/format';
import type { MemberStats, Person, Team } from '../../lib/types';

function claimPill(m: MemberStats) {
  if (m.unclaimedCount === 0) return <Pill tone="good">All claimed</Pill>;
  const label = m.unclaimedCount > 1 ? `${Money({ cents: m.unclaimedCents })} unclaimed · ${m.unclaimedCount}` : `${Money({ cents: m.unclaimedCents })} unclaimed`;
  return <Pill tone={m.unclaimedCount > 1 ? 'crit' : 'warn'}>{label}</Pill>;
}

export function MemberTable({
  members,
  teamName,
  people,
  teams,
}: {
  members: MemberStats[];
  teamName: string;
  people: Person[];
  teams: Team[];
}) {
  const pace = fiscalYearProgress();
  const teamColor = teams.find((t) => t.id === members[0]?.person.teamId)?.color ?? '#7C3AED';

  return (
    <Card className="mt-5">
      <CardHeader title="Members" sub={`${members.length} people · sorted by budget used, lowest first`} />
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            {['Member', 'Budget used', 'Given', 'Received', 'Claim status', 'Last given', ''].map((h) => (
              <th
                key={h}
                className={`border-b border-[#EFEDF4] bg-[#FCFBFE] px-3.5 py-2.5 text-[10px] font-semibold tracking-wider text-muted uppercase ${
                  h === 'Given' || h === 'Received' || h === 'Last given' ? 'text-right' : 'text-left'
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const tone = paceStatusTone(m.paceStatus) as 'good' | 'warn' | 'crit';
            return (
              <tr key={m.person.id} className={m.unclaimedCount > 0 ? 'bg-crit-bg/40' : ''}>
                <td className="border-b border-[#F2F0F7] px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={m.person.initials} color={teamColor} />
                    <div>
                      <b className="block text-[12.5px] leading-tight font-semibold">{m.person.name}</b>
                      <span className="text-[11px] text-muted">{m.person.role}</span>
                    </div>
                  </div>
                </td>
                <td className="w-[190px] border-b border-[#F2F0F7] px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1">
                      <ProgressBar value={m.usageRatio} pace={pace} tone={tone} />
                    </div>
                    <b className="text-[12px] tabular-nums">{percent(m.usageRatio)}</b>
                  </div>
                </td>
                <td className="border-b border-[#F2F0F7] px-3.5 py-2.5 text-right tabular-nums">
                  <Money cents={m.givenCents} />
                </td>
                <td className="border-b border-[#F2F0F7] px-3.5 py-2.5 text-right font-semibold tabular-nums">
                  <Money cents={m.receivedCents} />
                </td>
                <td className="border-b border-[#F2F0F7] px-3.5 py-2.5">{claimPill(m)}</td>
                <td className="border-b border-[#F2F0F7] px-3.5 py-2.5 text-right text-muted tabular-nums">
                  {m.lastGivenAt ? shortDate(m.lastGivenAt) : 'Never'}
                </td>
                <td className="border-b border-[#F2F0F7] px-3.5 py-2.5">
                  <NudgeButton
                    personIds={[m.person.id]}
                    template={m.unclaimedCount > 0 ? 'unclaimed_gift' : 'unused_budget'}
                    people={people}
                    teams={teams}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="border-t border-[#EFEDF4] px-4 py-2.5 text-[11.5px] text-muted">
        Showing all {members.length} of {teamName}
      </div>
    </Card>
  );
}
