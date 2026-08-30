-- Demo reset. Run in the Supabase SQL editor between rehearsals and once more
-- right before you go on stage. Restores the mockup's numbers exactly:
-- Wei has $30 left of $80, $110 received, $85 claimed, $25 waiting to claim.
-- Safe to run any number of times. Does NOT drop tables — the seed survives.

-- 1. Remove everything the demo created (the seed is ids 1-12).
delete from nudges;
delete from kudos where id > 12;

-- 2. Put the budgets back.
update budgets set spent_cents = v.spent, allocated_cents = 8000, period = 'FY2026',
                   resets_on = '2026-12-31'
from (values
  ('wei',5000), ('priya',3500), ('sofia',6000), ('dana',1000),
  ('leah',7500), ('tomas',0),   ('ana',4500),   ('aisha',2000)
) as v(id, spent)
where budgets.employee_id = v.id;

-- 3. Put the claim states back: Sofia's $25 is the one still waiting.
update kudos set status = 'claimed', claimed_at = created_at + interval '1 day',
                 redemption_code = null
 where id between 2 and 12;
update kudos set status = 'unclaimed', claimed_at = null, redemption_code = null
 where id = 1;

-- 4. Confirm. Expect: 30 | 110 | 85 | 25
select (select (allocated_cents - spent_cents)/100 from budgets where employee_id='wei') as wei_left,
       (select sum(amount_cents)/100 from kudos where recipient_id='wei')                as received,
       (select sum(amount_cents)/100 from kudos where recipient_id='wei'
          and status='claimed')                                                          as claimed,
       (select sum(amount_cents)/100 from kudos where recipient_id='wei'
          and status='unclaimed')                                                        as waiting;
