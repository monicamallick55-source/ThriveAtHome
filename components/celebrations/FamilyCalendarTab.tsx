'use client'

import { useState, useEffect } from 'react'

interface FamilyEvent {
  id: string
  person_name: string
  relationship?: string
  event_type: string
  title: string
  event_date: string
  end_date?: string
  recurs_yearly: boolean
  notes?: string
  aria_can_mention: boolean
}

const EVENT_ICONS: Record<string, string> = {
  birthday: '🎂',
  anniversary: '💍',
  graduation: '🎓',
  new_baby: '👶',
  wedding: '💒',
  travel: '✈️',
  party: '🎉',
  holiday: '🏖️',
  other: '📅',
}

export default function FamilyCalendarTab({
  memberId,
  memberName,
}: {
  memberId: string
  memberName: string
}) {
  const [events, setEvents] = useState<FamilyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    person_name: '',
    relationship: '',
    event_type: 'birthday',
    title: '',
    event_date: '',
    end_date: '',
    recurs_yearly: false,
    notes: '',
    aria_can_mention: true,
  })

  useEffect(() => {
    fetch(`/api/family/events?memberId=${memberId}`)
      .then(r => r.json())
      .then(d => { setEvents(d.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [memberId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/family/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, member_id: memberId }),
      })
      const { data } = await res.json()
      if (data) {
        setEvents(prev => [...prev, data].sort((a, b) => a.event_date.localeCompare(b.event_date)))
        setShowForm(false)
        setForm({ person_name: '', relationship: '', event_type: 'birthday', title: '', event_date: '', end_date: '', recurs_yearly: false, notes: '', aria_can_mention: true })
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/family/events?id=${id}`, { method: 'DELETE' })
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  if (loading) return <div className="text-gray-400 text-sm">Loading calendar…</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {events.length === 0
            ? `No family dates added yet for ${memberName}`
            : `${events.length} date${events.length !== 1 ? 's' : ''} on the calendar`}
        </p>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          + Add a family date
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 mb-6 space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white">Add a family date</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Person's name *</label>
              <input
                required
                value={form.person_name}
                onChange={e => setForm(f => ({ ...f, person_name: e.target.value }))}
                placeholder="Sophie (granddaughter)"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Relationship</label>
              <input
                value={form.relationship}
                onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}
                placeholder="Granddaughter"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Event type *</label>
              <select
                value={form.event_type}
                onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              >
                {Object.entries(EVENT_ICONS).map(([type, icon]) => (
                  <option key={type} value={type}>{icon} {type.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Title *</label>
              <input
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Sophie's 16th birthday"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date *</label>
              <input
                required
                type="date"
                value={form.event_date}
                onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            {form.event_type === 'travel' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">End date (travel)</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                />
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.recurs_yearly}
                onChange={e => setForm(f => ({ ...f, recurs_yearly: e.target.checked }))}
                className="rounded"
              />
              Repeats every year
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.aria_can_mention}
                onChange={e => setForm(f => ({ ...f, aria_can_mention: e.target.checked }))}
                className="rounded"
              />
              Aria can mention this
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save date'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {events.map(event => (
          <div key={event.id} className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
            <span className="text-2xl">{EVENT_ICONS[event.event_type] ?? '📅'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-white text-sm">{event.title}</span>
                {event.recurs_yearly && <span className="text-xs text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded">yearly</span>}
                {!event.aria_can_mention && <span className="text-xs text-gray-400">private</span>}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {event.person_name}{event.relationship ? ` · ${event.relationship}` : ''} · {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              {event.notes && <div className="text-xs text-gray-400 mt-1">{event.notes}</div>}
            </div>
            <button
              onClick={() => handleDelete(event.id)}
              className="text-gray-300 hover:text-red-400 text-xs transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}