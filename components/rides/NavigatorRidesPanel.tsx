'use client'
// components/rides/NavigatorRidesPanel.tsx
// G5.8 — Navigator view of all ride bookings with confirm/update/cancel

import { useState, useEffect, useCallback } from 'react'

interface RideBooking {
  id: string
  pickup_address: string | null
  dropoff_address: string | null
  pickup_time: string
  notes: string | null
  status: string
  driver_name: string | null
  driver_phone: string | null
  confirmed_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  members: { id: string; full_name: string; preferred_name: string | null; phone: string | null } | null
  events: { id: string; title: string; start_time: string; location: string | null } | null
}

const STATUS_BADGE: Record<string, string> = {
  requested: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  en_route: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function NavigatorRidesPanel() {
  const [bookings, setBookings] = useState<RideBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [driverForm, setDriverForm] = useState({ driver_name: '', driver_phone: '' })
  const [actionMsg, setActionMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const statusParam = statusFilter === 'active'
        ? '&status=requested'
        : statusFilter !== 'all' ? `&status=${statusFilter}` : ''
      const res = await fetch(`/api/ride-bookings?${statusParam}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  async function updateStatus(id: string, updates: Record<string, string>) {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/ride-bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        setActionMsg('Updated!')
        setTimeout(() => setActionMsg(''), 3000)
        setExpandedId(null)
        load()
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const displayName = (b: RideBooking) =>
    b.members?.preferred_name ?? b.members?.full_name ?? 'Unknown member'

  const statuses = ['active', 'confirmed', 'en_route', 'completed', 'cancelled', 'all']

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
              statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {actionMsg && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-800">
          {actionMsg}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-2xl mb-2">🚗</p>
          <p className="text-sm text-gray-500">No ride bookings found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              {/* Summary row */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{displayName(b)}</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(b.pickup_time).toLocaleString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    })}
                    {b.events && ` · ${b.events.title}`}
                  </p>
                  {b.dropoff_address && (
                    <p className="text-xs text-gray-400 truncate">📍 {b.dropoff_address}</p>
                  )}
                </div>
                <span className="text-gray-400 text-xs">{expandedId === b.id ? '▲' : '▼'}</span>
              </div>

              {/* Expanded detail */}
              {expandedId === b.id && (
                <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Pickup</p>
                      <p className="text-gray-800">{b.pickup_address ?? 'Home address'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Drop-off</p>
                      <p className="text-gray-800">{b.dropoff_address ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Member phone</p>
                      <p className="text-gray-800">{b.members?.phone ?? '—'}</p>
                    </div>
                    {b.notes && (
                      <div>
                        <p className="text-xs font-medium text-gray-500">Notes</p>
                        <p className="text-gray-800">{b.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Driver assignment */}
                  {['requested', 'confirmed'].includes(b.status) && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Assign Driver</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Driver name"
                          value={driverForm.driver_name}
                          onChange={e => setDriverForm(f => ({ ...f, driver_name: e.target.value }))}
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          placeholder="Phone"
                          value={driverForm.driver_phone}
                          onChange={e => setDriverForm(f => ({ ...f, driver_phone: e.target.value }))}
                          className="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {b.status === 'requested' && (
                      <button
                        onClick={() => updateStatus(b.id, {
                          status: 'confirmed',
                          ...(driverForm.driver_name ? { driver_name: driverForm.driver_name } : {}),
                          ...(driverForm.driver_phone ? { driver_phone: driverForm.driver_phone } : {}),
                        })}
                        disabled={!!updatingId}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {updatingId === b.id ? 'Saving…' : '✅ Confirm ride'}
                      </button>
                    )}
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => updateStatus(b.id, { status: 'en_route' })}
                        disabled={!!updatingId}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        🚗 Mark En Route
                      </button>
                    )}
                    {b.status === 'en_route' && (
                      <button
                        onClick={() => updateStatus(b.id, { status: 'completed' })}
                        disabled={!!updatingId}
                        className="rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                      >
                        🏁 Mark Completed
                      </button>
                    )}
                    {['requested', 'confirmed'].includes(b.status) && (
                      <button
                        onClick={() => updateStatus(b.id, { status: 'cancelled', cancel_reason: 'Cancelled by navigator' })}
                        disabled={!!updatingId}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        ✕ Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
