# Implementation Plan — Employee views 2.1, 2.3, 2.4

Target: §2.1 (My Kudos → Overview), §2.3 (My Preferences), §2.4 (Received) of the
mockup. §2.2 (Send Kudos) is already built — `src/employee/Send.tsx`.

Each of the three replaces a `<Soon>` placeholder in `src/App.tsx`. Routes, shell,
sidebar, tabs and the person switcher already exist and need no changes.

**Stack for this half:** React + plain CSS classes in `src/index.css`. The employee
half does *not* use Tailwind — that's the HR half. Do not import
`components/ui/*` (StatCard, Pill, Money…); they are Tailwind and belong to HR.

---

## 0. Rules for this build

1. **Data is real, from Supabase.** Nothing is hand-authored in the components.
   Every number on these three screens is derived from `getBudget`, `getReceived`,
   `getActivity`, `getPreferences`, `getCatalog`. `supabase/seed.sql` is seeded so
   Wei's figures land on the mockup's numbers exactly ($110 received, $85 claimed,
   $25 unclaimed, 9 kudos, 7 colleagues, $30 of $80 left). If a screen shows a
   different number, the derivation is wrong — do not patch the seed.

2. **Use `lib/clock.ts` for anything date-shaped.** `daysUntil(iso)` against the
   frozen `TODAY` (2026-08-29) is what makes "expires in 16 days" come out right.
   Never `new Date()` / `Date.now()` in a component.
   *(Known pre-existing violation: `getBudget()` in `lib/queries.ts` computes
   `days_until_reset` from `Date.now()`. Leave it — out of scope, and it only
   shifts the sidebar's "resets in N days" by a day or two.)*

3. **Match the existing employee CSS vocabulary.** `card`, `card-h`, `btn`,
   `btn pri`, `btn sm`, `btn gh`, `pill vio/good/warn`, `av`, `lab`, `muted`,
   `tnum`, `field`, `empty`. New classes go in `src/index.css` in the same
   plain-CSS style, appended to the end. Do not add Tailwind utilities here.

4. **Three screens, three plain components.** No shared `<KpiTile>` /
   `<DataTable>` abstraction. The tiles differ per screen; duplicated JSX is
   cheaper than the wrong abstraction. The *one* exception is `GiftMark` (below),
   which already exists and is needed in two places.

5. **Every write goes through `lib/queries.ts`.** Components never call `db`
   directly. Follow the existing shape of `sendKudos` / `claimKudos`.

---

## 1. Groundwork (do this first — all three screens depend on it)

### 1a. `src/lib/supabase.ts` — add two missing fields to `KudosRow`

`kudos_feed` is `select k.*, …`, so these already come back over the wire; the type
just doesn't declare them. `Received` needs both.

```ts
export type KudosRow = {
  …
  redemption_code: string | null
  gift_image_url?: string | null   // only if you extend the view — see note
}
```

`redemption_code` is a straight type addition, no SQL change.
`gift_image_url` is **optional scope**: the `kudos_feed` view currently selects
`g.brand, g.swatch, g.glyph` but not `g.image_url`. The Received table only shows
the brand as text (per the mockup), so **skip it** unless you decide to draw the
card artwork in the table — in which case add `g.image_url as gift_image_url` to
the view in `supabase/schema.sql` and re-run it.

### 1b. Extract `GiftMark` out of `Send.tsx`

It's currently a private function inside `src/employee/Send.tsx` and §2.3's catalog
grid needs the identical image-or-swatch fallback. Move it verbatim to
`src/employee/GiftMark.tsx`, export it, import it in both `Send.tsx` and
`Preferences.tsx`. Nothing else in `Send.tsx` changes.

### 1c. `src/lib/queries.ts` — one new write

Preferences are the only thing on these three screens with no existing mutation.
The table's PK is `(employee_id, rank)` with `rank between 1 and 3`, so a
replace-all is both the simplest and the only safe shape — an in-place reorder
would collide on the PK mid-update.

```ts
/** Replaces the whole top-3. `cardIds` is in rank order, 0–3 entries. */
export async function savePreferences(employeeId: string, cardIds: string[]) {
  await db.from('gift_preferences').delete().eq('employee_id', employeeId)
  if (!cardIds.length) return
  const rows = cardIds.slice(0, 3).map((gift_card_id, i) => ({
    employee_id: employeeId, rank: i + 1, gift_card_id,
  }))
  const { error } = await db.from('gift_preferences').insert(rows)
  if (error) throw error
}
```

No other query is needed. `getBudget`, `getReceived`, `getActivity`,
`getPreferences`, `getCatalog`, `claimKudos` all already exist and already return
exactly what these screens need.

### 1d. `src/index.css` — append the shared employee patterns

These four don't exist yet and all three screens use them. Values are taken from
the mockup.

```css
/* ---------- overview / received ---------- */
.grid { display: grid; gap: 14px; }

.kpi { border: 1px solid var(--line); border-radius: 10px; background: #fff; padding: 15px 16px; }
.kpi .big { font-size: 29px; font-weight: 700; line-height: 1; letter-spacing: -.02em;
            margin: 7px 0 3px; font-variant-numeric: tabular-nums; }
.kpi .sub { font-size: 11.5px; color: var(--muted); }
.kpi.vio { border-color: #E4C9F0; background: var(--violet-25); }
.kpi.vio .lab, .kpi.vio .big { color: var(--violet-700); }

/* .bar is currently white-on-dark for the sidebar wallet — override on light cards */
.kpi .bar { background: var(--line); }
.kpi .bar i { background: var(--violet-700); }
.kpi .bar i.good { background: var(--good); }

.tbl { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.tbl th { text-align: left; font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase;
          color: var(--muted); font-weight: 600; padding: 9px 14px; border-bottom: 1px solid var(--line-2); }
.tbl td { padding: 11px 14px; border-bottom: 1px solid var(--line-2); vertical-align: middle; }
.tbl tr:last-child td { border-bottom: 0; }
.tbl .num { text-align: right; font-variant-numeric: tabular-nums; }
.tbl tr.hi { background: var(--violet-25); }

.who-cell { display: flex; align-items: center; gap: 9px; }
.who-cell b { font-size: 12.5px; font-weight: 600; display: block; line-height: 1.25; }
.who-cell span.rl { font-size: 10.5px; color: var(--muted); }

.btn.gh { border-color: transparent; background: transparent; color: var(--violet-700); }
```

`.btn.gh` is used throughout the mockup and is confirmed **not** defined in
`index.css` today — only `.btn`, `.btn.pri`, `.btn.sm`, `.btn.on` exist. Add it.

**Verify 1a–1d:** `npm run build` passes and `/me/send` still renders with the
extracted `GiftMark`.

---

## 2. §2.1 — Overview (`src/employee/Overview.tsx`)

Replaces `<Soon what="Overview" />` on `/me/overview`.

### Data

```ts
const me = resolveCurrentUser()
getBudget(me)      // left_cents, allocated_cents, spent_cents, days_until_reset
getReceived(me)    // all kudos where recipient = me, newest first
getActivity(me)    // sent + received interleaved, newest first, limit 8
getPreferences(me) // [{ rank, card }]
```

Four parallel `useEffect` loads keyed on `me`, same pattern as `Send.tsx`. Render
each card independently as its data arrives — do not gate the whole page on a
combined loading flag.

### Derivations (all from `received`)

| Figure | Derivation | Expected for Wei |
| --- | --- | --- |
| Received this year | `sum(amount_cents)` | $110 |
| Kudos count | `received.length` | 9 |
| Colleague count | `new Set(r.sender_id).size` | 7 |
| Waiting to be claimed | `sum` where `status === 'unclaimed'` | $25 |
| Unclaimed count | `count` where `status === 'unclaimed'` | 1 |
| Expiry date shown | earliest `expires_at` among unclaimed | Sep 14, 2026 |
| Budget % used | `spent_cents / allocated_cents` | 63% |

### Layout

**Row 1 — three KPI tiles** (`.grid` with `grid-template-columns: repeat(3,1fr)`):

1. **Left to give** — `usd(left_cents)`, sub "of your $80 for 2026",
   `.bar` at 63%, then `<span class="pill warn">{daysUntilReset()} days until it
   resets</span>`. Use `daysUntilReset()` from `lib/clock.ts`, **not**
   `budget.days_until_reset`, so it reads 124 like the mockup.
2. **Received this year** — `$110`, sub "9 kudos from 7 colleagues", then an
   overlapping avatar stack: first 4 distinct senders as `.av`
   (`background: sender_color`, `marginRight: -7`, `boxShadow: 0 0 0 2px #fff`),
   then a `+N` chip in `#E8E5EF / #63687A` if more remain.
3. **Waiting to be claimed** — `.kpi.vio`, `$25`, sub
   "1 gift card · expires Sep 14, 2026" (`shortDate` from `lib/format.ts` plus the
   year), and a `btn pri sm` **Claim now** that navigates to `/me/received`.
   *Claiming happens on 2.4 — this tile only routes there.*
   If nothing is unclaimed, render the tile in the neutral style with `$0` and
   "Nothing waiting" and no button.

**Row 2 — two cards**, `grid-template-columns: 1.3fr 1fr`, `align-items: start`:

- **Recent activity** (`card`): header with a `btn gh sm` "See all →" linking to
  `/me/received`. Body is a headerless `.tbl` of `activity.slice(0, 4)`. Per row,
  branch on `row.sender_id === me`:
  - *received*: avatar = `sender_color`/`sender_initials`; text
    `<b>{sender_name}</b> thanked you`; second line is the quoted `message`;
    value `+{usd(amount)}`; status pill from `status`
    (`unclaimed → pill vio "Unclaimed"`, `claimed → pill good "Claimed"`).
  - *sent*: avatar = `recipient_color`/`recipient_initials`; text
    `You thanked <b>{recipient_name}</b>`; second line is `gift_brand`;
    value `−{usd(amount)}`.
  - Date column: `shortDate(created_at)`.
- **Your gift preferences** (`card`): copy line "Colleagues see these three first
  when they send you kudos.", then the three prefs as compact rows (rank number in
  violet, `GiftMark`, brand, `£min–£max` from the card's cents fields), then a
  full-width `btn sm` **Edit preferences** → `/me/preferences`.
  **Empty state matters:** if `prefs.length === 0`, replace the list with
  "You haven't picked any yet — colleagues are guessing." and make the button read
  "Pick your top 3". (Switch the person selector to Tomás to see this — he is
  seeded with no preferences on purpose.)

### Verify

Switch to `wei`: tiles read $30 / $110 / $25; activity's top four rows are
Sofia Aug 27, You→Aisha Aug 24, Leah Aug 14, You→Priya Aug 08 — matching the
mockup line for line. Switch to `tomas`: $80 left, $0 received, preference empty
state, no unclaimed tile action.

---

## 3. §2.3 — My Preferences (`src/employee/Preferences.tsx`)

Replaces `<Soon what="My Preferences" />` on `/me/preferences`.

### State

```ts
const [picked, setPicked] = useState<GiftCard[]>([])  // rank order, max 3
const [catalog, setCatalog] = useState<GiftCard[]>([])
const [query, setQuery] = useState('')
const [saving, setSaving] = useState(false)
```

Load: `getPreferences(me)` → `setPicked(prefs.map(p => p.card))`, `getCatalog()`.

**Save policy — decide once and be consistent: save immediately on every mutation.**
Every edit (add / remove / reorder) calls `savePreferences(me, picked.map(c => c.id))`
and shows a toast. Rationale: the mockup has no Save button, and an unsaved-changes
banner is scope the spec never asked for. Use the existing `useToast()` from
`components/ui/Toast` — it is provider-level and already wraps these routes.

### Left card — "Your top 3" (`flex: 0 0 400px`)

Header: `<h3>Your top 3</h3>` + `<span class="sub">drag to reorder</span>`.

Three rows. For each picked card: drag handle `⠿`, rank number in violet, a 36px
`GiftMark`, brand + `£min–£max · country`, and a `btn sm gh` **Remove** on the
right. Rank 1's row gets `background: var(--violet-25)`.

**Reordering — use native HTML5 drag and drop, no library.** On each row:
`draggable`, `onDragStart` stores the index, `onDragOver` calls
`e.preventDefault()`, `onDrop` splices the array and saves. ~20 lines; adding
dnd-kit for three rows is not justified. Also wire `↑`/`↓` on the handle for
keyboard access — two more lines and it makes the feature testable without a mouse.

If fewer than three are picked, render the remaining slots as dashed-border
placeholders reading "Empty — pick one from the catalog". This is the state a new
employee lands in and it is what makes the right-hand panel obviously actionable.

**Footer band — "What colleagues will see"** (`border-top`, `background:#FCFBFE`):
the eyebrow label, then a white bordered row with the user's own `.av`,
`<b>{firstName}'s top picks</b>` and the brand names joined with ` · `. When empty:
"Nothing yet — colleagues will see the full catalog." This band is the whole point
of the screen; it must update live from `picked`, not from a refetch.

### Right card — "Add from catalog" (`flex: 1`)

Header actions: a **static, non-interactive** `btn sm` reading "🌍 United Kingdom"
plus a search input. Justification: every one of the 88 rows in
`supabase/soda-full-catalog.sql` is `country = 'United Kingdom'`, so a country
dropdown would be a control with one option. Render it as a disabled-looking pill
so the mockup still reads correctly, and make **search real** —
`catalog.filter(c => c.brand.toLowerCase().includes(query.toLowerCase()))`.

Grid: `repeat(4, 1fr)`, each tile a 34px `GiftMark`, brand at 12px/600, and a
sub-line. Two tile states:

- already picked → `opacity: .5`, `pointer-events: none`, sub-line reads
  `Already #{rank}`.
- otherwise → clickable; sub-line is `£min–£max`. Click appends to `picked` and
  saves. When `picked.length === 3`, dim *all* remaining tiles and put
  "Remove one to add another" in the card footer — do not silently no-op a click.

Footer: `Showing {shown} of {catalog.length} · same catalog as Create order`.
Show the first 8 by default with a "Show all" toggle, or all of them behind the
card's own scroll — either is fine, just make the count honest.

### Verify

Add / remove / reorder as `wei`, hard-refresh: order persists. Send tab
(`/me/send`) picking Wei as recipient now shows the new order with the new #1
badged "Their #1" — that cross-screen link is the demo's payoff and is the real
test of this screen. As `tomas`: three empty slots, empty preview band, and after
picking one card the Send screen's empty state for him disappears.

---

## 4. §2.4 — Received (`src/employee/Received.tsx`)

Replaces `<Soon what="Received" />` on `/me/received`. This is the employee-side
mirror of the HR claim-tracking report.

### Data

`getReceived(me)` only. Everything on the screen derives from that one array.

```ts
const total    = sum(rows)
const claimed  = sum(rows.filter(r => r.status === 'claimed'))
const open     = rows.filter(r => r.status === 'unclaimed')
const openSum  = sum(open)
const soonest  = open.length ? Math.min(...open.map(r => daysUntil(r.expires_at))) : null
```

### Row 1 — three KPI tiles

1. **Total received** — `$110`, sub "9 kudos from 7 colleagues".
2. **Claimed** — `$85`, sub "8 of 9 gift cards redeemed",
   `.bar` with `<i class="good">` at `claimed/total` (77%).
3. **Not yet claimed** — `.kpi.vio`, `$25`, sub `expires in {soonest} days`
   (16, via `daysUntil` against the frozen clock), plus a `btn pri sm`
   **Claim now** that claims the soonest-expiring open card.
   With nothing open: `$0`, "All caught up", no button.

### The table — "All kudos received"

Header actions: `FY2026 ▾` and `All statuses ▾`.
- **FY2026 is static.** All seeded kudos are FY2026 and `budgets.period` has one
  value; a period picker with one option is dead UI. Render it as a plain pill.
- **Status filter is real** — a `<select className="field">` with
  All / Unclaimed / Claimed, filtering `rows` client-side.

Columns exactly as the mockup: From · Gift card · Message · Value · Status ·
Received · action.

- **From**: `.who-cell` with `.av` (`sender_color` / `sender_initials`), name, and
  the sender's team underneath. **`kudos_feed` does not carry the sender's team** —
  join it in the component from `getEmployees()` (already used elsewhere; one extra
  fetch), or add `s.team as sender_team` to the view. Prefer the client-side
  lookup — it's one line and avoids a schema change mid-demo.
- **Message**: a first-class column, `max-width: 230px`, muted, in quotes. Do not
  turn it into a tooltip; the legend calls this out specifically.
- **Status**: `unclaimed → pill vio "Expires {shortDate(expires_at)}"`,
  `claimed → pill good "Claimed"`, `expired → pill warn "Expired"`.
- **Action**: unclaimed → `btn pri sm` **Claim**; claimed → `btn gh sm`
  **View code**.
- Unclaimed rows get `class="hi"` (violet tint), as in the mockup.

### The claim interaction

`claimKudos(id)` already exists — it stamps `status`, `claimed_at` and generates a
`redemption_code`. Wire it as:

1. Click **Claim** → `ConfirmDialog` ("Claim this gift card?", body naming the
   brand and amount, confirm label "Claim $25"). `ConfirmDialog` is Tailwind but
   it's a portal-style overlay, not page furniture — importing it here is fine and
   is cheaper than a second modal.
2. On confirm: `claimKudos(row.id)`, then optimistically patch that row in local
   state (`status: 'claimed'`, `redemption_code: code`) so the KPI tiles recompute
   without a refetch, and `showToast('Claimed — code SG-XXXXXX')`.
3. **View code** opens the same dialog shell showing `redemption_code` in a mono
   `.field`-styled box. If `redemption_code` is null (every seeded claimed row has
   no code — they were claimed before the code column was in play), show
   "Sent to your email" rather than an empty box. **Handle this case; it is the
   default state of 8 of the 9 seeded rows, not an edge case.**

### Pagination

Mockup says "Showing 5 of 9". Render `filtered.slice(0, shown)` with `shown`
starting at 5 and a footer that is either `Showing 5 of 9` + a "Show all" button,
or `Showing 9 of 9`. Keep it to `useState` — no page-size control.

### Verify

As `wei`: tiles read $110 / $85 / $25, bar at 77%, top row is Sofia's unclaimed
$25 tinted violet with a Claim button, five rows visible, footer "Showing 5 of 9".
Claim it → tiles become $110 / $110 / $0, the third tile loses its button, the
row's pill flips to Claimed, and `/me/overview`'s third tile agrees on reload.
Status filter → Unclaimed shows one row, then zero after claiming.

---

## 5. Wire-up and final check

`src/App.tsx` — three import swaps, three element swaps:

```tsx
<Route path="overview"    element={<Overview />} />
<Route path="send"        element={<Send />} />
<Route path="preferences" element={<Preferences />} />
<Route path="received"    element={<Received />} />
```

`src/employee/Soon.tsx` becomes unused — **delete it** and drop its import. That is
an orphan created by this change, so removing it is in scope.

**Whole-flow verification, in this order:**

1. `npm run build` — clean, no TS errors.
2. `/me/overview` as `wei` — three tiles, four activity rows, three preferences.
3. `/me/preferences` — reorder so Costa is #1; toast fires; refresh holds.
4. `/me/send` — pick Wei as the recipient from another account (`?as=priya`):
   Costa now carries the "Their #1" badge. **This is the demo.**
5. `/me/received` — claim the open $25; all three screens agree afterwards.
6. Switch to `tomas` — every screen shows its empty state, nothing crashes.

---

## 6. Deliberately out of scope

- Country dropdown on the preferences catalog (one country exists).
- Period dropdown on Received (one period exists).
- Real email/redemption; `claimKudos`'s generated code is the whole mechanic.
- Mobile layouts — the employee half is desktop-only, same as the HR half.
- Any change to `components/ui/StatCard`, `Pill`, `Money` or the HR screens.
  The employee KPI tiles are new plain-CSS `.kpi` blocks *specifically* so this
  build never touches HR-side shared components.

## 7. Open questions worth a 30-second answer before starting

- **A.** Overview's "Claim now" — route to 2.4, or claim in place? Planned as
  *route to 2.4* so there is exactly one claim implementation.
- **B.** Preferences saves immediately on every edit, no Save button. If you want
  an explicit Save, say so now — it changes the state shape.
- **C.** Fewer than 3 preferences is allowed (the schema and Send.tsx both already
  assume it). Confirm that's still true; if 3 becomes mandatory, the empty slots
  become a validation state instead of a hint.
