import { createClient } from '@supabase/supabase-js'

export const db = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export type Employee = {
  id: string; name: string; title: string | null; team: string
  initials: string; avatar_color: string; slack_user_id: string | null
}
export type GiftCard = {
  id: string; brand: string; country: string
  min_cents: number; max_cents: number; swatch: string; glyph: string
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
