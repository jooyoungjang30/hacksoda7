import { useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { AppShell } from '../../components/shell/AppShell';
import { PageTabs } from '../../components/shell/PageTabs';
import { Avatar } from '../../components/ui/Avatar';
import { Card, CardHeader } from '../../components/ui/Card';
import { Money } from '../../components/ui/Money';
import { NudgeButton } from '../../components/nudge/NudgeButton';
import { Pill } from '../../components/ui/Pill';
import { StatCard } from '../../components/ui/StatCard';
import { shortDate } from '../../lib/format';
import { useHrDataset } from '../../hooks/useHrDataset';
import { usePersonDetail } from '../../hooks/useRelationships';
import { FLAG_LABEL, FLAG_TONE } from './flag';
import { PersonSearch } from './PersonSearch';
import { ReportingLine } from './ReportingLine';

type DirectionFilter = 'all' | 'in' | 'out';

export function PersonDetailPage() {
  const { people, teams, kudos, loading } = useHrDataset();
  const { personId } = useParams<{ personId: string }>();
  const location = useLocation();
  const [direction, setDirection] = useState<DirectionFilter>('all');
  const [withId, setWithId] = useState<string>('all');
  const detail = usePersonDetail(personId ?? '', people, kudos);

  if (loading) return <AppShell><PageTabs /></AppShell>;
  if (!personId || !detail) return <Navigate to="/kudos/relationships" replace />;

  const { stats, manager, managerLink, connections, exchanges, flag } = detail;
  const person = stats.person;
  const teamColor = teams.find((t) => t.id === person.teamId)?.color ?? '#7C3AED';
  const backTo = `/kudos/relationships${(location.state as { back?: string } | null)?.back ?? ''}`;

  const visibleExchanges = exchanges
    .filter((e) => direction === 'all' || e.direction === direction)
    .filter((e) => withId === 'all' || e.other.id === withId);

  return (
    <AppShell>
      <PageTabs />
      <div className="flex items-center gap-3 px-[26px] pt-5">
        <Avatar initials={person.initials} color={teamColor} size={38} />
        <div>
          <div className="mb-[3px] text-[11.5px] text-muted">
            <Link to={backTo} className="font-semibold text-brand">
              ‹ All people
            </Link>{' '}
            &nbsp;›&nbsp; {person.name}
          </div>
          <h2 className="text-[21px] font-bold">
            {person.name}{' '}
            <span className="text-[13px] font-normal text-muted">
              · {person.role}, {teams.find((t) => t.id === person.teamId)?.name}
              {manager ? ` · reports to ${manager.name}` : ''}
            </span>
          </h2>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <PersonSearch people={people} teams={teams} placeholder="Search people…" />
          <NudgeButton
            personIds={[person.id]}
            template={stats.unclaimedCount > 0 ? 'unclaimed_gift' : 'unused_budget'}
            people={people}
            teams={teams}
          />
        </div>
      </div>

      <div className="flex flex-col gap-5 bg-surface p-6.5">
        <div className="grid grid-cols-4 gap-3.5">
          <StatCard label="Received" value={<Money cents={stats.receivedCents} />} sub={`${connections.filter((c) => c.direction !== 'given').length} colleagues`} />
          <StatCard
            label="Given"
            value={<Money cents={stats.givenCents} />}
            sub={`${Math.round(stats.usageRatio * 100)}% of budget`}
          />
          <StatCard
            label="Connections"
            value={connections.length + (manager ? 1 : 0)}
            sub={(() => {
              const teamCount = new Set(connections.map((c) => c.person.teamId)).size;
              return `across ${teamCount} ${teamCount === 1 ? 'team' : 'teams'}`;
            })()}
          />
          <StatCard
            label="Unclaimed"
            value={<Money cents={stats.unclaimedCents} />}
            sub={stats.nearestExpiryAt ? `expires ${shortDate(stats.nearestExpiryAt)}` : 'nothing outstanding'}
            tone={stats.unclaimedCents > 0 ? 'crit' : undefined}
          />
        </div>

        <div className="grid grid-cols-[386px_minmax(0,1fr)] items-start gap-4">
          <div className="flex flex-col gap-3.5">
            <ReportingLine person={person} manager={manager} managerLink={managerLink} connections={connections} teams={teams} />

            {flag === 'manager_gap' && manager && (
              <Card className="border-[#F0C9C5] bg-[#FFFCFC] p-3.5">
                <div className="flex items-start gap-2.5">
                  <Avatar initials={manager.initials} color={teamColor} />
                  <div className="text-[12px] leading-relaxed">
                    <b className="block text-[12.5px]">{manager.name} hasn't recognised {person.name.split(' ')[0]} in the last 90 days</b>
                    <span className="text-muted">
                      At least two other colleagues have recently. This is the manager-gap pattern the Network
                      Map counts — here it's one specific pair.
                    </span>
                  </div>
                </div>
                <div className="mt-2.5">
                  <NudgeButton
                    personIds={[manager.id]}
                    template="manager_gap"
                    label={`Nudge ${manager.name}`}
                    people={people}
                    teams={teams}
                  />
                </div>
              </Card>
            )}

            {flag && flag !== 'manager_gap' && (
              <Card className="p-3.5">
                <Pill tone={FLAG_TONE[flag]}>{FLAG_LABEL[flag]}</Pill>
                <p className="mt-2 text-[12px] leading-relaxed text-muted">
                  {flag === 'unreached' && 'No one has recognised this person in the last 90 days.'}
                  {flag === 'single_source' && 'Every kudo this person has received came from the same one colleague.'}
                  {flag === 'receive_only' && 'This person has received kudos but never sent any.'}
                  {flag === 'team_only' && "Every one of this person's connections is on their own team."}
                </p>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader
              title="Every exchange"
              sub={`${exchanges.length} kudos · newest first`}
              actions={
                <>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as DirectionFilter)}
                    className="rounded-md border border-line bg-white px-2.5 py-1.5 text-[12px]"
                  >
                    <option value="all">Both directions</option>
                    <option value="in">Received only</option>
                    <option value="out">Given only</option>
                  </select>
                  <select
                    value={withId}
                    onChange={(e) => setWithId(e.target.value)}
                    className="rounded-md border border-line bg-white px-2.5 py-1.5 text-[12px]"
                  >
                    <option value="all">With: anyone</option>
                    {connections.map((c) => (
                      <option key={c.person.id} value={c.person.id}>
                        With: {c.person.name}
                      </option>
                    ))}
                  </select>
                </>
              }
            />
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr>
                  {['', 'Colleague', 'Message', 'Value', 'Status', 'Date'].map((h) => (
                    <th
                      key={h}
                      className={`border-b border-[#EFEDF4] bg-[#FCFBFE] px-3.5 py-2.5 text-[10px] font-semibold tracking-wider text-muted uppercase ${
                        h === 'Value' || h === 'Date' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleExchanges.map((ex) => {
                  const otherColor = teams.find((t) => t.id === ex.other.teamId)?.color ?? '#7C3AED';
                  return (
                    <tr key={ex.kudo.id}>
                      <td className="border-b border-[#F2F0F7] px-3.5 py-2.5 text-[15px] font-bold">
                        <span className={ex.direction === 'in' ? 'text-good' : 'text-muted'}>
                          {ex.direction === 'in' ? '←' : '→'}
                        </span>
                      </td>
                      <td className="border-b border-[#F2F0F7] px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar initials={ex.other.initials} color={otherColor} size={26} />
                          <div>
                            <b className="block text-[12.5px] leading-tight font-semibold">{ex.other.name}</b>
                            <span className="text-[11px] text-muted">
                              {teams.find((t) => t.id === ex.other.teamId)?.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[280px] border-b border-[#F2F0F7] px-3.5 py-2.5 text-muted italic">
                        "{ex.kudo.message}"
                      </td>
                      <td className={`border-b border-[#F2F0F7] px-3.5 py-2.5 text-right font-semibold tabular-nums ${ex.direction === 'in' ? 'text-good' : ''}`}>
                        {ex.direction === 'in' ? '+' : '−'}
                        <Money cents={ex.kudo.amountCents} />
                      </td>
                      <td className="border-b border-[#F2F0F7] px-3.5 py-2.5">
                        {ex.kudo.claimedAt ? (
                          <Pill tone="good">Claimed</Pill>
                        ) : ex.direction === 'in' ? (
                          <Pill tone="brand">Expires {shortDate(ex.kudo.expiresAt)}</Pill>
                        ) : (
                          <Pill tone="neutral">Unclaimed</Pill>
                        )}
                      </td>
                      <td className="border-b border-[#F2F0F7] px-3.5 py-2.5 text-right text-muted tabular-nums">
                        {shortDate(ex.kudo.sentAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleExchanges.length === 0 && (
              <div className="px-4 py-6 text-center text-[12.5px] text-muted">No exchanges match this filter.</div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
