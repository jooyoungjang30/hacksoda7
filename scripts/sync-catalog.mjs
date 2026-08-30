/**
 * Fetches the real SodaGift sandbox catalog and prints SQL to replace gift_cards.
 *
 *   SODA_API_KEY=sodagift_test_xxx node scripts/sync-catalog.mjs KR
 *
 * Paste the output into the Supabase SQL editor. Run with no country to see the
 * raw shape of the first product, which is useful if the mapping below drifts.
 */
const KEY = process.env.SODA_API_KEY
const COUNTRY = process.argv[2] ?? 'KR'
const BASE = 'https://biz-sandbox-api.sodagift.com'

if (!KEY) { console.error('set SODA_API_KEY'); process.exit(1) }

const res = await fetch(`${BASE}/v1/products?country_code=${COUNTRY}&page=0&size=40`, {
  headers: { 'SODA-API-KEY': KEY, accept: 'application/json' },
})
if (!res.ok) { console.error(res.status, await res.text()); process.exit(1) }

const body = await res.json()
const list = Array.isArray(body) ? body : (body.products ?? body.content ?? body.data ?? [])

if (process.argv[3] === '--raw' || list.length === 0) {
  console.error('--- first product, raw ---')
  console.error(JSON.stringify(list[0] ?? body, null, 2).slice(0, 2000))
  if (list.length === 0) process.exit(1)
}

const orderable = list.filter(p =>
  (p.availability ?? 'ON_SALE') === 'ON_SALE' &&
  String(p.available_delivery_method ?? p.availableDeliveryMethod ?? 'EMAIL').includes('EMAIL')
).slice(0, 12)

const esc = s => String(s ?? '').replace(/'/g, "''")
const SWATCH = ['#232F3E','#6C1F3A','#1F1F1F','#111111','#7B2D8E','#78BE20',
                '#000000','#05204A','#E31837','#00CCBC','#0F766E','#B45309']

const rows = orderable.map((p, i) => {
  const name  = p.name ?? p.brand ?? p.title ?? `Product ${p.id}`
  const fixed = p.amount ?? null
  const min   = p.min_amount ?? p.minAmount ?? fixed ?? 0
  const max   = p.max_amount ?? p.maxAmount ?? fixed ?? 0
  const id    = `soda-${p.id}`
  return `  ('${esc(id)}', '${esc(name)}', '${esc(COUNTRY)}', ` +
         `${Math.round(min * 100)}, ${Math.round(max * 100)}, ` +
         `'${SWATCH[i % SWATCH.length]}', '${esc(name.trim()[0] ?? '🎁')}', ${p.id})`
})

console.log(`-- ${orderable.length} orderable products from the ${COUNTRY} sandbox catalog
delete from gift_preferences;
delete from gift_cards where id not in (select distinct gift_card_id from kudos);

insert into gift_cards (id, brand, country, min_cents, max_cents, swatch, glyph, soda_product_id) values
${rows.join(',\n')}
on conflict (id) do update set soda_product_id = excluded.soda_product_id;

-- Re-point everyone's top three at real products.
insert into gift_preferences (employee_id, rank, gift_card_id)
select e.id, g.rn, g.id from employees e
cross join lateral (
  select id, row_number() over (order by md5(id || e.id)) as rn
  from gift_cards where soda_product_id is not null limit 3
) g
on conflict do nothing;`)
