import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getBudget, getCatalog, getEmployees, getPreferences, markNudgeOpened, sendKudos,
} from '../lib/queries'
import { usd, type Employee, type GiftCard } from '../lib/supabase'
import { resolveCurrentUser } from '../lib/currentUser'

const DENOMS = [500, 1000, 1500, 2000, 2500, 3000]
const MAX_CHARS = 175

type Pref = { rank: number; card: GiftCard }
type Signal = { behavior?: string; values?: string[]; specificity?: number; skipped?: string }

export default function Send() {
  const me = resolveCurrentUser()
  const [params] = useSearchParams()
  const nudgeId = params.get('nudge') ? Number(params.get('nudge')) : null

  const [people, setPeople] = useState<Employee[]>([])
  const [catalog, setCatalog] = useState<GiftCard[]>([])
  const [budget, setBudget] = useState<Awaited<ReturnType<typeof getBudget>> | null>(null)

  const [recipientId, setRecipientId] = useState<string | null>(params.get('to'))
  const [prefs, setPrefs] = useState<Pref[] | null>(null)
  const [browsing, setBrowsing] = useState(false)
  const [giftId, setGiftId] = useState<string | null>(null)
  const [amount, setAmount] = useState(1500)
  const [message, setMessage] = useState('')

  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<{ signal: Signal | null } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getEmployees().then(setPeople).catch(console.error)
    getCatalog().then(setCatalog).catch(console.error)
    getBudget(me).then(setBudget).catch(console.error)
    if (nudgeId) markNudgeOpened(nudgeId).catch(console.error)
  }, [me, nudgeId])

  // The reveal: choosing a person loads their stated top three.
  useEffect(() => {
    if (!recipientId) { setPrefs(null); return }
    setPrefs(null); setGiftId(null); setBrowsing(false)
    getPreferences(recipientId).then(setPrefs).catch(console.error)
  }, [recipientId])

  const left = budget?.left_cents ?? 0
  const recipient = people.find(p => p.id === recipientId) ?? null
  const firstName = recipient?.name.split(' ')[0] ?? ''
  const colleagues = useMemo(() => people.filter(p => p.id !== me), [people, me])
  const affordable = DENOMS.filter(d => d <= left)
  const gift = catalog.find(g => g.id === giftId) ?? null
  const followedPreference = !!prefs?.some(p => p.card.id === giftId)
  const ready = !!(recipientId && giftId && message.trim() && amount > 0 && amount <= left)

  useEffect(() => {
    if (affordable.length && !affordable.includes(amount)) setAmount(affordable.at(-1)!)
  }, [left]) // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    if (!ready || !recipientId || !giftId) return
    setSending(true); setError(null)
    try {
      const { signal } = await sendKudos({
        senderId: me, recipientId, giftCardId: giftId,
        amountCents: amount, message: message.trim(),
        followedPreference, nudgeId,
      })
      setSent({ signal: null })
      const s = (await signal) as Signal | null
      setSent({ signal: s })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    const s = sent.signal
    return (
      <div className="sent">
        <div className="tick">✅</div>
        <h3 style={{ margin: 0, fontSize: 18 }}>
          {usd(amount)} on its way to {firstName}
        </h3>
        <p className="muted" style={{ margin: 0 }}>
          {gift?.brand} · they'll get an email to claim it.
          {followedPreference && ' It was their top pick.'}
        </p>
        <div>
          <div className="lab" style={{ marginBottom: 7 }}>What your company now knows</div>
          {s?.behavior ? (
            <span className="chip">
              <span className="dot" />
              {s.behavior.replace(/_/g, ' ')} · specificity {s.specificity}/5
            </span>
          ) : s === null ? (
            <span className="muted" style={{ fontSize: 12 }}>reading your message…</span>
          ) : (
            <span className="muted" style={{ fontSize: 12 }}>
              Recorded. Signal extraction is off on this deployment.
            </span>
          )}
        </div>
        <div>
          <button className="btn" onClick={() => window.location.assign('/me/send')}>
            Send another
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {nudgeId && (
        <div className="card" style={{ marginBottom: 18, borderColor: '#5B21B6', background: 'var(--violet-25)' }}>
          <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="pill vio">Nudge</span>
            <span style={{ fontSize: 13 }}>
              You still have <b className="tnum">{usd(left)}</b> to give
              {budget && <> — it resets in {budget.days_until_reset} days.</>}
              {firstName && <> {firstName} hasn't been recognised by anyone this quarter.</>}
            </span>
          </div>
        </div>
      )}

      <div className="send-grid">
        <div className="card send-left">
          <div className="card-h"><h3>1 · Who are you thanking?</h3></div>
          <div style={{ padding: '14px 16px' }}>
            <div className="lab" style={{ marginBottom: 9 }}>You worked with recently</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {colleagues.map(p => (
                <button
                  key={p.id}
                  className={'person' + (p.id === recipientId ? ' on' : '')}
                  onClick={() => setRecipientId(p.id)}
                >
                  <span className="av" style={{ background: p.avatar_color }}>{p.initials}</span>
                  <span>
                    <span className="nm">{p.name}</span>
                    <span className="rl" style={{ display: 'block' }}>{p.title}</span>
                  </span>
                  {p.id === recipientId && <span className="ck">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="send-right">
          <div className="card">
            <div className="card-h" style={{ background: '#FBF8FF' }}>
              {recipient && (
                <span className="av" style={{ background: recipient.avatar_color, width: 32, height: 32 }}>
                  {recipient.initials}
                </span>
              )}
              <div>
                <h3>2 · {recipient ? `${firstName}'s top gift card picks` : 'Pick someone first'}</h3>
                {recipient && prefs?.length ? (
                  <span className="sub">
                    Chosen by {firstName} — they're most likely to actually use these
                  </span>
                ) : null}
              </div>
            </div>

            {!recipient ? (
              <div className="empty"><span className="muted">Choose a colleague on the left.</span></div>
            ) : prefs === null ? (
              <div className="empty"><span className="muted">Loading…</span></div>
            ) : prefs.length === 0 || browsing ? (
              <>
                {prefs.length === 0 && (
                  <div className="empty" style={{ borderBottom: '1px solid var(--line-2)' }}>
                    <span className="muted">
                      {firstName} hasn't set preferences yet — pick anything from the catalog.
                    </span>
                  </div>
                )}
                <div className="gifts">
                  {catalog.map(g => (
                    <button
                      key={g.id}
                      className={'gift' + (g.id === giftId ? ' on' : '')}
                      onClick={() => setGiftId(g.id)}
                    >
                      <span className="sw" style={{ background: g.swatch }}>{g.glyph}</span>
                      <div className="nm">{g.brand}</div>
                      <div className="rg">{g.country}</div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="gifts">
                  {prefs.map(({ rank, card }) => (
                    <button
                      key={card.id}
                      className={'gift' + (card.id === giftId ? ' on' : '')}
                      onClick={() => setGiftId(card.id)}
                    >
                      {rank === 1 && <span className="pill vio rk">Their #1</span>}
                      <span className="sw" style={{ background: card.swatch }}>{card.glyph}</span>
                      <div className="nm">{card.brand}</div>
                      <div className="rg">instant email</div>
                    </button>
                  ))}
                </div>
                <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line-2)', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span className="muted" style={{ fontSize: 12 }}>Something else in mind?</span>
                  <button className="btn sm" onClick={() => setBrowsing(true)}>
                    Browse all {catalog.length} gift cards →
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="card">
            <div className="card-h"><h3>3 · Amount and message</h3></div>
            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
                {affordable.map(d => (
                  <button
                    key={d}
                    className={'btn sm' + (d === amount ? ' on' : '')}
                    onClick={() => setAmount(d)}
                  >
                    {usd(d)}
                  </button>
                ))}
                <span className="muted" style={{ marginLeft: 'auto', fontSize: 11.5 }}>
                  Max {usd(left)} — your remaining budget
                </span>
              </div>

              <textarea
                className="field"
                style={{ marginTop: 14 }}
                rows={3}
                maxLength={MAX_CHARS}
                placeholder="What did they actually do?"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>
                {firstName || 'They'} will see this with the gift. {MAX_CHARS - message.length} characters left.
              </div>
            </div>

            <div className="foot">
              <div className="prev">
                <span className="muted">After sending</span>
                <b className="tnum">{usd(left)} → {usd(Math.max(0, left - amount))} left</b>
              </div>
              {error && <span style={{ color: '#B91C1C', fontSize: 12 }}>{error}</span>}
              <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => window.location.assign('/me/overview')}>
                Cancel
              </button>
              <button className="btn pri" disabled={!ready || sending} onClick={submit}>
                {sending ? 'Sending…' : `Send ${usd(amount)}${firstName ? ` to ${firstName}` : ''} →`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
