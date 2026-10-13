'use client'
// components/rides/RideBookingWidget.tsx
// G5.8 — Member/family ride booking form + status tracker

import { useState, useEffect, useCallback } from 'react'

interface RideBooking {
  id: string
  pickup_address: string | null
  dropoff_address: string | null
  pickup_time: string
  notes: string | null
  status: 'requested' | 'confirmed' | 'en_route' | 'completed' | 'cancelled'
  driver_name: string | null
  driver_phone: string | null
  confirmed_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  events: { id: string; title: string; start_time: string; location: string | null } | null
}

const STATUS_COLORS: Record<string, string> = {
  requested: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  en_route: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
}
const STATUS_LABELS: Record<string, string> = {
  requested: '⏳ Requested',
  confirmed: '✅ Confirmed',
  en_route: '🚗 En Route',
  completed: '🏁 Completed',
  cancelled: '✕ Cancelled',
}

interface Props {
  memberId: string
  eventId?: string
  eventTitle?: string
  eventTime?: string
  eventLocation?: string
  onBooked?: () => void
}

export default function RideBookingWidget({
  memberId, eventId, eventTitle, eventTime, eventLocation, onBooked,
}: Props) {
  const [bookings, setBookings] = useState<RideBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    pickup_address: '',
    dropoff_address: eventLocation ?? '',
    pickup_time: eventTime ? new Date(new Date(eventTime).getTime() - 30 * 60000).toISOString().slice(0, 16) : '',
    notes: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/ride-bookings?member_id=${memberId}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [memberId])

  useEffect(() => { load() }, [load])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.pickup_time) { setError('Pickup time is required'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/ride-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          event_id: eventId ?? null,
          pickup_address: form.pickup_address || null,
          dropoff_address: form.dropoff_address || null,
          pickup_time: new Date(form.pickup_time).toISOString(),
          notes: form.notes || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError((err as { error?: string }).error ?? 'Failed to book ride')
        return
      }
      setShowForm(false)
      setForm({ pickup_address: '', dropoff_address: eventLocation ?? '', pickup_time: '', notes: '' })
      onBooked?.()
      load()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel(id: string) {
    if (!confirm('Cancel this ride request?')) return
    await fetch(`/api/ride-bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled', cancel_reason: 'Cancelled by requester' }),
    })
    load()
  }

  const activeBookings = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled')
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled')

  return (
    <div className="space-y-4">
      {/* Active rides */}
      {loading ? (
        <div className="py-4 text-center">
          <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : activeBookings.length > 0 ? (
        <div className="space-y-3">
          {activeBookings.map(b => (
            <RideCard key={b.id} booking={b} onCancel={() => handleCancel(b.id)} />
          ))}
        </div>
      ) : !showForm ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center">
          <p className="text-2xl mb-2">🚗</p>
          <p className="text-sm text-gray-500 mb-3">No rides scheduled.</p>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Request a ride
          </button>
        </div>
      ) : null}

      {/* Book button when rides exist */}
      {activeBookings.length > 0 && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-lg border border-indigo-200 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
        >
          + Request another ride
        </button>
      )}

      {/* Booking form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Request a Ride</h3>
          {eventTitle && (
            <div className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
              🗓 For: <strong>{eventTitle}</strong>
              {eventTime && ` at ${new Date(eventTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Pickup address</label>
              <input
                type="text"
                value={form.pickup_address}
                onChange={e => setForm(f => ({ ...f, pickup_address: e.target.value }))}
                placeholder="Leave blank to use home address on file"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Drop-off address</label>
              <input
                type="text"
                value={form.dropoff_address}
                onChange={e => setForm(f => ({ ...f, dropoff_address: e.target.value }))}
                placeholder="Destination"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Pickup time *</label>
              <input
                type="datetime-local"
                value={form.pickup_time}
                onChange={e => setForm(f => ({ ...f, pickup_time: e.target.value }))}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Special notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Wheelchair accessible vehicle needed, etc."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Requesting…' : 'Request ride'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError('') }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Past bookings */}
      {pastBookings.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 select-none">
            Show past rides ({pastBookings.length})
          </summary>
          <div className="mt-2 space-y-2">
            {pastBookings.map(b => (
              <RideCard key={b.id} booking={b} />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function RideCard({ booking, onCancel }: { booking: RideBooking; onCancel?: () => void }) {
  const canCancel = ['requested', 'confirmed'].includes(booking.status) && onCancel

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[booking.status]}`}>
          {STATUS_LABELS[booking.status]}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(booking.pickup_time).toLocaleString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit',
          })}
        </span>
      </div>

      {booking.events && (
        <p className="text-xs text-indigo-700 font-medium">📅 {booking.events.title}</p>
      )}

      <div className="text-sm text-gray-600 space-y-0.5">
        {booking.pickup_address && <p>🏠 From: {booking.pickup_address}</p>}
        {booking.dropoff_address && <p>📍 To: {booking.dropoff_address}</p>}
      </div>

      {booking.driver_name && (
        <p className="text-sm text-gray-700">
          🧑‍✈️ Driver: <strong>{booking.driver_name}</strong>
          {booking.driver_phone && ` · ${booking.driver_phone}`}
        </p>
      )}

      {booking.notes && (
        <p className="text-xs text-gray-500 italic">{booking.notes}</p>
      )}

      {booking.cancel_reason && (
        <p className="text-xs text-red-600">Reason: {booking.cancel_reason}</p>
      )}

      {canCancel && (
        <button
          onClick={onCancel}
          className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2"
        >
          Cancel ride
        </button>
      )}
    </div>
  )
}
