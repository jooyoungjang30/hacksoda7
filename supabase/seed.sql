-- Seed. Numbers match the mockup exactly: Wei has $30 left of $80, has received
-- $110 across 9 kudos from 7 colleagues, $85 claimed, $25 waiting.
-- Run after schema.sql. Re-runnable: schema.sql drops everything first.

insert into employees (id, name, title, team, initials, avatar_color, manager_id) values
  ('wei',   'Wei Chen',         'Senior Engineer',  'Engineering', 'WC', '#7C3AED', 'dana'),
  ('priya', 'Priya Raman',      'Staff Engineer',   'Engineering', 'PR', '#7C3AED', 'dana'),
  ('sofia', 'Sofia Marchetti',  'Product Designer', 'Design',      'SM', '#0D9488', null),
  ('dana',  'Dana Whitfield',   'Senior Engineer',  'Engineering', 'DW', '#7C3AED', null),
  ('leah',  'Leah Osborne',     'People Ops Lead',  'People Ops',  'LO', '#059669', null),
  ('tomas', 'Tomás Iglesias',   'Engineer',         'Engineering', 'TI', '#7C3AED', 'dana'),
  ('ana',   'Ana Duarte',       'Marketing Lead',   'Marketing',   'AD', '#DB6D0B', null),
  ('aisha', 'Aisha Nkemdi',     'Support Lead',     'Support',     'AN', '#0891B2', null);

-- TODO before the demo: set slack_user_id for whoever's phone is on stage.
-- update employees set slack_user_id = 'U0XXXXXXX' where id = 'wei';

insert into gift_cards (id, brand, min_cents, max_cents, swatch, glyph) values
  ('amazon-uk',   'Amazon.co.uk',    100, 100000, '#232F3E', 'a'),
  ('costa-uk',    'Costa UK',        100,  10000, '#6C1F3A', '☕'),
  ('apple-uk',    'Apple UK eGift',  200,  50000, '#1F1F1F', '🍎'),
  ('adidas-uk',   'adidas UK',       100,  50000, '#111111', 'adi'),
  ('argos',       'Argos',           100,  50000, '#7B2D8E', 'Ar'),
  ('asda',        'ASDA',            100, 100000, '#78BE20', 'AS'),
  ('asos-uk',     'ASOS UK',         300,  25000, '#000000', 'asos'),
  ('boots-uk',    'Boots UK',        100,  25000, '#05204A', 'B'),
  ('cineworld',   'Cineworld',       100,  30000, '#E31837', '★'),
  ('deliveroo-uk','Deliveroo UK',    500,   2000, '#00CCBC', 'D');

-- Preferences. Priya's three are exactly what the mockup draws, so the demo
-- screen matches 주영's screenshot. Everyone else is differentiated so the
-- reveal feels real when you switch people on stage.
insert into gift_preferences (employee_id, rank, gift_card_id) values
  ('wei',1,'amazon-uk'), ('wei',2,'costa-uk'),    ('wei',3,'apple-uk'),
  ('priya',1,'amazon-uk'),('priya',2,'costa-uk'), ('priya',3,'apple-uk'),
  ('sofia',1,'asos-uk'),  ('sofia',2,'apple-uk'), ('sofia',3,'deliveroo-uk'),
  ('dana',1,'argos'),     ('dana',2,'amazon-uk'), ('dana',3,'cineworld'),
  ('leah',1,'costa-uk'),  ('leah',2,'boots-uk'),
  ('ana',1,'deliveroo-uk'),('ana',2,'cineworld'), ('ana',3,'asda'),
  ('aisha',1,'boots-uk'), ('aisha',2,'amazon-uk'),('aisha',3,'adidas-uk');
  -- tomas deliberately has none — that's the empty state the spec asks for.

insert into budgets (employee_id, allocated_cents, spent_cents) values
  ('wei',8000,5000), ('priya',8000,3500), ('sofia',8000,6000), ('dana',8000,1000),
  ('leah',8000,7500), ('tomas',8000,0),   ('ana',8000,4500),  ('aisha',8000,2000);
  -- dana $70 left and tomas $80 left = the two people HR would nudge first.

-- Received by Wei: 9 kudos, $110, 7 colleagues, $85 claimed, $25 waiting.
insert into kudos (sender_id, recipient_id, gift_card_id, amount_cents, message,
                   followed_preference, status, created_at, expires_at, claimed_at,
                   signal_behavior, signal_values, signal_specificity) values
 ('sofia','wei','amazon-uk',2500,'The migration doc saved my week.',
   true,'unclaimed','2026-08-27','2026-09-14',null,
   'unglamorous_work', array['documentation','generosity'], 4),
 ('leah','wei','costa-uk',1500,'Thanks for covering the onboarding session.',
   false,'claimed','2026-08-14','2026-09-01','2026-08-15',
   'covered_absence', array['reliability'], 4),
 ('priya','wei','apple-uk',2000,'Great catch on the auth bug.',
   false,'claimed','2026-07-30','2026-08-17','2026-07-31',
   'quality_save', array['rigor'], 3),
 ('ana','wei','deliveroo-uk',1000,'Launch day would''ve fallen over without you.',
   true,'claimed','2026-07-11','2026-07-29','2026-07-12',
   'cross_team_support', array['ownership'], 3),
 ('dana','wei','amazon-uk',1500,'Pairing on the parser was genuinely fun.',
   true,'claimed','2026-06-22','2026-07-10','2026-06-23',
   'mentorship', array['collaboration'], 3),
 ('tomas','wei','costa-uk',500,'Thanks for the code review turnaround.',
   false,'claimed','2026-06-02','2026-06-20','2026-06-03',
   'unglamorous_work', array['responsiveness'], 2),
 ('aisha','wei','amazon-uk',1000,'You unblocked our escalation in ten minutes.',
   false,'claimed','2026-05-19','2026-06-06','2026-05-20',
   'customer_impact', array['urgency'], 4),
 ('tomas','wei','costa-uk',500,'Cheers for the deploy walkthrough.',
   false,'claimed','2026-04-08','2026-04-26','2026-04-09',
   'mentorship', array['patience'], 2),
 ('aisha','wei','boots-uk',500,'Appreciate you.',
   true,'claimed','2026-03-11','2026-03-29','2026-03-12',
   'other', array[]::text[], 1);
   -- ^ specificity 1 on purpose: this is the row that proves the metric works.

-- Sent by Wei: $50, leaving $30.
insert into kudos (sender_id, recipient_id, gift_card_id, amount_cents, message,
                   followed_preference, status, created_at, expires_at, claimed_at,
                   signal_behavior, signal_values, signal_specificity) values
 ('wei','aisha','costa-uk',1000,'You stayed on the incident call past midnight.',
   false,'claimed','2026-08-24','2026-09-11','2026-08-25',
   'unglamorous_work', array['endurance'], 4),
 ('wei','priya','amazon-uk',2000,'The retry logic you wrote has held all quarter.',
   true,'claimed','2026-08-08','2026-08-26','2026-08-09',
   'quality_save', array['craft'], 4),
 ('wei','dana','argos',2000,'You took the on-call swap with no notice.',
   true,'claimed','2026-07-15','2026-08-02','2026-07-16',
   'covered_absence', array['reliability'], 4);

-- The missing record, seeded: sofia, leah, tomas and ana have received nothing
-- at all this year. tomas has also set no preferences. Those four are the
-- "who has nobody noticed" answer the HR half exists to surface.
--
-- Sanity check after running:
--   select sum(amount_cents) from kudos where recipient_id='wei';            -- 11000
--   select sum(amount_cents) from kudos where recipient_id='wei' and status='claimed'; -- 8500
--   select spent_cents from budgets where employee_id='wei';                 -- 5000
