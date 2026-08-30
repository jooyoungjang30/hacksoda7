import { Card } from '../../components/ui/Card';
import { percent } from '../../lib/format';
import type { GraphInsights as GraphInsightsData } from '../../hooks/useKudosGraph';

export function GraphInsights({ insights }: { insights: GraphInsightsData }) {
  const rows = [
    {
      label: 'Most relied on',
      text: `${insights.mostReliedOn.person.name} — thanked by ${insights.mostReliedOn.distinctGivers} people across ${insights.mostReliedOn.teamsSpanned} teams.`,
    },
    {
      label: 'Bridges the org',
      text: `${insights.connector.person.name} is the only person giving into ${insights.connector.teamsSentInto} different teams.`,
    },
    {
      label: 'Closed cluster',
      text: `${percent(insights.mostClosedTeam.ratio)} of ${insights.mostClosedTeam.team.name} kudos stay inside ${insights.mostClosedTeam.team.name} — almost no exchange with the rest of the company.`,
    },
    {
      label: 'Disconnected',
      text: `${insights.dormantCount} people neither gave nor received in 90 days.`,
    },
    {
      label: 'Mutual pairs',
      text: `${percent(insights.mutualPairRatio)} of connections go both ways.`,
    },
  ];

  return (
    <Card className="flex-1 p-4">
      <div className="mb-2.5 text-[10.5px] font-semibold tracking-wider text-muted uppercase">
        What the map shows
      </div>
      <div className="flex flex-col gap-3.5 text-xs leading-relaxed">
        {rows.map((row) => (
          <div key={row.label}>
            <b className="mb-0.5 block">{row.label}</b>
            <span className="text-muted">{row.text}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
