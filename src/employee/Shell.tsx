import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getBudget, getEmployees } from '../lib/queries'
import { usd, type Employee } from '../lib/supabase'
import { resolveCurrentUser, setCurrentUser } from '../lib/currentUser'

const TABS = [
  ['overview', 'Overview'],
  ['send', 'Send Kudos'],
  ['preferences', 'My Preferences'],
  ['received', 'Received'],
] as const

export default function Shell() {
  const me = resolveCurrentUser()
  const [people, setPeople] = useState<Employee[]>([])
  const [budget, setBudget] = useState<Awaited<ReturnType<typeof getBudget>> | null>(null)

  useEffect(() => {
    getEmployees().then(setPeople).catch(console.error)
    getBudget(me).then(setBudget).catch(console.error)
  }, [me])

  const self = people.find(p => p.id === me)
  const pct = budget ? Math.round((budget.spent_cents / budget.allocated_cents) * 100) : 0

  return (
    <div className="shell">
      <aside className="side">
        <div className="logo">
          <i>🎁</i>
          <div><b>SodaGift</b><span>for Biz</span></div>
        </div>
        <hr />

        <div className="wallet">
          <b>{self?.name ?? '…'}</b>
          <span>{self?.team ?? ''}</span>
          {budget && (
            <>
              <div className="amt tnum">
                {usd(budget.left_cents)} <small>left to give</small>
              </div>
              <div className="bar"><i style={{ width: `${pct}%` }} /></div>
              <div className="sub">
                {usd(budget.spent_cents)} of {usd(budget.allocated_cents)} used ·
                resets in {budget.days_until_reset} days
              </div>
            </>
          )}
        </div>

        <NavLink to="/me/overview" className="nav-i on"><em>♡</em> My Kudos</NavLink>
        <span className="nav-i off"><em>▦</em> Order history</span>
        <span className="nav-i off"><em>⚙</em> Setting</span>

        <select
          className="who-switch"
          value={me}
          onChange={e => setCurrentUser(e.target.value)}
          aria-label="Switch person"
        >
          {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </aside>

      <main className="main">
        <div className="top"><h2>My Kudos</h2></div>
        <nav className="tabs">
          {TABS.map(([slug, label]) => (
            <NavLink
              key={slug}
              to={`/me/${slug}`}
              className={({ isActive }) => 'tab' + (isActive ? ' on' : '')}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="body"><Outlet /></div>
      </main>
    </div>
  )
}
