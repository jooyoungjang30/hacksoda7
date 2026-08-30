# src/

Entry point: `main.tsx` → `App.tsx` (routes). The app is two independent halves
sharing one Supabase database — read the relevant subdirectory README before
editing, you shouldn't need the other half's.

| Route | Directory | Styling |
|---|---|---|
| `/kudos`, `/kudos/team/:id`, `/kudos/network` | [`screens/`](screens/README.md) | Tailwind v4 |
| `/me/*` (overview, send, preferences, received) | [`employee/`](employee/README.md) | plain CSS (`index.css`) |

Shared underneath both:

| Directory | What |
|---|---|
| [`lib/`](lib/README.md) | Supabase client, types, all reads/writes, pure derive functions, frozen clock |
| [`hooks/`](hooks/README.md) | React wrappers around `lib/` |
| [`components/`](components/README.md) | shared UI: Tailwind primitives, page chrome, the nudge button |

`assets/` — unused Vite template art, not wired into the app.
