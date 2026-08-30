import { useNavigate, useSearchParams } from 'react-router-dom';
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
import type { PersonDirectoryRow, TeamId } from '../../lib/types';
import { FLAG_LABEL, FLAG_TONE } from './flag';
import { PersonSearch } from './PersonSearch';

type SortKey = 'name' | 'manager' | 'received' | 'given' | 'connections' | 'flag' | 'lastExchange';
type SortDir = 'asc' | 'desc';

const DEFAULT_SORT: SortKey = 'connections';
const DEFAULT_DIR: SortDir = 'asc';

// First click on a column sorts it this way — highest/most-recent first for
// numbers and dates, alphabetical for text, so the first click always shows
// the more useful end of that column.
const DEFAULT_DIR_FOR: Record<SortKey, SortDir> = {
  name: 'asc',
  manager: 'asc',
  received: 'desc',
  given: 'desc',
  connections: 'asc',
  flag: 'asc',
  lastExchange: 'desc',
};

const COLUMNS: { label: string; key: SortKey | null; align?: 'right' }[] = [
  { label: 'Person', key: 'name' },
  { label: 'Reports to', key: 'manager' },
  { label: 'Received', key: 'received', align: 'right' },
  { label: 'Given', key: 'given', align: 'right' },
  { label: 'Connections', key: 'connections', align: 'right' },
  { label: 'Flag', key: 'flag' },
  { label: 'Last exchange', key: 'lastExchange', align: 'right' },
  { label: '', key: null },
];

function compareRows(a: PersonDirectoryRow, b: PersonDirectoryRow, sort: SortKey): number {
  switch (sort) {
    case 'name':
      return a.person.name.localeCompare(b.person.name);
    case 'manager':
      return (a.manager?.name ?? '').localeCompare(b.manager?.name ?? '');
    case 'received':
      return a.receivedCents - b.receivedCents;
    case 'given':
      return a.givenCents - b.givenCents;
    case 'connections':
      return a.connectionCount - b.connectionCount;
    case 'flag':
      return (a.flag ? FLAG_LABEL[a.flag] : '').localeCompare(b.flag ? FLAG_LABEL[b.flag] : '');
    case 'lastExchange':
      return (a.lastExchangeAt ?? '').localeCompare(b.lastExchangeAt ?? '');
  }
}

export function RelationshipsPage() {
  const { people, teams, kudos, loading } = useHrDataset();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const teamFilter = (searchParams.get('team') as TeamId | null) ?? 'all';
  const flaggedOnly = searchParams.get('flagged') === '1';
  const sort = (searchParams.get('sort') as SortKey | null) ?? DEFAULT_SORT;
  const dir = (searchParams.get('dir') as SortDir | null) ?? DEFAULT_DIR;

  const directory = usePersonDirectory(people, teams, kudos)
    .filter((row) => teamFilter === 'all' || row.person.teamId === teamFilter)
    .filter((row) => !flaggedOnly || row.flag !== null)
    .sort((a, b) => {
      const primary = compareRows(a, b, sort) * (dir === 'desc' ? -1 : 1);
      return primary !== 0 ? primary : a.person.name.localeCompare(b.person.name);
    });

  if (loading) return <AppShell><PageHeader title="Kudos Gift Tracker" /><PageTabs /></AppShell>;

  const backQuery = searchParams.toString();

  function updateParams(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams);
    mutate(next);
    setSearchParams(next);
  }

  function setTeamFilter(id: string) {
    updateParams((next) => (id === 'all' ? next.delete('team') : next.set('team', id)));
  }

  function toggleFlagged() {
    updateParams((next) => (flaggedOnly ? next.delete('flagged') : next.set('flagged', '1')));
  }

  function toggleSort(key: SortKey) {
    const nextDir: SortDir = sort === key ? (dir === 'asc' ? 'desc' : 'asc') : DEFAULT_DIR_FOR[key];
    updateParams((next) => {
      if (key === DEFAULT_SORT && nextDir === DEFAULT_DIR) {
        next.delete('sort');
        next.delete('dir');
      } else {
        next.set('sort', key);
        next.set('dir', nextDir);
      }
    });
  }

  function openPerson(personId: string) {
    navigate(`/kudos/relationships/${personId}`, { state: { back: backQuery ? `?${backQuery}` : '' } });
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
            sub={`${directory.length} people · click a column to sort, a row to open`}
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
                {COLUMNS.map((col) => (
                  <th
                    key={col.label || 'action'}
                    className={`border-b border-[#EFEDF4] bg-[#FCFBFE] px-3.5 py-2.5 text-[10px] font-semibold tracking-wider text-muted uppercase ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.key ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key!)}
                        className={`inline-flex items-center gap-1 uppercase hover:text-ink ${
                          col.align === 'right' ? 'flex-row-reverse' : ''
                        } ${sort === col.key ? 'text-brand' : ''}`}
                      >
                        {col.label}
                        {sort === col.key && <span aria-hidden>{dir === 'asc' ? '▲' : '▼'}</span>}
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {directory.map((row) => {
                const teamColor = teams.find((t) => t.id === row.person.teamId)?.color ?? '#7C3AED';
                return (
                  <tr
                    key={row.person.id}
                    onClick={() => openPerson(row.person.id)}
                    className={`cursor-pointer hover:bg-brand-soft/60 ${row.flag ? 'bg-crit-bg/25' : ''}`}
                  >
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
                    <td className="border-b border-[#F2F0F7] px-3.5 py-2.5 text-right text-[11.5px] font-semibold text-brand">
                      →
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
