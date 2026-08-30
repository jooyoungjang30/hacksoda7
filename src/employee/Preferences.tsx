import { useEffect, useRef, useState } from 'react'
import { getCatalog, getEmployees, getPreferences, savePreferences } from '../lib/queries'
import { type Employee, type GiftCard } from '../lib/supabase'
import { resolveCurrentUser } from '../lib/currentUser'
import { useToast } from '../components/ui/Toast'
import { GiftMark } from './GiftMark'

export default function Preferences() {
  const me = resolveCurrentUser()
  const { showToast } = useToast()

  const [picked, setPicked] = useState<GiftCard[]>([])
  const [catalog, setCatalog] = useState<GiftCard[]>([])
  const [self, setSelf] = useState<Employee | null>(null)
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const dragIndex = useRef(-1)

  useEffect(() => {
    getPreferences(me).then(prefs => setPicked(prefs.map(p => p.card))).catch(console.error)
    getCatalog().then(setCatalog).catch(console.error)
    getEmployees().then(people => setSelf(people.find(p => p.id === me) ?? null)).catch(console.error)
  }, [me])

  async function persist(next: GiftCard[]) {
    setPicked(next)
    try {
      await savePreferences(me, next.map(c => c.id))
      showToast('Preferences saved')
    } catch (e) {
      showToast('Could not save: ' + (e as Error).message)
    }
  }

  function add(card: GiftCard) {
    if (picked.length >= 3 || picked.some(c => c.id === card.id)) return
    persist([...picked, card])
  }

  function remove(id: string) {
    persist(picked.filter(c => c.id !== id))
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= picked.length || from === to) return
    const next = [...picked]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    persist(next)
  }

  const firstName = self?.name.split(' ')[0] ?? ''
  const filtered = catalog.filter(c => c.brand.toLowerCase().includes(query.toLowerCase()))
  const shown = showAll ? filtered : filtered.slice(0, 8)

  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
      <div className="card" style={{ flex: '0 0 400px' }}>
        <div className="card-h">
          <h3>Your top 3</h3>
          <span className="sub" style={{ marginLeft: 'auto' }}>drag to reorder</span>
        </div>
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {picked.map((card, i) => (
            <div
              key={card.id}
              draggable
              onDragStart={() => { dragIndex.current = i }}
              onDragOver={e => e.preventDefault()}
              onDrop={() => move(dragIndex.current, i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                border: '1px solid var(--line-2)', borderRadius: 9, padding: '12px 13px',
                background: i === 0 ? 'var(--violet-25)' : undefined,
              }}
            >
              <span className="muted" style={{ cursor: 'grab' }}>⠿</span>
              <b style={{ color: 'var(--violet-700)', fontSize: 15 }}>{i + 1}</b>
              <GiftMark card={card} size={56} />
              <div style={{ fontSize: 12.5 }}>
                <b>{card.brand}</b>
                <div className="muted" style={{ fontSize: 11 }}>
                  £{(card.min_cents / 100).toLocaleString('en-GB')}–£{(card.max_cents / 100).toLocaleString('en-GB')} · {card.country}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
                <button className="btn sm gh" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up">↑</button>
                <button className="btn sm gh" disabled={i === picked.length - 1} onClick={() => move(i, i + 1)} aria-label="Move down">↓</button>
                <button className="btn sm gh" onClick={() => remove(card.id)}>Remove</button>
              </div>
            </div>
          ))}
          {Array.from({ length: 3 - picked.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 56,
                border: '1px dashed var(--line)', borderRadius: 9, padding: '12px 13px',
                textAlign: 'center', color: 'var(--muted)', fontSize: 12,
              }}
            >
              Empty — pick one from the catalog
            </div>
          ))}
        </div>

        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--line-2)', background: '#FCFBFE' }}>
          <div className="lab" style={{ marginBottom: 10 }}>What colleagues will see</div>
          <div style={{
            border: '1px solid var(--line-2)', borderRadius: 8, padding: '11px 13px',
            background: '#fff', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span className="av" style={{ background: self?.avatar_color }}>{self?.initials}</span>
            <div style={{ fontSize: 12 }}>
              <b>{firstName ? `${firstName}'s top picks` : 'Your top picks'}</b>
              <div className="muted" style={{ fontSize: 11 }}>
                {picked.length ? picked.map(c => c.brand).join(' · ') : 'Nothing yet — colleagues will see the full catalog.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ flex: 1 }}>
        <div className="card-h">
          <h3>Add from catalog</h3>
          <span className="sp" style={{ display: 'flex', gap: 8 }}>
            <span className="btn sm" style={{ opacity: .6, pointerEvents: 'none' }}>🌍 United Kingdom</span>
            <input
              className="field"
              style={{ width: 150, padding: '5px 9px', fontSize: 11.5 }}
              placeholder="🔍 Search…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </span>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', padding: '16px 18px' }}>
          {shown.map(card => {
            const rank = picked.findIndex(c => c.id === card.id)
            const isPicked = rank !== -1
            const atLimit = picked.length >= 3
            const disabled = isPicked || atLimit
            return (
              <button
                key={card.id}
                onClick={() => add(card)}
                disabled={disabled}
                style={{
                  border: '1px solid var(--line-2)', borderRadius: 9, padding: 12,
                  textAlign: 'left', background: '#fff', opacity: disabled ? .5 : 1,
                  cursor: disabled ? 'default' : 'pointer',
                }}
              >
                <GiftMark card={card} size={56} />
                <div style={{ marginTop: 9, fontSize: 12, fontWeight: 600 }}>{card.brand}</div>
                <div className="muted" style={{ fontSize: 10.5 }}>
                  {isPicked ? `Already #${rank + 1}` : `£${(card.min_cents / 100).toLocaleString('en-GB')}–£${(card.max_cents / 100).toLocaleString('en-GB')}`}
                </div>
              </button>
            )
          })}
        </div>
        <div style={{ padding: '11px 18px', borderTop: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="muted" style={{ fontSize: 11.5 }}>
            Showing {shown.length} of {filtered.length} · same catalog as Create order
          </span>
          {picked.length >= 3 && (
            <span className="muted" style={{ fontSize: 11.5, marginLeft: 'auto' }}>Remove one to add another</span>
          )}
          {!showAll && filtered.length > 8 && (
            <button className="btn sm gh" style={{ marginLeft: picked.length >= 3 ? 0 : 'auto' }} onClick={() => setShowAll(true)}>
              Show all
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
