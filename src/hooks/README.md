# src/hooks/

All HR-side (see [`lib/README.md`](../lib/README.md) for the type split).
Every hook except `useHrDataset` is a thin wrapper with no logic of its own —
the actual computation lives in `lib/derive.ts` / `lib/relationships.ts`. Add
new stats there, not here.

| Hook | Wraps |
|---|---|
| `useHrDataset` | the only one that hits Supabase — fetches teams/employees/kudos and maps rows into `Person`/`Team`/`Kudo` |
| `useCompanyStats` | `computeCompanyStats` |
| `useTeamStats` | `computeTeamStats` (all teams, or one by id) |
| `useMemberStats` | `computeTeamMemberStats` |
| `useLeaderboard` | `computeLeaderboard` |
| `useClaimByTeam` | `computeClaimByTeam` |
| `useRelationships` | `computePersonDirectory` / `computePersonDetail` |
| `useKudosGraph` | builds the force-graph nodes/edges/insights for the network map (logic lives in the hook itself, not `derive.ts`) |
