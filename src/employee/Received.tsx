import { useEffect, useMemo, useState } from 'react'
import { claimKudos, getEmployees, getReceived } from '../lib/queries'
import { usd, type Employee, type KudosRow } from '../lib/supabase'
import { resolveCurrentUser } from '../lib/currentUser'
import { daysUntil, FISCAL_YEAR } from '../lib/clock'
import { shortDate } from '../lib/format'
import { useToast } from '../components/ui/Toast'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

type StatusFilter = 'all' | 'unclaimed' | 'claimed'

export default function Received() {
  const me = resolveCurrentUser()
  const { showToast } = useToast()

  const [rows, setRows] = useState<KudosRow[] | null>(null)
  const [people, setPeople] = useState<Employee[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [shownCount, setShownCount] = useState(5)

  const [claimTarget, setClaimTarget] = useState<KudosRow | null>(null)
  const [codeTarget, setCodeTarget] = useState<KudosRow | null>(null)
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    getReceived(me).then(setRows).catch(console.error)
    getEmployees().then(setPeople).catch(console.error)
  }, [me])

  const teamOf = useMemo(() => {
    const m = new Map(people.map(p => [p.id, p.team]))
    return (id: string) => m.get(id) ?? ''
  }, [people])

  const total = rows?.reduce((s, r) => s + r.amount_cents, 0) ?? 0
  const claimedRows = rows?.filter(r => r.status === 'claimed') ?? []
  const claimedTotal = claimedRows.reduce((s, r) => s + r.amount_cents, 0)
  const openRows = rows?.filter(r => r.status === 'unclaimed') ?? []
  const openTotal = openRows.reduce((s, r) => s + r.amount_cents, 0)
  const soonest = openRows.length
    ? openRows.reduce((min, r) => (r.expires_at < min.expires_at ? r : min), openRows[0])
    : null

  const filtered = (rows ?? []).filter(r => statusFilter === 'all' || r.status === statusFilter)
  const visible = filtered.slice(0, shownCount)

  async function confirmClaim() {
    if (!claimTarget) return
    setClaiming(true)
    try {
      const code = await claimKudos(claimTarget.id)
      setRows(prev => prev?.map(r => r.id === claimTarget.id
        ? { ...r, status: 'claimed' as const, claimed_at: new Date().toISOString(), redemption_code: code }
        : r) ?? null)
      showToast(`Claimed — code ${code}`)
      setClaimTarget(null)
    } catch (e) {
      showToast('Could not claim: ' + (e as Error).message)
    } finally {
      setClaiming(false)
    }
  }

  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="kpi">
          <div className="lab">Total received</div>
          <div className="big">{usd(total)}</div>
          <div className="sub">{rows?.length ?? 0} kudos from {new Set((rows ?? []).map(r => r.sender_id)).size} colleagues</div>
        </div>

        <div className="kpi">
          <div className="lab">Claimed</div>
          <div className="big">{usd(claimedTotal)}</div>
          <div className="sub">{claimedRows.length} of {rows?.length ?? 0} gift cards redeemed</div>
          <div className="bar"><i className="good" style={{ width: `${rows?.length ? Math.round((claimedRows.length / rows.length) * 100) : 0}%` }} /></div>
        </div>

        <div className="kpi vio">
          <div className="lab">Not yet claimed</div>
          <div className="big">{usd(openTotal)}</div>
          <div className="sub">{soonest ? `expires in ${daysUntil(soonest.expires_at)} days` : 'All caught up'}</div>
          {soonest && (
            <div style={{ marginTop: 11 }}>
              <button className="btn pri sm" onClick={() => setClaimTarget(soonest)}>Claim now</button>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-h">
          <h3>All kudos received</h3>
          <span className="sp" style={{ display: 'flex', gap: 8 }}>
            <span className="btn sm" style={{ opacity: .6, pointerEvents: 'none' }}>FY{FISCAL_YEAR}</span>
            <select
              className="field"
              style={{ width: 'auto', padding: '5px 9px', fontSize: 11.5 }}
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as StatusFilter); setShownCount(5) }}
            >
              <option value="all">All statuses</option>
              <option value="unclaimed">Unclaimed</option>
              <option value="claimed">Claimed</option>
            </select>
          </span>
        </div>

        {rows === null ? (
          <div className="empty"><span className="muted">Loading…</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty"><span className="muted">Nothing here.</span></div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>From</th><th>Gift card</th><th>Message</th>
                <th className="num">Value</th><th>Status</th><th className="num">Received</th>
                <th style={{ width: 132 }} />
              </tr>
            </thead>
            <tbody>
              {visible.map(row => (
                <tr key={row.id} className={row.status === 'unclaimed' ? 'hi' : undefined}>
                  <td>
                    <div className="who-cell">
                      <span className="av" style={{ background: row.sender_color }}>{row.sender_initials}</span>
                      <div><b>{row.sender_name}</b><span className="rl">{teamOf(row.sender_id)}</span></div>
                    </div>
                  </td>
                  <td>{row.gift_brand}</td>
                  <td className="muted" style={{ maxWidth: 230 }}>"{row.message}"</td>
                  <td className="num" style={{ fontWeight: 600 }}>{usd(row.amount_cents)}</td>
                  <td>
                    {row.status === 'unclaimed' ? (
                      <span className="pill vio">Expires {shortDate(row.expires_at)}</span>
                    ) : row.status === 'expired' ? (
                      <span className="pill warn">Expired</span>
                    ) : (
                      <span className="pill good">Claimed</span>
                    )}
                  </td>
                  <td className="num muted">{shortDate(row.created_at)}</td>
                  <td>
                    {row.status === 'unclaimed' ? (
                      <button className="btn pri sm" style={{ whiteSpace: 'nowrap' }} onClick={() => setClaimTarget(row)}>Claim</button>
                    ) : (
                      <button className="btn gh sm" style={{ whiteSpace: 'nowrap' }} onClick={() => setCodeTarget(row)}>View code</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {rows !== null && filtered.length > 0 && (
          <div style={{ padding: '11px 16px', borderTop: '1px solid var(--line-2)', display: 'flex', alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: 11.5 }}>
              Showing {visible.length} of {filtered.length}
            </span>
            {shownCount < filtered.length && (
              <button className="btn sm gh" style={{ marginLeft: 'auto' }} onClick={() => setShownCount(filtered.length)}>
                Show all
              </button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!claimTarget}
        title="Claim this gift card?"
        confirmLabel={claimTarget ? `Claim ${usd(claimTarget.amount_cents)}` : 'Claim'}
        onConfirm={confirmClaim}
        onCancel={() => !claiming && setClaimTarget(null)}
      >
        {claimTarget && (
          <>You're claiming {usd(claimTarget.amount_cents)} · {claimTarget.gift_brand} from {claimTarget.sender_name}.</>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={!!codeTarget}
        title="Redemption code"
        confirmLabel="Done"
        onConfirm={() => setCodeTarget(null)}
        onCancel={() => setCodeTarget(null)}
      >
        {codeTarget && (
          codeTarget.redemption_code ? (
            <div className="field tnum" style={{ textAlign: 'center', fontWeight: 600 }}>
              {codeTarget.redemption_code}
            </div>
          ) : (
            <span>Sent to your email.</span>
          )
        )}
      </ConfirmDialog>
    </>
  )
}
