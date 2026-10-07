'use client'

// Volunteer weekly availability (Batch 3, item 3). Volunteers publish the recurring
// windows they can help; org admins see the aggregate as coverage gaps.
import { useCallback, useEffect, useState } from 'react'

type Shift = { id: string; day_of_week: number; start_time: string; end_time: string }

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function VolunteerAvailability() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loaded, setLoaded] = useState(false)
  const [dow, setDow] = useState(1)
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('12:00')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/volunteer/shifts')
    const json = await res.json().catch(() => ({ shifts: [] }))
    setShifts(json.shifts ?? [])
    setLoaded(true)
  }, [])

  useEffect(() => { load() }, [load])

  async function add() {
    setBusy(true); setErr('')
    const res = await fetch('/api/volunteer/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_of_week: dow, start_time: start, end_time: end }),
    })
    setBusy(false)
    if (res.ok) { load() }
    else { const j = await res.json().catch(() => ({ error: 'Error' })); setErr(j.error ?? 'Could not add that window.') }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/volunteer/shifts?id=${id}`, { method: 'DELETE' })
    if (res.ok) setShifts(prev => prev.filter(s => s.id !== id))
  }

  const sel: React.CSSProperties = { height: '44px', padding: '0 12px', border: '1.5px solid #D4CFC8', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px' }

  return (
    <div style={{ marginTop: '32px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '6px' }}>My weekly availability</h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
        Let the coordinators know when you can usually help. They use this to see where more volunteers are needed.
      </p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
        <select value={dow} onChange={e => setDow(Number(e.target.value))} style={sel}>
          {DAYS.map((d: any, i: number) => <option key={d} value={i}>{d}</option>)}
        </select>
        <input type="time" value={start} onChange={e => setStart(e.target.value)} style={sel} />
        <span style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>to</span>
        <input type="time" value={end} onChange={e => setEnd(e.target.value)} style={sel} />
        <button onClick={add} disabled={busy}
          style={{ height: '44px', padding: '0 20px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, cursor: busy ? 'wait' : 'pointer' }}>
          Add window
        </button>
      </div>
      {err && <p role="alert" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#D62828', marginBottom: '10px' }}>{err}</p>}

      {!loaded ? (
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>Loading…</p>
      ) : shifts.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>No availability set yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {shifts.map((s: any) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 16px', backgroundColor: 'rgba(26,122,106,0.06)', borderRadius: '10px' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-navy)' }}>
                <strong>{DAYS[s.day_of_week]}</strong> · {s.start_time}–{s.end_time}
              </span>
              <button onClick={() => remove(s.id)}
                style={{ background: 'none', border: '1px solid #D4CFC8', borderRadius: '7px', padding: '5px 12px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
