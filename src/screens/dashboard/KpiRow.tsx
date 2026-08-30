import { NudgeButton } from '../../components/nudge/NudgeButton';
import { Money } from '../../components/ui/Money';
import { Pill } from '../../components/ui/Pill';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatCard } from '../../components/ui/StatCard';
import { computeExpiringSoonRecipientIds, paceLabel } from '../../lib/derive';
import { percent } from '../../lib/format';
import type { CompanyStats, Kudo, Person, Team } from '../../lib/types';

export function KpiRow({
  company,
  people,
  teams,
  kudos,
}: {
  company: CompanyStats;
  people: Person[];
  teams: Team[];
  kudos: Kudo[];
}) {
  const expiringPersonIds = computeExpiringSoonRecipientIds(kudos);

  return (
    <>
    <div className="grid grid-cols-4 gap-3.5">
      <StatCard
        label="Budget used"
        value={percent(company.usageRatio)}
        sub={
          <>
            <Money cents={company.givenCents} /> of <Money cents={company.allowanceCents} /> given
          </>
        }
      >
        <div className="mt-2.5">
          <ProgressBar value={company.usageRatio} pace={company.paceRatio} tone="warn" />
        </div>
        <div className="mt-1.5">
          <Pill tone="warn">{paceLabel(company.usageRatio, company.paceRatio)}</Pill>
        </div>
      </StatCard>

      <StatCard
        label="Claim rate"
        value={percent(company.claimRatio)}
        sub={
          <>
            <Money cents={company.claimedCents} /> of <Money cents={company.receivedCents} /> redeemed
          </>
        }
      >
        <div className="mt-2.5">
          <ProgressBar value={company.claimRatio} tone="good" />
        </div>
        <div className="mt-1.5">
          <Pill tone="neutral">{company.openCount} cards outstanding</Pill>
        </div>
      </StatCard>

      <StatCard
        label="Participation"
        value={
          <>
            {company.participantCount}
            <span className="text-[17px] font-medium text-muted">/{company.headcount}</span>
          </>
        }
        sub="employees have given at least once"
      >
        <div className="mt-2.5">
          <ProgressBar value={company.participantCount / company.headcount} tone="good" />
        </div>
        <div className="mt-1.5">
          <Pill tone="good">{percent(company.participantCount / company.headcount)} · healthy</Pill>
        </div>
      </StatCard>

      <StatCard
        label="Coverage"
        value={percent(company.coverageRatio)}
        sub={`${company.reachedCount} of ${company.headcount} people were reached at all`}
      >
        <div className="mt-3 space-y-2">
          {company.byOffice.map((o) => (
            <div key={o.office.id}>
              <div className="flex items-baseline justify-between text-[11.5px]">
                <span className="font-semibold">{o.office.name}</span>
                <span className="tabular-nums text-muted">
                  <b className={o.ratio < 0.5 ? 'text-crit' : 'text-ink'}>{percent(o.ratio)}</b>
                  {' · '}
                  {o.reachedCount}/{o.headcount}
                </span>
              </div>
              <div className="mt-1">
                <ProgressBar value={o.ratio} tone={o.ratio < 0.5 ? 'crit' : 'good'} />
              </div>
            </div>
          ))}
        </div>
      </StatCard>

    </div>

      <div className="rounded-[10px] border border-[#F0C9C5] bg-[#FFFCFC] px-4 py-3 flex items-center gap-3">
        <span className="text-[10.5px] font-semibold tracking-wider uppercase text-crit">At risk</span>
        <span className="text-[13px]">
          <b className="tabular-nums"><Money cents={company.expiringSoonCents} /></b>
          <span className="text-muted"> · {company.expiringSoonCount} gift cards expire within 30 days</span>
        </span>
        <span className="ml-auto">
          <NudgeButton
            personIds={expiringPersonIds}
            template="unclaimed_gift"
            label={`Nudge all ${company.expiringSoonCount} recipients`}
            people={people}
            teams={teams}
          />
        </span>
      </div>
    </>
  );
}
