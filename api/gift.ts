import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const db = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

const BASE = process.env.SODA_API_BASE ?? 'https://biz-sandbox-api.sodagift.com'

/**
 * POST { kudosId } → places a real SodaGift order for that kudos and records the
 * order id. Called after the row is written, never before: a SodaGift outage must
 * not stop someone from sending kudos.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const key = process.env.SODA_API_KEY
  if (!key) return res.status(200).json({ skipped: 'no SODA_API_KEY set' })

  try {
    const { kudosId } = req.body ?? {}
    const { data: k } = await db.from('kudos_feed').select('*').eq('id', kudosId).single()
    if (!k) return res.status(404).json({ error: 'no such kudos' })

    const { data: card } = await db.from('gift_cards')
      .select('soda_product_id, soda_custom_amount, brand').eq('id', k.gift_card_id).single()
    if (!card?.soda_product_id)
      return res.status(200).json({ skipped: `${card?.brand ?? k.gift_card_id} has no soda_product_id` })

    const { data: to } = await db.from('employees')
      .select('name, email').eq('id', k.recipient_id).single()
    const email = to?.email ?? process.env.DEMO_EMAIL
    if (!email) return res.status(200).json({ skipped: 'recipient has no email' })

    const order = await fetch(`${BASE}/v1/orders`, {
      method: 'POST',
      headers: {
        'SODA-API-KEY': key,
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        // GB products take a custom_amount; a few (Deliveroo) are fixed price.
        // Amount is sent as GBP — the app's balance is USD, which is the spec's
        // own open question D, deliberately not solved for the demo.
        item: card.soda_custom_amount === false
          ? { id: card.soda_product_id }
          : { id: card.soda_product_id, custom_amount: k.amount_cents / 100 },
        delivery: {
          method: 'EMAIL',
          recipient: { name: to?.name ?? 'Colleague', email },
          sender: { name: k.sender_name },
        },
        message: k.message,
        // Makes the call idempotent — a retry can't double-send a gift.
        external_reference_id: `kudos-${k.id}`,
      }),
    })

    const json = await order.json()
    if (!order.ok) {
      console.error('sodagift', order.status, json)
      return res.status(200).json({ skipped: `sodagift ${order.status}`, detail: json })
    }

    await db.from('kudos')
      .update({ soda_order_id: json.id, soda_status: json.status })
      .eq('id', k.id)

    res.status(200).json({ ok: true, orderId: json.id, status: json.status, email })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: (e as Error).message })
  }
}
