'use client'

import { useState } from 'react'

type WorkType = 'full_time' | 'part_time' | 'contract' | 'volunteer' | 'internship'
type OppStatus = 'active' | 'closed' | 'draft'

interface Opportunity {
  id: string
  title: string
  organization: string
  description: string | null
  work_type: WorkType
  location: string | null
  remote_ok: boolean
  hours_per_week: number | null
  pay: string | null
  skills_desired: string[] | null
  industries: string[] | null
  apply_url: string | null
  apply_email: string | null
  closes_on: string | null
  status: OppStatus
  created_at: string
}

interface InterestRow {
  opportunity_id: string
  status: string
}

interface Props {
  opportunities: Opportunity[]
  interestCounts: InterestRow[]
}

const WORK_TYPE_LABELS: Record<WorkType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  volunteer: 'Volunteer',
  internship: 'Internship',
}

const STATUS_COLORS: Record<OppStatus, string> = {
  active: 'bg-green-100 text-green-800',
  draft: 'bg-yellow-100 text-yellow-800',
  closed: 'bg-gray-100 text-gray-600',
}

const BLANK_FORM = {
  title: '',
  organization: '',
  description: '',
  work_type: 'part_time' as WorkType,
  location: '',
  remote_ok: false,
  hours_per_week: '',
  pay: '',
  skills_desired: '',
  industries: '',
  apply_url: '',
  apply_email: '',
  closes_on: '',
  status: 'active' as OppStatus,
}

export default function CareersAdminClient({ opportunities: initial, interestCounts }: Props) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState<OppStatus | 'all'>('active')
  const [selected, setSelected] = useState<Opportunity | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Count interests per opportunity
  const countMap: Record<string, number> = {}
  for (const row of interestCounts) {
    countMap[row.opportunity_id] = (countMap[row.opportunity_id] ?? 0) + 1
  }

  const filtered = opportunities.filter(o =>
    filterStatus === 'all' ? true : o.status === filterStatus
  )

  function openNew() {
    setEditingId(null)
    setForm(BLANK_FORM)
    setError('')
    setShowForm(true)
    setSelected(null)
  }

  function openEdit(opp: Opportunity) {
    setEditingId(opp.id)
    setForm({
      title: opp.title,
      organization: opp.organization,
      description: opp.description ?? '',
      work_type: opp.work_type,
      location: opp.location ?? '',
      remote_ok: opp.remote_ok,
      hours_per_week: opp.hours_per_week?.toString() ?? '',
      pay: opp.pay ?? '',
      skills_desired: (opp.skills_desired ?? []).join(', '),
      industries: (opp.industries ?? []).join(', '),
      apply_url: opp.apply_url ?? '',
      apply_email: opp.apply_email ?? '',
      closes_on: opp.closes_on ?? '',
      status: opp.status,
    })
    setError('')
    setShowForm(true)
    setSelected(null)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.organization.trim()) {
      setError('Title and organization are required.')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      title: form.title.trim(),
      organization: form.organization.trim(),
      description: form.description.trim() || null,
      work_type: form.work_type,
      location: form.location.trim() || null,
      remote_ok: form.remote_ok,
      hours_per_week: form.hours_per_week ? parseInt(form.hours_per_week) : null,
      pay: form.pay.trim() || null,
      skills_desired: form.skills_desired ? form.skills_desired.split(',').map(s => s.trim()).filter(Boolean) : [],
      industries: form.industries ? form.industries.split(',').map(s => s.trim()).filter(Boolean) : [],
      apply_url: form.apply_url.trim() || null,
      apply_email: form.apply_email.trim() || null,
      closes_on: form.closes_on || null,
      status: form.status,
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/careers/opportunities/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed')
        const { opportunity } = await res.json()
        setOpportunities(prev => prev.map(o => o.id === editingId ? opportunity : o))
      } else {
        const res = await fetch('/api/careers/opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Create failed')
        const { opportunity } = await res.json()
        setOpportunities(prev => [opportunity, ...prev])
      }
      setShowForm(false)
      setEditingId(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive(id: string) {
    if (!confirm('Archive this opportunity? It will no longer appear to members.')) return
    try {
      const res = await fetch(`/api/careers/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      })
      if (!res.ok) throw new Error('Failed')
      const { opportunity } = await res.json()
      setOpportunities(prev => prev.map(o => o.id === id ? opportunity : o))
      if (selected?.id === id) setSelected(opportunity)
    } catch {
      alert('Could not archive opportunity.')
    }
  }

  async function handleReactivate(id: string) {
    try {
      const res = await fetch(`/api/careers/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })
      if (!res.ok) throw new Error('Failed')
      const { opportunity } = await res.json()
      setOpportunities(prev => prev.map(o => o.id === id ? opportunity : o))
      if (selected?.id === id) setSelected(opportunity)
    } catch {
      alert('Could not reactivate opportunity.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Encore Careers — Opportunities</h1>
          <p className="text-sm text-gray-500 mt-0.5">{opportunities.filter(o => o.status === 'active').length} active listings</p>
        </div>
        <button
          onClick={openNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Post Opportunity
        </button>
      </div>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Left panel */}
        <div className="w-80 border-r bg-white flex flex-col">
          {/* Filter */}
          <div className="p-3 border-b">
            <div className="flex gap-1">
              {(['all', 'active', 'draft', 'closed'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                    filterStatus === s
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-400">No opportunities</div>
            )}
            {filtered.map(opp => (
              <div
                key={opp.id}
                onClick={() => { setSelected(opp); setShowForm(false) }}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === opp.id ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{opp.title}</p>
                    <p className="text-xs text-gray-500 truncate">{opp.organization}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[opp.status]}`}>
                    {opp.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-gray-400">{WORK_TYPE_LABELS[opp.work_type]}</span>
                  {opp.remote_ok && <span className="text-[10px] text-blue-500">Remote OK</span>}
                  {countMap[opp.id] && (
                    <span className="text-[10px] text-purple-600 ml-auto">{countMap[opp.id]} interested</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {showForm ? (
            <div className="max-w-2xl mx-auto bg-white rounded-xl border p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Opportunity' : 'Post New Opportunity'}
              </h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Part-time Bookkeeper"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
                  <input
                    type="text"
                    value={form.organization}
                    onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Company or nonprofit name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
                  <select
                    value={form.work_type}
                    onChange={e => setForm(f => ({ ...f, work_type: e.target.value as WorkType }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(WORK_TYPE_LABELS).map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as OppStatus }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City, State"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="remote_ok"
                    type="checkbox"
                    checked={form.remote_ok}
                    onChange={e => setForm(f => ({ ...f, remote_ok: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="remote_ok" className="text-sm text-gray-700">Remote OK</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours/week</label>
                  <input
                    type="number"
                    value={form.hours_per_week}
                    onChange={e => setForm(f => ({ ...f, hours_per_week: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 20"
                    min={1}
                    max={40}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pay / Stipend</label>
                  <input
                    type="text"
                    value={form.pay}
                    onChange={e => setForm(f => ({ ...f, pay: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. $25/hr or Volunteer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Closes On</label>
                  <input
                    type="date"
                    value={form.closes_on}
                    onChange={e => setForm(f => ({ ...f, closes_on: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apply URL</label>
                  <input
                    type="url"
                    value={form.apply_url}
                    onChange={e => setForm(f => ({ ...f, apply_url: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apply Email</label>
                  <input
                    type="email"
                    value={form.apply_email}
                    onChange={e => setForm(f => ({ ...f, apply_email: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="jobs@example.com"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills Desired</label>
                  <input
                    type="text"
                    value={form.skills_desired}
                    onChange={e => setForm(f => ({ ...f, skills_desired: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Bookkeeping, QuickBooks, Excel (comma-separated)"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industries</label>
                  <input
                    type="text"
                    value={form.industries}
                    onChange={e => setForm(f => ({ ...f, industries: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Finance, Nonprofit, Education (comma-separated)"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={5}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Role description, responsibilities, ideal candidate..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Post Opportunity'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setEditingId(null) }}
                  className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : selected ? (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Detail card */}
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selected.title}</h2>
                    <p className="text-gray-600 mt-0.5">{selected.organization}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Type:</span>{' '}
                    <span className="font-medium">{WORK_TYPE_LABELS[selected.work_type]}</span>
                  </div>
                  {selected.location && (
                    <div>
                      <span className="text-gray-500">Location:</span>{' '}
                      <span className="font-medium">{selected.location}</span>
                    </div>
                  )}
                  {selected.remote_ok && (
                    <div><span className="font-medium text-blue-600">Remote OK</span></div>
                  )}
                  {selected.hours_per_week && (
                    <div>
                      <span className="text-gray-500">Hours/week:</span>{' '}
                      <span className="font-medium">{selected.hours_per_week}</span>
                    </div>
                  )}
                  {selected.pay && (
                    <div>
                      <span className="text-gray-500">Pay:</span>{' '}
                      <span className="font-medium">{selected.pay}</span>
                    </div>
                  )}
                  {selected.closes_on && (
                    <div>
                      <span className="text-gray-500">Closes:</span>{' '}
                      <span className="font-medium">{new Date(selected.closes_on).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {selected.description && (
                  <p className="text-sm text-gray-700 whitespace-pre-line mb-4">{selected.description}</p>
                )}

                {(selected.skills_desired?.length ?? 0) > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.skills_desired!.map(s => (
                        <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {(selected.industries?.length ?? 0) > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Industries</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.industries!.map(s => (
                        <span key={s} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-400">
                    Posted {new Date(selected.created_at).toLocaleDateString()}
                    {countMap[selected.id] ? ` · ${countMap[selected.id]} member${countMap[selected.id] !== 1 ? 's' : ''} interested` : ''}
                  </p>
                  {selected.apply_url && (
                    <p className="text-xs text-gray-500 mt-1">Apply URL: <a href={selected.apply_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">{selected.apply_url}</a></p>
                  )}
                  {selected.apply_email && (
                    <p className="text-xs text-gray-500 mt-1">Apply Email: {selected.apply_email}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => openEdit(selected)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Edit
                </button>
                {selected.status === 'active' ? (
                  <button
                    onClick={() => handleArchive(selected.id)}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Archive
                  </button>
                ) : (
                  <button
                    onClick={() => handleReactivate(selected.id)}
                    className="border border-green-300 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50"
                  >
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Select an opportunity to view details, or post a new one.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
