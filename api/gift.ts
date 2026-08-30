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
      .select('soda_product_id, soda_custom_amount, currency, brand').eq('id', k.gift_card_id).single()
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
        // Budgets are held in USD; SodaGift charges in the product's own currency.
        // Fixed-price cards carry their amount already, so send only the id.
        item: card.soda_custom_amount === false
          ? { id: card.soda_product_id }
          : { id: card.soda_product_id, custom_amount: toNative(k.amount_cents, card.currency) },
        delivery: {
          method: 'EMAIL',
          recipient: { name: to?.name ?? 'Colleague', email },
          sender: { name: k.sender_name },
        },
        message: k.message,
        // Idempotency key. SodaGift rejects anything non-alphanumeric here —
        // a hyphen returns invalid_request, which is easy to miss.
        external_reference_id: `kudos${k.id}`,
      }),
    })

    const json = await order.json()
    if (!order.ok) {
      console.error('sodagift', order.status, json)
      await db.from('kudos')
        .update({ soda_status: `error: ${json.errorCode ?? order.status} ${json.message ?? ''}`.slice(0, 200) })
        .eq('id', k.id)
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
