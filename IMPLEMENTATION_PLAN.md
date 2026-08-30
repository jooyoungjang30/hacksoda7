# Belong — Implementation Plan (HR views 1.1–1.4)

Target: the HR admin screens specified in `kudos-gift-tracker-spec.html` §1.1–1.4.
Front-end only, mock data, no backend.

**Stack:** Vite + React 18 + TypeScript · Tailwind · react-router-dom · d3-force
**Scope:** 4 screens (Dashboard, Team drill-down, Nudge behavior, Network Map)
**Out of scope:** Part 2 employee screens (2.1–2.4), any API, any auth, mobile layouts

Read `kudos-gift-tracker-spec.html` in a browser before starting — it is the visual
source of truth. This document is the build order and the rules.

---

## 0. Five rules that matter more than anything else below

These are the failure modes most likely to wreck this build. Follow them literally.

1. **Derive every number from one array of kudos.** `mockKudos: Kudo[]` is the only
   authored data. Team usage %, leaderboard, claim rates, member stats and graph
   edges are all *computed* from it by pure functions in `lib/derive.ts`. Do **not**
   hand-author a `teamUsage` object alongside a `leaderboard` object — they will
   drift, and the dashboard will contradict the drill-down.

2. **Never call `new Date()` or `Date.now()`.** Import `TODAY` from `lib/clock.ts`.
   Every figure in the spec (66% pace, "124 days left", "expires in 16 days") is
   anchored to 2026-08-29. A live clock makes the mock data nonsense.

3. **No generic abstractions.** Three tables of three different shapes = three plain
   `<table>` elements sharing Tailwind classes. Do not build `<DataTable>`,
   `<ChartWrapper>`, or a config-driven column system.

4. **No extra dependencies.** Tailwind + react-router-dom + d3-force. No MUI, no
   shadcn, no react-query, no zustand/redux, no toast library, no chart library.
   `useState` plus one context is sufficient for all of 1.1–1.4.

5. **Desktop only.** Fixed `min-w-[1240px]` content area, matching the mockup. Do
   not write responsive breakpoints.

---

## 1. Setup — ALREADY DONE, do not re-run

The scaffold and all dependencies are installed and `npm run build` passes. Do not
run `npm create vite` — it prompts to wipe the directory and would destroy this plan
and the spec HTML.

Installed versions differ slightly from the original draft; build against these:

| | |
|---|---|
| React | **19** (not 18) |
| react-router-dom | **7** |
| Tailwind | **4**, via the `@tailwindcss/vite` plugin (not PostCSS) |
| Vite | 8 · TypeScript 6 · vitest 4 · d3-force 3 |

Remaining setup, still to do:
1. Add `tailwindcss()` to the `plugins` array in `vite.config.ts`.
2. Replace `src/index.css` with the theme block below.
3. Add the IBM Plex Sans `<link>` to `index.html`.
4. Delete the template's `src/App.css`, `src/assets/`, and `public/` demo art, and
   strip `App.tsx` down to the router.

Leave `README.md`, `claude.md`, `IMPLEMENTATION_PLAN.md` and
`kudos-gift-tracker-spec.html` untouched.

`src/index.css` — Tailwind v4 uses a CSS-first config:

```css
@import "tailwindcss";

@theme {
  --font-sans: "IBM Plex Sans", system-ui, sans-serif;

  --color-brand: #5B21B6;
  --color-brand-dark: #4C1D95;
  --color-brand-soft: #F3EDFD;

  --color-ink: #1F2430;
  --color-muted: #7C8190;
  --color-line: #E7E4EE;
  --color-surface: #FAFAFC;

  --color-good: #0F7A55;   --color-good-bg: #E2F5EC;
  --color-warn: #8F5106;   --color-warn-bg: #FDF0DC;
  --color-crit: #A8211A;   --color-crit-bg: #FCE7E5;
}
```

Load IBM Plex Sans from Google Fonts in `index.html`.

Team colors are **data, not theme** — they live on `Team.color` because the SVG needs
them as raw hex values. Do not duplicate them into the Tailwind config.

### Routes

```
/kudos                    → DashboardPage      (1.1)
/kudos/team/:teamId       → TeamDetailPage     (1.2)
/kudos/network            → NetworkMapPage     (1.4)
```

1.3 (Nudge) is not a route — it is a button, a context, and two template functions.

---

## 2. File structure

```
src/
  main.tsx
  App.tsx                       # router + NudgeProvider
  index.css

  lib/
    clock.ts                    # TODAY, daysUntil(), fiscalYearProgress()
    types.ts                    # all interfaces (§3)
    derive.ts                   # all computation (§5)  ← pure, tested
    format.ts                   # money(), percent(), shortDate()

  mock/
    teams.ts                    # 6 teams
    people.ts                   # 47 people
    kudos.ts                    # ~70 Kudo records ← the only authored numbers

  hooks/
    useCompanyStats.ts
    useTeamStats.ts             # all teams, or one by id
    useMemberStats.ts           # members of a team
    useLeaderboard.ts
    useClaimByTeam.ts
    useKudosGraph.ts            # nodes + links + insights
    useNudge.ts                 # from NudgeContext

  components/
    shell/  AppShell.tsx  Sidebar.tsx  PageTabs.tsx  PageHeader.tsx
    ui/     Avatar.tsx  Pill.tsx  ProgressBar.tsx  StatCard.tsx
            Card.tsx  Money.tsx  Toast.tsx
    nudge/  NudgeContext.tsx  NudgeButton.tsx  templates.ts

  screens/
    dashboard/    DashboardPage.tsx  KpiRow.tsx  TeamUsageGrid.tsx
                  TeamUsageCard.tsx  Leaderboard.tsx  ClaimTrackingTable.tsx
    team/         TeamDetailPage.tsx  TeamKpiRow.tsx  MemberTable.tsx
    network/      NetworkMapPage.tsx  ForceGraph.tsx  GraphInsights.tsx
                  useForceLayout.ts
```

~28 files. Build them in the phase order in §10.

---

## 3. Data model — `lib/types.ts`

```ts
export type TeamId = string;
export type PersonId = string;

export interface Team {
  id: TeamId;
  name: string;
  color: string;        // hex — used by avatars, pills, and graph nodes
}

export interface Person {
  id: PersonId;
  name: string;
  initials: string;
  role: string;
  teamId: TeamId;
  slackLinked: boolean; // drives the email-fallback flag in 1.3
}

/** The only authored data. Everything else is derived from this array. */
export interface Kudo {
  id: string;
  fromId: PersonId;
  toId: PersonId;
  amountCents: number;
  giftCardName: string;      // "Amazon.co.uk Gift Card"
  message: string;
  sentAt: string;            // ISO date
  claimedAt: string | null;  // null = outstanding
  expiresAt: string;         // ISO date
}

export type PaceStatus = 'ahead' | 'on' | 'behind' | 'far_behind';
export type NudgeTemplate = 'unused_budget' | 'unclaimed_gift';

export interface NudgeRecord {
  personId: PersonId;
  template: NudgeTemplate;
  sentAt: string;
}
```

### Derived shapes (returned by `derive.ts`, never authored)

```ts
export interface MemberStats {
  person: Person;
  givenCents: number;
  allowanceCents: number;       // always ANNUAL_ALLOWANCE_CENTS
  usageRatio: number;           // 0..1
  paceStatus: PaceStatus;
  receivedCents: number;
  claimedCents: number;
  unclaimedCents: number;
  unclaimedCount: number;
  nearestExpiryAt: string | null;  // earliest expiry among unclaimed — Template B needs it
  lastGivenAt: string | null;
  nudgeable: boolean;
}

export interface TeamStats {
  team: Team;
  memberCount: number;
  givenCents: number;
  allowanceCents: number;
  usageRatio: number;
  paceStatus: PaceStatus;
  membersWithBudgetLeft: number;  // powers the team-nudge label + skip rule (§9)
}

export interface TeamClaimRow {
  team: Team;
  memberCount: number;
  receivedCents: number;
  claimedCents: number;
  claimRatio: number;
  openCount: number;
}

export interface LeaderboardRow {
  person: Person;
  team: Team;
  receivedCents: number;
  kudosCount: number;
  distinctGivers: number;
}

export interface CompanyStats {
  headcount: number;
  givenCents: number;
  allowanceCents: number;
  usageRatio: number;
  paceRatio: number;            // fiscal year elapsed
  participantCount: number;     // gave >= 1
  receivedCents: number;
  claimedCents: number;
  claimRatio: number;
  openCount: number;
  expiringSoonCents: number;    // unclaimed, expires <= 30d
  expiringSoonCount: number;
}
```

---

## 4. Mock data — `src/mock/`

Author to these targets so the built UI matches the spec mockups:

| Team | Members | Given | Usage | Received | Claimed | Open cards |
|---|---:|---:|---:|---:|---:|---:|
| Engineering | 14 | $604 | 54% | $640 | $535 | 5 |
| Design | 6 | $391 | 81% | $402 | $362 | 3 |
| Marketing | 8 | $470 | 73% | $355 | $291 | 6 |
| Sales | 10 | $286 | 36% | $318 | $247 | 12 |
| People Ops | 4 | $278 | 87% | $296 | $269 | 2 |
| Finance | 5 | $92 | 23% | $110 | $55 | 4 |
| **Total** | **47** | **$2,121** | **56%** | **$2,121** | **$1,759** | **32** |

> **Correction (was wrong in the first draft of this plan).** Engineering was
> originally stated as claimed $571 and Sales as $211. That is arithmetically
> impossible: the named-member table below gives Engineering four people holding
> $105 unclaimed across 5 cards (Dana $25, Wei $25, Ravi $30, Jonas $25), but
> $640 − $571 leaves room for only $69. The named-member figures are the ones that
> render on screen in 1.2, so they win. Engineering's claimed drops to $535 (83.6%)
> and the $36 is absorbed by Sales ($247, 77.7%), the only team with no individually
> specified members. Company totals, every team's *received*, and all open-card
> counts are unchanged.

Company: 39 of 47 have given · claim rate 83% · $362 unclaimed · 9 cards ($118)
expiring within 30 days of 2026-08-29.

Named members that appear in the spec mockups and must exist with these figures:

| Person | Team | Given | Received | Claim state | Last given |
|---|---|---:|---:|---|---|
| Priya Raman | Engineering | $80 | $145 | all claimed | Aug 26 |
| Marcus Bell | Engineering | $72 | $60 | all claimed | Aug 28 |
| Dana Whitfield | Engineering | $65 | $95 | $25 open | Aug 21 |
| Tomás Iglesias | Engineering | $55 | $40 | all claimed | Aug 19 |
| Wei Chen | Engineering | $50 | $110 | $25 open | Aug 24 |
| Aisha Nkemdi | Engineering | $45 | $55 | all claimed | Aug 12 |
| Ravi Menon | Engineering | $20 | $30 | $30 open (2) | Jun 30 |
| Jonas Kerr | Engineering | $0 | $25 | $25 open | never |

Leaderboard top 7: Priya $145 (11 kudos/9 givers), Wei $110 (9/7),
Sofia Marchetti $105 (12/8), Dana $95 (7/6), Leah Osborne $90 (10/9),
Ana Duarte $75 (6/5), Kofi Mensah $70 (6/6).

Two shapes the network map needs, so author kudos to produce them:
- **Sales is a closed loop** — ≥80% of kudos sent by Sales members go to Sales members.
- **Leah Osborne (People Ops) is the connector** — sends into 5 different teams.
- 6 people (3 Finance, 3 Sales) have no kudos sent or received after 2026-05-31.

Generate the remaining ~39 people programmatically if you like, but `mockKudos` must
be an explicit literal array — a random generator will not hit the table above.

**Verify after writing mock data:** `computeCompanyStats()` returns exactly
$2,121 given / $1,759 claimed / 39 participants. If it doesn't, fix the mock data,
not the derive functions.

---

## 5. Computation — `lib/derive.ts` and `lib/clock.ts`

```ts
// clock.ts
export const TODAY = new Date('2026-08-29T12:00:00Z');
export const FY_START = new Date('2026-01-01T00:00:00Z');
export const FY_END   = new Date('2026-12-31T23:59:59Z');

/** 0.663 on 2026-08-29 — the pace marker on every progress bar. */
export function fiscalYearProgress(): number;
/** 124 on 2026-08-29 — used in Slack template A. */
export function daysUntilReset(): number;
export function daysUntil(iso: string): number;
```

```ts
// derive.ts
export const ANNUAL_ALLOWANCE_CENTS = 8000;

export function paceStatus(usageRatio: number, pace: number): PaceStatus {
  if (usageRatio >= pace)        return 'ahead';
  if (usageRatio >= pace - 0.05) return 'on';
  if (usageRatio >= pace - 0.20) return 'behind';
  return 'far_behind';
}
```

Check: at pace 0.66 this yields Design 81% `ahead`, People Ops 87% `ahead`,
Marketing 73% `ahead`, Engineering 54% `behind`, Sales 36% `far_behind`,
Finance 23% `far_behind` — matching the mockup's color coding.

Remaining exports, all pure `(people, kudos, ...) => T`:

```ts
computeMemberStats(personId, people, kudos): MemberStats
computeTeamMemberStats(teamId, people, kudos): MemberStats[]   // sorted usage asc
computeTeamStats(people, kudos): TeamStats[]                   // sorted usage asc
computeCompanyStats(people, kudos): CompanyStats
computeLeaderboard(people, kudos, limit): LeaderboardRow[]      // by receivedCents desc
computeClaimByTeam(people, kudos): TeamClaimRow[]              // by claimRatio asc
```

`nudgeable` on `MemberStats` = `usageRatio < 1 || unclaimedCount > 0`.

**Pace does not gate nudging.** Anyone under 100% is nudgeable even if they're ahead
of pace — there's still budget on the table and a deadline. Only someone who has spent
all $80 *and* has nothing outstanding is left alone.

This means `paceStatus` is **display only**: it drives bar and pill colors, nothing
else. No action anywhere in the app branches on it. Keep it that way — if you find
yourself reading `paceStatus` outside a className, something has gone wrong.

The 7-day cooldown is applied separately in `NudgeButton`, not here — `derive.ts`
stays pure and free of nudge history.

**Verify with vitest** (`lib/derive.test.ts`, ~8 assertions — the whole app rests on
this layer, so it is the one place tests earn their keep):

- company given = 212100, claimed = 175900, participants = 39
- Engineering usageRatio ≈ 0.539, paceStatus === 'behind'
- Sales paceStatus === 'far_behind'
- leaderboard[0].person.name === 'Priya Raman' && receivedCents === 14500
- Jonas Kerr: givenCents === 0, lastGivenAt === null, nudgeable === true
- Tomás Iglesias: paceStatus === 'ahead' but nudgeable === true (69%, under full)
- Priya Raman: nudgeable === false (100% used, nothing outstanding — the only one)
- claimByTeam[0].team.name === 'Finance' (lowest claim ratio, 50%)
- expiringSoonCount === 9

**Data-integrity assertions — added after the phase 4 review caught three defects
these would have prevented. Keep them permanently.**

- **No self-kudos:** `mockKudos.filter(k => k.fromId === k.toId).length === 0`.
  Nobody spends their recognition budget on themselves. Self-edges also produce
  degenerate `forceLink` entries that destabilise the 1.4 layout.
- **Leaderboard top 7 matches §4 exactly** — all seven rows, each with its
  `receivedCents`, `kudosCount` and `distinctGivers`. Asserting only row 1 lets
  rows 2–7 drift.
- **Dormant count === 6**, and they are exactly 3 Finance + 3 Sales. This is what
  1.4 renders grey; an extra dormant Engineering node contradicts the map's story.
- **Every `fromId`/`toId` resolves to a real person**, and per-team *given* totals
  match the §4 table.

`src/lib/__verify.test.ts` already contains all of these, computed from the raw mock
arrays without importing `derive.ts` — so a bug in the data can't be masked by a
matching bug in the derive layer. Merge it into `derive.test.ts` and delete it.

---

## 6. Shared UI primitives

Small, dumb, no data fetching. Match the mockup's atoms.

| Component | Props | Notes |
|---|---|---|
| `AppShell` | `children` | Sidebar + main column, `min-w-[1240px]` |
| `Sidebar` | — | Static nav; "Belong" active with `NEW` badge |
| `PageTabs` | — | `<NavLink>` to `/kudos` and `/kudos/network` |
| `Avatar` | `initials, color, size?` | Circle, white bold text |
| `Pill` | `tone: 'good'\|'warn'\|'crit'\|'neutral'\|'brand'` | |
| `ProgressBar` | `value: number, pace?: number, tone` | **The pace tick is the distinctive part** — a 2px absolutely-positioned marker at `left: pace%`. Without it the percentages mean nothing. |
| `StatCard` | `label, value, sub, tone?, action?` | KPI tile |
| `Card` / `CardHeader` | `title, sub?, actions?` | |
| `Money` | `cents` | `$1,234` — always through this, never inline math |
| `Toast` | via context | One fixed-position div, 4s auto-dismiss |

Map `PaceStatus` → `Pill` tone once, in a helper, and reuse:
`ahead|on → 'good'`, `behind → 'warn'`, `far_behind → 'crit'`.

**Verify:** add a temporary `/kitchen-sink` route rendering every primitive in every
tone. Delete it before you finish.

---

## 7. Screen 1.1 — Dashboard

`DashboardPage` composes four blocks. Data comes from
`useCompanyStats()`, `useTeamStats()`, `useLeaderboard(7)`, `useClaimByTeam()`.

**`KpiRow`** — 4 `StatCard`s: Budget used (56%, bar with pace tick, "10 pts behind
pace"), Participation (39/47), Claim rate (83%), At risk ($118 / 9 cards, crit
styling, with a bulk `NudgeButton`).

**`TeamUsageGrid`** — 3-column grid of `TeamUsageCard`, sorted lowest usage first
(hard-sorted, no control). Each card: avatar, team name, member count, allowance,
big usage %, `ProgressBar` with pace tick, pace `Pill`, dollars given, and two
buttons — `View team →` (`navigate('/kudos/team/' + id)`) and `Nudge team · N`,
which targets the whole team minus anyone at $0 remaining (§9).

**`Leaderboard`** — top 7 by received. Columns: rank, person, received, kudos count,
distinct givers. Ranks 1–3 get gold/silver/bronze rank numerals.

**`ClaimTrackingTable`** — one row per receiving team, sorted by claim ratio ascending.
Columns: team, received, claimed, claim-rate bar + %, open count `Pill`, `NudgeButton`.
Footer: "32 open cards · $362 unclaimed · 9 expiring within 30 days" plus a bulk
`NudgeButton`.

Note the two `NudgeButton` variants differ only by `template` prop — team cards send
`unused_budget`, claim rows send `unclaimed_gift`.

**Verify:** every figure on screen matches the §4 table; clicking any team card
navigates to that team's detail page.

---

## 8. Screen 1.2 — Team drill-down

`TeamDetailPage` reads `useParams<{teamId}>()`, calls `useTeamStats()` (filtered) and
`useMemberStats(teamId)`. 404 → redirect to `/kudos`.

- Breadcrumb `Dashboard › Engineering`, `PageTabs` still visible and unchanged —
  this is a state of the Dashboard tab, not a new destination.
- Header action: `Nudge team · N`, where N is `teamStats.membersWithBudgetLeft` —
  every member under 100%, regardless of pace (§9). The label must name the real
  send count; a bulk action should never surprise.
- `TeamKpiRow`: Team budget used (with pace tick), Members giving (12/14),
  Received by team ($640, 89% claimed, 5 open).
- `MemberTable`: one row per member, sorted usage ascending. Columns: member
  (avatar + name + role), budget-used bar + %, given, received, claim status `Pill`,
  last given, `NudgeButton`.
- Rows where `unclaimedCount > 0` get a `bg-crit-bg/40` tint.
- Show all 14 rows. (The mockup's "Showing 8 of 14" pagination is not worth building
  at this size — see §11.)

**Verify:** `/kudos/team/engineering` shows the 8 named members from §4 with exactly
those figures; every nudge button is enabled except Priya's (100% used, all claimed) —
including Marcus at 90% and Tomás at 69%, both of whom are ahead of pace.

---

## 9. Screen 1.3 — Nudge

Mostly not UI. Three pieces:

**`templates.ts`** — pure string builders, no JSX:

```ts
export function unusedBudgetMessage(s: MemberStats): string {
  // "Hi Wei 👋 You still have $30 of your $80 Kudos budget left to give,
  //  and there are 124 days before it resets on Dec 31. ..."
}
export function unclaimedGiftMessage(s: MemberStats): string {
  // "Hi Ravi 👋 You have 2 unclaimed Kudos gift cards worth $30 waiting
  //  for you. One of them expires Sep 14. ..."
}
```

Only the name, amounts, day count and expiry date vary. Copy is fixed — there is no
compose step and no editable field anywhere in the UI.

**`NudgeContext`** — holds `NudgeRecord[]` in `useState`, exposes:

```ts
sendNudge(personIds: PersonId[], template: NudgeTemplate): void
canNudge(personId: PersonId): boolean   // no record within 7 days of TODAY
```

Seed 2–3 existing records at mount (e.g. Tomás nudged Aug 26) so the disabled
cooldown state is visible without clicking anything.

**`NudgeButton`** — `{ personIds, template, label? }`. Disabled when every target is
in cooldown. On click: `sendNudge(...)`, then toast — `"Nudged 6 people in Engineering"`
for bulk, `"Nudged Ravi Menon"` for one.

### Targeting rules

**One rule, everywhere: nudge anyone under 100%.** Pace is irrelevant to targeting —
someone at 69% who is comfortably ahead of pace still has $25 that expires Dec 31, and
that is worth a reminder.

- **Individual nudge** — enabled when `usageRatio < 1 || unclaimedCount > 0`.
- **Team nudge** — every member under 100%. `membersWithBudgetLeft` drives both the
  button label and the send list, so what the label says and what the button does
  can't drift apart.

The only people never nudged are those who have spent all $80 with nothing
outstanding. That falls out of the rule rather than being a special case — and it's
also what keeps Template A's copy honest, since *"you still have $0 of your $80 left
to give"* would otherwise go to the people who did exactly what the program wanted.

**Recommendation that departs from the spec:** add a confirm step for bulk nudges
of >5 people. You ruled out a compose modal, and that's right for a single nudge —
but a whole-team nudge now hits up to 14 people, and "Nudge everyone with open cards"
can DM 30 from one misclick. That's a different risk than nudging one person. A
one-line confirm ("Send a Slack reminder to 12 people?" / Cancel / Send) keeps the
fixed copy and removes the footgun.

**Optional, cheap:** a dev-only `/kudos/_templates` route rendering both messages in
the Slack-bubble styling from spec §1.3, so stakeholders can review the copy. Zero
product surface. Build only if you want it for the demo.

**Verify:** nudging Ravi disables his button and shows a toast; the button stays
disabled on re-render; Engineering's team nudge label reads "Nudge team · 13" (14
members minus Priya at $0 remaining) and sends exactly 13 records, none to Priya.

---

## 10. Screen 1.4 — Network Map

**`useForceLayout(nodes, links, width, height)`** — runs d3-force **synchronously,
once**, and returns positioned nodes. Do not animate a tick loop; it costs React
re-render churn and buys nothing for 24 static nodes.

```ts
const sim = forceSimulation(nodeCopies)
  .force('link', forceLink(linkCopies).id(d => d.id).distance(60).strength(0.35))
  .force('charge', forceManyBody().strength(-180))
  .force('collide', forceCollide(d => d.r + 6))
  .force('x', forceX(d => teamCentroid(d.teamId).x).strength(0.12))
  .force('y', forceY(d => teamCentroid(d.teamId).y).strength(0.12))
  .stop();
sim.tick(300);
```

Three gotchas, all of which will bite otherwise:

- **d3-force mutates its inputs.** It writes `x/y/vx/vy` onto nodes and replaces
  `link.source`/`link.target` string ids with node object references. Pass deep
  copies, never your memoized derived data.
- **The per-team `forceX`/`forceY` anchors are what make the map readable.** Without
  them everything collapses into one hairball and the "Sales is a closed loop"
  finding becomes invisible. Lay the 6 team centroids out on a ring.
- Layout is deterministic for identical input (d3 seeds node positions in a fixed
  phyllotaxis pattern), so the map won't reshuffle on every render — but memoize on
  `[nodes, links, width, height]` anyway.

**`useKudosGraph({ crossTeamOnly, teamFilter })`** returns:

```ts
nodes: { id, name, teamId, color, r, receivedCents, isDormant }[]
links: { source, target, width, color }[]   // aggregated per ordered pair
insights: GraphInsights
```

- `r = clamp(5 + Math.sqrt(receivedCents / 100) * 1.6, 5, 20)`
- `link.width = clamp(1 + amountCents / 1500, 1, 3)`; `link.color` = **giver's** team color
- `isDormant` = no kudos sent or received since `TODAY − 90d` → render grey `#B9AECF`
- `crossTeamOnly` drops links where both ends share a `teamId`

**`GraphInsights`** — computed, not hardcoded:

```ts
mostReliedOn:   highest distinct-giver count, + how many teams those givers span
connector:      highest count of distinct teams sent into
mostClosedTeam: highest ratio of intra-team out-edges to total out-edges
dormantCount:   nodes where isDormant
mutualPairRatio: pairs with edges in both directions / total distinct pairs
```

Render each as a sentence in the right-hand panel. This panel is the point of the
screen — a graph alone asks an HR user to interpret a hairball.

**`ForceGraph.tsx`** — plain SVG, `viewBox="0 0 660 520"`, `<line>`s then `<circle>`s
then `<text>` labels. Draw the dashed ring around the connector node. No zoom, no pan,
no drag (see §11).

Controls above the graph: team filter and a `Show cross-team only` toggle. That is all
— see the cut list.

**Verify:** six visible team clusters; toggling cross-team-only visibly thins the
Sales cluster to almost nothing; the insights panel names Priya as most relied on and
Leah as the connector, computed rather than typed.

---

## 11. Build order

Each phase ends with something runnable. Don't start a phase before the previous one
verifies.

| # | Phase | Verify |
|---|---|---|
| 0 | Scaffold, Tailwind theme, `AppShell` + `Sidebar` + `PageTabs`, 3 empty routes | Sidebar matches mockup; tabs switch routes |
| 1 | `types.ts`, `clock.ts`, `mock/*`, `derive.ts`, `derive.test.ts` | `npx vitest run` — all 8 assertions in §5 pass |
| 2 | `hooks/*` (thin wrappers over derive + mock) | `/kitchen-sink` logs correct stats |
| 3 | UI primitives | `/kitchen-sink` renders every primitive/tone |
| 4 | **1.1 Dashboard** | Every figure matches §4; team cards navigate |
| 5 | **1.2 Team drill-down** | Engineering shows the 8 named members correctly |
| 6 | **1.3 Nudge** | Nudge disables + toasts; cooldown holds; bulk confirm works |
| 7 | **1.4 Network Map** | Clusters visible; insights computed; toggle works |
| 8 | Delete `/kitchen-sink`, README with run instructions | `npm run build` clean, no TS errors |

Phases 1–3 are the foundation and are where an implementation goes wrong quietly.
Do not skip the tests in phase 1.

---

## 12. What I'd cut — and why

You asked me to flag what isn't worth building. In rough order of how confident I am:

**Cut outright:**

1. **"Show individuals" toggle on claim tracking (1.1).** Genuinely redundant — 1.2
   already shows per-member claim status, and it's one click away. This is the only
   item on the list I think is a *design* mistake rather than just premature.
   *Note:* you confirmed claim tracking is measured on the receiving **individual and
   team**. Both measurements exist either way — `MemberStats` carries per-person
   `receivedCents` / `claimedCents` / `unclaimedCount`, surfaced in the 1.2 member
   table's Claim status column. The cut is the redundant *toggle* on 1.1, not the
   individual-level data. Say so if you wanted the toggle back.
2. **FY2026 / date-range selectors (1.1, 1.2, 1.4).** There is one year of mock data.
   A dropdown with a single option is a dead control that invites clicks that do
   nothing. Render the period as static text instead.
3. **"Node size: Kudos received" dropdown (1.4).** The only alternative (size by
   given) isn't interesting enough to justify a control. Hard-code it; put the
   encoding in a legend line.
4. **"Sort: lowest first" dropdown (1.1).** Six teams, all visible at once. Hard-sort.
5. **"View full ranking (47)" (1.1).** A second render of the same table. Top 7 is
   the whole insight; the tail is noise.
6. **Member search/filter (1.2).** Fourteen rows on screen.
7. **"Showing 8 of 14" pagination (1.2).** Render all 14. Pagination on a 14-row table
   is pure cost.

**Cut for the prototype, real for production:**

8. **Export CSV (1.1, 1.2).** A real feature with zero design risk — you learn nothing
   about the UX by building it now, and it's an afternoon later.
9. **Zoom / pan / drag on the graph (1.4).** 24 nodes fit in the viewBox. Revisit only
   if you push mock data past ~60 people.

**Build, but know it's fake:**

10. **The 7-day nudge cooldown.** In-memory only — it resets on refresh. Fine for a
    demo, but don't let anyone conclude from the prototype that the rate limit works.
    It needs server-side state to be real, and it's the rule that stops two HR admins
    double-DMing the same person.

**One thing I'd add rather than cut:** the bulk-nudge confirm in §9.

That trims roughly 9 controls. What remains is the part that carries the product idea:
usage vs. pace, the leaderboard, claim tracking, the drill-down, nudging, and the map.

---

## 13. Decisions — settled, build to these

All five open questions were answered. Recorded here so the reasoning isn't lost.

1. **Pace is linear.** Giving is expected to track the calendar evenly, so the
   `paceStatus` thresholds in §5 stand as written, and `fiscalYearProgress()` is a
   plain elapsed-days ratio. No seasonal curve.

2. **Someone at 100% used with unclaimed cards is still `nudgeable`.** They need to
   claim. The button label reads "Nudge" in both cases; the template differs
   (`unclaimed_gift` rather than `unused_budget`), which is what makes it correct.

3. **Nudge anyone under 100%, individually or by team — pace does not gate it.**
   Being ahead of pace is not a reason to skip someone who still has budget that
   expires Dec 31. `nudgeable = usageRatio < 1 || unclaimedCount > 0`, and a team
   nudge sends to every member under 100%.

   This is the answer that changed the most plan text. `TeamStats.membersBelowPace`
   became `membersWithBudgetLeft`, both team-nudge labels read `Nudge team · N`, and
   **`paceStatus` is now display-only** — it colors bars and pills and drives no
   behavior anywhere. That's a simplification worth protecting: reading `paceStatus`
   outside a className means a rule has crept back in.

4. **Claim tracking is measured on the receiving individual and the receiving team.**
   Both already exist: `TeamClaimRow` for teams (1.1), `MemberStats` for individuals
   (1.2 member table). No new computation. See the note on cut #1 in §12.

5. **No permission model.** Every dashboard view is admin. `useKudosGraph` takes no
   viewer-scope parameter, there are no role checks anywhere, and no route guards.

   One thing to keep separate: this is a *build* simplification, not a resolution of
   the data-sensitivity note in spec §1.4. The network map still exposes individual
   relationship data, including who has no connections. That question is live for
   production even though the prototype ignores it.
