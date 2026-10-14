'use client'
// G7.22 — Cultural festival calendar + potluck coordination + oral history archive
import { useState, useEffect } from 'react'

interface Festival {
  id: string
  name: string
  cultural_group: string
  month: number
  day: number | null
  description: string | null
  member_relevant: boolean
}

interface Potluck {
  id: string
  title: string
  description: string | null
  cultural_theme: string | null
  event_date: string
  event_time: string | null
  location: string | null
  max_attendees: number | null
  dish_signups: Array<{ member_id: string; dish: string; dietary_tags: string[] }>
}

interface OralHistoryEntry {
  id: string
  title: string
  decade: string | null
  recorded_at: string
  themes: string[] | null
}

interface Props {
  memberId: string
  canWrite?: boolean
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const GROUP_EMOJI: Record<string, string> = {
  chinese: '🏮', jewish: '✡️', hispanic: '🌸', irish: '☘️', african_american: '✊',
  indian: '🪔', muslim: '🌙', generic: '🌍',
}

export default function CulturalCalendar({ memberId, canWrite = false }: Props) {
  const [tab, setTab] = useState<'calendar' | 'potlucks' | 'stories'>('calendar')
  const [festivals, setFestivals] = useState<Festival[]>([])
  const [potlucks, setPotlucks] = useState<Potluck[]>([])
  const [stories, setStories] = useState<OralHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [currentMonth] = useState(new Date().getMonth() + 1)

  // Potluck sign-up state
  const [signingUp, setSigningUp] = useState<string | null>(null)
  const [dish, setDish] = useState('')

  // Oral history form
  const [showStoryForm, setShowStoryForm] = useState(false)
  const [storyForm, setStoryForm] = useState({ title: '', storyText: '', decade: '', themes: '', isPublic: false })
  const [savingStory, setSavingStory] = useState(false)
  const [storyError, setStoryError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    if (tab === 'calendar') {
      fetch(`/api/cultural-programming?type=festivals&memberId=${memberId}`)
        .then(r => r.json()).then(d => setFestivals(d.festivals ?? [])).finally(() => setLoading(false))
    } else if (tab === 'potlucks') {
      fetch('/api/cultural-programming?type=potlucks')
        .then(r => r.json()).then(d => setPotlucks(d.potlucks ?? [])).finally(() => setLoading(false))
    } else {
      fetch(`/api/cultural-programming?type=oral_history&memberId=${memberId}`)
        .then(r => r.json()).then(d => setStories(d.entries ?? [])).finally(() => setLoading(false))
    }
  }, [tab, memberId])

  const signUpForPotluck = async (potluckId: string) => {
    if (!dish.trim()) return
    const res = await fetch('/api/cultural-programming', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'potluck_signup', potluckId, dish }),
    })
    if (res.ok) {
      setPotlucks(prev => prev.map(p =>
        p.id === potluckId
          ? { ...p, dish_signups: [...p.dish_signups, { member_id: memberId, dish, dietary_tags: [] }] }
          : p
      ))
      setSigningUp(null)
      setDish('')
    }
  }

  const submitStory = async () => {
    if (!storyForm.title.trim() || !storyForm.storyText.trim()) return
    setSavingStory(true)
    setStoryError(null)
    try {
      const res = await fetch('/api/cultural-programming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'oral_history',
          memberId,
          title: storyForm.title,
          storyText: storyForm.storyText,
          decade: storyForm.decade || null,
          themes: storyForm.themes ? storyForm.themes.split(',').map(t => t.trim()).filter(Boolean) : [],
          isPublic: storyForm.isPublic,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const newEntry = await res.json()
      setStories(prev => [{ id: newEntry.entryId, title: storyForm.title, decade: storyForm.decade || null, recorded_at: new Date().toISOString(), themes: [] }, ...prev])
      setShowStoryForm(false)
      setStoryForm({ title: '', storyText: '', decade: '', themes: '', isPublic: false })
    } catch (e: unknown) {
      setStoryError(e instanceof Error ? e.message : 'Error saving story')
    } finally {
      setSavingStory(false)
    }
  }

  // Group festivals by month
  const byMonth: Record<number, Festival[]> = {}
  for (const f of festivals) {
    if (!byMonth[f.month]) byMonth[f.month] = []
    byMonth[f.month].push(f)
  }

  return (
    <div style={{ fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {([['calendar', '🗓 Festival Calendar'], ['potlucks', '🍲 Community Potlucks'], ['stories', '📖 Our Stories']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              borderColor: tab === key ? '#1e3a5f' : '#e5e7eb',
              background: tab === key ? '#1e3a5f' : '#fff',
              color: tab === key ? '#fff' : '#374151' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <div style={{ color: '#9ca3af', fontSize: '14px', padding: '24px 0' }}>Loading…</div> : (
        <>
          {/* Festival Calendar */}
          {tab === 'calendar' && (
            <div>
              {Object.keys(byMonth).sort((a, b) => Number(a) - Number(b)).map(mStr => {
                const m = Number(mStr)
                const isCurrent = m === currentMonth
                return (
                  <div key={m} style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: isCurrent ? '#1e3a5f' : '#6b7280', marginBottom: '8px', borderBottom: isCurrent ? '2px solid #1e3a5f' : '1px solid #e5e7eb', paddingBottom: '4px' }}>
                      {isCurrent ? '📅 ' : ''}{MONTH_NAMES[m - 1]}
                    </div>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {byMonth[m].map(f => (
                        <div key={f.id} style={{ background: f.member_relevant ? '#eff6ff' : '#fff', border: `1px solid ${f.member_relevant ? '#bfdbfe' : '#f3f4f6'}`, borderRadius: '8px', padding: '12px 14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '20px', lineHeight: 1 }}>{GROUP_EMOJI[f.cultural_group] ?? '🌍'}</span>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>{f.name}</div>
                            {f.day && <div style={{ fontSize: '12px', color: '#9ca3af' }}>{MONTH_NAMES[m - 1]} {f.day}</div>}
                            {f.description && <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '3px' }}>{f.description}</div>}
                          </div>
                          {f.member_relevant && <span style={{ marginLeft: 'auto', fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '10px', fontWeight: 600, flexShrink: 0 }}>Your tradition</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {festivals.length === 0 && <div style={{ color: '#9ca3af', fontSize: '14px', padding: '24px 0', textAlign: 'center' }}>No festivals in calendar yet.</div>}
            </div>
          )}

          {/* Potlucks */}
          {tab === 'potlucks' && (
            <div style={{ display: 'grid', gap: '14px' }}>
              {potlucks.length === 0 && <div style={{ color: '#9ca3af', fontSize: '14px', padding: '24px 0', textAlign: 'center' }}>No upcoming potlucks scheduled.</div>}
              {potlucks.map(p => {
                const alreadySigned = p.dish_signups.some(s => s.member_id === memberId)
                const isFull = p.max_attendees && p.dish_signups.length >= p.max_attendees

                return (
                  <div key={p.id} style={{ background: '#fff', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: '#1e3a5f' }}>{p.title}</div>
                    {p.cultural_theme && <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '3px' }}>🌍 {p.cultural_theme}</div>}
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '13px', color: '#4b5563' }}>📅 {new Date(p.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                      {p.event_time && <div style={{ fontSize: '13px', color: '#4b5563' }}>🕐 {p.event_time}</div>}
                      {p.location && <div style={{ fontSize: '13px', color: '#4b5563' }}>📍 {p.location}</div>}
                    </div>
                    {p.description && <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5, margin: '8px 0 0' }}>{p.description}</p>}

                    {/* Dish list */}
                    {p.dish_signups.length > 0 && (
                      <div style={{ marginTop: '12px', background: '#f9fafb', borderRadius: '8px', padding: '10px 12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>🍽 Dishes being brought ({p.dish_signups.length}{p.max_attendees ? `/${p.max_attendees}` : ''})</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {p.dish_signups.map((s, i) => (
                            <span key={i} style={{ fontSize: '12px', background: s.member_id === memberId ? '#dbeafe' : '#e5e7eb', color: s.member_id === memberId ? '#1e40af' : '#374151', padding: '3px 10px', borderRadius: '10px' }}>
                              {s.dish}{s.member_id === memberId ? ' (you)' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {canWrite && !alreadySigned && !isFull && (
                      signingUp === p.id ? (
                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                          <input value={dish} onChange={e => setDish(e.target.value)} placeholder="What dish will you bring?"
                            style={{ flex: 1, padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                          <button onClick={() => signUpForPotluck(p.id)} disabled={!dish.trim()}
                            style={{ padding: '8px 14px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                            Sign up
                          </button>
                          <button onClick={() => setSigningUp(null)}
                            style={{ padding: '8px 12px', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setSigningUp(p.id)} style={{ marginTop: '12px', padding: '8px 16px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                          🍲 Sign up to bring a dish
                        </button>
                      )
                    )}
                    {alreadySigned && <div style={{ marginTop: '10px', fontSize: '13px', color: '#166534', fontWeight: 600 }}>✓ You're signed up!</div>}
                    {isFull && !alreadySigned && <div style={{ marginTop: '10px', fontSize: '13px', color: '#9ca3af' }}>This potluck is full</div>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Oral History */}
          {tab === 'stories' && (
            <div>
              {canWrite && (
                <div style={{ marginBottom: '16px' }}>
                  <button onClick={() => setShowStoryForm(!showStoryForm)}
                    style={{ padding: '8px 16px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    + Share a story
                  </button>
                </div>
              )}

              {showStoryForm && (
                <div style={{ background: '#f8f7f4', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '18px', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 14px', fontSize: '14px', color: '#1e3a5f' }}>Share your story 📖</h4>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Story title *</label>
                    <input value={storyForm.title} onChange={e => setStoryForm(f => ({ ...f, title: e.target.value }))} placeholder="Coming to America, 1967"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Decade</label>
                      <input value={storyForm.decade} onChange={e => setStoryForm(f => ({ ...f, decade: e.target.value }))} placeholder="1960s"
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Themes (comma-separated)</label>
                      <input value={storyForm.themes} onChange={e => setStoryForm(f => ({ ...f, themes: e.target.value }))} placeholder="family, immigration"
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Your story *</label>
                    <textarea value={storyForm.storyText} onChange={e => setStoryForm(f => ({ ...f, storyText: e.target.value }))} rows={6}
                      placeholder="Tell your story in your own words…"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer', marginBottom: '14px' }}>
                    <input type="checkbox" checked={storyForm.isPublic} onChange={e => setStoryForm(f => ({ ...f, isPublic: e.target.checked }))} />
                    Share with the ThriveAtHome community (after navigator review)
                  </label>
                  {storyError && <div style={{ color: '#991b1b', fontSize: '13px', marginBottom: '10px' }}>{storyError}</div>}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={submitStory} disabled={savingStory || !storyForm.title.trim() || !storyForm.storyText.trim()}
                      style={{ flex: 1, padding: '9px', background: savingStory ? '#9ca3af' : '#1e3a5f', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                      {savingStory ? 'Saving…' : 'Save story'}
                    </button>
                    <button onClick={() => setShowStoryForm(false)}
                      style={{ padding: '9px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '7px', cursor: 'pointer', fontSize: '14px' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gap: '12px' }}>
                {stories.length === 0 && <div style={{ color: '#9ca3af', fontSize: '14px', padding: '24px 0', textAlign: 'center' }}>No stories recorded yet. Your life story matters — share it!</div>}
                {stories.map(s => (
                  <div key={s.id} style={{ background: '#fff', borderRadius: '10px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e3a5f' }}>📖 {s.title}</div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {s.decade && <span style={{ fontSize: '12px', color: '#9ca3af' }}>📅 {s.decade}</span>}
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>Recorded {new Date(s.recorded_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                    {s.themes && s.themes.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {s.themes.map(t => <span key={t} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#ede9fe', color: '#5b21b6' }}>{t}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
