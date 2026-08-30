-- Repairs the duplicated demo_watermark rows, then locks the table so it can
-- only ever hold one. Run once. The earliest watermark is the correct one --
-- later ones were captured after rehearsal kudos already existed.

do $$
declare v bigint;
begin
  select min(max_kudos_id) into v from demo_watermark;
  drop table demo_watermark;
  create table demo_watermark (
    id           int primary key default 1 check (id = 1),
    max_kudos_id bigint not null
  );
  insert into demo_watermark (id, max_kudos_id) values (1, coalesce(v, 0));
end $$;

select * from demo_watermark;   -- exactly one row, ~199
