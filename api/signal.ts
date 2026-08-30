import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'

const db = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

const Signal = z.object({
  behavior: z.enum([
    'cross_team_support', 'mentorship', 'covered_absence',
    'quality_save', 'customer_impact', 'unglamorous_work', 'other',
  ]),
  values: z.array(z.string()),
  specificity: z.number().int().min(1).max(5),
})

/** POST { kudosId } → extracts the signal from the message and patches the row. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  try {
    const { kudosId } = req.body ?? {}
    const { data: k } = await db.from('kudos').select('id, message').eq('id', kudosId).single()
    if (!k) return res.status(404).json({ error: 'no such kudos' })

    if (!process.env.ANTHROPIC_API_KEY)
      return res.status(200).json({ skipped: 'no ANTHROPIC_API_KEY set' })

    const claude = new Anthropic()
    const r = await claude.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 512,
      output_config: { effort: 'low', format: zodOutputFormat(Signal) },
      system:
        'Read one peer recognition message. Extract what the person actually did. ' +
        'Do not infer beyond the text. `specificity` is 1 when the message names no ' +
        'concrete action ("thanks!", "appreciate you") and 5 when it names a specific ' +
        'act, when it happened, and its effect. `values` are 1-3 short lowercase nouns.',
      messages: [{ role: 'user', content: k.message }],
    })

    const s = r.parsed_output
    if (!s) return res.status(200).json({ skipped: 'could not parse' })

    await db.from('kudos').update({
      signal_behavior: s.behavior,
      signal_values: s.values,
      signal_specificity: s.specificity,
    }).eq('id', kudosId)

    res.status(200).json(s)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: (e as Error).message })
  }
}
