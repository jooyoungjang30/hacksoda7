import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/shell/AppShell';
import { PageHeader } from '../../components/shell/PageHeader';
import { PageTabs } from '../../components/shell/PageTabs';
import { Card } from '../../components/ui/Card';
import { buildKudosGraph } from '../../hooks/useKudosGraph';
import { useHrDataset } from '../../hooks/useHrDataset';
import { ForceGraph } from './ForceGraph';
import { GraphInsights } from './GraphInsights';
import type { TeamId } from '../../lib/types';

export function NetworkMapPage() {
  const { people, teams, offices, kudos, loading } = useHrDataset();
  const navigate = useNavigate();
  const [teamFilter, setTeamFilter] = useState<TeamId | 'all'>('all');
  const [crossTeamOnly, setCrossTeamOnly] = useState(false);
  const [groupByOffice, setGroupByOffice] = useState(false);

  if (loading) return <AppShell><PageHeader title="Kudos Gift Tracker" /><PageTabs /></AppShell>;

  const { nodes, links, insights } = buildKudosGraph({ people, teams, offices, kudos, crossTeamOnly, teamFilter });

  return (
    <AppShell>
      <PageHeader title="Kudos Gift Tracker" />
      <PageTabs />
      <div className="bg-surface p-6.5">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] items-start gap-5">
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3">
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value as TeamId | 'all')}
                className="rounded-md border border-line bg-white px-2.5 py-1.5 text-[12.5px]"
              >
                <option value="all">All teams</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setCrossTeamOnly((v) => !v)}
                className={`rounded-md border px-2.5 py-1.5 text-[12.5px] whitespace-nowrap ${
                  crossTeamOnly ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-white text-ink'
                }`}
              >
                {crossTeamOnly ? '☑' : '☐'} Cross-team only
              </button>
              <button
                type="button"
                onClick={() => setGroupByOffice((v) => !v)}
                aria-pressed={groupByOffice}
                className={`rounded-md border px-2.5 py-1.5 text-[12.5px] whitespace-nowrap ${
                  groupByOffice ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-white text-ink'
                }`}
              >
                {groupByOffice ? 'Ungroup' : 'Cluster by office'}
              </button>
              <span className="ml-auto text-[11.5px] whitespace-nowrap text-muted">
                {nodes.length} people · {links.length} pairs
              </span>
            </div>

            <Card className="overflow-hidden border-[#2A2438] bg-[#14121C] p-0">
              <ForceGraph
                nodes={nodes}
                links={links}
                insights={insights}
                onNodeClick={(id) => navigate(`/kudos/relationships/${id}`)}
                clusterBy={groupByOffice ? 'office' : 'team'}
                offices={offices}
              />
            </Card>

            <Card className="p-4">
              <div className="mb-3 text-[10.5px] font-semibold tracking-wider text-muted uppercase">
                Legend
                {!groupByOffice && (
                  <span className="normal-case text-muted/70"> · click a team to filter the map</span>
                )}
              </div>
              {/* The legend names whatever the colours currently mean. Grouped by
                  office that is the two sites — not clickable, since the map filters
                  by team; otherwise it is the teams, which do filter. */}
              <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-xs">
                {groupByOffice ? (
                  offices.map((o) => (
                    <div key={o.id} className="flex items-center gap-2 px-1.5 py-1">
                      <i
                        className="h-2.5 w-2.5 flex-none rounded-full"
                        style={{ background: o.color }}
                      />
                      <b>{o.name}</b>
                      <span className="text-muted">{o.country}</span>
                      <span className="ml-auto text-muted tabular-nums">
                        {people.filter((p) => p.officeId === o.id).length}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setTeamFilter('all')}
                      className={`flex items-center gap-2 rounded-md px-1.5 py-1 text-left ${
                        teamFilter === 'all' ? 'bg-brand-soft text-brand' : 'hover:bg-surface'
                      }`}
                    >
                      <i className="h-2.5 w-2.5 flex-none rounded-full bg-ink" />
                      All
                      <span className="ml-auto text-muted tabular-nums">{people.length}</span>
                    </button>
                    {teams.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTeamFilter(t.id)}
                        className={`flex items-center gap-2 rounded-md px-1.5 py-1 text-left ${
                          teamFilter === t.id ? 'bg-brand-soft text-brand' : 'hover:bg-surface'
                        }`}
                      >
                        <i className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: t.color }} />
                        {t.name}
                        <span className="ml-auto text-muted tabular-nums">
                          {people.filter((p) => p.teamId === t.id).length}
                        </span>
                      </button>
                    ))}
                  </>
                )}
              </div>
              <div className="mt-3.5 flex flex-col gap-1 border-t border-line pt-3 text-[11px] text-muted">
                <div className="flex items-center gap-2">
                  <i className="h-2.5 w-2.5 flex-none rounded-full bg-[#B9AECF]" />
                  Grey node — no kudos given or received in 90 days
                </div>
                <div>
                  Node colour — {groupByOffice ? 'office' : 'team'} · node size — kudos received ·
                  edge colour — the giver&rsquo;s {groupByOffice ? 'office' : 'team'}
                </div>
                <div>Click a person to see their full relationship history</div>
                <div className="flex items-center gap-2">
                  <i className="h-2.5 w-2.5 flex-none rounded-full border-2 border-dashed border-[#F4739E]" />
                  Dashed ring — the connector (bridges the most teams)
                </div>
              </div>
            </Card>
          </div>

          <GraphInsights insights={insights} />
        </div>
      </div>
    </AppShell>
  );
}
