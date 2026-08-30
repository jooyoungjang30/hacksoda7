import { Navigate, useParams } from 'react-router-dom';
import { AppShell } from '../../components/shell/AppShell';
import { PageHeader } from '../../components/shell/PageHeader';
import { PageTabs } from '../../components/shell/PageTabs';
import { NudgeButton } from '../../components/nudge/NudgeButton';
import { useTeamStats } from '../../hooks/useTeamStats';
import { useMemberStats } from '../../hooks/useMemberStats';
import { useClaimByTeam } from '../../hooks/useClaimByTeam';
import { useHrDataset } from '../../hooks/useHrDataset';
import { TeamKpiRow } from './TeamKpiRow';
import { MemberTable } from './MemberTable';

export function TeamDetailPage() {
  const { people, teams, kudos, loading } = useHrDataset();
  const { teamId } = useParams<{ teamId: string }>();
  const team = useTeamStats(people, teams, kudos, teamId ?? '');
  const members = useMemberStats(teamId ?? '', people, kudos);
  const claimByTeam = useClaimByTeam(people, teams, kudos);

  if (loading) return <AppShell><PageHeader title="Belong" /><PageTabs /></AppShell>;
  if (!teamId || !team) return <Navigate to="/kudos" replace />;

  const claim = claimByTeam.find((c) => c.team.id === teamId)!;
  const nudgeTargets = members.filter((m) => m.usageRatio < 1).map((m) => m.person.id);

  return (
    <AppShell>
      <PageHeader
        title={team.team.name}
        breadcrumb={
          <>
            <span className="text-brand">Dashboard</span> &nbsp;›&nbsp; {team.team.name}
          </>
        }
        actions={
          <NudgeButton
            personIds={nudgeTargets}
            template="unused_budget"
            label={`Nudge team · ${nudgeTargets.length}`}
            people={people}
            teams={teams}
          />
        }
      />
      <PageTabs />
      <div className="space-y-5 bg-surface p-6.5">
        <TeamKpiRow team={team} members={members} claim={claim} />
        <MemberTable members={members} teamName={team.team.name} people={people} teams={teams} />
      </div>
    </AppShell>
  );
}
