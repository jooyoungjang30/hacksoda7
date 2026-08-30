-- Cross-region support. Additive; safe to re-run.
-- Offices are a first-class dimension because the demo's headline metric
-- (coverage, Austin 88% vs Tokyo 19%) is computed per office, and the map
-- colours nodes by office rather than team.

create table if not exists offices (
  id       text primary key,       -- 'austin', 'tokyo'
  name     text not null,
  country  text not null,          -- ISO-3166 alpha-2
  timezone text not null,
  color    text not null           -- node colour on the connection map
);

insert into offices (id, name, country, timezone, color) values
  ('austin', 'Austin', 'US', 'America/Chicago', '#5B21B6'),
  ('tokyo',  'Tokyo',  'JP', 'Asia/Tokyo',      '#0D9488')
on conflict (id) do nothing;

alter table employees add column if not exists office_id  text references offices(id);
alter table employees add column if not exists started_at date;

-- Anyone already in the table predates the Vega dataset; park them in Austin so
-- nothing renders with a null office while the new data is being loaded.
update employees set office_id = 'austin' where office_id is null;

create index if not exists employees_office_idx on employees (office_id);
