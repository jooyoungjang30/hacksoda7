# src/components/

Shared UI for the HR side (Tailwind). The employee side doesn't use these — it
has its own plain-CSS markup in `src/employee/`.

- **`ui/`** — Tailwind primitives, no app logic: `Avatar`, `Card`/`CardHeader`,
  `Money` (wraps `lib/format.money`), `Pill` (tone-colored badge, also exports
  `paceStatusTone`), `ProgressBar`, `StatCard`, `ConfirmDialog` (modal, no exit
  animation — unmount to dismiss), `Toast` (context + `useToast()`).
- **`shell/`** — page chrome shared by every HR screen: `AppShell` (sidebar +
  content, fixed `min-w-[1240px]`), `Sidebar`, `PageHeader`, `PageTabs`
  (dashboard vs. network tab, driven by the current route).
- **`nudge/`** — the "Nudge" action button used across dashboard/team/network:
  `NudgeButton` (confirms above `BULK_CONFIRM_THRESHOLD`), `NudgeContext`
  (7-day per-person cooldown, seeded so the disabled state is visible without
  clicking), `templates.ts` (message copy per `NudgeTemplate`).
