# src/employee/

Employee-facing pages (`/me/*`). Plain CSS classes in `src/index.css`
(`card`, `btn`, `pill`, `av`, `field`, `empty`, …) — do not import
`components/ui/*` here, that's Tailwind and belongs to the HR side. Every
read/write goes through `lib/queries.ts`; components never call the Supabase
client directly.

| File | Route | What |
|---|---|---|
| `Shell.tsx` | wraps `/me/*` | tab nav, budget summary, no-auth person switcher |
| `Overview.tsx` | `/me/overview` | budget, recent activity, received-gifts summary |
| `Send.tsx` | `/me/send` | pick a colleague + gift card + message, sends a kudos (triggers the real SodaGift order via `api/gift.ts`) |
| `Preferences.tsx` | `/me/preferences` | pick/reorder top-3 gift cards from the catalog |
| `Received.tsx` | `/me/received` | claim received gifts, redemption codes |
| `GiftMark.tsx` | — | shared gift-card tile (image, falls back to swatch + glyph); used by `Send.tsx` and `Preferences.tsx` |
