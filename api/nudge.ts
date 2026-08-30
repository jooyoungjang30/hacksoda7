import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const db = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)
const APP = (process.env.APP_URL ?? '').replace(/\/$/, '')

async function slack(method: string, body: Record<string, unknown>) {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token)
    throw new Error(
      'SLACK_BOT_TOKEN is not set on this deployment. Add it in Vercel → ' +
      'Settings → Environment Variables (Production), then REDEPLOY — env ' +
      'changes do not apply to existing deployments.'
    )
  if (!token.startsWith('xoxb-'))
    throw new Error(
      `SLACK_BOT_TOKEN should start with "xoxb-" but starts with ` +
      `"${token.slice(0, 5)}" (length ${token.length}). You want the ` +
      `"Bot User OAuth Token" from OAuth & Permissions, not the signing ` +
      `secret or an app-level "xapp-" token.`
    )

  const r = await fetch(`https://slack.com/api/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  })
  const json = (await r.json()) as { ok: boolean; error?: string; ts?: string } & Record<string, unknown>
  if (!json.ok) throw new Error(`slack.${method}: ${json.error}`)
  return json
}

const usd = (cents: number) => `$${Math.round(cents / 100)}`

/**
 * POST { targetId, suggestedTo }  → sends the nudge DM, returns the landing URL
 * POST { kudosId }                → posts the ✅ reply into the same thread
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  try {
    const body = req.body ?? {}

    // POST {"debug":true} → asks Slack who this deployment's token belongs to.
    if (body.debug) {
      const who = await slack('auth.test', {})
      return res.status(200).json({ ok: true, team: who.team, bot: who.user })
    }

    res.status(200).json(body.kudosId ? await confirm(body.kudosId) : await send(body))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: (e as Error).message })
  }
}

async function send({ targetId = 'wei', suggestedTo = 'priya' }) {
  if (!/^https?:\/\//.test(APP))
    throw new Error(
      `APP_URL is "${APP || 'unset'}" — Slack rejects a button whose url is not ` +
      `absolute. Set APP_URL to your https://….vercel.app URL in Vercel ` +
      `(Production), then redeploy.`
    )

  const { data: target } = await db.from('employees').select('*').eq('id', targetId).single()
  const { data: budget } = await db.from('budgets').select('*').eq('employee_id', targetId).single()
  const { data: sug } = await db.from('employees').select('*').eq('id', suggestedTo).single()

  if (!target) throw new Error(`no employee '${targetId}'`)
  if (!target.slack_user_id)
    throw new Error(`'${targetId}' has no slack_user_id — set it in the employees table`)

  const left = budget!.allocated_cents - budget!.spent_cents
  const days = Math.round((+new Date(budget!.resets_on) - Date.now()) / 86_400_000)

  const { data: nudge, error } = await db.from('nudges').insert({
    kind: 'unused_budget',
    target_id: targetId,
    suggested_to: suggestedTo,
    reason: `${usd(left)} unspent, ${days} days left`,
  }).select().single()
  if (error) throw error

  const url = `${APP}/me/send?nudge=${nudge.id}&as=${targetId}&to=${suggestedTo}`

  const posted = await slack('chat.postMessage', {
    channel: target.slack_user_id,
    text: `You still have ${usd(left)} left to give`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `*${target.name.split(' ')[0]}* — *${usd(left)}* of your ` +
            `${usd(budget!.allocated_cents)} for 2026 is still unspent, and ` +
            `there are ${days} days left before it resets.\n` +
            `${sug!.name} hasn't been recognised by anyone this quarter.`,
        },
      },
      {
        type: 'actions',
        elements: [{
          type: 'button',
          style: 'primary',
          text: { type: 'plain_text', text: `Send kudos to ${sug!.name.split(' ')[0]}` },
          url,
        }],
      },
    ],
  })

  await db.from('nudges')
    .update({ slack_ok: true, slack_ts: posted.ts })
    .eq('id', nudge.id)

  return { nudgeId: nudge.id, url }
}

async function confirm(kudosId: number) {
  const { data: k } = await db.from('kudos_feed').select('*').eq('id', kudosId).single()
  if (!k?.nudge_id) return { skipped: 'kudos did not come from a nudge' }

  const { data: n } = await db.from('nudges').select('*').eq('id', k.nudge_id).single()
  if (!n?.slack_ts) return { skipped: 'no slack thread to reply into' }

  const { data: target } = await db.from('employees')
    .select('slack_user_id').eq('id', n.target_id).single()

  await db.from('nudges').update({ fulfilled_kudos_id: kudosId }).eq('id', n.id)

  const signal = k.signal_behavior ? ` · ${String(k.signal_behavior).replace(/_/g, ' ')}` : ''
  await slack('chat.postMessage', {
    channel: target!.slack_user_id,
    thread_ts: n.slack_ts,
    text: `✅ ${k.sender_name} recognised ${k.recipient_name} · ` +
          `${usd(k.amount_cents)} · ${k.gift_brand}${signal}`,
  })

  return { ok: true }
}
