'use client'

// Opt-in community directory. Shows the viewer's own listing toggle + short bio,
// and a searchable list of fellow members of the same community organization who
// have opted in. Backed by /api/directory.
import { useCallback, useEffect, useState } from 'react'

type DirMember = {
  id: string
  name: string
  city: string | null
  state: string | null
  bio: string | null
  interests: string[]
}

const card: React.CSSProperties = { backgroundColor: 'white', border: '1px solid #E8E4DC', borderRadius: '14px', padding: '22px' }
const input: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1.5px solid #D4CFC8',
  borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px',
}

export default function DirectoryClient() {
  const [loaded, setLoaded] = useState(false)
  const [inOrg, setInOrg] = useState(false)
  const [optedIn, setOptedIn] = useState(false)
  const [bio, setBio] = useState('')
  const [savedBio, setSavedBio] = useState('')
  const [members, setMembers] = useState<DirMember[]>([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async (query = '') => {
    const res = await fetch(`/api/directory${query ? `?q=${encodeURIComponent(query)}` : ''}`)
    const json = await res.json().catch(() => ({ me: { opted_in: false, bio: '' }, members: [], in_org: false }))
    setInOrg(!!json.in_org)
    setOptedIn(!!json.me?.opted_in)
    setBio(json.me?.bio ?? '')
    setSavedBio(json.me?.bio ?? '')
    setMembers(json.members ?? [])
    setLoaded(true)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveSetting(nextOptedIn: boolean, nextBio: string) {
    setBusy(true)
    setMsg('')
    const res = await fetch('/api/directory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directory_opt_in: nextOptedIn, directory_bio: nextBio }),
    })
    setBusy(false)
    if (res.ok) {
      setOptedIn(nextOptedIn)
      setSavedBio(nextBio)
      setMsg(nextOptedIn ? 'You are now listed in the directory.' : 'You have been removed from the directory.')
      load(q)
    } else {
      const j = await res.json().catch(() => ({ error: 'Error' }))
      setMsg(j.error ?? 'Could not save your preference.')
    }
    setTimeout(() => setMsg(''), 4000)
  }

  if (!loaded) return <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>Loading…</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Your listing */}
      <div style={card}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '4px' }}>Your listing</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
          {inOrg
            ? 'Choose whether other members of your organization can see a short profile for you.'
            : 'Join a community organization to appear in its directory. You can still set your preference here.'}
        </p>

        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <button
            type="button"
            role="switch"
            aria-checked={optedIn}
            onClick={() => saveSetting(!optedIn, bio)}
            disabled={busy}
            style={{
              width: '52px', height: '30px', borderRadius: '15px', border: 'none', position: 'relative',
              cursor: busy ? 'wait' : 'pointer', backgroundColor: optedIn ? 'var(--color-teal)' : '#CBD2CE', flexShrink: 0,
            }}
          >
            <span style={{ position: 'absolute', top: '3px', left: optedIn ? '25px' : '3px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.15s' }} />
          </button>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)' }}>
            {optedIn ? 'Listed in the directory' : 'Not listed'}
          </span>
        </label>

        <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
          Short profile (optional)
        </label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={3}
          maxLength={600}
          placeholder="A sentence or two about yourself — where you're from, what you enjoy, what you'd love to connect over."
          style={{ ...input, resize: 'vertical' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
          <button
            type="button"
            onClick={() => saveSetting(optedIn, bio)}
            disabled={busy || bio === savedBio}
            style={{ padding: '9px 20px', backgroundColor: bio === savedBio ? '#DDD8CE' : 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '9px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: bio === savedBio ? 'default' : 'pointer' }}
          >
            {busy ? 'Saving…' : 'Save profile'}
          </button>
          {msg && <span role="status" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-teal)' }}>{msg}</span>}
        </div>
      </div>

      {/* Browse */}
      <div style={card}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') load(q) }}
            placeholder="Search by name or city"
            style={{ ...input, flex: 1, minWidth: '200px' }}
          />
          <button onClick={() => load(q)} style={{ padding: '10px 20px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '9px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            Search
          </button>
        </div>

        {members.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>
            {inOrg ? 'No members have listed themselves yet. Be the first!' : 'Not in a community organization yet.'}
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
            {members.map((m: any) => (
              <div key={m.id} style={{ backgroundColor: '#F9F6F0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-navy)' }}>{m.name}</div>
                {(m.city || m.state) && (
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {[m.city, m.state].filter(Boolean).join(', ')}
                  </div>
                )}
                {m.bio && <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '8px 0 0', lineHeight: 1.5 }}>{m.bio}</p>}
                {m.interests.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                    {m.interests.map((i: any) => (
                      <span key={i} style={{ fontFamily: 'var(--font-body)', fontSize: '11px', backgroundColor: 'white', border: '1px solid #E8E4DC', borderRadius: '10px', padding: '2px 8px', color: 'var(--color-text-secondary)' }}>{i}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
