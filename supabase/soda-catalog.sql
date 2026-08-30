-- Attach real SodaGift GB product ids to the cards already in gift_cards.
-- 주영's mockup was drawn from this exact catalog, so brands and ranges match.
-- Run after supabase/soda.sql.

alter table gift_cards add column if not exists soda_custom_amount boolean default true;

update gift_cards set soda_product_id = 19705 where id = 'amazon-uk';    -- Amazon.co.uk  £1–£1000
update gift_cards set soda_product_id = 19715 where id = 'costa-uk';     -- Costa UK      £1–£100
update gift_cards set soda_product_id = 19707 where id = 'apple-uk';     -- Apple UK      £2–£500
update gift_cards set soda_product_id = 19704 where id = 'adidas-uk';    -- adidas UK     £1–£500
update gift_cards set soda_product_id = 19708 where id = 'argos';        -- Argos         £1–£500
update gift_cards set soda_product_id = 19709 where id = 'asda';         -- ASDA          £1–£1000
update gift_cards set soda_product_id = 19710 where id = 'asos-uk';      -- ASOS UK       £3–£250
update gift_cards set soda_product_id = 19712 where id = 'boots-uk';     -- Boots UK      £1–£250
update gift_cards set soda_product_id = 19714 where id = 'cineworld';    -- Cineworld     £1–£300
update gift_cards set soda_product_id = 19719, soda_custom_amount = false
  where id = 'deliveroo-uk';                                             -- Deliveroo UK  fixed £10

-- Confirm all ten are wired.
select id, brand, soda_product_id, soda_custom_amount
  from gift_cards order by soda_product_id nulls first;
