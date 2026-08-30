import { AppShell } from '../../components/shell/AppShell';
import { PageHeader } from '../../components/shell/PageHeader';
import { PageTabs } from '../../components/shell/PageTabs';
import { useCompanyStats } from '../../hooks/useCompanyStats';
import { useTeamStats } from '../../hooks/useTeamStats';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { useClaimByTeam } from '../../hooks/useClaimByTeam';
import { KpiRow } from './KpiRow';
import { TeamUsageGrid } from './TeamUsageGrid';
import { Leaderboard } from './Leaderboard';
import { ClaimTrackingTable } from './ClaimTrackingTable';

export function DashboardPage() {
  const company = useCompanyStats();
  const teams = useTeamStats();
  const leaderboard = useLeaderboard(7);
  const claimByTeam = useClaimByTeam();

  return (
    <AppShell>
      <PageHeader title="Kudos Gift Tracker" />
      <PageTabs />
      <div className="space-y-5 bg-surface p-6.5">
        <KpiRow company={company} />
        <TeamUsageGrid teams={teams} />
        <div className="grid grid-cols-[1fr_1.35fr] items-start gap-5">
          <Leaderboard rows={leaderboard} />
          <ClaimTrackingTable rows={claimByTeam} company={company} />
        </div>
      </div>
    </AppShell>
  );
}
