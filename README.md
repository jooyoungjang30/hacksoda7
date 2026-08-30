# Kudos Gift Tracker

HR admin screens (dashboard, team drill-down, nudge, network map) for the Kudos
Gift Tracker, per `IMPLEMENTATION_PLAN.md`. Front-end only, mock data, no backend.

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints and go to `/kudos`.

## Routes

- `/kudos` — Dashboard (1.1)
- `/kudos/team/:teamId` — Team drill-down (1.2), e.g. `/kudos/team/engineering`
- `/kudos/network` — Network Map (1.4)

Nudge (1.3) is not a route — it's the "Nudge" buttons throughout the dashboard
and team pages.

## Other scripts

```bash
npx vitest run   # unit tests for lib/derive.ts and the mock data
npx tsc --noEmit # typecheck
npm run build    # production build
```
