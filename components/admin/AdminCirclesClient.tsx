'use client'

import { useState } from 'react'
import type { CulturalCircle } from '@/lib/data/circles'

const LANGUAGE_OPTIONS = [
  { value: 'english', label: 'English' },
  { value: 'spanish', label: 'Español' },
  { value: 'mandarin', label: '中文 (Mandarin)' },
  { value: 'vietnamese', label: 'Tiếng Việt' },
  { value: 'korean', label: '한국어' },
  { value: 'hindi', label: 'हिन्दी' },
  { value: 'tagalog', label: 'Tagalog' },
  { value: 'arabic', label: 'العربية' },
  { value: 'polish', label: 'Polski' },
]

const INTEREST_TAG_OPTIONS = [
  '', 'Family', 'Gardening', 'Cooking', 'Music', 'Travel memories',
  'Sports', 'Books', 'Movies & TV', 'Faith & spirituality', 'History', 'Nature', 'Current events',
]

interface CommunityForm {
  circle_name: string
  description: string
  primary_language: string
  interest_tag: string
  community_type: string
}

const defaultCommunityForm: CommunityForm = {
  circle_name: '',
  description: '',
  primary_language: 'english',
  interest_tag: '',
  community_type: 'cultural',
}

const CIRCLE_COLORS = [
  '#E8401C', '#1E6B9E', '#2A8A5E', '#8A4A2E',
  '#6A3D9A', '#D4880E', '#C74B8A', '#1A7A6A',
  '#5A2D82', '#C04A1A', '#2A6E3A', '#9A1A3A',
]

interface Props {
  circles: CulturalCircle[]
}

interface EventForm {
  circleIds: string[]
  title: string
  description: string
  event_date: string
  event_time: string
  format: string
  dial_in_number: string
  dial_in_code: string
  location_address: string
  is_platform_wide: boolean
}

const defaultForm: EventForm = {
  circleIds: [],
  title: '',
  description: '',
  event_date: '',
  event_time: '',
  format: 'phone',
  dial_in_number: '',
  dial_in_code: '',
  location_address: '',
  is_platform_wide: false,
}

export default function AdminCirclesClient({ circles: initialCircles }: Props) {
  const [circles, setCircles] = useState<CulturalCircle[]>(initialCircles)
  const [showEventForm, setShowEventForm] = useState(false)
  const [showCreateCircleForm, setShowCreateCircleForm] = useState(false)
  const [form, setForm] = useState<EventForm>(defaultForm)
  const [communityForm, setCommunityForm] = useState<CommunityForm>(defaultCommunityForm)
  const [submitting, setSubmitting] = useState(false)
  const [creatingCircle, setCreatingCircle] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [circleFormError, setCircleFormError] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const handleCreateCircle = async (e: React.FormEvent) => {
    e.preventDefault()
    setCircleFormError(null)
    if (!communityForm.circle_name.trim()) {
      setCircleFormError('Community name is required.')
      return
    }
    if (!communityForm.description.trim()) {
      setCircleFormError('Description is required.')
      return
    }
    setCreatingCircle(true)
    try {
      const res = await fetch('/api/admin/circles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circle_name: communityForm.circle_name.trim(),
          description: communityForm.description.trim(),
          primary_language: communityForm.primary_language,
          interest_tag: communityForm.interest_tag || null,
          community_type: communityForm.community_type,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setCircles(prev => [...prev, data.circle])
        setCommunityForm(defaultCommunityForm)
        setShowCreateCircleForm(false)
        showToast(`Community "${data.circle.circle_name}" created successfully`)
      } else {
        const data = await res.json().catch(() => ({}))
        setCircleFormError((data as { error?: string }).error ?? 'Failed to create community')
      }
    } finally {
      setCreatingCircle(false)
    }
  }

  const toggleCircle = (circleId: string) => {
    setForm(f => ({
      ...f,
      circleIds: f.circleIds.includes(circleId)
        ? f.circleIds.filter(id => id !== circleId)
        : [...f.circleIds, circleId],
    }))
    setValidationError(null)
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!form.title.trim() || !form.event_date) {
      setValidationError('Title and date are required.')
      return
    }
    if (!form.is_platform_wide && form.circleIds.length === 0) {
      setValidationError('Select at least one circle, or check "Show to all members".')
      return
    }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        circle_ids: form.circleIds,
        title: form.title.trim(),
        event_date: form.event_date,
        format: form.format,
        is_platform_wide: form.is_platform_wide,
      }
      if (form.description.trim()) body.description = form.description.trim()
      if (form.event_time) body.event_time = form.event_time
      if (form.format !== 'in_person') {
        if (form.dial_in_number.trim()) body.dial_in_number = form.dial_in_number.trim()
        if (form.dial_in_code.trim()) body.dial_in_code = form.dial_in_code.trim()
      } else {
        if (form.location_address.trim()) body.location_address = form.location_address.trim()
      }

      const res = await fetch('/api/admin/circles/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setForm(defaultForm)
        setShowEventForm(false)
        showToast('Event created successfully')
      } else {
        const data = await res.json().catch(() => ({}))
        showToast(`Error: ${(data as { error?: string }).error ?? 'Failed to create event'}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px',
    fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', height: '44px', padding: '0 12px',
    border: '1px solid var(--color-warm-grey)', borderRadius: '10px',
    fontFamily: 'var(--font-body)', fontSize: '15px', outline: 'none',
    backgroundColor: 'white', boxSizing: 'border-box',
  }

  return (
    <div style={{ flex: 1, padding: '32px 24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {toast && (
          <div style={{
            position: 'fixed', bottom: '24px', right: '24px',
            backgroundColor: 'var(--color-navy)', color: 'white',
            padding: '12px 20px', borderRadius: '12px',
            fontFamily: 'var(--font-body)', fontSize: '15px',
            zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}>{toast}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500,
              color: 'var(--color-navy)', margin: '0 0 4px',
            }}>Communities</h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: 0 }}>
              {circles.length} active communities
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setShowCreateCircleForm(!showCreateCircleForm); setCircleFormError(null); setShowEventForm(false) }}
              style={{
                padding: '10px 20px', borderRadius: '10px',
                fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500,
                cursor: 'pointer', border: '1px solid var(--color-teal)',
                backgroundColor: showCreateCircleForm ? 'white' : 'var(--color-teal)', color: showCreateCircleForm ? 'var(--color-teal)' : 'white',
              }}
            >
              {showCreateCircleForm ? 'Cancel' : '+ New Community'}
            </button>
            <button
              onClick={() => { setShowEventForm(!showEventForm); setValidationError(null); setShowCreateCircleForm(false) }}
              style={{
                padding: '10px 20px', borderRadius: '10px',
                fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500,
                cursor: 'pointer', border: 'none',
                backgroundColor: 'var(--color-navy)', color: 'white',
              }}
            >
              {showEventForm ? 'Cancel' : '+ Create Event'}
            </button>
          </div>
        </div>

        {/* Create New Community Form */}
        {showCreateCircleForm && (
          <div style={{
            backgroundColor: 'white', borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '24px', marginBottom: '32px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500,
              color: 'var(--color-navy)', margin: '0 0 20px',
            }}>Create New Community</h2>
            <form onSubmit={handleCreateCircle}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Community name *</label>
                <input
                  type="text"
                  value={communityForm.circle_name}
                  onChange={e => setCommunityForm(f => ({ ...f, circle_name: e.target.value }))}
                  placeholder="e.g. Nature Walkers Circle"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Description *</label>
                <textarea
                  value={communityForm.description}
                  onChange={e => setCommunityForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="A warm 1–2 sentence description of this community..."
                  rows={3}
                  style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Community type *</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { value: 'cultural', label: 'Cultural & Heritage', desc: 'Cultural, ethnic, and heritage communities' },
                    { value: 'interest', label: 'Interest & Hobby', desc: 'Hobby, interest, and activity groups' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'flex-start', gap: '10px',
                        padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                        border: communityForm.community_type === opt.value
                          ? '2px solid var(--color-teal)'
                          : '2px solid var(--color-warm-grey)',
                        backgroundColor: communityForm.community_type === opt.value
                          ? 'rgba(0,128,120,0.06)' : 'white',
                        transition: 'all 0.15s',
                      }}
                    >
                      <input
                        type="radio"
                        name="community_type"
                        value={opt.value}
                        checked={communityForm.community_type === opt.value}
                        onChange={() => setCommunityForm(f => ({ ...f, community_type: opt.value }))}
                        style={{ marginTop: '2px', accentColor: 'var(--color-teal)' }}
                      />
                      <div>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', display: 'block' }}>
                          {opt.label}
                        </span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {opt.desc}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Primary language</label>
                  <select
                    value={communityForm.primary_language}
                    onChange={e => setCommunityForm(f => ({ ...f, primary_language: e.target.value }))}
                    style={{ ...inputStyle }}
                  >
                    {LANGUAGE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Interest tag</label>
                  <select
                    value={communityForm.interest_tag}
                    onChange={e => setCommunityForm(f => ({ ...f, interest_tag: e.target.value }))}
                    style={{ ...inputStyle }}
                  >
                    {INTEREST_TAG_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt || '— None —'}</option>
                    ))}
                  </select>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                    Used to show this community in the &ldquo;Recommended for you&rdquo; section.
                  </p>
                </div>
              </div>

              {circleFormError && (
                <div style={{
                  backgroundColor: '#fff0f0', border: '1px solid #ffcccc',
                  borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
                  fontFamily: 'var(--font-body)', fontSize: '14px', color: '#c0392b',
                }}>{circleFormError}</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setCommunityForm(defaultCommunityForm); setShowCreateCircleForm(false); setCircleFormError(null) }}
                  style={{
                    padding: '10px 20px', borderRadius: '10px',
                    fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500,
                    cursor: 'pointer', border: '1px solid var(--color-warm-grey)',
                    backgroundColor: 'white', color: 'var(--color-text-secondary)',
                  }}
                >Cancel</button>
                <button
                  type="submit"
                  disabled={creatingCircle}
                  style={{
                    padding: '10px 24px', borderRadius: '10px',
                    fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500,
                    cursor: creatingCircle ? 'wait' : 'pointer', border: 'none',
                    backgroundColor: 'var(--color-teal)', color: 'white',
                    opacity: creatingCircle ? 0.7 : 1,
                  }}
                >
                  {creatingCircle ? 'Creating...' : 'Create community'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Create Event Form */}
        {showEventForm && (
          <div style={{
            backgroundColor: 'white', borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '24px', marginBottom: '32px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500,
              color: 'var(--color-navy)', margin: '0 0 20px',
            }}>Create Event</h2>
            <form onSubmit={handleCreateEvent}>

              {/* Title + Format */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Event title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Monthly Gathering"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Format *</label>
                  <select
                    value={form.format}
                    onChange={e => setForm(f => ({ ...f, format: e.target.value }))}
                    style={{ ...inputStyle, height: '44px' }}
                  >
                    <option value="phone">Phone only</option>
                    <option value="video">Video or phone</option>
                    <option value="in_person">In-person</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional event description"
                  rows={2}
                  style={{
                    ...inputStyle, height: 'auto', padding: '10px 12px',
                    resize: 'vertical', lineHeight: 1.5,
                  }}
                />
              </div>

              {/* Date + Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Date *</label>
                  <input
                    type="date"
                    value={form.event_date}
                    onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Time</label>
                  <input
                    type="time"
                    value={form.event_time}
                    onChange={e => setForm(f => ({ ...f, event_time: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Location / dial-in details */}
              {form.format !== 'in_person' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>Dial-in number</label>
                    <input
                      type="tel"
                      value={form.dial_in_number}
                      onChange={e => setForm(f => ({ ...f, dial_in_number: e.target.value }))}
                      placeholder="e.g. 1-800-555-0100"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Access code</label>
                    <input
                      type="text"
                      value={form.dial_in_code}
                      onChange={e => setForm(f => ({ ...f, dial_in_code: e.target.value }))}
                      placeholder="e.g. 123456#"
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              {form.format === 'in_person' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Location address</label>
                  <input
                    type="text"
                    value={form.location_address}
                    onChange={e => setForm(f => ({ ...f, location_address: e.target.value }))}
                    placeholder="e.g. 123 Main St, Community Hall, Room 2"
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Platform-wide toggle */}
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="is_platform_wide"
                  checked={form.is_platform_wide}
                  onChange={e => { setForm(f => ({ ...f, is_platform_wide: e.target.checked })); setValidationError(null) }}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-teal)' }}
                />
                <label htmlFor="is_platform_wide" style={{ ...labelStyle, margin: 0, cursor: 'pointer' }}>
                  Show to all members (platform-wide event)
                </label>
              </div>

              {/* Circle selection — optional when platform-wide */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>
                  Community circles
                  {!form.is_platform_wide && (
                    <span style={{ color: '#c0392b', marginLeft: '4px' }}>*</span>
                  )}
                  <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', marginLeft: '8px', fontSize: '13px' }}>
                    {form.is_platform_wide
                      ? '— optional, select to also show inside specific circles'
                      : '— required if not platform-wide, select one or more'}
                  </span>
                </label>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '8px', maxHeight: '280px', overflowY: 'auto',
                  border: '1px solid var(--color-warm-grey)', borderRadius: '10px', padding: '12px',
                }}>
                  {circles.map((circle, i) => {
                    const isSelected = form.circleIds.includes(circle.id)
                    const color = CIRCLE_COLORS[i % CIRCLE_COLORS.length]
                    return (
                      <label
                        key={circle.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                          backgroundColor: isSelected ? color + '12' : 'transparent',
                          border: isSelected ? `1px solid ${color}` : '1px solid transparent',
                          transition: 'all 0.15s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCircle(circle.id)}
                          style={{ accentColor: color, width: '16px', height: '16px' }}
                        />
                        <span style={{
                          fontFamily: 'var(--font-body)', fontSize: '13px',
                          color: isSelected ? color : 'var(--color-text-primary)', fontWeight: isSelected ? 600 : 400,
                        }}>
                          {circle.circle_name}
                        </span>
                      </label>
                    )
                  })}
                </div>
                {form.circleIds.length > 0 && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
                    {form.circleIds.length} circle{form.circleIds.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Validation error */}
              {validationError && (
                <div style={{
                  backgroundColor: '#fff0f0', border: '1px solid #ffcccc',
                  borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
                  fontFamily: 'var(--font-body)', fontSize: '14px', color: '#c0392b',
                }}>
                  {validationError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setForm(defaultForm); setShowEventForm(false); setValidationError(null) }}
                  style={{
                    padding: '10px 20px', borderRadius: '10px',
                    fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500,
                    cursor: 'pointer', border: '1px solid var(--color-warm-grey)',
                    backgroundColor: 'white', color: 'var(--color-text-secondary)',
                  }}
                >Cancel</button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 24px', borderRadius: '10px',
                    fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500,
                    cursor: submitting ? 'wait' : 'pointer', border: 'none',
                    backgroundColor: 'var(--color-teal)', color: 'white',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Creating...' : 'Create event'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Circles list — split by community_type */}
        {(['cultural', 'interest'] as const).map(type => {
          const sectionCircles = circles.filter(c => (c.community_type ?? 'cultural') === type)
          if (sectionCircles.length === 0) return null
          const sectionLabel = type === 'cultural' ? 'Cultural & Heritage Communities' : 'Interest & Hobby Communities'
          return (
            <div key={type} style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
                color: 'var(--color-text-secondary)', textTransform: 'uppercase',
                letterSpacing: '0.06em', margin: '0 0 12px',
              }}>
                {sectionLabel}
                <span style={{
                  marginLeft: '8px', fontSize: '12px', fontWeight: 400,
                  backgroundColor: 'var(--color-cream)', color: 'var(--color-text-secondary)',
                  padding: '1px 8px', borderRadius: '10px',
                }}>
                  {sectionCircles.length}
                </span>
              </h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                {sectionCircles.map((circle) => {
                  const i = circles.findIndex(c => c.id === circle.id)
                  return (
                    <div key={circle.id} style={{
                      backgroundColor: 'white', borderRadius: '14px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                      borderLeft: `4px solid ${CIRCLE_COLORS[i % CIRCLE_COLORS.length]}`,
                      padding: '16px 20px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: '12px',
                    }}>
                      <div>
                        <p style={{
                          fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 500,
                          color: 'var(--color-navy)', margin: '0 0 2px',
                        }}>{circle.circle_name}</p>
                        <p style={{
                          fontFamily: 'var(--font-body)', fontSize: '14px',
                          color: 'var(--color-text-secondary)', margin: 0,
                        }}>
                          {circle.member_count} {circle.member_count === 1 ? 'member' : 'members'} · {circle.primary_language}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setForm(f => ({ ...f, circleIds: [circle.id] }))
                          setShowEventForm(true)
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
                        }}
                        style={{
                          padding: '7px 14px', borderRadius: '8px',
                          fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500,
                          cursor: 'pointer', border: `1px solid ${CIRCLE_COLORS[i % CIRCLE_COLORS.length]}`,
                          backgroundColor: 'white', color: CIRCLE_COLORS[i % CIRCLE_COLORS.length],
                        }}
                      >
                        + Create event
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
