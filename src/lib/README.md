# src/lib/

The data layer. Two parallel type systems read the same Supabase tables — know
which one you're in before touching a file here:

- **HR side** (`screens/`): `types.ts` (`Person`, `Team`, `Kudo`, and every
  `*Stats`/`Leaderboard` shape) + `derive.ts` + `relationships.ts`, fed by
  `useHrDataset` mapping raw Supabase rows into these shapes.
- **Employee side** (`employee/`, `api/`): `supabase.ts`'s own types
  (`Employee`, `GiftCard`, `KudosRow`) used directly, no mapping layer.

They describe the same underlying rows differently (e.g. HR's `Person` vs.
employee's `Employee`) — don't assume a type from one side works on the other.

| File | What |
|---|---|
| `clock.ts` | frozen `TODAY` (2026-08-29) + date helpers. Never call `new Date()` / `Date.now()` anywhere else in the app — import from here. |
| `supabase.ts` | Supabase client, `configError` (renders a message instead of a blank page if env vars are missing), and the employee-side types |
| `types.ts` | HR-side domain types, including every shape `derive.ts` computes |
| `derive.ts` | pure functions: given `Kudo[]`/`Person[]`/`Team[]`, compute leaderboard, team usage, claim rates, pace status. HR dashboard numbers all trace back here — never hand-author a stat that could be derived. |
| `relationships.ts` | network-map-specific derivation: who's under-connected, manager-gap flags |
| `queries.ts` | every Supabase read/write for the employee side (budget, catalog, preferences, send/claim kudos). The only file that should call `db` directly outside `useHrDataset`. |
| `format.ts` | `money()`, `percent()`, `shortDate()` — always go through these, never inline formatting |
| `currentUser.ts` | no-auth user switch: `?as=priya` in the URL, persisted to `localStorage` |
