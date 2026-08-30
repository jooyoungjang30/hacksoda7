import { db, type Employee, type GiftCard, type KudosRow } from './supabase'

/**
 * Only people with a budget row — i.e. the eight in seed.sql. The HR dataset adds
 * ~39 more employees for the dashboard; they have no allowance, so listing them
 * here would both break the sidebar and bury the mockup's "recently worked with".
 */
export async function getEmployees() {
  const { data: budgeted, error: bErr } = await db.from('budgets').select('employee_id')
  if (bErr) throw bErr
  const ids = (budgeted ?? []).map((b: { employee_id: string }) => b.employee_id)

  const { data, error } = await db.from('employees').select('*').in('id', ids).order('name')
  if (error) throw error
  return data as Employee[]
}

export async function getBudget(employeeId: string) {
  const { data, error } = await db.from('budgets').select('*')
    .eq('employee_id', employeeId).single()
  if (error) throw error
  const left = data.allocated_cents - data.spent_cents
  const days = Math.round((+new Date(data.resets_on) - Date.now()) / 86_400_000)
  return { ...data, left_cents: left, days_until_reset: days }
}

/** The reveal. Returns [] when they haven't set any — that's the spec's empty state. */
export async function getPreferences(employeeId: string) {
  const { data, error } = await db.from('gift_preferences')
    .select('rank, gift_cards(*)').eq('employee_id', employeeId).order('rank')
  if (error) throw error
  return (data ?? []).map((r: { rank: number; gift_cards: unknown }) =>
    ({ rank: r.rank, card: r.gift_cards as GiftCard }))
}

export async function getCatalog() {
  const { data, error } = await db.from('gift_cards').select('*').order('brand')
  if (error) throw error
  return data as GiftCard[]
}

export async function getReceived(employeeId: string) {
  const { data, error } = await db.from('kudos_feed').select('*')
    .eq('recipient_id', employeeId).order('created_at', { ascending: false })
  if (error) throw error
  return data as KudosRow[]
}

export async function getActivity(employeeId: string) {
  const { data, error } = await db.from('kudos_feed').select('*')
    .or(`sender_id.eq.${employeeId},recipient_id.eq.${employeeId}`)
    .order('created_at', { ascending: false }).limit(8)
  if (error) throw error
  return data as KudosRow[]
}

/**
 * The one write that matters. Inserts the kudos, spends the budget, closes the
 * nudge in Slack, and kicks off signal extraction — neither of which is allowed
 * to break the send if it fails.
 */
export async function sendKudos(input: {
  senderId: string; recipientId: string; giftCardId: string
  amountCents: number; message: string
  followedPreference: boolean; nudgeId?: number | null
}) {
  const { data: kudos, error } = await db.from('kudos').insert({
    sender_id: input.senderId,
    recipient_id: input.recipientId,
    gift_card_id: input.giftCardId,
    amount_cents: input.amountCents,
    message: input.message,
    followed_preference: input.followedPreference,
    nudge_id: input.nudgeId ?? null,
  }).select().single()
  if (error) throw error

  const budget = await getBudget(input.senderId)
  await db.from('budgets')
    .update({ spent_cents: budget.spent_cents + input.amountCents })
    .eq('employee_id', input.senderId)

  // Fire and forget, all of them. A dead key or a SodaGift outage must never
  // block a send on stage — the kudos is already committed above.
  fetch('/api/gift', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kudosId: kudos.id }),
  }).catch(() => {})

  const signal = fetch('/api/signal', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kudosId: kudos.id }),
  }).then(r => r.json()).catch(() => null)

  if (input.nudgeId) {
    fetch('/api/nudge', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kudosId: kudos.id }),
    }).catch(() => {})
  }

  return { kudos: kudos as KudosRow, signal }
}

export async function markNudgeOpened(nudgeId: number) {
  await db.from('nudges').update({ opened_at: new Date().toISOString() }).eq('id', nudgeId)
}

export async function claimKudos(kudosId: number) {
  const code = 'SG-' + Math.random().toString(36).slice(2, 8).toUpperCase()
  const { error } = await db.from('kudos')
    .update({ status: 'claimed', claimed_at: new Date().toISOString(), redemption_code: code })
    .eq('id', kudosId)
  if (error) throw error
  return code
}
