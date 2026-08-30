import type { ReactNode } from 'react';
import { Card } from '../../components/ui/Card';
import { Pill, type PillTone } from '../../components/ui/Pill';
import { money, percent } from '../../lib/format';
import type { GraphInsights as GraphInsightsData, ManagerActionGroup } from '../../hooks/useKudosGraph';
import type { Team } from '../../lib/types';

type Tone = 'attention' | 'neutral' | 'good';

const TONE: Record<Tone, { pill: PillTone; card: string; stripe: string }> = {
  attention: { pill: 'warn', card: 'bg-warn-bg', stripe: 'border-warn' },
  neutral: { pill: 'neutral', card: 'bg-surface', stripe: 'border-muted/40' },
  good: { pill: 'good', card: 'bg-good-bg', stripe: 'border-good' },
};

/** One manager-per-line reach-out list — the concrete "who do I message" checklist
 * an HR head acts on, distinct in style from the descriptive text above it. */
function ActionList({ groups, teams }: { groups: ManagerActionGroup[]; teams: Team[] }) {
  if (groups.length === 0) return null;
  const teamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name ?? teamId;
  return (
    <div className="mt-2.5 flex flex-col gap-1.5 border-t border-warn/25 pt-2.5">
      <div className="text-[10px] font-semibold tracking-wider text-warn uppercase">Action</div>
      {groups.map((g) => (
        <div key={g.manager.id} className="text-[12px] leading-relaxed text-ink">
          . Reach out to <b>{g.manager.name}</b>{' '}
          <span className="text-muted">({teamName(g.manager.teamId)} manager)</span> about{' '}
          {g.people.map((p) => p.name).join(', ')}.
        </div>
      ))}
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

/** One trello-style column. Columns scroll horizontally as a group (see the
 * `overflow-x-auto` wrapper below) rather than squeezing cards unreadably
 * narrow on smaller screens. `width` sets each column's share of the board:
 * Needs attention gets more room since it carries the most cards. */
function Column({ width, children }: { width: '40%' | '30%'; children: ReactNode }) {
  const widthClass = width === '40%' ? 'w-[40%]' : 'w-[30%]';
  return (
    <div className={`min-w-[230px] shrink-0 ${widthClass} rounded-lg border border-line/60 bg-surface/60 p-3`}>
      {children}
    </div>
  );
}

export function GraphInsights({ insights, teams }: { insights: GraphInsightsData; teams: Team[] }) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <div className="text-[10.5px] font-semibold tracking-wider text-brand uppercase">HR Insights</div>
        <h2 className="mt-1 text-[17px] font-semibold">What this map means for the team</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
          Computed from the full year of kudos activity — reads the same regardless of the filters at left.
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto">
        <Column width="40%">
          <Section tone="attention" title="Needs attention" sub="worth a message this week">
            <InsightCard title="Not reached" stat={String(insights.unreached.count)} tone="attention">
              No one has recognized them in the last 90 days — a gap in the org's reach, not a reflection on
              them.
              <ActionList groups={insights.unreached.groups} teams={teams} />
            </InsightCard>

            {insights.managerGap.example && (
              <InsightCard title="Manager hasn't reached them" stat={String(insights.managerGap.count)} tone="attention">
                {insights.managerGap.example.peerGivers} peers recognize {insights.managerGap.example.person.name},
                but {insights.managerGap.example.manager.name} hasn't in 90 days — a manager conversation, not an
                employee one.
                <ActionList groups={insights.managerGap.groups} teams={teams} />
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
              <ActionList groups={insights.receiveOnly.groups} teams={teams} />
            </InsightCard>

            <InsightCard title="One relationship away from nothing" stat={String(insights.singleSource.count)} tone="attention">
              Everything they've received came from a single colleague. If that relationship lapses, their
              recognition drops to zero overnight.
              <ActionList groups={insights.singleSource.groups} teams={teams} />
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

        <Column width="30%">
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

        <Column width="30%">
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
