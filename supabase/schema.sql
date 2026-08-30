-- Kudos Gift Tracker — shared schema
-- Paste into Supabase SQL Editor. No CLI, no migrations, RLS off (hackathon).

drop table if exists nudges, kudos, gift_preferences, budgets, gift_cards, employees cascade;

create table employees (
  id            text primary key,          -- 'wei', 'priya' — readable ids beat uuids in a demo
  name          text not null,
  title         text,
  team          text not null,
  initials      text not null,
  avatar_color  text not null,
  slack_user_id text,                      -- fill in by hand for the demo users
  manager_id    text references employees(id),
  country       text default 'GB'
);

create table gift_cards (                  -- shared catalog: my Send screen + his Create Order
  id        text primary key,
  brand     text not null,
  country   text not null default 'United Kingdom',
  min_cents int not null,
  max_cents int not null,
  swatch    text not null,                 -- background hex from the mockup
  glyph     text not null                  -- letter or emoji shown on the tile
);

create table gift_preferences (            -- the centre of the product
  employee_id  text references employees(id) on delete cascade,
  rank         int not null check (rank between 1 and 3),
  gift_card_id text not null references gift_cards(id),
  primary key (employee_id, rank)
);

create table budgets (
  employee_id     text primary key references employees(id) on delete cascade,
  period          text not null default 'FY2026',
  allocated_cents int  not null default 8000,
  spent_cents     int  not null default 0,
  resets_on       date not null default '2026-12-31'
);

create table kudos (
  id                  bigint generated always as identity primary key,
  sender_id           text not null references employees(id),
  recipient_id        text not null references employees(id),
  gift_card_id        text not null references gift_cards(id),
  amount_cents        int  not null,
  message             text not null,
  followed_preference boolean default false,   -- picked from recipient's top 3?
  nudge_id            bigint,
  status              text not null default 'unclaimed',  -- unclaimed | claimed | expired
  expires_at          timestamptz not null default now() + interval '18 days',
  claimed_at          timestamptz,
  redemption_code     text,
  created_at          timestamptz not null default now(),
  -- written by /api/signal:
  signal_behavior     text,
  signal_values       text[],
  signal_specificity  int
);

create table nudges (
  id                 bigint generated always as identity primary key,
  kind               text not null default 'unused_budget',  -- unused_budget | unclaimed_gift
  target_id          text not null references employees(id),
  created_by         text references employees(id),
  suggested_to       text references employees(id),          -- who to thank (preselects the form)
  reason             text,
  sent_at            timestamptz not null default now(),
  slack_ok           boolean default false,
  slack_ts           text,                                -- thread anchor for the ✅ reply
  opened_at          timestamptz,
  fulfilled_kudos_id bigint references kudos(id)
);

-- Convenience view: everything the Overview tab and his dashboard both need.
create or replace view kudos_feed as
select k.*,
       s.name as sender_name,   s.initials as sender_initials,   s.avatar_color as sender_color,
       r.name as recipient_name, r.initials as recipient_initials, r.avatar_color as recipient_color,
       g.brand as gift_brand,   g.swatch as gift_swatch,          g.glyph as gift_glyph
from kudos k
join employees  s on s.id = k.sender_id
join employees  r on r.id = k.recipient_id
join gift_cards g on g.id = k.gift_card_id;
