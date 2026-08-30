# supabase/

Paste-into-SQL-editor scripts. No CLI, no migration tool, RLS off (hackathon).
Run in this order:

1. `schema.sql` — drops and recreates everything (`employees`, `gift_cards`,
   `gift_preferences`, `budgets`, `kudos`, `nudges`)
2. `seed.sql` — demo data; numbers match the mockup exactly (Wei: $30 of $80
   left, $110 received across 9 kudos from 7 colleagues, $85 claimed, $25
   waiting)
3. `soda.sql` — adds `gift_cards.soda_product_id` and `employees.email` for
   the real SodaGift integration
4. `soda-catalog.sql` — attaches real SodaGift GB product ids to the seeded cards
5. `soda-full-catalog.sql` — adds the rest of the GB catalog + brand artwork
6. `hr-dataset.sql` — additive, only needed once: backfills `team_id` for the
   fuller HR dataset (generated from the old `src/mock/*` files); matches
   existing employees by name, doesn't touch their other columns

`reset.sql` — re-run between demo rehearsals to restore the seeded numbers
without dropping tables (safe to run repeatedly).
