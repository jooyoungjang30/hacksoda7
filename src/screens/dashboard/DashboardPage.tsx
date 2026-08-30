import { AppShell } from '../../components/shell/AppShell';
import { PageHeader } from '../../components/shell/PageHeader';
import { PageTabs } from '../../components/shell/PageTabs';
import { useHrDataset } from '../../hooks/useHrDataset';
import { useCompanyStats } from '../../hooks/useCompanyStats';
import { useTeamStats } from '../../hooks/useTeamStats';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { useClaimByTeam } from '../../hooks/useClaimByTeam';
import { KpiRow } from './KpiRow';
import { TeamUsageGrid } from './TeamUsageGrid';
import { Leaderboard } from './Leaderboard';
import { ClaimTrackingTable } from './ClaimTrackingTable';

export function DashboardPage() {
  const { people, teams: teamList, kudos, loading } = useHrDataset();
  const company = useCompanyStats(people, kudos);
  const teams = useTeamStats(people, teamList, kudos);
  const leaderboard = useLeaderboard(people, teamList, kudos, 7);
  const claimByTeam = useClaimByTeam(people, teamList, kudos);

  if (loading) return <AppShell><PageHeader title="Kudos Gift Tracker" /><PageTabs /></AppShell>;

  return (
    <AppShell>
      <PageHeader title="Kudos Gift Tracker" />
      <PageTabs />
      <div className="space-y-5 bg-surface p-6.5">
        <KpiRow company={company} people={people} teams={teamList} kudos={kudos} />
        <TeamUsageGrid teams={teams} people={people} teamList={teamList} kudos={kudos} />
        <div className="grid grid-cols-[1fr_1.35fr] items-start gap-5">
          <Leaderboard rows={leaderboard} />
          <ClaimTrackingTable rows={claimByTeam} company={company} people={people} teams={teamList} kudos={kudos} />
        </div>
      </div>
    </AppShell>
  );
}
