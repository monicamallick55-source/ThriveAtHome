'use client'

/**
 * app/vso-admin/page.tsx — G7.8 Veteran Service Organization Named Portals
 * Shows VSO programs organized by branch/era. Members can enroll.
 * Admins can add programs.
 */

import { useState, useEffect } from 'react'

type VSOProgram = {
  id: string
  vso_name: string
  name: string
  program_type: string
  branch_focus: string
  era_focus: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  description: string | null
  eligibility_notes: string | null
  website_url: string | null
  my_enrollment_status: string | null
}

type Enrollment = {
  id: string
  program_id: string
  status: string
  enrolled_at: string
  vso_programs: { name: string; vso_name: string; program_type: string; branch_focus: string; era_focus: string } | null
}

const BRANCH_OPTIONS = [
  { value: 'any', label: 'All Branches' },
  { value: 'army', label: '🪖 Army' },
  { value: 'navy', label: '⚓ Navy' },
  { value: 'marines', label: '🦅 Marines' },
  { value: 'air_force', label: '✈️ Air Force' },
  { value: 'coast_guard', label: '⛵ Coast Guard' },
  { value: 'space_force', label: '🚀 Space Force' },
  { value: 'national_guard', label: '🛡️ National Guard' },
]

const ERA_OPTIONS = [
  { value: 'any', label: 'All Eras' },
  { value: 'wwii', label: 'WWII' },
  { value: 'korea', label: 'Korea' },
  { value: 'vietnam', label: 'Vietnam' },
  { value: 'gulf_war', label: 'Gulf War' },
  { value: 'post_911', label: 'Post-9/11' },
]

const TYPE_LABELS: Record<string, string> = {
  benefits_counseling: 'Benefits Counseling',
  peer_support: 'Peer Support',
  caregiver_respite: 'Caregiver Respite',
  transportation: 'Transportation',
  housing: 'Housing',
  employment: 'Employment',
  health_wellness: 'Health & Wellness',
  social_connection: 'Social Connection',
  general: 'General',
}

const KNOWN_VSOS = [
  { name: 'VFW', full: 'Veterans of Foreign Wars' },
  { name: 'DAV', full: 'Disabled American Veterans' },
  { name: 'American Legion', full: 'American Legion' },
  { name: 'AMVETS', full: 'American Veterans' },
  { name: 'PVA', full: 'Paralyzed Veterans of America' },
  { name: 'Vietnam Veterans of America', full: 'Vietnam Veterans of America' },
]

export default function VSOAdminPage() {
  const [tab, setTab] = useState<'programs' | 'my_enrollments'>('programs')
  const [programs, setPrograms] = useState<VSOProgram[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [branchFilter, setBranchFilter] = useState('any')
  const [eraFilter, setEraFilter] = useState('any')
  const [typeFilter, setTypeFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [enrollTarget, setEnrollTarget] = useState<VSOProgram | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const [form, setForm] = useState({
    vso_name: '', name: '', program_type: 'benefits_counseling',
    branch_focus: 'any', era_focus: 'any',
    contact_name: '', contact_email: '', contact_phone: '',
    description: '', eligibility_notes: '', website_url: '',
  })

  useEffect(() => { load() }, [branchFilter, eraFilter, typeFilter])

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (branchFilter !== 'any') params.set('branch', branchFilter)
    if (eraFilter !== 'any') params.set('era', eraFilter)
    if (typeFilter) params.set('type', typeFilter)

    const [progRes, enrollRes] = await Promise.all([
      fetch(`/api/vso-programs?${params}`),
      fetch('/api/vso-programs?my=true'),
    ])
    const progData = await progRes.json()
    const enrollData = await enrollRes.json()
    setPrograms(progData.programs ?? [])
    setEnrollments(enrollData.enrollments ?? [])
    setLoading(false)
  }

  async function enroll(program: VSOProgram) {
    setSaving(true)
    const res = await fetch('/api/vso-enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ program_id: program.id }),
    })
    setSaving(false)
    if (res.ok) {
      setEnrollTarget(null)
      setMsg(`Enrolled in ${program.name}!`)
      load()
    }
  }

  async function createProgram() {
    setSaving(true)
    const res = await fetch('/api/vso-programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (data.program) {
      setShowCreateModal(false)
      setMsg('Program added.')
      load()
    }
  }

  // Group programs by VSO
  const grouped = programs.reduce((acc: Record<string, VSOProgram[]>, p) => {
    const key = p.vso_name
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Veteran Service Organizations</h1>
          <p className="text-gray-500 text-sm mt-1">VSO programs for veterans, service members, and their families</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-olive-700 bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-900"
        >
          + Add VSO Program
        </button>
      </div>

      {msg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg text-sm">
          {msg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-800">{programs.length}</div>
          <div className="text-sm text-green-700 mt-1">Programs Available</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-amber-700">{Object.keys(grouped).length}</div>
          <div className="text-sm text-amber-600 mt-1">Partner VSOs</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-700">{enrollments.filter(e => e.status === 'active').length}</div>
          <div className="text-sm text-blue-600 mt-1">My Enrollments</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
        {(['programs', 'my_enrollments'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'programs' ? 'Find Programs' : 'My Enrollments'}
          </button>
        ))}
      </div>

      {tab === 'programs' && (
        <>
          {/* Filters */}
          <div className="flex gap-3 mb-5 flex-wrap">
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {BRANCH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={eraFilter} onChange={e => setEraFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {ERA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">All Types</option>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading programs…</div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-16 text-gray-400">No programs match your filters.</div>
          ) : Object.entries(grouped).map(([vsoName, vsoPrograms]) => (
            <div key={vsoName} className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-800 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {vsoName}
                </div>
                <div className="h-px bg-gray-200 flex-1" />
              </div>
              <div className="space-y-3">
                {vsoPrograms.map(p => (
                  <div key={p.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{p.name}</h3>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            {TYPE_LABELS[p.program_type] ?? p.program_type}
                          </span>
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-gray-500">
                          {p.branch_focus !== 'any' && (
                            <span>{BRANCH_OPTIONS.find(b => b.value === p.branch_focus)?.label ?? p.branch_focus}</span>
                          )}
                          {p.era_focus !== 'any' && (
                            <span>{ERA_OPTIONS.find(e => e.value === p.era_focus)?.label ?? p.era_focus} veterans</span>
                          )}
                          {p.branch_focus === 'any' && p.era_focus === 'any' && <span>All veterans welcome</span>}
                        </div>
                        {p.description && <p className="text-sm text-gray-600 mt-2">{p.description}</p>}
                        {p.eligibility_notes && (
                          <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mt-2">
                            Eligibility: {p.eligibility_notes}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {p.my_enrollment_status ? (
                          <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">
                            Enrolled
                          </span>
                        ) : (
                          <button onClick={() => setEnrollTarget(p)} disabled={saving}
                            className="bg-green-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-900">
                            Enroll
                          </button>
                        )}
                      </div>
                    </div>
                    {(p.contact_name || p.website_url) && (
                      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
                        {p.contact_name && <span>Contact: {p.contact_name}{p.contact_email ? ` · ${p.contact_email}` : ''}</span>}
                        {p.website_url && <a href={p.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Visit site →</a>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'my_enrollments' && (
        <div className="space-y-3">
          {enrollments.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No enrollments yet. Browse programs to get started.</div>
          ) : enrollments.map(e => (
            <div key={e.id} className="border border-gray-200 rounded-xl p-4 bg-white flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{e.vso_programs?.name ?? '—'}</p>
                <p className="text-sm text-gray-500">{e.vso_programs?.vso_name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {TYPE_LABELS[e.vso_programs?.program_type ?? ''] ?? ''}
                  {e.vso_programs?.branch_focus && e.vso_programs.branch_focus !== 'any'
                    ? ` · ${e.vso_programs.branch_focus}` : ''}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  e.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {e.status}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  Enrolled {new Date(e.enrolled_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enroll Confirm Modal */}
      {enrollTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-2">Confirm Enrollment</h2>
            <p className="text-sm text-gray-600 mb-1"><strong>{enrollTarget.name}</strong></p>
            <p className="text-sm text-gray-500 mb-4">{enrollTarget.vso_name}</p>
            {enrollTarget.eligibility_notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 mb-4">
                <strong>Eligibility note:</strong> {enrollTarget.eligibility_notes}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setEnrollTarget(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">
                Cancel
              </button>
              <button onClick={() => enroll(enrollTarget)} disabled={saving}
                className="flex-1 bg-green-800 text-white py-2 rounded-lg text-sm disabled:opacity-50">
                {saving ? 'Enrolling…' : 'Confirm Enrollment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Program Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md my-4">
            <h2 className="text-lg font-bold mb-4">Add VSO Program</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">VSO Name *</label>
                <input list="vso-list" value={form.vso_name} onChange={e => setForm(f => ({ ...f, vso_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="VFW" />
                <datalist id="vso-list">
                  {KNOWN_VSOS.map(v => <option key={v.name} value={v.name}>{v.full}</option>)}
                </datalist>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Program Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Program Type *</label>
                <select value={form.program_type} onChange={e => setForm(f => ({ ...f, program_type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1">
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">Branch Focus</label>
                  <select value={form.branch_focus} onChange={e => setForm(f => ({ ...f, branch_focus: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1">
                    {BRANCH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Era Focus</label>
                  <select value={form.era_focus} onChange={e => setForm(f => ({ ...f, era_focus: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1">
                    {ERA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" rows={2} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Eligibility Notes</label>
                <input value={form.eligibility_notes} onChange={e => setForm(f => ({ ...f, eligibility_notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"
                  placeholder="Must have served 90+ days active duty" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Contact Email</label>
                <input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Website URL</label>
                <input type="url" value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="https://vfw.org/…" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={createProgram} disabled={saving || !form.vso_name || !form.name}
                className="flex-1 bg-green-800 text-white py-2 rounded-lg text-sm disabled:opacity-50">
                {saving ? 'Adding…' : 'Add Program'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
