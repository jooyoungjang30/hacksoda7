# src/screens/

HR admin pages. Tailwind, fixed desktop-width layout, all data via
[`hooks/`](../hooks/README.md) — no numbers hand-authored in these files.

- **`dashboard/`** (`/kudos`) — `DashboardPage` composes `KpiRow`,
  `TeamUsageGrid` (→ `TeamUsageCard` per team), `Leaderboard`,
  `ClaimTrackingTable`.
- **`team/`** (`/kudos/team/:teamId`) — `TeamDetailPage` composes
  `TeamKpiRow`, `MemberTable`.
- **`network/`** (`/kudos/network`) — `NetworkMapPage` renders `ForceGraph`
  (d3-force layout via `useForceLayout` + pan/zoom via `useZoomPan`, both
  local to this directory) and `GraphInsights` (the flagged-people / manager-gap
  panel, sourced from `useKudosGraph`).
