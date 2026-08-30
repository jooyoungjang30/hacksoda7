/** Placeholder so no tab 404s during the demo. Replaced at H6 / H8. */
export default function Soon({ what }: { what: string }) {
  return (
    <div className="card" style={{ maxWidth: 460 }}>
      <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <b style={{ fontSize: 14 }}>{what}</b>
        <span className="muted" style={{ fontSize: 12.5 }}>Not built yet.</span>
      </div>
    </div>
  )
}
