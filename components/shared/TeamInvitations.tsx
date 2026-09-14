'use client'

// Reusable "invite a teammate" panel. The parent passes the list of roles the
// signed-in user is allowed to invite (derived server-side from INVITABLE_BY).
import { useCallback, useEffect, useState } from 'react'
import { ROLE_LABEL } from '@/lib/roles'
import type { UserRole } from '@/lib/auth'

type Invitation = {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  expires_at: string
  invited_by_name: string | null
  note: string | null
}

export default function TeamInvitations({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<string>(allowedRoles[0] ?? '')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [invites, setInvites] = useState<Invitation[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/invitations')
    const json = await res.json().catch(() => ({ invitations: [] }))
    setInvites(json.invitations ?? [])
    setLoaded(true)
  }, [])

  useEffect(() => { load() }, [load])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), role, note: note.trim() || undefined }),
    })
    const json = await res.json().catch(() => ({ error: 'Error' }))
    setBusy(false)
    if (res.ok) {
      setMsg({ kind: 'ok', text: `Invitation sent to ${email.trim()}.` })
      setEmail(''); setNote('')
      load()
    } else {
      setMsg({ kind: 'err', text: json.error ?? 'Could not send the invitation.' })
    }
  }

  async function revoke(id: string) {
    const res = await fetch(`/api/invitations/${id}`, { method: 'DELETE' })
    if (res.ok) setInvites(prev => prev.map(i => i.id === id ? { ...i, status: 'revoked' } : i))
  }

  const input: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', height: '46px', padding: '0 12px',
    border: '1.5px solid #D4CFC8', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px',
  }
  const pending = invites.filter(i => i.status === 'pending')
  const past = invites.filter(i => i.status !== 'pending')

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid #E8E4DC', borderRadius: '14px', padding: '24px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '4px' }}>
        Invite a teammate
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
        They get an email link to set a password. Their account opens with the right role and access already set up.
      </p>

      <form onSubmit={send} style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr', maxWidth: '520px' }}>
        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
          <input type="email" required placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} style={input} />
          <select value={role} onChange={e => setRole(e.target.value)} style={input}>
            {allowedRoles.map(r => <option key={r} value={r}>{ROLE_LABEL[r] ?? r}</option>)}
          </select>
        </div>
        <input placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} style={input} />
        <button type="submit" disabled={busy || !role}
          style={{ justifySelf: 'start', padding: '10px 22px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '9px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, cursor: busy ? 'wait' : 'pointer' }}>
          {busy ? 'Sending…' : 'Send invitation'}
        </button>
      </form>

      {msg && (
        <p role="status" style={{ marginTop: '12px', fontFamily: 'var(--font-body)', fontSize: '14px', color: msg.kind === 'ok' ? 'var(--color-teal)' : '#D62828' }}>
          {msg.text}
        </p>
      )}

      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color: 'var(--color-navy)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
          Pending ({pending.length})
        </h3>
        {!loaded ? (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Loading…</p>
        ) : pending.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>No pending invitations.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pending.map(i => (
              <div key={i.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 14px', backgroundColor: '#F9F6F0', borderRadius: '9px' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-navy)' }}>
                  {i.email} · <strong>{ROLE_LABEL[i.role as UserRole] ?? i.role}</strong>
                </span>
                <button onClick={() => revoke(i.id)}
                  style={{ background: 'none', border: '1px solid #D4CFC8', borderRadius: '7px', padding: '5px 12px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}

        {past.length > 0 && (
          <details style={{ marginTop: '14px' }}>
            <summary style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
              {past.length} past invitation{past.length === 1 ? '' : 's'}
            </summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
              {past.map(i => (
                <span key={i.id} style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {i.email} · {ROLE_LABEL[i.role as UserRole] ?? i.role} · {i.status}
                </span>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
