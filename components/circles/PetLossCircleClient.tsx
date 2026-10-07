'use client'

// M27 Phase 119 — The Companion Circle client: join/leave, feed, 1:1 support request, resources.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
type PetLossCirclePostRow = any
type PetLossSupportRequestRow = any

const card: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid rgba(0,0,0,0.06)',
  padding: '20px',
  boxShadow: 'var(--shadow-card)',
}
const h2: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '22px',
  fontWeight: 500,
  color: 'var(--color-navy)',
  margin: '0 0 12px',
}
const label: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--color-navy)',
  margin: '0 0 4px',
}
const input: React.CSSProperties = {
  width: '100%',
  minHeight: '48px',
  padding: '10px 12px',
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  border: '1px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'white',
}
const btnPrimary: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  fontWeight: 600,
  minHeight: '48px',
  padding: '0 22px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  backgroundColor: 'var(--color-teal)',
  color: 'white',
  cursor: 'pointer',
}
const btnGhost: React.CSSProperties = {
  ...btnPrimary,
  backgroundColor: 'transparent',
  color: 'var(--color-navy)',
  border: '1px solid var(--color-warm-grey)',
}

const POST_TYPES: { value: string; label: string }[] = [
  { value: 'reflection', label: 'A reflection' },
  { value: 'tribute', label: 'A tribute' },
  { value: 'question', label: 'A question' },
  { value: 'encouragement', label: 'Encouragement for others' },
]

interface PetLite {
  id: string
  name: string
  passed_away_on: string | null
}
interface Resource {
  name: string
  detail: string
  contact: string
}
interface Props {
  memberPreferredName: string
  memberFullName: string
  isActive: boolean
  displayName: string
  petRemembered: string
  initialPosts: PetLossCirclePostRow[]
  roster: { display_name: string; pet_remembered: string | null; joined_at: string }[]
  existingRequests: PetLossSupportRequestRow[]
  pets: PetLite[]
  resources: Resource[]
}

function defaultDisplayName(full: string): string {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

export default function PetLossCircleClient({
  memberPreferredName,
  memberFullName,
  isActive,
  displayName,
  petRemembered,
  initialPosts,
  roster,
  existingRequests,
  pets,
  resources,
}: Props) {
  const router = useRouter()
  const { push } = useToast()

  const [active, setActive] = useState(isActive)
  const [posts, setPosts] = useState<PetLossCirclePostRow[]>(initialPosts)
  const [requests, setRequests] = useState<PetLossSupportRequestRow[]>(existingRequests)
  const [busy, setBusy] = useState(false)

  // Join form
  const [joinName, setJoinName] = useState(displayName || defaultDisplayName(memberFullName))
  const [joinPet, setJoinPet] = useState(petRemembered)

  // Compose
  const [postText, setPostText] = useState('')
  const [postType, setPostType] = useState('reflection')

  // Support request
  const [showSupport, setShowSupport] = useState(false)
  const [supportType, setSupportType] = useState('one_to_one')
  const [supportPetId, setSupportPetId] = useState('')
  const [supportLossDate, setSupportLossDate] = useState('')
  const [supportMessage, setSupportMessage] = useState('')

  async function join(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch('/api/pet-loss/circle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: joinName, pet_remembered: joinPet || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not join.')
      setActive(true)
      push({ title: 'Welcome to The Companion Circle.', severity: 'success' })
      router.refresh()
    } catch (err) {
      push({ title: err instanceof Error ? err.message : 'Something went wrong.', severity: 'concern' })
    } finally {
      setBusy(false)
    }
  }

  async function leave() {
    if (!confirm('Leave The Companion Circle? You can re-join any time.')) return
    setBusy(true)
    try {
      const res = await fetch('/api/pet-loss/circle', { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not leave.')
      setActive(false)
      setPosts([])
      push({ title: 'You have left the circle.', severity: 'info' })
      router.refresh()
    } catch (err) {
      push({ title: err instanceof Error ? err.message : 'Something went wrong.', severity: 'concern' })
    } finally {
      setBusy(false)
    }
  }

  async function submitPost(e: React.FormEvent) {
    e.preventDefault()
    if (!postText.trim()) {
      push({ title: 'Write a few words to share.', severity: 'concern' })
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/pet-loss/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: postText, post_type: postType }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not post.')
      setPosts((prev) => [json.post, ...prev])
      setPostText('')
      push({ title: 'Shared with the circle.', severity: 'success' })
    } catch (err) {
      push({ title: err instanceof Error ? err.message : 'Something went wrong.', severity: 'concern' })
    } finally {
      setBusy(false)
    }
  }

  async function submitSupport(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const pet = pets.find((p: any) => p.id === supportPetId)
      const res = await fetch('/api/pet-loss/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          support_type: supportType,
          pet_id: supportPetId || null,
          pet_name: pet?.name ?? null,
          loss_date: supportLossDate || null,
          message: supportMessage || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not send.')
      setRequests((prev) => [json.request, ...prev])
      setShowSupport(false)
      setSupportMessage('')
      push({
        title: 'Your request was received.',
        body:
          supportType === 'one_to_one'
            ? 'A Navigator will reach out with a gentle check-in.'
            : 'The circle and resources are ready whenever you need them.',
        severity: 'success',
      })
      router.refresh()
    } catch (err) {
      push({ title: err instanceof Error ? err.message : 'Something went wrong.', severity: 'concern' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Membership */}
      {!active ? (
        <section style={card}>
          <h2 style={h2}>Join the circle</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>
            Members share reflections and tributes, and support one another. You choose the name
            others see.
          </p>
          <form onSubmit={join} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={label} htmlFor="join-name">Name shown in the circle</label>
              <input id="join-name" style={input} value={joinName} onChange={(e) => setJoinName(e.target.value)} maxLength={60} required />
            </div>
            <div>
              <label style={label} htmlFor="join-pet">In memory of (optional)</label>
              <input id="join-pet" style={input} value={joinPet} onChange={(e) => setJoinPet(e.target.value)} maxLength={120} placeholder="e.g. Biscuit, our golden retriever" />
            </div>
            <button type="submit" style={btnPrimary} disabled={busy}>{busy ? 'Joining…' : 'Join The Companion Circle'}</button>
          </form>
        </section>
      ) : (
        <section style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ ...h2, margin: 0 }}>You&apos;re in the circle</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                Shown as <strong>{displayName || joinName}</strong>
                {petRemembered ? ` · in memory of ${petRemembered}` : ''}
              </p>
            </div>
            <button type="button" style={{ ...btnGhost, minHeight: '40px', fontSize: '14px' }} onClick={leave} disabled={busy}>
              Leave circle
            </button>
          </div>
        </section>
      )}

      {/* Feed */}
      {active && (
        <section style={card}>
          <h2 style={h2}>Circle feed</h2>
          <form onSubmit={submitPost} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            <textarea
              aria-label="Share with the circle"
              style={{ ...input, minHeight: '80px', resize: 'vertical' }}
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder={`Share a memory of your companion, ${memberPreferredName}…`}
              maxLength={4000}
            />
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select style={{ ...input, width: 'auto', minWidth: '180px' }} value={postType} onChange={(e) => setPostType(e.target.value)}>
                {POST_TYPES.map((t: any) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <button type="submit" style={btnPrimary} disabled={busy}>{busy ? 'Posting…' : 'Share'}</button>
            </div>
          </form>

          {posts.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
              No posts yet. Be the first to share.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {posts.map((p: any) => (
                <div key={p.id} style={{ borderBottom: '1px solid var(--color-warm-grey)', paddingBottom: '12px' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 4px' }}>
                    {p.author_name} · {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {p.post_type !== 'reflection' ? ` · ${p.post_type}` : ''}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {p.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 1:1 support */}
      <section style={card}>
        <h2 style={h2}>Talk to someone</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>
          A Navigator can offer a warm, one-to-one check-in about your loss. This is handled
          separately from bereavement support for people.
        </p>
        {!showSupport ? (
          <button type="button" style={btnPrimary} onClick={() => setShowSupport(true)}>
            Request pet-loss support
          </button>
        ) : (
          <form onSubmit={submitSupport} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend style={label}>What would help right now?</legend>
              {[
                { v: 'one_to_one', l: 'A one-to-one call with a Navigator' },
                { v: 'circle_only', l: 'Just connect me with the circle' },
                { v: 'resources_only', l: 'Send me the resource list' },
              ].map((o: any) => (
                <label key={o.v} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontFamily: 'var(--font-body)', fontSize: '15px', padding: '6px 0' }}>
                  <input type="radio" name="support-type" value={o.v} checked={supportType === o.v} onChange={(e) => setSupportType(e.target.value)} />
                  {o.l}
                </label>
              ))}
            </fieldset>
            {pets.length > 0 && (
              <div>
                <label style={label} htmlFor="support-pet">Which companion? (optional)</label>
                <select id="support-pet" style={input} value={supportPetId} onChange={(e) => setSupportPetId(e.target.value)}>
                  <option value="">Prefer not to say</option>
                  {pets.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label style={label} htmlFor="support-date">When did they pass? (optional)</label>
              <input id="support-date" type="date" style={input} value={supportLossDate} onChange={(e) => setSupportLossDate(e.target.value)} />
            </div>
            <div>
              <label style={label} htmlFor="support-msg">Anything you&apos;d like the Navigator to know (optional)</label>
              <textarea
                id="support-msg"
                style={{ ...input, minHeight: '72px', resize: 'vertical' }}
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                maxLength={2000}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={btnPrimary} disabled={busy}>{busy ? 'Sending…' : 'Send request'}</button>
              <button type="button" style={btnGhost} onClick={() => setShowSupport(false)} disabled={busy}>Cancel</button>
            </div>
          </form>
        )}

        {requests.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ ...label, marginBottom: '8px' }}>Your requests</p>
            {requests.map((r: any) => (
              <p key={r.id} style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>
                {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} —{' '}
                {r.support_type.replace(/_/g, ' ')} · <strong>{r.status}</strong>
                {r.pet_name ? ` · ${r.pet_name}` : ''}
              </p>
            ))}
          </div>
        )}
      </section>

      {/* Resources */}
      <section style={card}>
        <h2 style={h2}>Pet-loss resources</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 12px' }}>
          Independent organisations that support people grieving a companion animal.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {resources.map((res: any) => (
            <div key={res.name}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', margin: 0 }}>
                {res.name}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                {res.detail}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-teal)', margin: '2px 0 0' }}>
                {res.contact}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Roster */}
      {roster.length > 0 && (
        <section style={card}>
          <h2 style={h2}>In the circle</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {roster.map((m: any, i: number) => (
              <span
                key={i}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--color-cream)',
                  border: '1px solid var(--color-warm-grey)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {m.display_name}
                {m.pet_remembered ? ` 🐾 ${m.pet_remembered}` : ''}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
