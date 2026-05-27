'use client'

import { useState } from 'react'
import type { CulturalCircle } from '@/lib/data/circles'

const CIRCLE_COLORS = [
  '#E8401C', '#1E6B9E', '#2A8A5E', '#8A4A2E',
  '#6A3D9A', '#D4880E', '#C74B8A', '#1A7A6A',
  '#5A2D82', '#C04A1A', '#2A6E3A', '#9A1A3A',
]

interface Props {
  circles: CulturalCircle[]
}

interface EventForm {
  circleId: string
  title: string
  description: string
  event_date: string
  event_time: string
  format: string
  dial_in_number: string
  dial_in_code: string
}

const defaultForm: EventForm = {
  circleId: '',
  title: '',
  description: '',
  event_date: '',
  event_time: '',
  format: 'phone',
  dial_in_number: '',
  dial_in_code: '',
}

export default function AdminCirclesClient({ circles }: Props) {
  const [showEventForm, setShowEventForm] = useState(false)
  const [form, setForm] = useState<EventForm>(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.circleId || !form.title || !form.event_date) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/circles/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circle_id: form.circleId,
          title: form.title,
          description: form.description || undefined,
          event_date: form.event_date,
          event_time: form.event_time || undefined,
          format: form.format,
          dial_in_number: form.dial_in_number || undefined,
          dial_in_code: form.dial_in_code || undefined,
        }),
      })
      if (res.ok) {
        setForm(defaultForm)
        setShowEventForm(false)
        showToast('Event created successfully')
      } else {
        const { error } = await res.json()
        showToast(`Error: ${error}`)
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
            }}>Cultural Community Circles</h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: 0 }}>
              {circles.length} active circles
            </p>
          </div>
          <button
            onClick={() => setShowEventForm(!showEventForm)}
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

        {/* Create Event Form */}
        {showEventForm && (
          <div style={{
            backgroundColor: 'white', borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '24px', marginBottom: '32px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500,
              color: 'var(--color-navy)', margin: '0 0 20px',
            }}>Create Circle Event</h2>
            <form onSubmit={handleCreateEvent}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Circle *</label>
                  <select
                    value={form.circleId}
                    onChange={e => setForm(f => ({ ...f, circleId: e.target.value }))}
                    required
                    style={{ ...inputStyle, height: '44px' }}
                  >
                    <option value="">Select a circle</option>
                    {circles.map(c => (
                      <option key={c.id} value={c.id}>{c.circle_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Format *</label>
                  <select
                    value={form.format}
                    onChange={e => setForm(f => ({ ...f, format: e.target.value }))}
                    style={{ ...inputStyle, height: '44px' }}
                  >
                    <option value="phone">Phone call</option>
                    <option value="video">Video call</option>
                    <option value="in_person">In person</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Event title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Monthly Gathering"
                  required
                  style={inputStyle}
                />
              </div>

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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Date *</label>
                  <input
                    type="date"
                    value={form.event_date}
                    onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                    required
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

              {(form.format === 'phone' || form.format === 'video') && (
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setForm(defaultForm); setShowEventForm(false) }}
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

        {/* Circles list */}
        <div style={{ display: 'grid', gap: '12px' }}>
          {circles.map((circle, i) => (
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
                  setForm(f => ({ ...f, circleId: circle.id }))
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
          ))}
        </div>
      </div>
    </div>
  )
}
