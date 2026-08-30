import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Non-null when the deployment is missing its Supabase env vars. Rendering this
 *  beats a blank white page — createClient() throws at import time otherwise. */
export const configError =
  !url || !key
    ? 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set on this deployment. ' +
      'In Vercel → Settings → Environment Variables, tick Preview as well as ' +
      'Production, then redeploy.'
    : null

export const db = createClient(url ?? 'http://localhost:54321', key ?? 'placeholder')

export type Employee = {
  id: string; name: string; title: string | null; team: string
  initials: string; avatar_color: string; slack_user_id: string | null
}
export type GiftCard = {
  id: string; brand: string; country: string
  min_cents: number; max_cents: number; swatch: string; glyph: string
  image_url?: string | null
}
export type KudosRow = {
  id: number; sender_id: string; recipient_id: string; gift_card_id: string
  amount_cents: number; message: string; followed_preference: boolean
  nudge_id: number | null; status: 'unclaimed' | 'claimed' | 'expired'
  expires_at: string; claimed_at: string | null; created_at: string
  signal_behavior: string | null; signal_values: string[] | null
  signal_specificity: number | null
  sender_name: string; sender_initials: string; sender_color: string
  recipient_name: string; recipient_initials: string; recipient_color: string
  gift_brand: string; gift_swatch: string; gift_glyph: string
}

export const usd = (cents: number) => `$${Math.round(cents / 100)}`
