-- Full SodaGift GB catalog. Adds the 78 products not already seeded,
-- and back-fills brand artwork on the ten that were. Run after soda-catalog.sql.
-- Existing ids are untouched, so seeded kudos and preferences keep working.

alter table gift_cards add column if not exists image_url text;

update gift_cards set image_url = 'https://media.sodagift.com/img/dev/biz/sandbox/1733647449805.png' where soda_product_id = 19704;
update gift_cards set image_url = 'https://media.sodagift.com/img/dev/biz/sandbox/1733647451719.png' where soda_product_id = 19705;
update gift_cards set image_url = 'https://media.sodagift.com/img/dev/biz/sandbox/1733647458930.png' where soda_product_id = 19707;
update gift_cards set image_url = 'https://media.sodagift.com/img/dev/biz/sandbox/1733647461051.png' where soda_product_id = 19708;
update gift_cards set image_url = 'https://media.sodagift.com/img/dev/biz/sandbox/1733647463706.png' where soda_product_id = 19709;
update gift_cards set image_url = 'https://media.sodagift.com/img/dev/biz/sandbox/1733647465041.png' where soda_product_id = 19710;
update gift_cards set image_url = 'https://media.sodagift.com/img/dev/biz/sandbox/1733647468338.png' where soda_product_id = 19712;
update gift_cards set image_url = 'https://media.sodagift.com/img/dev/biz/sandbox/1733647471534.png' where soda_product_id = 19714;
update gift_cards set image_url = 'https://media.sodagift.com/img/dev/biz/sandbox/1733647473581.png' where soda_product_id = 19715;
update gift_cards set image_url = 'https://media.sodagift.com/img/dev/biz/sandbox/1733647480619.png' where soda_product_id = 19719;

insert into gift_cards
  (id, brand, country, min_cents, max_cents, swatch, glyph, soda_product_id, soda_custom_amount, image_url)
values

  ('soda19706', 'Amazon.co.uk Ireland', 'United Kingdom', 100, 100000, '#2D3748', 'A', 19706, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647456002.png'),
  ('soda19711', 'Boohoo.com UK', 'United Kingdom', 500, 50000, '#553C9A', 'B', 19711, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647466942.png'),
  ('soda19713', 'Caffè Nero', 'United Kingdom', 100, 10000, '#B83280', 'C', 19713, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647470361.png'),
  ('soda19716', 'Currys PC World', 'United Kingdom', 1000, 1000, '#2C7A7B', 'C', 19716, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647475875.png'),
  ('soda19717', 'Currys PC World', 'United Kingdom', 5000, 5000, '#975A16', 'C', 19717, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647475875.png'),
  ('soda19718', 'Decathlon', 'United Kingdom', 200, 25000, '#276749', 'D', 19718, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647478221.png'),
  ('soda19720', 'Deliveroo UK', 'United Kingdom', 1500, 1500, '#9B2C2C', 'D', 19720, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647480619.png'),
  ('soda19721', 'Deliveroo UK', 'United Kingdom', 2000, 2000, '#2A4365', 'D', 19721, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647480619.png'),
  ('soda19722', 'Deliveroo UK', 'United Kingdom', 500, 500, '#4A5568', 'D', 19722, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647480619.png'),
  ('soda19723', 'Foot Locker UK', 'United Kingdom', 1000, 1000, '#6B46C1', 'F', 19723, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647483595.png'),
  ('soda19724', 'Foot Locker UK', 'United Kingdom', 10000, 10000, '#B7791F', 'F', 19724, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647483595.png'),
  ('soda19725', 'Foot Locker UK', 'United Kingdom', 2500, 2500, '#285E61', 'F', 19725, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647483595.png'),
  ('soda19726', 'Foot Locker UK', 'United Kingdom', 5000, 5000, '#2D3748', 'F', 19726, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647483595.png'),
  ('soda19727', 'Global Hotel Card Powered by Expedia UK', 'United Kingdom', 10000, 10000, '#553C9A', 'G', 19727, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647486459.png'),
  ('soda19728', 'Global Hotel Card Powered by Expedia UK', 'United Kingdom', 25000, 25000, '#B83280', 'G', 19728, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647486459.png'),
  ('soda19729', 'Global Hotel Card Powered by Expedia UK', 'United Kingdom', 5000, 5000, '#2C7A7B', 'G', 19729, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647486459.png'),
  ('soda19730', 'Google Play UK', 'United Kingdom', 100, 50000, '#975A16', 'G', 19730, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647489524.png'),
  ('soda19731', 'H Samuel UK', 'United Kingdom', 100, 250000, '#276749', 'H', 19731, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647491155.png'),
  ('soda19732', 'H&M UK', 'United Kingdom', 1000, 1000, '#9B2C2C', 'H', 19732, false, 'https://media.sodagift.com/img/image/562363130826099.png'),
  ('soda19733', 'H&M UK', 'United Kingdom', 10000, 10000, '#2A4365', 'H', 19733, false, 'https://media.sodagift.com/img/image/562363130826099.png'),
  ('soda19734', 'H&M UK', 'United Kingdom', 2500, 2500, '#4A5568', 'H', 19734, false, 'https://media.sodagift.com/img/image/562363130826099.png'),
  ('soda19735', 'H&M UK', 'United Kingdom', 5000, 5000, '#6B46C1', 'H', 19735, false, 'https://media.sodagift.com/img/image/562363130826099.png'),
  ('soda19736', 'Halfords', 'United Kingdom', 100, 100000, '#B7791F', 'H', 19736, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647496299.png'),
  ('soda19737', 'Hotelgift UK ', 'United Kingdom', 2500, 2500, '#285E61', 'H', 19737, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647498023.png'),
  ('soda19738', 'Iceland UK', 'United Kingdom', 1000, 50000, '#2D3748', 'I', 19738, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647499586.png'),
  ('soda19739', 'IKEA United Kingdom', 'United Kingdom', 500, 100000, '#553C9A', 'I', 19739, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647501642.png'),
  ('soda19740', 'John Lewis & Partners', 'United Kingdom', 100, 200000, '#B83280', 'J', 19740, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647503290.png'),
  ('soda19741', 'Just Eat UK', 'United Kingdom', 1000, 50000, '#2C7A7B', 'J', 19741, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647504944.png'),
  ('soda19742', 'lastminute.com Flight', 'United Kingdom', 1000, 400000, '#975A16', 'l', 19742, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647507226.png'),
  ('soda19743', 'lastminute.com Flight', 'United Kingdom', 1000, 400000, '#276749', 'l', 19743, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647507226.png'),
  ('soda19744', 'Lego UK', 'United Kingdom', 500, 50000, '#9B2C2C', 'L', 19744, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647512087.png'),
  ('soda19745', 'Marks & Spencer', 'United Kingdom', 1000, 1000, '#2A4365', 'M', 19745, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647514191.png'),
  ('soda19746', 'Marks & Spencer', 'United Kingdom', 10000, 10000, '#4A5568', 'M', 19746, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647514191.png'),
  ('soda19747', 'Marks & Spencer', 'United Kingdom', 2000, 2000, '#6B46C1', 'M', 19747, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647514191.png'),
  ('soda19748', 'Marks & Spencer', 'United Kingdom', 2500, 2500, '#B7791F', 'M', 19748, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647514191.png'),
  ('soda19749', 'Marks & Spencer', 'United Kingdom', 500, 500, '#285E61', 'M', 19749, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647514191.png'),
  ('soda19750', 'Marks & Spencer', 'United Kingdom', 5000, 5000, '#2D3748', 'M', 19750, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647514191.png'),
  ('soda19752', 'Mitchells & Butlers', 'United Kingdom', 500, 25000, '#553C9A', 'M', 19752, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647522780.png'),
  ('soda19753', 'New Look', 'United Kingdom', 500, 100000, '#B83280', 'N', 19753, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647524643.png'),
  ('soda19754', 'Nike UK', 'United Kingdom', 500, 40000, '#2C7A7B', 'N', 19754, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647526030.png'),
  ('soda19755', 'Pizza Hut UK', 'United Kingdom', 1000, 1000, '#975A16', 'P', 19755, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647528486.png'),
  ('soda19756', 'Pizza Hut UK', 'United Kingdom', 2500, 2500, '#276749', 'P', 19756, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647528486.png'),
  ('soda19757', 'Pizza Hut UK', 'United Kingdom', 5000, 5000, '#9B2C2C', 'P', 19757, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647528486.png'),
  ('soda19758', 'PizzaExpress', 'United Kingdom', 1000, 1000, '#2A4365', 'P', 19758, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647530643.png'),
  ('soda19759', 'PizzaExpress', 'United Kingdom', 10000, 10000, '#4A5568', 'P', 19759, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647530643.png'),
  ('soda19760', 'PizzaExpress', 'United Kingdom', 2000, 2000, '#6B46C1', 'P', 19760, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647530643.png'),
  ('soda19761', 'PizzaExpress', 'United Kingdom', 2500, 2500, '#B7791F', 'P', 19761, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647530643.png'),
  ('soda19762', 'PizzaExpress', 'United Kingdom', 500, 500, '#285E61', 'P', 19762, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647530643.png'),
  ('soda19763', 'PizzaExpress', 'United Kingdom', 5000, 5000, '#2D3748', 'P', 19763, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647530643.png'),
  ('soda19764', 'Primark UK', 'United Kingdom', 500, 20000, '#553C9A', 'P', 19764, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647535764.png'),
  ('soda19766', 'Sainsbury''s', 'United Kingdom', 1000, 1000, '#B83280', 'S', 19766, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647539209.png'),
  ('soda19767', 'Sainsbury''s', 'United Kingdom', 10000, 10000, '#2C7A7B', 'S', 19767, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647539209.png'),
  ('soda19768', 'Sainsbury''s', 'United Kingdom', 2500, 2500, '#975A16', 'S', 19768, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647539209.png'),
  ('soda19769', 'Sainsbury''s', 'United Kingdom', 500, 500, '#276749', 'S', 19769, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647539209.png'),
  ('soda19770', 'Sainsbury''s', 'United Kingdom', 5000, 5000, '#9B2C2C', 'S', 19770, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647539209.png'),
  ('soda19771', 'Sports Direct UK', 'United Kingdom', 1000, 1000, '#2A4365', 'S', 19771, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647543801.png'),
  ('soda19772', 'Sports Direct UK', 'United Kingdom', 10000, 10000, '#4A5568', 'S', 19772, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647543801.png'),
  ('soda19773', 'Sports Direct UK', 'United Kingdom', 2500, 2500, '#6B46C1', 'S', 19773, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647543801.png'),
  ('soda19774', 'Sports Direct UK', 'United Kingdom', 500, 500, '#B7791F', 'S', 19774, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647543801.png'),
  ('soda19775', 'Sports Direct UK', 'United Kingdom', 5000, 5000, '#285E61', 'S', 19775, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647543801.png'),
  ('soda19776', 'Spotify UK', 'United Kingdom', 1000, 1000, '#2D3748', 'S', 19776, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647546882.png'),
  ('soda19777', 'Spotify UK', 'United Kingdom', 3000, 3000, '#553C9A', 'S', 19777, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647546882.png'),
  ('soda19778', 'Spotify UK', 'United Kingdom', 6000, 6000, '#B83280', 'S', 19778, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647546882.png'),
  ('soda19779', 'Starbucks UK', 'United Kingdom', 500, 15000, '#2C7A7B', 'S', 19779, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647549295.png'),
  ('soda19780', 'Tesco', 'United Kingdom', 100, 25000, '#975A16', 'T', 19780, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647551292.png'),
  ('soda19781', 'The Great British Pub', 'United Kingdom', 500, 25000, '#276749', 'T', 19781, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647553184.png'),
  ('soda19782', 'Ticketmaster UK', 'United Kingdom', 500, 25000, '#9B2C2C', 'T', 19782, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647555104.png'),
  ('soda19783', 'TK Maxx', 'United Kingdom', 1000, 1000, '#2A4365', 'T', 19783, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647557289.png'),
  ('soda19784', 'TK Maxx', 'United Kingdom', 10000, 10000, '#4A5568', 'T', 19784, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647557289.png'),
  ('soda19785', 'TK Maxx', 'United Kingdom', 2500, 2500, '#6B46C1', 'T', 19785, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647557289.png'),
  ('soda19786', 'TK Maxx', 'United Kingdom', 5000, 5000, '#B7791F', 'T', 19786, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647557289.png'),
  ('soda19787', 'Twitch UK', 'United Kingdom', 1500, 15000, '#285E61', 'T', 19787, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647561554.png'),
  ('soda19788', 'Uber UK', 'United Kingdom', 1500, 15000, '#2D3748', 'U', 19788, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647562794.png'),
  ('soda19791', 'Waitrose & Partners', 'United Kingdom', 100, 250000, '#553C9A', 'W', 19791, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647568585.png'),
  ('soda19792', 'Waterstones UK', 'United Kingdom', 1000, 1000, '#B83280', 'W', 19792, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647570189.png'),
  ('soda19793', 'Waterstones UK', 'United Kingdom', 2500, 2500, '#2C7A7B', 'W', 19793, false, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647570189.png'),
  ('soda19794', 'WHSmith UK', 'United Kingdom', 500, 25000, '#975A16', 'W', 19794, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647572764.png'),
  ('soda19795', 'Zalando United Kingdom', 'United Kingdom', 500, 17000, '#276749', 'Z', 19795, true, 'https://media.sodagift.com/img/dev/biz/sandbox/1733647574886.png')
on conflict (id) do nothing;

select count(*) filter (where soda_product_id is not null) as live_products,
       count(*) as total from gift_cards;
