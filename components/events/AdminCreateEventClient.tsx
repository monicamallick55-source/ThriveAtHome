'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type EventFormat = 'phone_only' | 'video_or_phone' | 'in_person'

const FORMAT_OPTIONS: { value: EventFormat; label: string }[] = [
  { value: 'phone_only', label: 'Phone only' },
  { value: 'video_or_phone', label: 'Video or phone' },
  { value: 'in_person', label: 'In person' },
]

export default function AdminCreateEventClient() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_type: 'general',
    host_name: '',
    event_date: '',
    event_time: '',
    timezone: 'America/New_York',
    duration_minutes: 60,
    format: 'phone_only' as EventFormat,
    dial_in_number: '',
    dial_in_code: '',
    video_link: '',
    location_address: '',
    max_capacity: '',
    is_recurring: false,
    recurrence_pattern: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function update(field: string, value: string | boolean | number) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.title || !form.event_date || !form.event_time) {
      setError('Title, date, and time are required.')
      return
    }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        description: form.description || null,
        event_type: form.event_type,
        host_name: form.host_name || null,
        event_date: form.event_date,
        event_time: form.event_time,
        timezone: form.timezone,
        duration_minutes: Number(form.duration_minutes),
        format: form.format,
        max_capacity: form.max_capacity ? Number(form.max_capacity) : null,
        is_recurring: form.is_recurring,
        recurrence_pattern: form.is_recurring ? form.recurrence_pattern || null : null,
      }

      if (form.format === 'phone_only' || form.format === 'video_or_phone') {
        body.dial_in_number = form.dial_in_number || null
        body.dial_in_code = form.dial_in_code || null
      }
      if (form.format === 'video_or_phone') {
        body.video_link = form.video_link || null
      }
      if (form.format === 'in_person') {
        body.location_address = form.location_address || null
      }

      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Failed to create event.')
        return
      }
      setSuccess(true)
      setTimeout(() => router.push('/dashboard/events'), 1500)
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%', height: '52px', border: '1.5px solid var(--color-warm-grey)',
    borderRadius: '10px', padding: '0 14px', fontFamily: 'var(--font-body)',
    fontSize: '16px', color: 'var(--color-text-primary)',
    backgroundColor: 'white', boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    display: 'block', fontFamily: 'var(--font-body)', fontSize: '15px',
    fontWeight: 500, color: 'var(--color-navy)', marginBottom: '6px',
  }

  if (success) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '48px 32px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-teal)', margin: '0 0 8px' }}>Event created!</p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: 0 }}>Redirecting to events page…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {error && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '12px 16px', color: '#DC2626', fontFamily: 'var(--font-body)', fontSize: '15px' }}>
          {error}
        </div>
      )}

      <div>
        <label style={labelStyle} htmlFor="ev-title">Event title *</label>
        <input id="ev-title" style={inputStyle} value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Senior Trivia Night" required />
      </div>

      <div>
        <label style={labelStyle} htmlFor="ev-desc">Description</label>
        <textarea id="ev-desc" style={{ ...inputStyle, height: '100px', padding: '12px 14px', resize: 'vertical' }} value={form.description} onChange={e => update('description', e.target.value)} placeholder="What will happen at this event?" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle} htmlFor="ev-date">Date *</label>
          <input id="ev-date" type="date" style={inputStyle} value={form.event_date} onChange={e => update('event_date', e.target.value)} required />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ev-time">Time *</label>
          <input id="ev-time" type="time" style={inputStyle} value={form.event_time} onChange={e => update('event_time', e.target.value)} required />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle} htmlFor="ev-host">Host name</label>
          <input id="ev-host" style={inputStyle} value={form.host_name} onChange={e => update('host_name', e.target.value)} placeholder="e.g. Dr. Sarah Williams" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ev-duration">Duration (minutes)</label>
          <input id="ev-duration" type="number" style={inputStyle} value={form.duration_minutes} onChange={e => update('duration_minutes', Number(e.target.value))} min={15} max={240} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Format *</label>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {FORMAT_OPTIONS.map(opt => (
            <label key={opt.value} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px', borderRadius: '10px',
              border: `2px solid ${form.format === opt.value ? 'var(--color-teal)' : 'var(--color-warm-grey)'}`,
              backgroundColor: form.format === opt.value ? 'var(--color-teal)' + '10' : 'white',
              cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '15px',
              color: 'var(--color-navy)', fontWeight: form.format === opt.value ? 600 : 400,
            }}>
              <input type="radio" name="ev-format" value={opt.value} checked={form.format === opt.value} onChange={() => update('format', opt.value)} style={{ margin: 0 }} />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Phone details */}
      {(form.format === 'phone_only' || form.format === 'video_or_phone') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle} htmlFor="ev-phone">Dial-in number</label>
            <input id="ev-phone" style={inputStyle} value={form.dial_in_number} onChange={e => update('dial_in_number', e.target.value)} placeholder="e.g. 1-800-555-0100" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="ev-code">Conference code</label>
            <input id="ev-code" style={inputStyle} value={form.dial_in_code} onChange={e => update('dial_in_code', e.target.value)} placeholder="e.g. 123456" />
          </div>
        </div>
      )}

      {/* Video link */}
      {form.format === 'video_or_phone' && (
        <div>
          <label style={labelStyle} htmlFor="ev-video">Video link (optional)</label>
          <input id="ev-video" style={inputStyle} value={form.video_link} onChange={e => update('video_link', e.target.value)} placeholder="e.g. https://zoom.us/j/..." />
        </div>
      )}

      {/* Address for in-person */}
      {form.format === 'in_person' && (
        <div>
          <label style={labelStyle} htmlFor="ev-addr">Location address</label>
          <input id="ev-addr" style={inputStyle} value={form.location_address} onChange={e => update('location_address', e.target.value)} placeholder="e.g. 123 Main St, Springfield, IL" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle} htmlFor="ev-cap">Max capacity (optional)</label>
          <input id="ev-cap" type="number" style={inputStyle} value={form.max_capacity} onChange={e => update('max_capacity', e.target.value)} placeholder="Leave blank for unlimited" min={1} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ev-tz">Timezone</label>
          <select id="ev-tz" style={{ ...inputStyle, appearance: 'none' as const }} value={form.timezone} onChange={e => update('timezone', e.target.value)}>
            <option value="America/New_York">Eastern (ET)</option>
            <option value="America/Chicago">Central (CT)</option>
            <option value="America/Denver">Mountain (MT)</option>
            <option value="America/Los_Angeles">Pacific (PT)</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input id="ev-recurring" type="checkbox" checked={form.is_recurring} onChange={e => update('is_recurring', e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
        <label htmlFor="ev-recurring" style={{ ...labelStyle, margin: 0, cursor: 'pointer' }}>Recurring event</label>
      </div>

      {form.is_recurring && (
        <div>
          <label style={labelStyle} htmlFor="ev-recur">Recurrence pattern</label>
          <input id="ev-recur" style={inputStyle} value={form.recurrence_pattern} onChange={e => update('recurrence_pattern', e.target.value)} placeholder="e.g. Every Tuesday at 2pm" />
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          backgroundColor: 'var(--color-teal)', color: 'white', border: 'none',
          borderRadius: '12px', padding: '16px 32px',
          fontFamily: 'var(--font-body)', fontSize: '17px', fontWeight: 600,
          cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
          alignSelf: 'flex-start', minHeight: '52px',
        }}
      >
        {submitting ? 'Creating event…' : 'Create event'}
      </button>
    </form>
  )
}
