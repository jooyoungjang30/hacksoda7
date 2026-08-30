# Kudos Gift Tracker

Peer-to-peer kudos with real gift cards attached. Employees send colleagues a kudos
message plus a gift card (from their top-3 preferences); HR gets a dashboard,
team drill-downs, and a network map of who's recognizing whom. Sending a kudos
places a real order through the SodaGift sandbox API.

Two halves of the app, built by different people — don't cross their styling:

- **HR admin** (`/kudos`, `/kudos/team/:teamId`, `/kudos/network`) — Tailwind v4,
  components in `src/screens/` and `src/components/ui/`.
- **Employee** (`/me/*`: overview, send, preferences, received) — plain CSS
  classes in `src/index.css`, components in `src/employee/`.

## Stack

Vite · React 19 · TypeScript · react-router-dom 7 · Supabase (Postgres, no auth,
RLS off) · Tailwind v4 (HR side only) · d3-force (network map) · Vercel functions
for the SodaGift integration.

## Getting started

1. `npm install`
2. Create a Supabase project, then run `supabase/schema.sql` followed by
   `supabase/seed.sql` in the SQL editor (or `soda-full-catalog.sql` /
   `hr-dataset.sql` for the fuller catalog/dataset variants).
3. Copy `.env.local` (or create it) with:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
4. `npm run dev`

Gift orders (`api/gift.ts`) only fire against the real SodaGift sandbox if
`SODA_API_KEY` is set in the Vercel/local environment; without it, sends are
skipped gracefully (kudos are still recorded).

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — typecheck (`tsc -b`) then build
- `npm run lint` — oxlint
- `npm run preview` — preview the production build
- `node scripts/sync-catalog.mjs [COUNTRY]` — pull the live SodaGift sandbox
  catalog and print SQL to refresh `gift_cards` (needs `SODA_API_KEY`)

## Data flow

All numbers on screen are derived from Supabase via `src/lib/queries.ts` and the
`src/hooks/*` — never hand-authored in a component. All writes go through
`src/lib/queries.ts` too; components don't call the Supabase client directly.
The demo clock is frozen: date math imports `TODAY` from `src/lib/clock.ts`
rather than calling `new Date()`, so the seeded figures (days-until-expiry,
budget resets) stay stable.

## Docs

- `kudos-gift-tracker-spec.html` — visual/behavior spec (source of truth for the
  mockup)
- `IMPLEMENTATION_PLAN.md` — HR admin build plan (§1.1–1.4)
- `IMPLEMENTATION_PLAN_EMPLOYEE.md` — employee views build plan (§2.1, 2.3, 2.4)
- `CLAUDE.md` — coding guidelines for this repo
- [`src/README.md`](src/README.md) — directory-by-directory index of the app
  (`lib/`, `hooks/`, `screens/`, `employee/`, `components/`); [`api/README.md`](api/README.md)
  and [`supabase/README.md`](supabase/README.md) cover the backend. Each
  directory's README says what's in it and why, so you don't need to open every
  file (or hand a whole tree to an LLM) to know where something lives — this
  matters more as the repo grows past what fits in one context window.
