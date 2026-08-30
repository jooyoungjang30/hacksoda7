import { Link, useSearchParams } from 'react-router-dom';
import { AppShell } from '../../components/shell/AppShell';
import { PageHeader } from '../../components/shell/PageHeader';
import { PageTabs } from '../../components/shell/PageTabs';
import { Avatar } from '../../components/ui/Avatar';
import { Card, CardHeader } from '../../components/ui/Card';
import { Money } from '../../components/ui/Money';
import { Pill } from '../../components/ui/Pill';
import { shortDate } from '../../lib/format';
import { useHrDataset } from '../../hooks/useHrDataset';
import { usePersonDirectory } from '../../hooks/useRelationships';
import type { TeamId } from '../../lib/types';
import { FLAG_LABEL, FLAG_TONE } from './flag';
import { PersonSearch } from './PersonSearch';

export function RelationshipsPage() {
  const { people, teams, kudos, loading } = useHrDataset();
  const [searchParams, setSearchParams] = useSearchParams();
  const teamFilter = (searchParams.get('team') as TeamId | null) ?? 'all';
  const flaggedOnly = searchParams.get('flagged') === '1';
  const directory = usePersonDirectory(people, teams, kudos)
    .filter((row) => teamFilter === 'all' || row.person.teamId === teamFilter)
    .filter((row) => !flaggedOnly || row.flag !== null);

  if (loading) return <AppShell><PageHeader title="Kudos Gift Tracker" /><PageTabs /></AppShell>;

  const backQuery = searchParams.toString();

  function setTeamFilter(id: string) {
    const next = new URLSearchParams(searchParams);
    if (id === 'all') next.delete('team');
    else next.set('team', id);
    setSearchParams(next);
  }

  function toggleFlagged() {
    const next = new URLSearchParams(searchParams);
    if (flaggedOnly) next.delete('flagged');
    else next.set('flagged', '1');
    setSearchParams(next);
  }

  return (
    <AppShell>
      <PageHeader title="Kudos Gift Tracker" />
      <PageTabs />
      <div className="flex flex-col gap-3.5 bg-surface p-6.5">
        <div className="flex items-center gap-3">
          <PersonSearch people={people} teams={teams} />
          <span className="ml-auto text-[11.5px] text-muted">{directory.length} of {people.length} people</span>
        </div>

        <Card>
          <CardHeader
            title="Everyone"
            sub={`${directory.length} people · sorted by fewest connections first`}
            actions={
              <>
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
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
                  onClick={toggleFlagged}
                  className={`rounded-md border px-2.5 py-1.5 text-[12.5px] whitespace-nowrap ${
                    flaggedOnly ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-white text-ink'
                  }`}
                >
                  {flaggedOnly ? '☑' : '☐'} Flagged only
                </button>
              </>
            }
          />
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                {['Person', 'Reports to', 'Received', 'Given', 'Connections', 'Flag', 'Last exchange', ''].map((h) => (
                  <th
                    key={h}
                    className={`border-b border-[#EFEDF4] bg-[#FCFBFE] px-3.5 py-2.5 text-[10px] font-semibold tracking-wider text-muted uppercase ${
                      ['Received', 'Given', 'Connections', 'Last exchange'].includes(h) ? 'text-right' : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {directory.map((row) => {
                const teamColor = teams.find((t) => t.id === row.person.teamId)?.color ?? '#7C3AED';
                return (
                  <tr key={row.person.id} className={row.flag ? 'bg-crit-bg/25' : ''}>
                    <td className="border-b border-[#F2F0F7] px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={row.person.initials} color={teamColor} />
                        <div>
                          <b className="block text-[12.5px] leading-tight font-semibold">{row.person.name}</b>
                          <span className="text-[11px] text-muted">{row.person.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-[#F2F0F7] px-3.5 py-2.5 text-muted">
                      {row.manager?.name ?? '—'}
                    </td>
                    <td className="border-b border-[#F2F0F7] px-3.5 py-2.5 text-right tabular-nums">
                      <Money cents={row.receivedCents} />
                    </td>
                    <td className="border-b border-[#F2F0F7] px-3.5 py-2.5 text-right tabular-nums">
                      <Money cents={row.givenCents} />
                    </td>
                    <td className="border-b border-[#F2F0F7] px-3.5 py-2.5 text-right tabular-nums">
                      {row.connectionCount}
                    </td>
                    <td className="border-b border-[#F2F0F7] px-3.5 py-2.5">
                      {row.flag ? <Pill tone={FLAG_TONE[row.flag]}>{FLAG_LABEL[row.flag]}</Pill> : <span className="text-muted">—</span>}
                    </td>
                    <td className="border-b border-[#F2F0F7] px-3.5 py-2.5 text-right text-muted tabular-nums">
                      {row.lastExchangeAt ? shortDate(row.lastExchangeAt) : 'Never'}
                    </td>
                    <td className="border-b border-[#F2F0F7] px-3.5 py-2.5">
                      <Link
                        to={`/kudos/relationships/${row.person.id}`}
                        state={{ back: backQuery ? `?${backQuery}` : '' }}
                        className="text-[11.5px] font-semibold text-brand whitespace-nowrap"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {directory.length === 0 && (
            <div className="px-4 py-6 text-center text-[12.5px] text-muted">No one matches this filter.</div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
