import { Avatar } from '../../components/ui/Avatar';
import { Card, CardHeader } from '../../components/ui/Card';
import { Money } from '../../components/ui/Money';
import { NudgeButton } from '../../components/nudge/NudgeButton';
import { Pill } from '../../components/ui/Pill';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { computeTeamMemberStats } from '../../lib/derive';
import { percent, teamInitials } from '../../lib/format';
import type { CompanyStats, Kudo, Person, Team, TeamClaimRow } from '../../lib/types';

function openCountTone(count: number): 'crit' | 'warn' | 'neutral' {
  if (count >= 10) return 'crit';
  if (count >= 5) return 'warn';
  return 'neutral';
}

export function ClaimTrackingTable({
  rows,
  company,
  people,
  teams,
  kudos,
}: {
  rows: TeamClaimRow[];
  company: CompanyStats;
  people: Person[];
  teams: Team[];
  kudos: Kudo[];
}) {
  const everyoneWithOpenCards = [
    ...new Set(kudos.filter((k) => k.claimedAt === null).map((k) => k.toId)),
  ];

  return (
    <Card>
      <CardHeader title="Gift cards claimed" sub="by receiving team" />
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            {['Team', 'Received', 'Claimed', 'Claim rate', 'Open', ''].map((h) => (
              <th
                key={h}
                className={`border-b border-[#EFEDF4] bg-[#FCFBFE] px-3.5 py-2.5 text-[10px] font-semibold tracking-wider text-muted uppercase ${
                  h === 'Received' || h === 'Claimed' || h === 'Open' ? 'text-right' : 'text-left'
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const barTone = row.claimRatio >= 0.85 ? 'good' : row.claimRatio >= 0.7 ? 'warn' : 'crit';
            const nudgeTargets = computeTeamMemberStats(row.team.id, people, kudos)
              .filter((m) => m.unclaimedCount > 0)
              .map((m) => m.person.id);
            return (
              <tr key={row.team.id}>
                <td className="border-b border-[#F2F0F7] px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={teamInitials(row.team.id)} color={row.team.color} />
                    <div>
                      <b className="block text-[12.5px] leading-tight font-semibold">{row.team.name}</b>
                      <span className="text-[11px] text-muted">{row.memberCount} members</span>
                    </div>
                  </div>
                </td>
                <td className="border-b border-[#F2F0F7] px-3.5 py-2.5 text-right tabular-nums">
                  <Money cents={row.receivedCents} />
                </td>
                <td className="border-b border-[#F2F0F7] px-3.5 py-2.5 text-right tabular-nums">
                  <Money cents={row.claimedCents} />
                </td>
                <td className="w-[150px] border-b border-[#F2F0F7] px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1">
                      <ProgressBar value={row.claimRatio} tone={barTone} />
                    </div>
                    <b className="text-[12px] tabular-nums">{percent(row.claimRatio)}</b>
                  </div>
                </td>
                <td className="border-b border-[#F2F0F7] px-3.5 py-2.5 text-right">
                  <Pill tone={openCountTone(row.openCount)}>{row.openCount}</Pill>
                </td>
                <td className="border-b border-[#F2F0F7] px-3.5 py-2.5">
                  <NudgeButton personIds={nudgeTargets} template="unclaimed_gift" people={people} teams={teams} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex items-center gap-2.5 border-t border-[#EFEDF4] px-4 py-2.5">
        <span className="text-[11.5px] text-muted">
          {company.openCount} open cards · <Money cents={company.receivedCents - company.claimedCents} /> unclaimed
          · {company.expiringSoonCount} expiring within 30 days
        </span>
        <span className="ml-auto">
          <NudgeButton
            personIds={everyoneWithOpenCards}
            template="unclaimed_gift"
            label="Nudge everyone with open cards"
            people={people}
            teams={teams}
          />
        </span>
      </div>
    </Card>
  );
}
