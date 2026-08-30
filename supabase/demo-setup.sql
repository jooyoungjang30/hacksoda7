-- Demo wiring. Run last, and re-run any time you change your Slack id or email.
-- Everything here is about the person driving the demo, not the dataset.

-- 1. EDIT THESE TWO LINES, then run the file.
--    Slack member id: your avatar -> Profile -> ... -> Copy member ID (starts with U).
update employees set slack_user_id = null;
update employees set slack_user_id = 'U01ABCDEFGH' where id = 'wei';
update employees set email = 'YOUR-EMAIL@example.com';

-- 2. Who appears in the employee Send picker. It lists people who have a budget,
--    so this is also the list of colleagues you can thank on stage. Four Tokyo
--    engineers are included so the cross-border gift is possible at all —
--    without them every recipient is in Austin and "a gift lands in her country"
--    has nowhere to land.
insert into budgets (employee_id, allocated_cents, spent_cents, period, resets_on)
values
  ('yuka-takahashi', 8000, 2500, 'FY2026', '2026-12-31'),
  ('honoka-ogawa',   8000, 1000, 'FY2026', '2026-12-31'),
  ('nanami-suzuki',  8000, 3500, 'FY2026', '2026-12-31'),
  ('hayato-abe',     8000, 4000, 'FY2026', '2026-12-31')
on conflict (employee_id) do nothing;

-- Aya deliberately has NO budget row: she must not appear as a colleague you can
-- thank, because the whole peak of the demo is that nobody has reached her.
delete from budgets where employee_id = 'aya-yoshida';

-- 3. Confirm.
select e.id, e.name, e.office_id,
       (b.allocated_cents - b.spent_cents) / 100 as left_to_give,
       e.slack_user_id is not null as slack_wired
  from budgets b join employees e on e.id = b.employee_id
 order by e.office_id, e.name;
