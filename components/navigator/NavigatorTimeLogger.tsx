'use client'
// components/navigator/NavigatorTimeLogger.tsx
// G5.7 — Navigator time logging form + log list with approve/edit

import { useState, useEffect, useCallback } from 'react'

interface Member { id: string; full_name: string; preferred_name: string | null }
interface TimeLog {
  id: string; logged_at: string; duration_minutes: number; activity_type: string
  notes: string | null; billable: boolean; approved: boolean; approved_at: string | null
  navigator: { id: string; full_name: string } | null
  member: { id: string; full_name: string; preferred_name: string | null } | null
}

const ACTIVITY_LABELS: Record<string, string> = {
  check_in: '📞 Check-in',
  care_coordination: '🤝 Care coordination',
  family_update: '👨‍👩‍👧 Family update',
  crisis_support: '🆘 Crisis support',
  event_support: '🗓 Event support',
  admin: '📋 Admin',
  ride_coordination: '🚗 Ride coordination',
  health_followup: '❤️ Health follow-up',
  other: '💬 Other',
}

interface Props {
  members: Member[]
  isAdmin?: boolean
}

export default function NavigatorTimeLogger({ members, isAdmin = false }: Props) {
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filterMember, setFilterMember] = useState('')
  const [filterApproved, setFilterApproved] = useState<string>('')
  const [successMsg, setSuccessMsg] = useState('')

  const [form, setForm] = useState({
    member_id: members[0]?.id ?? '',
    duration_minutes: 30,
    activity_type: 'check_in',
    notes: '',
    billable: true,
    logged_at: new Date().toISOString().slice(0, 16),
  })

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterMember) params.set('member_id', filterMember)
      if (filterApproved !== '') params.set('approved', filterApproved)
      const res = await fetch(`/api/navigator/time-logs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [filterMember, filterApproved])

  useEffect(() => { loadLogs() }, [loadLogs])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/navigator/time-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          logged_at: new Date(form.logged_at).toISOString(),
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setForm(f => ({ ...f, notes: '', duration_minutes: 30, activity_type: 'check_in' }))
        setSuccessMsg('Time logged!')
        setTimeout(() => setSuccessMsg(''), 3000)
        loadLogs()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleApprove(id: string, approved: boolean) {
    await fetch(`/api/navigator/time-logs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved }),
    })
    loadLogs()
  }

  const totalMinutes = logs.reduce((s, l) => s + l.duration_minutes, 0)
  const pendingCount = logs.filter(l => !l.approved).length

  const memberName = (m: TimeLog['member']) =>
    m ? (m.preferred_name ?? m.full_name) : 'Unknown'

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total entries', value: logs.length },
          { label: 'Total hours', value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` },
          { label: 'Pending approval', value: pendingCount },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-indigo-700">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3 flex-wrap items-center">
        <select
          value={filterMember}
          onChange={e => setFilterMember(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All members</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.preferred_name ?? m.full_name}</option>
          ))}
        </select>
        {isAdmin && (
          <select
            value={filterApproved}
            onChange={e => setFilterApproved(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All status</option>
            <option value="false">Pending approval</option>
            <option value="true">Approved</option>
          </select>
        )}
        <div className="ml-auto">
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Log time
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-800">
          {successMsg}
        </div>
      )}

      {/* Log form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Log Time</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Member *</label>
              <select
                value={form.member_id}
                onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.preferred_name ?? m.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Duration (minutes) *</label>
              <input
                type="number"
                min={1}
                value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date & time</label>
              <input
                type="datetime-local"
                value={form.logged_at}
                onChange={e => setForm(f => ({ ...f, logged_at: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Activity type</label>
              <select
                value={form.activity_type}
                onChange={e => setForm(f => ({ ...f, activity_type: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Brief description of interaction..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.billable}
                  onChange={e => setForm(f => ({ ...f, billable: e.target.checked }))}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Billable time</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save log entry'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Log list */}
      {loading ? (
        <div className="py-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-500">No time entries found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div
              key={log.id}
              className={`rounded-xl border p-4 ${log.approved ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 text-sm">{memberName(log.member)}</p>
                    <span className="text-xs text-gray-500">
                      {ACTIVITY_LABELS[log.activity_type] ?? log.activity_type}
                    </span>
                    {!log.billable && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Non-billable</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(log.logged_at).toLocaleString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    })}
                    {log.navigator && ` · ${log.navigator.full_name}`}
                  </p>
                  {log.notes && <p className="text-xs text-gray-500 mt-1 italic">{log.notes}</p>}
                </div>
                <div className="flex-shrink-0 text-right space-y-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {log.duration_minutes >= 60
                      ? `${Math.floor(log.duration_minutes / 60)}h ${log.duration_minutes % 60}m`
                      : `${log.duration_minutes}m`}
                  </p>
                  {log.approved ? (
                    <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">✓ Approved</span>
                  ) : isAdmin ? (
                    <button
                      onClick={() => handleApprove(log.id, true)}
                      className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 hover:bg-indigo-200"
                    >
                      Approve
                    </button>
                  ) : (
                    <span className="inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">Pending</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
