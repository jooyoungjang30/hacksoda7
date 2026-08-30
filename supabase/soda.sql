-- SodaGift integration. Run once in the Supabase SQL editor.

alter table gift_cards add column if not exists soda_product_id bigint;
alter table employees  add column if not exists email text;
alter table kudos      add column if not exists soda_order_id bigint;
alter table kudos      add column if not exists soda_status   text;

-- Every gift in the demo is delivered to you, so the card actually arrives on
-- stage. Replace with your own address before running.
update employees set email = 'jwpark97114@gmail.com';
