'use client'
// M25 Phases 103–107 — Cultural Programming hub client.
// Tabs: Classes (106), Potlucks (103), Story Circle (104), Heritage (105),
// Oral History (107). Each tab lists what's available and has a simple form
// that posts to the matching /api/cultural route.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import type {
  PotluckWithSignups,
  CulturalClassWithReg,
  HeritageProjectWithNames,
} from '@/lib/data/cultural'
type CulturalStorySessionRow = any
type CulturalStoryContributionRow = any
type HeritageProjectRow = any
type OralHistoryRecordingRow = any

interface FestivalLite { id: string; festival_name: string; festival_date: string }
interface CircleLite { id: string; circle_name: string }

interface Props {
  hasMember: boolean
  festivals: FestivalLite[]
  circles: CircleLite[]
  potlucks: PotluckWithSignups[]
  storySessions: CulturalStorySessionRow[]
  storyContributions: CulturalStoryContributionRow[]
  openHeritageProjects: HeritageProjectWithNames[]
  myHeritageProjects: HeritageProjectRow[]
  classes: CulturalClassWithReg[]
  oralHistory: OralHistoryRecordingRow[]
}

type TabKey = 'classes' | 'potlucks' | 'story' | 'heritage' | 'oral'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'classes', label: 'Classes' },
  { key: 'potlucks', label: 'Potlucks' },
  { key: 'story', label: 'Story Circle' },
  { key: 'heritage', label: 'Heritage Projects' },
  { key: 'oral', label: 'Oral History' },
]

const card: React.CSSProperties = {
  backgroundColor: 'white',
  border: '1px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-lg)',
  padding: '18px 20px',
  boxShadow: 'var(--shadow-card)',
}
const label: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  fontWeight: 600,
  color: 'var(--color-navy)',
  marginBottom: '6px',
}
const field: React.CSSProperties = {
  width: '100%',
  minHeight: '52px',
  border: '1.5px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-md)',
  padding: '12px 14px',
  fontSize: '16px',
  fontFamily: 'var(--font-body)',
  backgroundColor: 'white',
  boxSizing: 'border-box',
}
const h2: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '20px',
  color: 'var(--color-navy)',
  margin: '0 0 12px',
}

function Notice({ msg }: { msg: { kind: 'ok' | 'err'; text: string } | null }) {
  if (!msg) return null
  return (
    <p
      role={msg.kind === 'err' ? 'alert' : 'status'}
      style={{
        margin: '0 0 12px',
        fontFamily: 'var(--font-body)',
        fontSize: '14px',
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: msg.kind === 'err' ? 'var(--color-concern)' : 'var(--color-teal-muted)',
        color: msg.kind === 'err' ? 'var(--color-concern-text)' : 'var(--color-navy)',
        border: `1px solid ${msg.kind === 'err' ? 'var(--color-concern-border)' : 'var(--color-teal)'}`,
      }}
    >
      {msg.text}
    </p>
  )
}

function fmtDate(d: string | null): string {
  if (!d) return ''
  return new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })
}

export default function CulturalProgrammingClient(props: Props) {
  const [tab, setTab] = useState<TabKey>('classes')
  const router = useRouter()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div role="tablist" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {TABS.map((t: any) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 600,
                padding: '8px 14px',
                borderRadius: '999px',
                cursor: 'pointer',
                border: `1.5px solid ${active ? 'var(--color-teal)' : 'var(--color-warm-grey)'}`,
                backgroundColor: active ? 'var(--color-teal)' : 'white',
                color: active ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {!props.hasMember && (
        <div style={{ ...card, backgroundColor: 'var(--color-cream)' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Finish setting up your member profile to sign up for classes, potlucks, and story circles.
          </p>
        </div>
      )}

      {tab === 'classes' && <ClassesTab classes={props.classes} disabled={!props.hasMember} onDone={() => router.refresh()} />}
      {tab === 'potlucks' && (
        <PotlucksTab
          potlucks={props.potlucks}
          circles={props.circles}
          festivals={props.festivals}
          disabled={!props.hasMember}
          onDone={() => router.refresh()}
        />
      )}
      {tab === 'story' && (
        <StoryCircleTab
          sessions={props.storySessions}
          contributions={props.storyContributions}
          festivals={props.festivals}
          disabled={!props.hasMember}
          onDone={() => router.refresh()}
        />
      )}
      {tab === 'heritage' && (
        <HeritageTab
          open={props.openHeritageProjects}
          mine={props.myHeritageProjects}
          disabled={!props.hasMember}
          onDone={() => router.refresh()}
        />
      )}
      {tab === 'oral' && (
        <OralHistoryTab recordings={props.oralHistory} disabled={!props.hasMember} onDone={() => router.refresh()} />
      )}
    </div>
  )
}

/* ─── Phase 106 — Classes ──────────────────────────────────────────────────── */
function ClassesTab({ classes, disabled, onDone }: { classes: CulturalClassWithReg[]; disabled: boolean; onDone: () => void }) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [kitId, setKitId] = useState<string | null>(null)

  async function toggle(cls: CulturalClassWithReg) {
    setBusyId(cls.id)
    setMsg(null)
    try {
      const res = await fetch(`/api/cultural/classes/${cls.id}`, {
        method: cls.user_registered ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: cls.user_registered ? undefined : JSON.stringify({ needs_materials_kit: kitId === cls.id }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg({ kind: 'err', text: json.error ?? 'Something went wrong.' })
      } else {
        setMsg({ kind: 'ok', text: cls.user_registered ? 'You have been withdrawn from the class.' : 'You are registered — we will call with the join details.' })
        onDone()
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section style={card}>
      <h2 style={h2}>Craft &amp; cooking classes</h2>
      <Notice msg={msg} />
      {classes.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
          No classes scheduled right now. New ones are added each festival season.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {classes.map((c: any) => (
            <li key={c.id} style={{ border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 700, color: 'var(--color-navy)', margin: '0 0 2px' }}>
                {c.title}{' '}
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-teal)' }}>
                  {c.class_type === 'cooking' ? 'Cooking' : 'Craft'}
                </span>
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>
                {fmtDate(c.class_date)}{c.class_time ? ` at ${c.class_time.slice(0, 5)}` : ''}
                {c.festival_tag ? ` · ${c.festival_tag}` : ''} · {c.seats_left} seat{c.seats_left === 1 ? '' : 's'} left
                {c.instructor_name ? ` · with ${c.instructor_name}` : ''}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-primary)', lineHeight: 1.6, margin: '0 0 6px' }}>
                {c.description}
              </p>
              {c.materials_list && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>
                  <strong>You&apos;ll need:</strong> {c.materials_list}
                </p>
              )}
              {!c.user_registered && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-navy)', margin: '0 0 8px' }}>
                  <input
                    type="checkbox"
                    checked={kitId === c.id}
                    onChange={(e) => setKitId(e.target.checked ? c.id : null)}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--color-teal)' }}
                  />
                  Mail me a free materials kit
                </label>
              )}
              <Button
                variant={c.user_registered ? 'secondary' : 'primary'}
                loading={busyId === c.id}
                disabled={disabled || (!c.user_registered && c.seats_left === 0)}
                onClick={() => toggle(c)}
              >
                {c.user_registered ? 'Withdraw' : c.seats_left === 0 ? 'Class full' : 'Register'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* ─── Phase 103 — Potlucks ─────────────────────────────────────────────────── */
function PotlucksTab({
  potlucks,
  circles,
  festivals,
  disabled,
  onDone,
}: {
  potlucks: PotluckWithSignups[]
  circles: CircleLite[]
  festivals: FestivalLite[]
  disabled: boolean
  onDone: () => void
}) {
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [showHost, setShowHost] = useState(false)
  const [form, setForm] = useState({
    title: '', potluck_date: '', potluck_time: '', location_name: '', location_address: '',
    city: '', state: '', circle_id: '', festival_tag: '', capacity: '20', description: '',
  })
  const [dish, setDish] = useState<Record<string, string>>({})

  async function join(p: PotluckWithSignups) {
    setBusyId(p.id)
    setMsg(null)
    try {
      const res = await fetch(`/api/cultural/potlucks/${p.id}`, {
        method: p.user_signed_up ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: p.user_signed_up ? undefined : JSON.stringify({ dish_name: dish[p.id] ?? null }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) setMsg({ kind: 'err', text: json.error ?? 'Something went wrong.' })
      else {
        setMsg({ kind: 'ok', text: p.user_signed_up ? 'You are no longer signed up.' : 'You are on the list — see you there!' })
        onDone()
      }
    } finally {
      setBusyId(null)
    }
  }

  async function host(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setBusyId('host')
    try {
      const res = await fetch('/api/cultural/potlucks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          capacity: Number(form.capacity) || 20,
          circle_id: form.circle_id || null,
          festival_tag: form.festival_tag || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) setMsg({ kind: 'err', text: json.error ?? 'Something went wrong.' })
      else {
        setMsg({ kind: 'ok', text: 'Your potluck is posted. Neighbours can now sign up and bring a dish.' })
        setShowHost(false)
        setForm({ title: '', potluck_date: '', potluck_time: '', location_name: '', location_address: '', city: '', state: '', circle_id: '', festival_tag: '', capacity: '20', description: '' })
        onDone()
      }
    } finally {
      setBusyId(null)
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <section style={card}>
      <h2 style={h2}>Community potlucks</h2>
      <Notice msg={msg} />

      {potlucks.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 16px' }}>
          No potlucks planned nearby yet. If you&apos;d like to host one, we&apos;ll help you organise it.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {potlucks.map((p: any) => (
            <li key={p.id} style={{ border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 700, color: 'var(--color-navy)', margin: '0 0 2px' }}>{p.title}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>
                {fmtDate(p.potluck_date)}{p.potluck_time ? ` at ${p.potluck_time.slice(0, 5)}` : ''} · hosted by {p.host_name}
                {p.festival_tag ? ` · ${p.festival_tag}` : ''}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>
                {[p.location_name, p.location_address, p.city, p.state].filter(Boolean).join(', ')}
              </p>
              {p.description && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-primary)', lineHeight: 1.6, margin: '0 0 6px' }}>{p.description}</p>
              )}
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>
                {p.attendee_total} of {p.capacity} coming
                {p.signups.length > 0 && ` · dishes: ${p.signups.map((s: any) => s.dish_name || `${s.member_name}'s ${s.dish_category}`).join(', ')}`}
              </p>
              {!p.user_signed_up && (
                <input
                  style={{ ...field, marginBottom: '8px' }}
                  placeholder="What will you bring? (optional)"
                  value={dish[p.id] ?? ''}
                  onChange={(e) => setDish((d) => ({ ...d, [p.id]: e.target.value }))}
                  maxLength={160}
                />
              )}
              <Button
                variant={p.user_signed_up ? 'secondary' : 'primary'}
                loading={busyId === p.id}
                disabled={disabled || (!p.user_signed_up && p.attendee_total >= p.capacity)}
                onClick={() => join(p)}
              >
                {p.user_signed_up ? "I can't make it" : p.attendee_total >= p.capacity ? 'Full' : "I'll come"}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {!showHost ? (
        <Button variant="secondary" disabled={disabled} onClick={() => setShowHost(true)}>Host a potluck</Button>
      ) : (
        <form onSubmit={host} style={{ display: 'grid', gap: '12px', borderTop: '1px solid var(--color-warm-grey)', paddingTop: '16px' }}>
          <div>
            <label style={label} htmlFor="pl-title">Title</label>
            <input id="pl-title" required style={field} value={form.title} onChange={set('title')} maxLength={160} placeholder="e.g. Lunar New Year reunion dinner" />
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 160px' }}>
              <label style={label} htmlFor="pl-date">Date</label>
              <input id="pl-date" type="date" required style={field} value={form.potluck_date} onChange={set('potluck_date')} />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={label} htmlFor="pl-time">Time</label>
              <input id="pl-time" type="time" style={field} value={form.potluck_time} onChange={set('potluck_time')} />
            </div>
          </div>
          <div>
            <label style={label} htmlFor="pl-addr">Location address</label>
            <input id="pl-addr" required style={field} value={form.location_address} onChange={set('location_address')} maxLength={300} />
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 140px' }}>
              <label style={label} htmlFor="pl-city">City</label>
              <input id="pl-city" style={field} value={form.city} onChange={set('city')} maxLength={80} />
            </div>
            <div style={{ flex: '1 1 80px' }}>
              <label style={label} htmlFor="pl-state">State</label>
              <input id="pl-state" style={field} value={form.state} onChange={set('state')} maxLength={40} />
            </div>
            <div style={{ flex: '1 1 90px' }}>
              <label style={label} htmlFor="pl-cap">Capacity</label>
              <input id="pl-cap" type="number" min={2} max={200} style={field} value={form.capacity} onChange={set('capacity')} />
            </div>
          </div>
          <div>
            <label style={label} htmlFor="pl-circle">Community (optional)</label>
            <select id="pl-circle" style={field} value={form.circle_id} onChange={set('circle_id')}>
              <option value="">Any / everyone</option>
              {circles.map((c: any) => <option key={c.id} value={c.id}>{c.circle_name}</option>)}
            </select>
          </div>
          <div>
            <label style={label} htmlFor="pl-fest">Festival (optional)</label>
            <select id="pl-fest" style={field} value={form.festival_tag} onChange={set('festival_tag')}>
              <option value="">None</option>
              {festivals.map((f: any) => <option key={f.id} value={f.festival_name}>{f.festival_name}</option>)}
            </select>
          </div>
          <div>
            <label style={label} htmlFor="pl-desc">Anything else? (optional)</label>
            <textarea id="pl-desc" style={{ ...field, minHeight: '80px' }} value={form.description} onChange={set('description')} maxLength={1000} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button type="submit" loading={busyId === 'host'}>Post potluck</Button>
            <Button type="button" variant="secondary" onClick={() => setShowHost(false)}>Cancel</Button>
          </div>
        </form>
      )}
    </section>
  )
}

/* ─── Phase 104 — Story Circle ─────────────────────────────────────────────── */
function StoryCircleTab({
  sessions,
  contributions,
  festivals,
  disabled,
  onDone,
}: {
  sessions: CulturalStorySessionRow[]
  contributions: CulturalStoryContributionRow[]
  festivals: FestivalLite[]
  disabled: boolean
  onDone: () => void
}) {
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ session_id: '', festival_name: '', homeland: '', story_text: '', save_to_life_story: true })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setBusy(true)
    try {
      const res = await fetch('/api/cultural/story-circle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: form.session_id || null,
          festival_name: form.festival_name || null,
          homeland: form.homeland || null,
          story_text: form.story_text,
          save_to_life_story: form.save_to_life_story,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) setMsg({ kind: 'err', text: json.error ?? 'Something went wrong.' })
      else {
        setMsg({ kind: 'ok', text: form.save_to_life_story ? 'Your memory is saved and added to your Life Story archive.' : 'Your memory is saved.' })
        setForm({ session_id: '', festival_name: '', homeland: '', story_text: '', save_to_life_story: true })
        onDone()
      }
    } finally {
      setBusy(false)
    }
  }
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <section style={card}>
      <h2 style={h2}>Cultural Story Circle</h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>
        Share a festival memory from home. With your permission we keep it in your Life Story archive
        for your family.
      </p>
      <Notice msg={msg} />

      {sessions.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color: 'var(--color-navy)', margin: '0 0 6px' }}>Upcoming sessions</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sessions.map((s: any) => (
              <li key={s.id} style={{ border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
                <strong>{s.title}</strong> · {fmtDate(s.session_date)}{s.session_time ? ` at ${s.session_time.slice(0, 5)}` : ''}
                {s.dial_in_number && (
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Call {s.dial_in_number}{s.dial_in_code ? `, code ${s.dial_in_code}` : ''}. That&apos;s it.
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={submit} style={{ display: 'grid', gap: '12px' }}>
        {sessions.length > 0 && (
          <div>
            <label style={label} htmlFor="sc-session">Session (optional)</label>
            <select id="sc-session" style={field} value={form.session_id} onChange={set('session_id')}>
              <option value="">Not tied to a session</option>
              {sessions.map((s: any) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 180px' }}>
            <label style={label} htmlFor="sc-fest">Festival</label>
            <select id="sc-fest" style={field} value={form.festival_name} onChange={set('festival_name')}>
              <option value="">Choose…</option>
              {festivals.map((f: any) => <option key={f.id} value={f.festival_name}>{f.festival_name}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <label style={label} htmlFor="sc-home">Homeland / where you grew up</label>
            <input id="sc-home" style={field} value={form.homeland} onChange={set('homeland')} maxLength={120} />
          </div>
        </div>
        <div>
          <label style={label} htmlFor="sc-text">Your memory</label>
          <textarea id="sc-text" required style={{ ...field, minHeight: '120px' }} value={form.story_text} onChange={set('story_text')} maxLength={6000} placeholder="What do you remember about this festival growing up?" />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-navy)' }}>
          <input type="checkbox" checked={form.save_to_life_story} onChange={(e) => setForm((f) => ({ ...f, save_to_life_story: e.target.checked }))} style={{ width: '20px', height: '20px', accentColor: 'var(--color-teal)' }} />
          Also save this to my Life Story archive
        </label>
        <div><Button type="submit" loading={busy} disabled={disabled}>Share memory</Button></div>
      </form>

      {contributions.length > 0 && (
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-warm-grey)', paddingTop: '14px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color: 'var(--color-navy)', margin: '0 0 8px' }}>
            Your shared memories ({contributions.length})
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {contributions.map((c: any) => (
              <li key={c.id} style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                <strong>{c.festival_name ?? 'A festival memory'}</strong>
                {c.homeland ? ` — ${c.homeland}` : ''} {c.saved_to_life_story ? ' · in Life Story' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

/* ─── Phase 105 — Heritage projects ────────────────────────────────────────── */
function HeritageTab({
  open,
  mine,
  disabled,
  onDone,
}: {
  open: HeritageProjectWithNames[]
  mine: HeritageProjectRow[]
  disabled: boolean
  onDone: () => void
}) {
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ tradition_topic: '', school_name: '', project_description: '' })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setBusy(true)
    try {
      const res = await fetch('/api/cultural/heritage-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) setMsg({ kind: 'err', text: json.error ?? 'Something went wrong.' })
      else {
        setMsg({ kind: 'ok', text: 'Thank you. A navigator will match you with a student and set up a time.' })
        setForm({ tradition_topic: '', school_name: '', project_description: '' })
        onDone()
      }
    } finally {
      setBusy(false)
    }
  }
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <section style={card}>
      <h2 style={h2}>Intergenerational heritage projects</h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>
        Offer to teach a student about a tradition for their school project — a recipe, a craft, a
        holiday, a story. We match you with a participating student and record it for your Life Story.
      </p>
      <Notice msg={msg} />

      {mine.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {mine.map((p: any) => (
            <li key={p.id} style={{ border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
              <strong>{p.tradition_topic}</strong> · {p.status.replace(/_/g, ' ')}
              {p.school_name ? ` · ${p.school_name}` : ''}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} style={{ display: 'grid', gap: '12px' }}>
        <div>
          <label style={label} htmlFor="hp-topic">Tradition you&apos;d like to share</label>
          <input id="hp-topic" required style={field} value={form.tradition_topic} onChange={set('tradition_topic')} maxLength={200} placeholder="e.g. Making tamales for Las Posadas" />
        </div>
        <div>
          <label style={label} htmlFor="hp-school">School (if you know it)</label>
          <input id="hp-school" style={field} value={form.school_name} onChange={set('school_name')} maxLength={160} />
        </div>
        <div>
          <label style={label} htmlFor="hp-desc">A bit more about it (optional)</label>
          <textarea id="hp-desc" style={{ ...field, minHeight: '90px' }} value={form.project_description} onChange={set('project_description')} maxLength={2000} />
        </div>
        <div><Button type="submit" loading={busy} disabled={disabled}>Offer to share</Button></div>
      </form>

      {open.length > 0 && (
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-warm-grey)', paddingTop: '14px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
            {open.length} project{open.length === 1 ? '' : 's'} being organised across the community right now.
          </p>
        </div>
      )}
    </section>
  )
}

/* ─── Phase 107 — Oral history ─────────────────────────────────────────────── */
function OralHistoryTab({
  recordings,
  disabled,
  onDone,
}: {
  recordings: OralHistoryRecordingRow[]
  disabled: boolean
  onDone: () => void
}) {
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    title: '', language: '', topic: '', era: '', description: '', transcript: '',
    consent_given: false, visibility: 'family', save_to_life_story: true,
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setBusy(true)
    try {
      const res = await fetch('/api/cultural/oral-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg({ kind: 'err', text: json.error ?? 'Something went wrong.' })
        return
      }
      const recordingId: string | undefined = json.recording?.id
      if (file && recordingId) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('recording_id', recordingId)
        const up = await fetch('/api/cultural/oral-history/upload', { method: 'POST', body: fd })
        if (!up.ok) {
          const uj = await up.json().catch(() => ({}))
          setMsg({ kind: 'err', text: `Recording saved, but the audio upload failed: ${uj.error ?? 'unknown error'}` })
          onDone()
          return
        }
      }
      setMsg({ kind: 'ok', text: 'Recording saved to the archive.' })
      setForm({ title: '', language: '', topic: '', era: '', description: '', transcript: '', consent_given: false, visibility: 'family', save_to_life_story: true })
      setFile(null)
      onDone()
    } finally {
      setBusy(false)
    }
  }
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <section style={card}>
      <h2 style={h2}>Oral history archive</h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>
        Record a story in your first language — a memory, a recipe, a song, family history. Add an
        audio file if you have one, plus a written version if you&apos;d like.
      </p>
      <Notice msg={msg} />

      {recordings.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recordings.map((r: any) => (
            <li key={r.id} style={{ border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
              <strong>{r.title}</strong> · {r.language}
              {r.era ? ` · ${r.era}` : ''}
              {r.audio_path ? ' · 🎧 audio' : ''}
              {r.saved_to_life_story ? ' · in Life Story' : ''}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} style={{ display: 'grid', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={label} htmlFor="oh-title">Title</label>
            <input id="oh-title" required style={field} value={form.title} onChange={set('title')} maxLength={200} />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label style={label} htmlFor="oh-lang">Language</label>
            <input id="oh-lang" required style={field} value={form.language} onChange={set('language')} maxLength={60} placeholder="e.g. Tagalog" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 160px' }}>
            <label style={label} htmlFor="oh-topic">Topic (optional)</label>
            <input id="oh-topic" style={field} value={form.topic} onChange={set('topic')} maxLength={120} />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label style={label} htmlFor="oh-era">Era (optional)</label>
            <input id="oh-era" style={field} value={form.era} onChange={set('era')} maxLength={60} placeholder="e.g. Childhood" />
          </div>
        </div>
        <div>
          <label style={label} htmlFor="oh-desc">Short description (optional)</label>
          <textarea id="oh-desc" style={{ ...field, minHeight: '70px' }} value={form.description} onChange={set('description')} maxLength={2000} />
        </div>
        <div>
          <label style={label} htmlFor="oh-transcript">Written version / transcript (optional)</label>
          <textarea id="oh-transcript" style={{ ...field, minHeight: '100px' }} value={form.transcript} onChange={set('transcript')} maxLength={20000} />
        </div>
        <div>
          <label style={label} htmlFor="oh-file">Audio file (optional — mp3, m4a, wav, ogg; up to 50 MB)</label>
          <input id="oh-file" type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }} />
        </div>
        <div>
          <label style={label} htmlFor="oh-vis">Who can see this</label>
          <select id="oh-vis" style={field} value={form.visibility} onChange={set('visibility')}>
            <option value="family">My family only</option>
            <option value="circle">My cultural community</option>
            <option value="public">Anyone on ThriveAtHome</option>
          </select>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-navy)' }}>
          <input type="checkbox" checked={form.save_to_life_story} onChange={(e) => setForm((f) => ({ ...f, save_to_life_story: e.target.checked }))} style={{ width: '20px', height: '20px', accentColor: 'var(--color-teal)' }} />
          Also save to my Life Story archive
        </label>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-navy)' }}>
          <input type="checkbox" checked={form.consent_given} onChange={(e) => setForm((f) => ({ ...f, consent_given: e.target.checked }))} style={{ width: '20px', height: '20px', accentColor: 'var(--color-teal)', marginTop: '2px' }} />
          The storyteller agreed to have this recorded and kept in the archive.
        </label>
        <div><Button type="submit" loading={busy} disabled={disabled || !form.consent_given}>Save to archive</Button></div>
      </form>
    </section>
  )
}
