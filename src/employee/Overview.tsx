import { useEffect, useState } from 'react'
import { getActivity, getBudget, getPreferences, getReceived } from '../lib/queries'
import { usd, type KudosRow } from '../lib/supabase'
import { resolveCurrentUser } from '../lib/currentUser'
import { daysUntilReset } from '../lib/clock'
import { shortDate } from '../lib/format'
import { GiftMark } from './GiftMark'

type Pref = Awaited<ReturnType<typeof getPreferences>>[number]

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export default function Overview() {
  const me = resolveCurrentUser()

  const [budget, setBudget] = useState<Awaited<ReturnType<typeof getBudget>> | null>(null)
  const [received, setReceived] = useState<KudosRow[] | null>(null)
  const [activity, setActivity] = useState<KudosRow[] | null>(null)
  const [prefs, setPrefs] = useState<Pref[] | null>(null)

  useEffect(() => {
    getBudget(me).then(setBudget).catch(console.error)
    getReceived(me).then(setReceived).catch(console.error)
    getActivity(me).then(setActivity).catch(console.error)
    getPreferences(me).then(setPrefs).catch(console.error)
  }, [me])

  const pct = budget ? Math.round((budget.spent_cents / budget.allocated_cents) * 100) : 0

  const receivedTotal = received?.reduce((s, r) => s + r.amount_cents, 0) ?? 0
  const senderIds = new Set((received ?? []).map(r => r.sender_id))
  const unclaimed = (received ?? []).filter(r => r.status === 'unclaimed')
  const unclaimedTotal = unclaimed.reduce((s, r) => s + r.amount_cents, 0)
  const soonestExpiry = unclaimed.length
    ? unclaimed.reduce((min, r) => (r.expires_at < min ? r.expires_at : min), unclaimed[0].expires_at)
    : null

  const distinctSenders = received
    ? Array.from(new Map(received.map(r => [r.sender_id, r])).values()).slice(0, 4)
    : []
  const extraSenders = senderIds.size - distinctSenders.length

  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="kpi">
          <div className="lab">Left to give</div>
          <div className="big">{budget ? usd(budget.left_cents) : '—'}</div>
          <div className="sub">of your {budget ? usd(budget.allocated_cents) : '—'} for 2026</div>
          <div className="bar"><i style={{ width: `${pct}%` }} /></div>
          <div className="sub" style={{ marginTop: 8 }}>
            <span className="pill warn">{daysUntilReset()} days until it resets</span>
          </div>
        </div>

        <div className="kpi">
          <div className="lab">Received this year</div>
          <div className="big">{usd(receivedTotal)}</div>
          <div className="sub">{received?.length ?? 0} kudos from {senderIds.size} colleagues</div>
          {distinctSenders.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex' }}>
              {distinctSenders.map(r => (
                <span
                  key={r.sender_id}
                  className="av"
                  style={{ background: r.sender_color, marginRight: -7, boxShadow: '0 0 0 2px #fff' }}
                >
                  {r.sender_initials}
                </span>
              ))}
              {extraSenders > 0 && (
                <span className="av" style={{ background: '#E8E5EF', color: '#63687A', boxShadow: '0 0 0 2px #fff' }}>
                  +{extraSenders}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="kpi vio">
          <div className="lab">Waiting to be claimed</div>
          <div className="big">{usd(unclaimedTotal)}</div>
          <div className="sub">
            {unclaimed.length
              ? `${unclaimed.length} gift card${unclaimed.length > 1 ? 's' : ''} · expires ${longDate(soonestExpiry!)}`
              : 'Nothing waiting'}
          </div>
          {unclaimed.length > 0 && (
            <div style={{ marginTop: 13 }}>
              <button className="btn pri sm" onClick={() => window.location.assign('/me/received')}>
                Claim now
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.3fr 1fr', marginTop: 20, alignItems: 'start' }}>
        <div className="card">
          <div className="card-h">
            <h3>Recent activity</h3>
            <span className="sp">
              <button className="btn gh sm" onClick={() => window.location.assign('/me/received')}>
                See all →
              </button>
            </span>
          </div>
          {activity === null ? (
            <div className="empty"><span className="muted">Loading…</span></div>
          ) : activity.length === 0 ? (
            <div className="empty"><span className="muted">No activity yet.</span></div>
          ) : (
            <table className="tbl"><tbody>
              {activity.slice(0, 4).map(row => {
                const isReceived = row.recipient_id === me
                return (
                  <tr key={row.id}>
                    <td style={{ width: 34 }}>
                      <span
                        className="av"
                        style={{ background: isReceived ? row.sender_color : row.recipient_color }}
                      >
                        {isReceived ? row.sender_initials : row.recipient_initials}
                      </span>
                    </td>
                    <td>
                      {isReceived ? (
                        <><b>{row.sender_name}</b> thanked you</>
                      ) : (
                        <>You thanked <b>{row.recipient_name}</b></>
                      )}
                      <br />
                      <span className="muted" style={{ fontSize: 11.5 }}>
                        {isReceived ? `"${row.message}"` : row.gift_brand}
                      </span>
                    </td>
                    <td className="num">
                      <b>{isReceived ? '+' : '−'}{usd(row.amount_cents)}</b><br />
                      <span className={'pill ' + (row.status === 'unclaimed' ? 'vio' : 'good')}>
                        {row.status === 'unclaimed' ? 'Unclaimed' : 'Claimed'}
                      </span>
                    </td>
                    <td className="num muted" style={{ fontSize: 11.5 }}>{shortDate(row.created_at)}</td>
                  </tr>
                )
              })}
            </tbody></table>
          )}
        </div>

        <div className="card">
          <div className="card-h"><h3>Your gift preferences</h3></div>
          <div style={{ padding: '16px 18px' }}>
            <p className="muted" style={{ margin: '0 0 13px', fontSize: 12, lineHeight: 1.5 }}>
              Colleagues see these three first when they send you kudos.
            </p>
            {prefs === null ? (
              <span className="muted" style={{ fontSize: 12 }}>Loading…</span>
            ) : prefs.length === 0 ? (
              <span className="muted" style={{ fontSize: 12 }}>
                You haven't picked any yet — colleagues are guessing.
              </span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {prefs.map(({ rank, card }) => (
                  <div
                    key={card.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      border: '1px solid var(--line-2)', borderRadius: 8, padding: '9px 11px',
                    }}
                  >
                    <b style={{ color: 'var(--violet-700)', width: 12 }}>{rank}</b>
                    <GiftMark card={card} size={56} />
                    <div style={{ fontSize: 12 }}>
                      <b>{card.brand}</b>
                      <div className="muted" style={{ fontSize: 10.5 }}>
                        £{(card.min_cents / 100).toLocaleString('en-GB')}–£{(card.max_cents / 100).toLocaleString('en-GB')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 13 }}>
              <button
                className="btn sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => window.location.assign('/me/preferences')}
              >
                {prefs?.length ? 'Edit preferences' : 'Pick your top 3'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
