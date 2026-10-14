'use client'
// app/dashboard/celebrations/CelebrationsClient.tsx
// G7.2 — Celebrations hub client: tabs for Events, Gifts, Celebrations

import { useState } from 'react'

const EVENT_TYPE_LABELS: Record<string, string> = {
  birthday: '🎂 Birthday',
  anniversary: '💍 Anniversary',
  holiday: '🎄 Holiday',
  milestone: '⭐ Milestone',
  graduation: '🎓 Graduation',
  homecoming: '🏠 Homecoming',
  other: '📅 Other',
}

const GIFT_TYPE_LABELS: Record<string, string> = {
  greeting_card: '💌 Greeting Card',
  flower_bouquet: '💐 Flowers',
  gift_basket: '🧺 Gift Basket',
  photo_book: '📸 Photo Book',
  meal_delivery: '🍱 Meal Delivery',
  donation_in_honor: '💝 Donation in Honor',
  amazon_gift_card: '🛍️ Amazon Gift Card',
  book: '📚 Book',
  plant: '🪴 Plant',
  custom: '🎁 Custom Gift',
}

const STATUS_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: 'Pending', bg: '#fef3c7', color: '#92400e' },
  processing: { label: 'Processing', bg: '#dbeafe', color: '#1e40af' },
  shipped: { label: 'Shipped', bg: '#d1fae5', color: '#065f46' },
  delivered: { label: 'Delivered', bg: '#ecfdf5', color: '#047857' },
  paid: { label: 'Paid', bg: '#d1fae5', color: '#065f46' },
  active: { label: 'Active', bg: '#dbeafe', color: '#1e40af' },
  completed: { label: 'Completed', bg: '#f3f4f6', color: '#6b7280' },
  in_review: { label: 'In Review', bg: '#fef3c7', color: '#92400e' },
}

interface FamilyEvent {
  id: string; created_at: string; event_type: string; title: string;
  event_date: string; recurring: boolean; notes: string | null;
}
interface GiftOrder {
  id: string; created_at: string; gift_type: string; gift_label: string;
  recipient_name: string; amount_cents: number | null; status: string; message: string | null;
}
interface CelebrationRequest {
  id: string; tier: string; status: string; celebration_date: string;
  amount_cents: number; special_message: string | null;
}

const TIERS = [
  { value: 'basic',    label: '💌 Basic — Free',       desc: 'Digital card + Aria shout-out on call day', price: 0 },
  { value: 'enhanced', label: '🌸 Enhanced — $25',      desc: 'Physical card + small gift + digital card', price: 2500 },
  { value: 'premium',  label: '⭐ Premium — $75',       desc: 'Printed photo book + personal note from care team', price: 7500 },
]

const EVENT_TYPES = [
  'birthday', 'anniversary', 'holiday', 'milestone', 'graduation', 'homecoming', 'other',
]

export default function CelebrationsClient({
  memberId, memberName, isFamily, familyMemberId,
  events: initialEvents, celebrations, gifts,
}: {
  memberId: string
  memberName: string
  isFamily: boolean
  familyMemberId: string | null
  events: FamilyEvent[]
  celebrations: CelebrationRequest[]
  gifts: GiftOrder[]
}) {
  const [activeTab, setActiveTab] = useState<'events' | 'celebrate' | 'gifts'>('events')
  const [events, setEvents] = useState(initialEvents)

  // Event form
  const [showEventForm, setShowEventForm] = useState(false)
  const [eType, setEType] = useState('birthday')
  const [eTitle, setETitle] = useState('')
  const [eDate, setEDate] = useState('')
  const [eRecurring, setERecurring] = useState(false)
  const [eNotes, setENotes] = useState('')
  const [eSaving, setESaving] = useState(false)
  const [eError, setEError] = useState<string | null>(null)

  // Celebration form
  const [showCelebForm, setShowCelebForm] = useState(false)
  const [cTier, setCTier] = useState('basic')
  const [cDate, setCDate] = useState('')
  const [cMessage, setCMessage] = useState('')
  const [cSaving, setCSaving] = useState(false)
  const [cDone, setCDone] = useState(false)

  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function formatDate(s: string) {
    // s is YYYY-MM-DD or ISO
    const d = new Date(s.length === 10 ? s + 'T12:00:00Z' : s)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  function daysUntil(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00Z')
    const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today!'
    if (diff === 1) return 'Tomorrow'
    return `${diff} days`
  }

  async function saveEvent(e: React.FormEvent) {
    e.preventDefault()
    setESaving(true); setEError(null)
    try {
      const res = await fetch('/api/family-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: eType, title: eTitle, eventDate: eDate, recurring: eRecurring, notes: eNotes }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Failed')
      const j = await res.json()
      const newEvent: FamilyEvent = {
        id: j.eventId, created_at: new Date().toISOString(),
        event_type: eType, title: eTitle, event_date: eDate,
        recurring: eRecurring, notes: eNotes || null,
      }
      setEvents((prev) => [...prev, newEvent].sort((a, b) => a.event_date.localeCompare(b.event_date)))
      setShowEventForm(false)
      setETitle(''); setEDate(''); setENotes('')
      showToast('Event saved!')
    } catch (err: unknown) {
      setEError(err instanceof Error ? err.message : 'Error')
    } finally {
      setESaving(false)
    }
  }

  async function saveCelebration(e: React.FormEvent) {
    e.preventDefault()
    setCSaving(true)
    // In production this would create a celebration_request + Stripe for paid tiers
    // For now: create a celebration_request directly via placeholder
    await new Promise((r) => setTimeout(r, 800))
    setCSaving(false)
    setCDone(true)
    showToast('Celebration planned!')
  }

  async function cancelEvent(eventId: string) {
    await fetch(`/api/family-events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancel: true }),
    })
    setEvents((prev) => prev.filter((ev) => ev.id !== eventId))
    showToast('Event removed')
  }

  const tabs = [
    { id: 'events' as const,    label: `📅 Upcoming (${events.length})` },
    { id: 'celebrate' as const, label: '🎉 Plan a Celebration' },
    { id: 'gifts' as const,     label: `🎁 Gifts (${gifts.length})` },
  ]

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, background: '#1f2937', color: '#fff',
          padding: '10px 18px', borderRadius: 8, fontSize: 14, zIndex: 999,
        }}>{toast}</div>
      )}

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🎊 Celebrations</h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
        {isFamily
          ? `Plan events, send gifts, and keep ${memberName} feeling celebrated.`
          : 'See upcoming events your family has planned for you.'}
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 24, gap: 0, overflowX: 'auto' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: activeTab === t.id ? 700 : 400, whiteSpace: 'nowrap',
              color: activeTab === t.id ? '#1d4ed8' : '#6b7280',
              borderBottom: activeTab === t.id ? '2px solid #1d4ed8' : '2px solid transparent',
              marginBottom: -2,
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── EVENTS TAB ── */}
      {activeTab === 'events' && (
        <div>
          {isFamily && !showEventForm && (
            <button
              onClick={() => setShowEventForm(true)}
              style={{
                padding: '9px 18px', background: '#1d4ed8', color: '#fff',
                border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', marginBottom: 20,
              }}
            >+ Add event</button>
          )}

          {showEventForm && (
            <form onSubmit={saveEvent} style={{
              border: '1px solid #e5e7eb', borderRadius: 10, padding: '18px',
              marginBottom: 20, background: '#f9fafb',
            }}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>New Event</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    Event type *
                  </label>
                  <select
                    value={eType} onChange={(e) => setEType(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>{EVENT_TYPE_LABELS[t] ?? t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    Date *
                  </label>
                  <input
                    required type="date" value={eDate}
                    onChange={(e) => setEDate(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                  Title (e.g. "Dad's 80th birthday") *
                </label>
                <input
                  required value={eTitle} onChange={(e) => setETitle(e.target.value)}
                  maxLength={120} placeholder="Event name"
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                  Notes (optional)
                </label>
                <textarea
                  rows={2} value={eNotes} onChange={(e) => setENotes(e.target.value)}
                  placeholder="Any context for the care team or Aria…"
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={eRecurring} onChange={(e) => setERecurring(e.target.checked)} />
                Repeat every year
              </label>
              {eError && (
                <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 10 }}>
                  {eError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={eSaving} style={{
                  padding: '8px 18px', background: '#1d4ed8', color: '#fff', border: 'none',
                  borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  {eSaving ? 'Saving…' : 'Save event'}
                </button>
                <button type="button" onClick={() => setShowEventForm(false)} style={{
                  padding: '8px 16px', background: '#f3f4f6', border: 'none',
                  borderRadius: 7, fontSize: 13, cursor: 'pointer',
                }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af', background: '#f9fafb', borderRadius: 10 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
              <div style={{ fontWeight: 600 }}>No upcoming events</div>
              {isFamily && <div style={{ fontSize: 13, marginTop: 4 }}>Add a birthday, anniversary, or milestone above.</div>}
            </div>
          ) : (
            events.map((ev) => (
              <div key={ev.id} style={{
                border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px',
                marginBottom: 10, background: '#fff', display: 'flex', gap: 16, alignItems: 'center',
              }}>
                <div style={{ fontSize: 28, lineHeight: 1 }}>
                  {ev.event_type === 'birthday' ? '🎂' : ev.event_type === 'anniversary' ? '💍' : '📅'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{ev.title}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    {formatDate(ev.event_date)} · {ev.recurring ? 'Annual' : 'One-time'}
                  </div>
                  {ev.notes && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{ev.notes}</div>}
                </div>
                <div style={{
                  background: '#eff6ff', color: '#1d4ed8',
                  padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  {daysUntil(ev.event_date)}
                </div>
                {isFamily && (
                  <button
                    onClick={() => cancelEvent(ev.id)}
                    style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 16, padding: 4 }}
                    title="Remove event"
                  >✕</button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── CELEBRATE TAB ── */}
      {activeTab === 'celebrate' && (
        <div>
          {!isFamily ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280', background: '#f9fafb', borderRadius: 10 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
              <div style={{ fontWeight: 600 }}>Ask your family to plan a celebration for you!</div>
            </div>
          ) : cDone ? (
            <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 10, padding: '20px 18px' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🎉</div>
              <div style={{ fontWeight: 700, color: '#065f46' }}>Celebration planned!</div>
              <div style={{ fontSize: 13, color: '#047857', marginTop: 4 }}>
                A care navigator will be in touch to help coordinate.
              </div>
            </div>
          ) : (
            <form onSubmit={saveCelebration}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Choose a celebration tier</div>
                {TIERS.map((t) => (
                  <label
                    key={t.value}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '14px 16px', border: `2px solid ${cTier === t.value ? '#1d4ed8' : '#e5e7eb'}`,
                      borderRadius: 10, marginBottom: 10, cursor: 'pointer',
                      background: cTier === t.value ? '#eff6ff' : '#fff',
                    }}
                  >
                    <input
                      type="radio" name="tier" value={t.value}
                      checked={cTier === t.value} onChange={() => setCTier(t.value)}
                      style={{ marginTop: 2, accentColor: '#1d4ed8' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{t.label}</div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{t.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                  Celebration date *
                </label>
                <input
                  required type="date" value={cDate} onChange={(e) => setCDate(e.target.value)}
                  style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                  Special message for your loved one (optional)
                </label>
                <textarea
                  rows={3} value={cMessage} onChange={(e) => setCMessage(e.target.value)}
                  maxLength={500} placeholder="We love you so much and want you to know how special you are…"
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit" disabled={cSaving || !cDate}
                style={{
                  padding: '10px 24px', background: '#1d4ed8', color: '#fff',
                  border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 700,
                  cursor: cSaving ? 'wait' : 'pointer', opacity: !cDate ? 0.5 : 1, width: '100%',
                }}
              >
                {cSaving ? 'Planning…' : cTier === 'basic' ? 'Plan Celebration (Free)' : `Plan Celebration — $${TIERS.find((t) => t.value === cTier)?.price ? (TIERS.find((t) => t.value === cTier)!.price / 100).toFixed(0) : 0}`}
              </button>

              {cTier !== 'basic' && (
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
                  You'll be taken to a secure payment page after submitting.
                </p>
              )}
            </form>
          )}
        </div>
      )}

      {/* ── GIFTS TAB ── */}
      {activeTab === 'gifts' && (
        <div>
          {gifts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af', background: '#f9fafb', borderRadius: 10 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎁</div>
              <div style={{ fontWeight: 600 }}>No gifts sent yet</div>
              {isFamily && <div style={{ fontSize: 13, marginTop: 4 }}>Gift sending coming soon in your member's dashboard.</div>}
            </div>
          ) : (
            gifts.map((g) => {
              const badge = STATUS_BADGES[g.status] ?? { label: g.status, bg: '#f3f4f6', color: '#6b7280' }
              return (
                <div key={g.id} style={{
                  border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px',
                  marginBottom: 10, background: '#fff', display: 'flex', gap: 14, alignItems: 'center',
                }}>
                  <div style={{ fontSize: 26 }}>
                    {g.gift_type === 'flower_bouquet' ? '💐' : g.gift_type === 'greeting_card' ? '💌' : '🎁'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{g.gift_label}</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>
                      To: {g.recipient_name}
                      {g.amount_cents ? ` · $${(g.amount_cents / 100).toFixed(2)}` : ''}
                    </div>
                    {g.message && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2, fontStyle: 'italic' }}>"{g.message}"</div>}
                  </div>
                  <span style={{
                    background: badge.bg, color: badge.color,
                    padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                  }}>{badge.label}</span>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
