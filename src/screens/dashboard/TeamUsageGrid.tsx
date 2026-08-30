import { Card, CardHeader } from '../../components/ui/Card';
import { TeamUsageCard } from './TeamUsageCard';
import type { TeamStats } from '../../lib/types';

export function TeamUsageGrid({ teams }: { teams: TeamStats[] }) {
  return (
    <Card className="mt-5">
      <CardHeader
        title="Usage by team"
        sub="Share of each team's total allowance given out · black tick marks year-to-date pace"
      />
      <div className="grid grid-cols-3 gap-3.5 p-[18px]">
        {teams.map((stats) => (
          <TeamUsageCard key={stats.team.id} stats={stats} />
        ))}
      </div>
    </Card>
  );
}
