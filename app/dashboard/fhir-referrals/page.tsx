'use client'

import { useEffect, useState } from 'react'

interface Referral {
  id: string
  service_type: string
  status: string
  priority: string
  intent: string
  requester_name: string | null
  performer_name: string | null
  reason_text: string | null
  notes: string | null
  occurrence_datetime: string | null
  location_name: string | null
  created_at: string
  updated_at: string
  members?: { first_name: string; last_name: string; email: string }
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-teal-100 text-teal-700',
  'on-hold': 'bg-yellow-100 text-yellow-700',
  revoked: 'bg-red-100 text-red-600',
  completed: 'bg-blue-100 text-blue-700',
  'entered-in-error': 'bg-red-100 text-red-600',
  unknown: 'bg-gray-100 text-gray-500',
}

const PRIORITY_ICONS: Record<string, string> = {
  routine: '🟢',
  urgent: '🟡',
  asap: '🟠',
  stat: '🔴',
}

const STATUS_OPTIONS = ['draft', 'active', 'on-hold', 'revoked', 'completed', 'entered-in-error', 'unknown']
const PRIORITY_OPTIONS = ['routine', 'urgent', 'asap', 'stat']
const INTENT_OPTIONS = ['proposal', 'plan', 'directive', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option']

const COMMON_SERVICES = [
  'Home Health Aide',
  'Physical Therapy',
  'Occupational Therapy',
  'Speech Therapy',
  'Social Work',
  'Skilled Nursing',
  'Meal Delivery',
  'Transportation Assistance',
  'Mental Health Counseling',
  'Respiratory Therapy',
  'Wound Care',
  'Palliative Care',
  'Hospice',
  'Pharmacy Services',
  'Telehealth Visit',
]

export default function FHIRReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showDetail, setShowDetail] = useState<Referral | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    service_type: '',
    status: 'active',
    priority: 'routine',
    intent: 'order',
    requester_name: '',
    performer_name: '',
    reason_text: '',
    notes: '',
    patient_instruction: '',
    occurrence_datetime: '',
    location_name: '',
    snomed_code: '',
  })

  const load = () => {
    setLoading(true)
    const qs = statusFilter ? `?status=${statusFilter}` : ''
    fetch(`/api/fhir/referrals${qs}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setReferrals(d.referrals ?? [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [statusFilter])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/fhir/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) {
        alert(data.error)
      } else {
        setShowCreate(false)
        setForm({
          service_type: '', status: 'active', priority: 'routine', intent: 'order',
          requester_name: '', performer_name: '', reason_text: '', notes: '',
          patient_instruction: '', occurrence_datetime: '', location_name: '', snomed_code: '',
        })
        load()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const exportFHIR = async (id: string) => {
    const res = await fetch(`/api/fhir/referrals?id=${id}&format=fhir`)
    const json = await res.json()
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/fhir+json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ServiceRequest-${id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FHIR Referrals</h1>
          <p className="text-gray-500 text-sm mt-1">FHIR R4 ServiceRequest — healthcare referral coordination</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          + New Referral
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>

        <button
          onClick={() => {
            fetch('/api/fhir/referrals?format=fhir')
              .then(r => r.json())
              .then(json => {
                const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/fhir+json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `fhir-bundle-${Date.now()}.json`
                a.click()
                URL.revokeObjectURL(url)
              })
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ⬇ Export FHIR Bundle
        </button>
      </div>

      {/* Referrals list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
      ) : referrals.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <div className="font-medium text-gray-500">No referrals yet</div>
          <div className="text-sm mt-1">Create a referral to coordinate healthcare services</div>
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map(r => (
            <div
              key={r.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-teal-300 transition-colors cursor-pointer"
              onClick={() => setShowDetail(r)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-800">{r.service_type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {r.status}
                    </span>
                    <span className="text-xs">{PRIORITY_ICONS[r.priority] ?? ''} {r.priority}</span>
                  </div>
                  {r.members && (
                    <div className="text-sm text-gray-500">
                      Patient: {r.members.first_name} {r.members.last_name}
                    </div>
                  )}
                  {r.requester_name && (
                    <div className="text-sm text-gray-500">Requested by: {r.requester_name}</div>
                  )}
                  {r.reason_text && (
                    <div className="text-sm text-gray-500 truncate">{r.reason_text}</div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); exportFHIR(r.id) }}
                    className="text-xs text-teal-600 hover:underline mt-1 block"
                  >
                    FHIR R4 ↗
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-lg text-gray-800">New FHIR Referral</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
                <input
                  list="service-list"
                  value={form.service_type}
                  onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}
                  required
                  placeholder="e.g. Home Health Aide"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                <datalist id="service-list">
                  {COMMON_SERVICES.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Intent</label>
                  <select
                    value={form.intent}
                    onChange={e => setForm(f => ({ ...f, intent: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    {INTENT_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requester Name</label>
                  <input
                    value={form.requester_name}
                    onChange={e => setForm(f => ({ ...f, requester_name: e.target.value }))}
                    placeholder="Dr. Smith"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Performer/Provider</label>
                  <input
                    value={form.performer_name}
                    onChange={e => setForm(f => ({ ...f, performer_name: e.target.value }))}
                    placeholder="City Home Health"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Clinical Indication</label>
                <input
                  value={form.reason_text}
                  onChange={e => setForm(f => ({ ...f, reason_text: e.target.value }))}
                  placeholder="Post-hip replacement, needs ADL support"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Instructions</label>
                <textarea
                  value={form.patient_instruction}
                  onChange={e => setForm(f => ({ ...f, patient_instruction: e.target.value }))}
                  rows={2}
                  placeholder="What the member needs to do or know"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Date</label>
                  <input
                    type="datetime-local"
                    value={form.occurrence_datetime}
                    onChange={e => setForm(f => ({ ...f, occurrence_datetime: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    value={form.location_name}
                    onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))}
                    placeholder="Member's home / clinic name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SNOMED Code (optional)</label>
                <input
                  value={form.snomed_code}
                  onChange={e => setForm(f => ({ ...f, snomed_code: e.target.value }))}
                  placeholder="e.g. 3457005"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Coordinator notes"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-teal-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating…' : 'Create Referral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-lg text-gray-800">{showDetail.service_type}</h2>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[showDetail.status] ?? ''}`}>{showDetail.status}</span>
                <span>{PRIORITY_ICONS[showDetail.priority]} {showDetail.priority}</span>
                <span className="text-gray-400">· {showDetail.intent}</span>
              </div>
              {showDetail.requester_name && <div><span className="text-gray-500">Requester:</span> {showDetail.requester_name}</div>}
              {showDetail.performer_name && <div><span className="text-gray-500">Provider:</span> {showDetail.performer_name}</div>}
              {showDetail.reason_text && <div><span className="text-gray-500">Reason:</span> {showDetail.reason_text}</div>}
              {showDetail.patient_instruction && <div><span className="text-gray-500">Instructions:</span> {showDetail.patient_instruction}</div>}
              {showDetail.occurrence_datetime && <div><span className="text-gray-500">Service date:</span> {new Date(showDetail.occurrence_datetime).toLocaleString()}</div>}
              {showDetail.location_name && <div><span className="text-gray-500">Location:</span> {showDetail.location_name}</div>}
              {showDetail.notes && <div><span className="text-gray-500">Notes:</span> {showDetail.notes}</div>}
              <div className="text-xs text-gray-400 pt-2">
                ID: {showDetail.id}<br />
                Created: {new Date(showDetail.created_at).toLocaleString()}
              </div>
              <button
                onClick={() => exportFHIR(showDetail.id)}
                className="w-full border border-teal-300 text-teal-700 rounded-lg py-2 text-sm font-medium hover:bg-teal-50 transition-colors mt-3"
              >
                Export as FHIR R4 ServiceRequest JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
