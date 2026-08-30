import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Pill, type PillTone } from '../../components/ui/Pill';
import { money, percent } from '../../lib/format';
import type { GraphInsights as GraphInsightsData, ManagerActionGroup } from '../../hooks/useKudosGraph';

type Tone = 'attention' | 'neutral' | 'good';

const TONE: Record<Tone, { pill: PillTone; card: string; stripe: string }> = {
  attention: { pill: 'warn', card: 'bg-warn-bg', stripe: 'border-warn' },
  neutral: { pill: 'neutral', card: 'bg-surface', stripe: 'border-muted/40' },
  good: { pill: 'good', card: 'bg-good-bg', stripe: 'border-good' },
};

const COLLAPSED_COUNT = 4;

/** Pills for the flagged individuals behind this card — the concrete "who" list
 * an HR head can act on. Clicking a person opens their page in Relationships,
 * where the manager reach-out action items now live. Collapsed to a handful by
 * default since some cohorts (e.g. "Not reached") run past a dozen people. */
function ActionList({ groups, onPersonClick }: { groups: ManagerActionGroup[]; onPersonClick: (personId: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const flagged = groups.flatMap((g) => g.people);
  if (flagged.length === 0) return null;
  const visible = expanded ? flagged : flagged.slice(0, COLLAPSED_COUNT);
  const hiddenCount = flagged.length - visible.length;
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-warn/25 pt-2.5">
      <div className="w-full text-[10px] font-semibold tracking-wider text-warn uppercase">Flagged</div>
      {visible.map((p) => (
        <button key={p.id} type="button" onClick={() => onPersonClick(p.id)} className="cursor-pointer">
          <Pill tone="warn" className="border border-warn/40">
            {p.name}
          </Pill>
        </button>
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-[11px] font-semibold text-warn hover:underline"
        >
          See {hiddenCount} more
        </button>
      )}
      {expanded && flagged.length > COLLAPSED_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-[11px] font-semibold text-muted hover:underline"
        >
          Show less
        </button>
      )}
    </div>
  );
}

function InsightCard({
  tone,
  title,
  stat,
  children,
}: {
  tone: Tone;
  title: string;
  stat?: string;
  children: ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div className={`rounded-lg border-l-[3px] ${t.stripe} ${t.card} py-2.5 pr-3.5 pl-3`}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[15.5px] font-semibold">{title}</div>
        {stat && <div className="shrink-0 text-[14px] font-bold tabular-nums">{stat}</div>}
      </div>
      <div className="mt-1 text-[12px] leading-relaxed text-muted">{children}</div>
    </div>
  );
}

function Section({
  tone,
  title,
  sub,
  children,
}: {
  tone: Tone;
  title: string;
  sub: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-baseline gap-2">
        <Pill tone={TONE[tone].pill}>{title}</Pill>
        <span className="text-[11px] text-muted">{sub}</span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

/** One trello-style column. Grid tracks (not flex + overflow-x-auto) so the
 * board always fits the card's actual width — columns wrap their content
 * instead of clipping it off past a horizontal scrollbar. */
function Column({ children }: { children: ReactNode }) {
  return <div className="min-w-0 rounded-lg border border-line/60 bg-surface/60 p-3">{children}</div>;
}

export function GraphInsights({ insights }: { insights: GraphInsightsData }) {
  const navigate = useNavigate();
  const onPersonClick = (personId: string) => navigate(`/kudos/relationships/${personId}`);
  return (
    <Card className="min-w-0 p-5">
      <div className="mb-4">
        <div className="text-[10.5px] font-semibold tracking-wider text-brand uppercase">HR Insights</div>
        <h2 className="mt-1 text-[17px] font-semibold">What this map means for the team</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
          Computed from the full year of kudos activity — reads the same regardless of the filters at left.
        </p>
      </div>

      <div className="grid grid-cols-[2fr_1.4fr_1.4fr] gap-4">
        <Column>
          <Section tone="attention" title="Needs attention" sub="worth a message this week">
          {insights.crossOffice.worst && insights.crossOffice.offices.length > 1 && (
            <InsightCard
              title={`Recognition is not reaching ${insights.crossOffice.worst.office.name}`}
              stat={percent(insights.crossOffice.worst.ratio)}
              tone="attention"
            >
              <b className="text-ink">
                {insights.crossOffice.worst.reached} of {insights.crossOffice.worst.headcount}
              </b>{' '}
              people in {insights.crossOffice.worst.office.name} have been thanked by anyone in the
              last 90 days.{' '}
              <b className="text-ink">{insights.crossOffice.worst.inbound}</b> of those thank-yous
              came from another office
              {insights.crossOffice.worst.topInboundSender &&
                insights.crossOffice.worst.topInboundSender.count > 1 && (
                  <>
                    , and{' '}
                    <b className="text-ink">
                      {insights.crossOffice.worst.topInboundSender.count} of them
                    </b>{' '}
                    came from {insights.crossOffice.worst.topInboundSender.person.name} alone
                  </>
                )}
              .
              <div className="mt-2 flex flex-wrap gap-1.5">
                {insights.crossOffice.offices.map((o) => (
                  <span
                    key={o.office.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2 py-0.5 text-[11px]"
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: o.office.color }}
                    />
                    <b>{o.office.name}</b>
                    <span className="tabular-nums text-muted">
                      {percent(o.ratio)} reached . {o.outbound} sent out . {o.inbound} received in
                    </span>
                  </span>
                ))}
              </div>
            </InsightCard>
          )}

            <InsightCard title="Not reached" stat={String(insights.unreached.count)} tone="attention">
              No one has recognized them in the last 90 days — a gap in the org's reach, not a reflection on
              them.
              <ActionList groups={insights.unreached.groups} onPersonClick={onPersonClick} />
            </InsightCard>

            {insights.managerGap.example && (
              <InsightCard title="Manager hasn't reached them" stat={String(insights.managerGap.count)} tone="attention">
                {insights.managerGap.example.peerGivers} peers recognize {insights.managerGap.example.person.name},
                but {insights.managerGap.example.manager.name} hasn't in 90 days — a manager conversation, not an
                employee one.
                <ActionList groups={insights.managerGap.groups} onPersonClick={onPersonClick} />
              </InsightCard>
            )}

            {insights.overloadRisk.top && (
              <InsightCard title="Overload risk" stat={String(insights.overloadRisk.count)} tone="attention">
                {insights.overloadRisk.top.person.name} is thanked by {insights.overloadRisk.top.distinctGivers}{' '}
                people on a team of {insights.overloadRisk.top.teamSize} — the heaviest support load relative to
                team size. Attrition runs up to 200% higher around people carrying this much informal load.
              </InsightCard>
            )}

            <InsightCard title="Recognized, but not giving back" stat={String(insights.receiveOnly.count)} tone="attention">
              Received kudos at least once but has never given any — recognized, but not yet part of the culture
              of thanking others.
              <ActionList groups={insights.receiveOnly.groups} onPersonClick={onPersonClick} />
            </InsightCard>

            <InsightCard title="One relationship away from nothing" stat={String(insights.singleSource.count)} tone="attention">
              Everything they've received came from a single colleague. If that relationship lapses, their
              recognition drops to zero overnight.
              <ActionList groups={insights.singleSource.groups} onPersonClick={onPersonClick} />
            </InsightCard>

            <InsightCard
              title={`${insights.mostClosedTeam.team.name} rarely reaches outside the team`}
              stat={percent(insights.mostClosedTeam.ratio)}
              tone="attention"
            >
              {percent(insights.mostClosedTeam.ratio)} of {insights.mostClosedTeam.team.name} kudos stay inside{' '}
              {insights.mostClosedTeam.team.name} — almost no exchange with the rest of the company.
              <div className="mt-2.5 flex flex-col gap-1.5 border-t border-warn/25 pt-2.5">
                <div className="text-[10px] font-semibold tracking-wider text-warn uppercase">Action</div>
                <div className="text-[12px] leading-relaxed text-ink">
                  . Reach out to <b>{insights.mostClosedTeam.manager.name}</b>{' '}
                  <span className="text-muted">({insights.mostClosedTeam.team.name} manager)</span> to encourage
                  the team to send kudos outside {insights.mostClosedTeam.team.name} too.
                </div>
              </div>
            </InsightCard>

            {insights.fragileBridges.example && (
              <InsightCard
                title="Fragile bridges"
                stat={`${insights.fragileBridges.count}/${insights.fragileBridges.totalConnectedPairs}`}
                tone="attention"
              >
                {insights.fragileBridges.count} of {insights.fragileBridges.totalConnectedPairs} connected team
                pairs rely on a single relationship — e.g. {insights.fragileBridges.example.teamA.name} and{' '}
                {insights.fragileBridges.example.teamB.name} connect only through{' '}
                {insights.fragileBridges.example.people[0].name} and{' '}
                {insights.fragileBridges.example.people[1].name}.
                <div className="mt-2.5 flex flex-col gap-1.5 border-t border-warn/25 pt-2.5">
                  <div className="text-[10px] font-semibold tracking-wider text-warn uppercase">Action</div>
                  <div className="text-[12px] leading-relaxed text-ink">
                    . If either leaves, {insights.fragileBridges.example.teamA.name} and{' '}
                    {insights.fragileBridges.example.teamB.name} lose their only connection — loop in{' '}
                    <b>{insights.fragileBridges.example.managers[0].name}</b>{' '}
                    <span className="text-muted">({insights.fragileBridges.example.teamA.name} manager)</span> and{' '}
                    <b>{insights.fragileBridges.example.managers[1].name}</b>{' '}
                    <span className="text-muted">({insights.fragileBridges.example.teamB.name} manager)</span>.
                  </div>
                </div>
              </InsightCard>
            )}
          </Section>
        </Column>

        <Column>
          <Section tone="neutral" title="Worth knowing" sub="context, no action needed">
            <InsightCard title="Cross-team collaboration" stat={percent(insights.crossTeamRatio)} tone="neutral">
              Of all kudos exchanged company-wide, {percent(insights.crossTeamRatio)} cross a team boundary.
            </InsightCard>
            <InsightCard title="Bridges the org" stat={`${insights.connector.teamsSentInto} teams`} tone="neutral">
              {insights.connector.person.name} is the only person giving into {insights.connector.teamsSentInto}{' '}
              different teams — the most connected node in the graph.
            </InsightCard>
          </Section>
        </Column>

        <Column>
          <Section tone="good" title="Going well" sub="worth recognizing">
            <InsightCard
              title="Most relied on"
              stat={`${insights.mostReliedOn.distinctGivers} people`}
              tone="good"
            >
              {insights.mostReliedOn.person.name} — thanked by {insights.mostReliedOn.distinctGivers} people
              across {insights.mostReliedOn.teamsSpanned} teams. Research on organizational networks finds 3–5%
              of people typically carry 20–35% of this kind of value-adding collaboration.
            </InsightCard>
            {insights.strongestBond && (
              <InsightCard title="Strongest bond" stat={money(insights.strongestBond.totalCents)} tone="good">
                {insights.strongestBond.a.name} and {insights.strongestBond.b.name} have exchanged{' '}
                {money(insights.strongestBond.totalCents)} in kudos — the strongest relationship in the data.
              </InsightCard>
            )}
          </Section>
        </Column>
      </div>
    </Card>
  );
}
