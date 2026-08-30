import { db } from './supabase'
import { mockKudos } from '../mock/kudos'

/**
 * Bridges the employee half (Supabase, short ids) into the HR half (his authored
 * dataset, kebab ids). His comment on mockKudos is the whole reason this works:
 * "the only authored data — everything else is derived from this array."
 * Append to it and the KPIs, leaderboard, claim table and network map all move.
 */
const ID_MAP: Record<string, string> = {
  wei: 'wei-chen',
  priya: 'priya-raman',
  sofia: 'sofia-marchetti',
  dana: 'dana-whitfield',
  leah: 'leah-osborne',
  tomas: 'tomas-iglesias',
  ana: 'ana-duarte',
  aisha: 'aisha-nkemdi',
}

/** seed.sql owns ids 1-12. Anything above it happened during the demo. */
const SEEDED_MAX_ID = 12
const LIVE_PREFIX = 'live-'

export async function hydrateLiveKudos(): Promise<number> {
  const { data, error } = await db
    .from('kudos_feed')
    .select('*')
    .gt('id', SEEDED_MAX_ID)
    .order('created_at')

  if (error) {
    console.error('live kudos:', error.message)
    return 0
  }

  // Remove rows a previous hydration added — StrictMode runs effects twice.
  for (let i = mockKudos.length - 1; i >= 0; i--) {
    if (mockKudos[i].id.startsWith(LIVE_PREFIX)) mockKudos.splice(i, 1)
  }

  let added = 0
  for (const row of data ?? []) {
    const fromId = ID_MAP[row.sender_id]
    const toId = ID_MAP[row.recipient_id]
    if (!fromId || !toId) continue // not part of the HR dataset

    const brand = String(row.gift_brand ?? 'Gift')
    mockKudos.push({
      id: LIVE_PREFIX + row.id,
      fromId,
      toId,
      amountCents: row.amount_cents,
      giftCardName: /gift card/i.test(brand) ? brand : `${brand} Gift Card`,
      message: row.message,
      sentAt: String(row.created_at).slice(0, 10),
      claimedAt: row.claimed_at ? String(row.claimed_at).slice(0, 10) : null,
      expiresAt: String(row.expires_at).slice(0, 10),
    })
    added++
  }
  return added
}
