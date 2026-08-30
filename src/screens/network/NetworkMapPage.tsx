import { useState } from 'react';
import { AppShell } from '../../components/shell/AppShell';
import { PageHeader } from '../../components/shell/PageHeader';
import { PageTabs } from '../../components/shell/PageTabs';
import { Card } from '../../components/ui/Card';
import { useKudosGraph } from '../../hooks/useKudosGraph';
import { mockTeams } from '../../mock/teams';
import { mockPeople } from '../../mock/people';
import { ForceGraph } from './ForceGraph';
import { GraphInsights } from './GraphInsights';
import type { TeamId } from '../../lib/types';

export function NetworkMapPage() {
  const [teamFilter, setTeamFilter] = useState<TeamId | 'all'>('all');
  const [crossTeamOnly, setCrossTeamOnly] = useState(false);
  const { nodes, links, insights } = useKudosGraph({ crossTeamOnly, teamFilter });

  return (
    <AppShell>
      <PageHeader title="Kudos Gift Tracker" />
      <PageTabs />
      <div className="space-y-3.5 bg-surface p-6.5">
        <div className="flex items-center gap-4">
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value as TeamId | 'all')}
            className="rounded-md border border-line bg-white px-2.5 py-1.5 text-[12.5px]"
          >
            <option value="all">All teams</option>
            {mockTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setCrossTeamOnly((v) => !v)}
            className={`rounded-md border px-2.5 py-1.5 text-[12.5px] ${
              crossTeamOnly ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-white text-ink'
            }`}
          >
            {crossTeamOnly ? '☑' : '☐'} Show cross-team only
          </button>
          <span className="ml-auto text-[11.5px] text-muted">
            {nodes.length} people · {links.length} unique pairs
          </span>
        </div>

        <div className="flex items-stretch gap-4">
          <Card className="flex-1 overflow-hidden bg-[#FCFBFE] p-0">
            <ForceGraph nodes={nodes} links={links} insights={insights} />
          </Card>

          <div className="flex w-[258px] flex-none flex-col gap-3.5">
            <Card className="p-4">
              <div className="mb-2.5 text-[10.5px] font-semibold tracking-wider text-muted uppercase">Teams</div>
              <div className="flex flex-col gap-1.5 text-xs">
                {mockTeams.map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <i className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
                    {t.name}
                    <span className="ml-auto text-muted tabular-nums">
                      {mockPeople.filter((p) => p.teamId === t.id).length}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
            <GraphInsights insights={insights} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
