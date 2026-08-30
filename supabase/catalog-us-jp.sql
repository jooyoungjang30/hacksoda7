-- US + JP catalog, so the gift a Vega employee sends matches the country the
-- recipient actually works in. Additive: the GB rows stay, keeping the 825 rows
-- of seeded history valid. Run after supabase/vega-dataset.sql.

alter table gift_cards add column if not exists currency      text default 'GBP';
alter table gift_cards add column if not exists native_amount numeric;

insert into gift_cards
  (id, brand, country, min_cents, max_cents, currency, native_amount,
   soda_custom_amount, image_url, soda_product_id, swatch, glyph)
values
  ('soda19985', 'Apple $10', 'United States', 1000, 1000, 'USD', 10.0, false, 'https://media.sodagift.com/img/image/1370659462059646.jpg', 19985, '#2D3748', 'A'),
  ('soda19986', 'Apple $100', 'United States', 10000, 10000, 'USD', 100.0, false, 'https://media.sodagift.com/img/image/1370659462059646.jpg', 19986, '#553C9A', 'A'),
  ('soda19987', 'Apple $25', 'United States', 2500, 2500, 'USD', 25.0, false, 'https://media.sodagift.com/img/image/1370659462059646.jpg', 19987, '#B83280', 'A'),
  ('soda19988', 'Apple $50', 'United States', 5000, 5000, 'USD', 50.0, false, 'https://media.sodagift.com/img/image/1370659462059646.jpg', 19988, '#2C7A7B', 'A'),
  ('soda60394', 'AMC Theatres $10', 'United States', 1000, 1000, 'USD', 10.0, false, 'https://media.sodagift.com/img/image/779347724587814.jpg', 60394, '#975A16', 'A'),
  ('soda60395', 'Texas Roadhouse $10', 'United States', 1000, 1000, 'USD', 10.0, false, 'https://media.sodagift.com/img/image/52092814825667.jpg', 60395, '#276749', 'T'),
  ('soda60396', 'Krispy Kreme $10', 'United States', 1000, 1000, 'USD', 10.0, false, 'https://media.sodagift.com/img/image/52019905399851.jpg', 60396, '#9B2C2C', 'K'),
  ('soda60398', 'Grubhub $10', 'United States', 1000, 1000, 'USD', 10.0, false, 'https://media.sodagift.com/img/image/779407117968693.jpg', 60398, '#2A4365', 'G'),
  ('soda60402', 'Panera Bread $10', 'United States', 1000, 1000, 'USD', 10.0, false, 'https://media.sodagift.com/img/image/52056123440642.jpg', 60402, '#4A5568', 'P'),
  ('soda60404', 'Bath & Body Works $10', 'United States', 1000, 1000, 'USD', 10.0, false, 'https://media.sodagift.com/img/image/2048695024882135.jpg', 60404, '#6B46C1', 'B'),
  ('soda60408', 'Subway $10', 'United States', 1000, 1000, 'USD', 10.0, false, 'https://media.sodagift.com/img/image/5960868485033108.jpg', 60408, '#B7791F', 'S'),
  ('soda19796', 'Amazon.co.jp', 'Japan', 500, 30000, 'JPY', null, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733659771414.png', 19796, '#285E61', 'A'),
  ('soda19797', 'Apple Japan ¥1,000', 'Japan', 667, 667, 'JPY', 1000.0, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733659775285.png', 19797, '#7C2D12', 'A'),
  ('soda19798', 'Apple Japan ¥2,500', 'Japan', 1667, 1667, 'JPY', 2500.0, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733659775285.png', 19798, '#1E3A5F', 'A'),
  ('soda19799', 'Google Play Japan ¥2,000', 'Japan', 1333, 1333, 'JPY', 2000.0, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733659780239.png', 19799, '#2D3748', 'G'),
  ('soda19800', 'Google Play Japan ¥3,000', 'Japan', 2000, 2000, 'JPY', 3000.0, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733659780239.png', 19800, '#553C9A', 'G'),
  ('soda19801', 'Uber Eats 日本 ¥2,000', 'Japan', 1333, 1333, 'JPY', 2000.0, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733659782311.png', 19801, '#B83280', 'U')
on conflict (id) do update set
  min_cents = excluded.min_cents, max_cents = excluded.max_cents,
  currency = excluded.currency, native_amount = excluded.native_amount,
  soda_custom_amount = excluded.soda_custom_amount, image_url = excluded.image_url;

update gift_cards set currency = 'GBP' where currency is null;

-- Preferences follow the office: Austin picks US cards, Tokyo picks Japanese ones.
delete from gift_preferences;
insert into gift_preferences (employee_id, rank, gift_card_id)
select e.id, g.rn, g.id
from employees e
join lateral (
  select c.id, row_number() over (order by (c.country <> case e.office_id
           when 'tokyo' then 'Japan' else 'United States' end), md5(c.id || e.id)) as rn
  from gift_cards c
  where c.soda_product_id is not null
    and c.country = case e.office_id when 'tokyo' then 'Japan' else 'United States' end
  limit 3
) g on true
on conflict do nothing;

select country, count(*) as products,
       count(*) filter (where soda_custom_amount) as variable
  from gift_cards where soda_product_id is not null group by country;