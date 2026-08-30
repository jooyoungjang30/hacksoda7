import json, datetime
p = json.load(open('/tmp/vega_people.json')); k = json.load(open('/tmp/vega_kudos.json'))
people, K = p['people'], k['K']
KEEP = {'wei','priya','sofia','dana','leah','tomas','ana','aisha'}
esc = lambda s: str(s or '').replace("'", "''")
q = lambda s: 'null' if s is None else f"'{esc(s)}'"

TEAMS = {'engineering':'Engineering','product':'Product','design':'Design','sales':'Sales',
         'marketing':'Marketing','support':'Support','people-ops':'People Ops','finance':'Finance'}
COLORS = {'engineering':'#7C3AED','product':'#2563EB','design':'#0D9488','sales':'#DB6D0B',
          'marketing':'#9333EA','support':'#0891B2','people-ops':'#059669','finance':'#64748B'}

out = ["""-- Vega — the company in the demo script. 200 people, Austin + Tokyo, 90 days.
--
--   budget spent 61%  ·  claim rate 86%  ·  171 of 200 have sent at least one
--   coverage: Austin 150/170 (88%), Tokyo 6/30 (20%)
--   4 thank-yous reached Tokyo in 90 days, 3 of them from one Austin engineer
--   Aya Yoshida — QA, Tokyo, 14 months: gave 11, received 0
--   Daniel Reyes — 14 reports, 4 in Tokyo, every kudos he sent stayed in Austin
--
-- Replaces the Lumen Labs dataset. The eight seeded employees (wei, priya, ...)
-- keep their ids so Send, Slack, budgets and SodaGift keep working unchanged.
-- Run after supabase/offices.sql.

begin;

-- Break the self-referencing manager FK first: a kept employee may point at
-- someone in the old dataset, and that row is about to disappear.
update employees set manager_id = null;

delete from kudos where id > 12;                       -- HR history only; seed 1-12 stays
delete from gift_preferences where employee_id not in ('wei','priya','sofia','dana','leah','tomas','ana','aisha');
delete from budgets          where employee_id not in ('wei','priya','sofia','dana','leah','tomas','ana','aisha');
delete from employees        where id not in ('wei','priya','sofia','dana','leah','tomas','ana','aisha');

insert into teams (id, name, color) values"""]
out.append(',\n'.join(f"  ('{t}', '{n}', '{COLORS[t]}')" for t, n in TEAMS.items())
           + "\non conflict (id) do update set color = excluded.color;\n")

# employees: update the eight, insert the rest
upd, ins = [], []
for e in people:
    row = (f"'{e['id']}', '{esc(e['name'])}', '{esc(e['title'])}', '{TEAMS[e['team']]}', "
           f"'{e['team']}', '{e['initials']}', '{e['color']}', {q(e['manager'])}, "
           f"'{e['office']}', '{e['start']}', true")
    if e['id'] in KEEP:
        upd.append(f"update employees set team = '{TEAMS[e['team']]}', team_id = '{e['team']}', "
                   f"office_id = '{e['office']}', started_at = '{e['start']}', "
                   f"manager_id = {q(e['manager'])} where id = '{e['id']}';")
    else:
        ins.append(f"  ({row})")

out.append("""insert into employees
  (id, name, title, team, team_id, initials, avatar_color, manager_id, office_id, started_at, slack_linked)
values""")
out.append(',\n'.join(ins) + "\non conflict (id) do nothing;\n")
out.append("-- The eight who already existed keep their ids; only org data is refreshed.")
out.extend(upd)
out.append("")

out.append("""insert into kudos
  (sender_id, recipient_id, gift_card_id, amount_cents, message, status, created_at, expires_at, claimed_at)
values""")
MSGS = ["Covered my on-call at short notice.","Caught a regression before it shipped.",
        "Walked me through the deploy pipeline end to end.","Stayed late to unblock the release.",
        "Rewrote the runbook so the next person doesn't suffer.","Handled the escalation calmly.",
        "Took the handover notes seriously — saved my morning.","Reviewed my PR properly, not just LGTM.",
        "Picked up the ticket nobody wanted.","Explained the billing edge case twice, patiently.",
        "Kept the customer informed through the whole incident.","Spotted the data issue before the report went out.",
        "Onboarded the new hire without being asked.","Fixed the flaky test that had been ignored for months.",
        "Made the launch checklist actually usable.","Triaged the overnight queue before standup."]
rows = []
for i, x in enumerate(K):
    sent = x['d']
    exp = (datetime.date.fromisoformat(sent) + datetime.timedelta(days=60)).isoformat()
    claimed = (datetime.date.fromisoformat(sent) + datetime.timedelta(days=2)).isoformat() if x['claimed'] else None
    rows.append(f"  ('{x['f']}', '{x['t']}', '{x['c']}', {x['a']}, '{esc(MSGS[i % len(MSGS)])}', "
                f"'{'claimed' if x['claimed'] else 'unclaimed'}', '{sent}', '{exp}', {q(claimed)})")
out.append(',\n'.join(rows) + ';\n')

out.append("""-- Reset the rehearsal watermark to sit above this dataset, creating it if
-- fix-watermark.sql was never run.
create table if not exists demo_watermark (
  id           int primary key default 1 check (id = 1),
  max_kudos_id bigint not null
);
delete from demo_watermark;
insert into demo_watermark (id, max_kudos_id) select 1, coalesce(max(id), 0) from kudos;

commit;

select (select count(*) from employees)                        as people,
       (select count(*) from employees where office_id='tokyo') as tokyo,
       (select count(*) from kudos)                             as kudos,
       (select max_kudos_id from demo_watermark)                as watermark;""")

open('supabase/vega-dataset.sql','w').write('\n'.join(out))
print('supabase/vega-dataset.sql')
