# api/

Vercel serverless functions. Each connects to Supabase directly with the
service role client (not via `src/lib/queries.ts`) and is called after a row
already exists — none of these should be able to block a kudos from being
recorded if they fail.

| File | Trigger | What | Requires |
|---|---|---|---|
| `gift.ts` | after a kudos is sent | places a real order against the SodaGift sandbox for that kudos, records the order id | `SODA_API_KEY` (skips gracefully if unset) |
| `signal.ts` | after a kudos is sent | asks Claude to classify the kudos message (`behavior`, `values`, `specificity`) and patches the row — powers the HR insights panel | `ANTHROPIC_API_KEY` |
| `nudge.ts` | HR clicks "Nudge" | posts a Slack DM via a bot token | `SLACK_BOT_TOKEN` (must start with `xoxb-`), `APP_URL` |

See [`scripts/sync-catalog.mjs`](../scripts/sync-catalog.mjs) for pulling the
SodaGift catalog itself (separate from these request-time functions).
