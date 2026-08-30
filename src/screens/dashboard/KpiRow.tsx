import { NudgeButton } from '../../components/nudge/NudgeButton';
import { Money } from '../../components/ui/Money';
import { Pill } from '../../components/ui/Pill';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatCard } from '../../components/ui/StatCard';
import { computeExpiringSoonRecipientIds, paceLabel } from '../../lib/derive';
import { percent } from '../../lib/format';
import { mockKudos } from '../../mock/kudos';
import type { CompanyStats } from '../../lib/types';

export function KpiRow({ company }: { company: CompanyStats }) {
  const expiringPersonIds = computeExpiringSoonRecipientIds(mockKudos);

  return (
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
        label="At risk"
        value={<Money cents={company.expiringSoonCents} />}
        sub={`${company.expiringSoonCount} gift cards expire within 30 days`}
        tone="crit"
        action={
          <NudgeButton
            personIds={expiringPersonIds}
            template="unclaimed_gift"
            label={`Nudge all ${company.expiringSoonCount} recipients`}
          />
        }
      />
    </div>
  );
}
