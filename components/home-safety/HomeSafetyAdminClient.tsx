'use client'
// components/home-safety/HomeSafetyAdminClient.tsx
// Coordinator view: programs, enrollments, assign volunteers, build proposals

import { useState } from 'react'

interface Member { id: string; full_name: string; preferred_name: string | null; phone?: string | null; city?: string | null; state?: string | null; subscription_tier?: string | null }
interface Partner { id: string; name: string; category: string; status: string }
interface Program {
  id: string; name: string; program_year: string; description: string | null
  capacity_households: number; enrollment_open: boolean
  starts_on: string | null; ends_on: string | null
  free_item_budget_cents: number; subsidy_per_home_cents: number
  sponsors: { name: string }[]
  contractor_partner: { id: string; name: string } | null
  income_referral_partner: { id: string; name: string } | null
  eligibility: { org_tiers?: string[] }
}
interface Enrollment {
  id: string; status: string; home_type: string; comments: string | null
  income_qualified: boolean | null; created_at: string; program_id: string; volunteer_id: string | null
  member: Member | null
  volunteer: { id: string; full_name: string; preferred_name: string | null } | null
  proposals: { id: string; status: string; tier_key: string; sent_at: string | null; total_free_cents: number; total_subsidy_cents: number; total_member_cents: number }[]
}
interface Volunteer { id: string; program_id: string; max_households: number; trained_at: string | null; volunteer: Member | null }

interface Props {
  programs: Program[]
  enrollments: Enrollment[]
  volunteers: Volunteer[]
  partners: Partner[]
  allMembers: Member[]
}

const STATUS_COLORS: Record<string, string> = {
  applied: 'bg-blue-100 text-blue-700',
  waitlisted: 'bg-yellow-100 text-yellow-700',
  enrolled: 'bg-green-100 text-green-700',
  training_scheduled: 'bg-purple-100 text-purple-700',
  inspected: 'bg-indigo-100 text-indigo-700',
  proposal_sent: 'bg-orange-100 text-orange-700',
  work_in_progress: 'bg-teal-100 text-teal-700',
  complete: 'bg-green-200 text-green-800',
  declined: 'bg-gray-100 text-gray-500',
  withdrawn: 'bg-gray-100 text-gray-500',
}

function cents(c: number) { return c === 0 ? '$0' : `$${(c / 100).toFixed(0)}` }

export default function HomeSafetyAdminClient({ programs, enrollments, volunteers, partners, allMembers }: Props) {
  const [tab, setTab] = useState<'enrollments' | 'programs' | 'volunteers'>('enrollments')
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterProgram, setFilterProgram] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // New program form
  const [showNewProgram, setShowNewProgram] = useState(false)
  const [newProgram, setNewProgram] = useState({
    name: '', program_year: new Date().getFullYear().toString(),
    description: '', capacity_households: 20, enrollment_open: true,
    contractor_partner_id: '', income_referral_partner_id: '',
    free_item_budget_cents: 0, subsidy_per_home_cents: 0,
  })

  // Proposal builder
  const [showProposalBuilder, setShowProposalBuilder] = useState(false)
  const [proposalTier, setProposalTier] = useState('basic')
  const [proposalLines, setProposalLines] = useState([
    { item_key: 'grab_bar_toilet', description: 'Install grab bar at toilet', route: 'contractor', est_cost_cents: 0, contractor_discount_cents: 0, subsidy_cents: 0, member_cost_cents: 0 },
    { item_key: 'smoke_alarm', description: 'Replace smoke alarm batteries', route: 'contractor', est_cost_cents: 0, contractor_discount_cents: 0, subsidy_cents: 0, member_cost_cents: 0 },
  ])

  const filtered = enrollments.filter(e =>
    (filterStatus ? e.status === filterStatus : true) &&
    (filterProgram ? e.program_id === filterProgram : true)
  )

  async function updateEnrollmentStatus(enrollmentId: string, status: string) {
    setSaving(true); setMsg('')
    try {
      const res = await fetch(`/api/admin/home-safety/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) { setMsg('Updated'); window.location.reload() }
      else { const d = await res.json(); setMsg(d.error) }
    } catch { setMsg('Network error') }
    finally { setSaving(false) }
  }

  async function assignVolunteer(enrollmentId: string, volunteerId: string) {
    setSaving(true); setMsg('')
    try {
      const res = await fetch(`/api/admin/home-safety/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_volunteer', volunteer_id: volunteerId }),
      })
      const d = await res.json()
      if (res.ok) { setMsg('Volunteer assigned'); window.location.reload() }
      else setMsg(d.error)
    } catch { setMsg('Network error') }
    finally { setSaving(false) }
  }

  async function createProgram() {
    setSaving(true); setMsg('')
    try {
      const res = await fetch('/api/admin/home-safety/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProgram,
          contractor_partner_id: newProgram.contractor_partner_id || null,
          income_referral_partner_id: newProgram.income_referral_partner_id || null,
        }),
      })
      const d = await res.json()
      if (res.ok) { setMsg('Program created'); setShowNewProgram(false); window.location.reload() }
      else setMsg(d.error)
    } catch { setMsg('Network error') }
    finally { setSaving(false) }
  }

  async function sendProposal() {
    if (!selectedEnrollment) return
    setSaving(true); setMsg('')
    try {
      const res = await fetch(`/api/admin/home-safety/enrollments/${selectedEnrollment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_proposal', tier_key: proposalTier, lines: proposalLines }),
      })
      const d = await res.json()
      if (res.ok) { setMsg('Proposal created and sent'); setShowProposalBuilder(false); window.location.reload() }
      else setMsg(d.error)
    } catch { setMsg('Network error') }
    finally { setSaving(false) }
  }

  // Volunteer counts per program
  const volunteerCounts: Record<string, number> = {}
  enrollments.forEach(e => {
    if (e.volunteer_id && e.program_id) {
      const key = `${e.program_id}-${e.volunteer_id}`
      volunteerCounts[key] = (volunteerCounts[key] ?? 0) + 1
    }
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Home Safety Program</h1>
        <button
          onClick={() => { setShowNewProgram(true); setTab('programs') }}
          className="text-sm px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >+ New program</button>
      </div>

      {msg && <div className="mb-4 p-3 rounded-lg bg-blue-50 text-blue-800 text-sm">{msg}</div>}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {(['enrollments', 'programs', 'volunteers'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors
              ${tab === t ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Enrollments tab */}
      {tab === 'enrollments' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">All statuses</option>
              {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={filterProgram} onChange={e => setFilterProgram(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">All programs</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name} {p.program_year}</option>)}
            </select>
          </div>

          <div className="text-sm text-gray-500">{filtered.length} enrollments</div>

          <div className="space-y-3">
            {filtered.map(enr => (
              <div key={enr.id} className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {enr.member?.full_name ?? 'Unknown'}
                      {enr.member?.preferred_name && enr.member.preferred_name !== enr.member.full_name && (
                        <span className="text-gray-500 font-normal"> ({enr.member.preferred_name})</span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[enr.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {enr.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-500">{enr.home_type.replace(/_/g, ' ')}</span>
                      {enr.income_qualified && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Income-qualified</span>}
                      {enr.member?.subscription_tier && <span className="text-xs text-gray-400">{enr.member.subscription_tier} tier</span>}
                    </div>
                    {enr.comments && <p className="text-xs text-gray-500 mt-1">{enr.comments}</p>}
                  </div>

                  <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                    {/* Status transitions */}
                    {enr.status === 'applied' && (
                      <button onClick={() => updateEnrollmentStatus(enr.id, 'enrolled')} disabled={saving}
                        className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg">Enroll</button>
                    )}
                    {enr.status === 'enrolled' && (
                      <button onClick={() => updateEnrollmentStatus(enr.id, 'training_scheduled')} disabled={saving}
                        className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg">Mark training scheduled</button>
                    )}
                    {enr.status === 'training_scheduled' && (
                      <button onClick={() => updateEnrollmentStatus(enr.id, 'inspected')} disabled={saving}
                        className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg">Mark inspected</button>
                    )}
                    {enr.status === 'inspected' && !enr.proposals?.length && (
                      <button onClick={() => { setSelectedEnrollment(enr); setShowProposalBuilder(true) }}
                        className="text-xs px-3 py-1.5 bg-orange-600 text-white rounded-lg">Build proposal</button>
                    )}
                    {enr.status === 'proposal_sent' && (
                      <button onClick={() => updateEnrollmentStatus(enr.id, 'work_in_progress')} disabled={saving}
                        className="text-xs px-3 py-1.5 bg-teal-600 text-white rounded-lg">Mark work started</button>
                    )}
                    {enr.status === 'work_in_progress' && (
                      <button onClick={() => updateEnrollmentStatus(enr.id, 'complete')} disabled={saving}
                        className="text-xs px-3 py-1.5 bg-green-700 text-white rounded-lg">Mark complete</button>
                    )}
                    <button onClick={() => setSelectedEnrollment(selectedEnrollment?.id === enr.id ? null : enr)}
                      className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg">
                      {selectedEnrollment?.id === enr.id ? 'Close' : 'Detail'}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {selectedEnrollment?.id === enr.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {/* Volunteer assignment */}
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Assigned volunteer</p>
                      {enr.volunteer ? (
                        <p className="text-sm text-gray-800">{enr.volunteer.preferred_name ?? enr.volunteer.full_name}</p>
                      ) : (
                        <div className="flex gap-2">
                          <select
                            onChange={e => e.target.value && assignVolunteer(enr.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
                            defaultValue=""
                          >
                            <option value="">Assign volunteer…</option>
                            {volunteers
                              .filter(v => v.program_id === enr.program_id)
                              .map(v => {
                                const count = volunteerCounts[`${v.program_id}-${v.volunteer?.id}`] ?? 0
                                const atMax = count >= v.max_households
                                return (
                                  <option key={v.id} value={v.volunteer?.id ?? ''} disabled={atMax}>
                                    {v.volunteer?.preferred_name ?? v.volunteer?.full_name} ({count}/{v.max_households}{atMax ? ' — FULL' : ''})
                                  </option>
                                )
                              })}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Proposal summary */}
                    {enr.proposals?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Proposal</p>
                        {enr.proposals.map(p => (
                          <div key={p.id} className="text-sm text-gray-700 flex gap-3 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? 'bg-gray-100'}`}>{p.status.replace(/_/g, ' ')}</span>
                            <span className="text-green-700">{cents(p.total_free_cents)} free</span>
                            {p.total_subsidy_cents > 0 && <span className="text-blue-700">{cents(p.total_subsidy_cents)} covered</span>}
                            {p.total_member_cents > 0 && <span className="text-amber-700">{cents(p.total_member_cents)} member pays</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">No enrollments found</div>
            )}
          </div>
        </div>
      )}

      {/* Programs tab */}
      {tab === 'programs' && (
        <div className="space-y-4">
          {showNewProgram && (
            <div className="border border-teal-200 rounded-xl bg-teal-50 p-5 space-y-3">
              <h2 className="font-semibold text-gray-900">New Program</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Program name</label>
                  <input value={newProgram.name} onChange={e => setNewProgram(p => ({ ...p, name: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Home Safety 2026" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Year</label>
                  <input value={newProgram.program_year} onChange={e => setNewProgram(p => ({ ...p, program_year: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600">Description</label>
                  <textarea value={newProgram.description} onChange={e => setNewProgram(p => ({ ...p, description: e.target.value }))}
                    rows={2} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Capacity (households)</label>
                  <input type="number" value={newProgram.capacity_households}
                    onChange={e => setNewProgram(p => ({ ...p, capacity_households: Number(e.target.value) }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Contractor partner</label>
                  <select value={newProgram.contractor_partner_id}
                    onChange={e => setNewProgram(p => ({ ...p, contractor_partner_id: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">None</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Income referral partner (e.g. Rebuilding Together)</label>
                  <select value={newProgram.income_referral_partner_id}
                    onChange={e => setNewProgram(p => ({ ...p, income_referral_partner_id: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">None</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowNewProgram(false)} className="text-sm px-4 py-2 border border-gray-300 rounded-lg text-gray-600">Cancel</button>
                <button onClick={createProgram} disabled={saving || !newProgram.name}
                  className="text-sm px-4 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-50">
                  {saving ? 'Creating…' : 'Create program'}
                </button>
              </div>
            </div>
          )}

          {programs.map(p => {
            const enrCount = enrollments.filter(e => e.program_id === p.id && !['declined','withdrawn'].includes(e.status)).length
            return (
              <div key={p.id} className="border border-gray-200 rounded-xl bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{p.name} · {p.program_year}</h3>
                    {p.description && <p className="text-sm text-gray-500 mt-0.5">{p.description}</p>}
                    <div className="flex gap-3 mt-2 text-sm text-gray-600 flex-wrap">
                      <span>{enrCount} / {p.capacity_households} households</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.enrollment_open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.enrollment_open ? 'Open' : 'Closed'}
                      </span>
                      {p.contractor_partner && <span className="text-xs text-gray-500">Contractor: {p.contractor_partner.name}</span>}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div>{cents(p.free_item_budget_cents)} free item budget</div>
                    <div>{cents(p.subsidy_per_home_cents)} subsidy/home</div>
                  </div>
                </div>
              </div>
            )
          })}
          {programs.length === 0 && !showNewProgram && (
            <div className="text-center py-12 text-gray-400">
              No programs yet. <button onClick={() => setShowNewProgram(true)} className="text-teal-600 underline">Create one</button>
            </div>
          )}
        </div>
      )}

      {/* Volunteers tab */}
      {tab === 'volunteers' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Volunteers are assigned per program. Each can oversee up to 5 households.</p>
          {programs.map(prog => {
            const progVols = volunteers.filter(v => v.program_id === prog.id)
            return (
              <div key={prog.id} className="border border-gray-200 rounded-xl bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">{prog.name} · {prog.program_year}</h3>
                {progVols.length === 0 ? (
                  <p className="text-sm text-gray-400">No volunteers added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {progVols.map(v => {
                      const count = volunteerCounts[`${prog.id}-${v.volunteer?.id}`] ?? 0
                      return (
                        <div key={v.id} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium text-gray-800">{v.volunteer?.preferred_name ?? v.volunteer?.full_name}</span>
                            {v.volunteer?.phone && <span className="ml-2 text-gray-500">{v.volunteer.phone}</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs ${count >= v.max_households ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                              {count}/{v.max_households} homes
                            </span>
                            {v.trained_at
                              ? <span className="text-xs text-green-600">Trained ✓</span>
                              : <span className="text-xs text-yellow-600">Training pending</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <AddVolunteerInline programId={prog.id} allMembers={allMembers} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Proposal builder modal */}
      {showProposalBuilder && selectedEnrollment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Build Proposal</h2>
              <button onClick={() => setShowProposalBuilder(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-sm text-gray-600">For {selectedEnrollment.member?.full_name}</p>

            <div>
              <label className="text-xs font-medium text-gray-600">Work tier</label>
              <select value={proposalTier} onChange={e => setProposalTier(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="basic">Basic — grab bars, alarms, bulbs, batteries (free)</option>
                <option value="enhanced">Enhanced — basic + modifications (some member cost)</option>
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Line items</p>
                <button onClick={() => setProposalLines(l => [...l, { item_key: '', description: '', route: 'contractor', est_cost_cents: 0, contractor_discount_cents: 0, subsidy_cents: 0, member_cost_cents: 0 }])}
                  className="text-xs text-teal-600 hover:underline">+ Add line</button>
              </div>
              {proposalLines.map((line, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <input
                    value={line.description}
                    onChange={e => setProposalLines(l => l.map((x, j) => j === i ? { ...x, description: e.target.value, item_key: e.target.value.toLowerCase().replace(/\s+/g, '_').slice(0, 40) } : x))}
                    placeholder="Description (e.g. Install grab bar at shower)"
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Contractor cost (¢)</label>
                      <input type="number" value={line.est_cost_cents}
                        onChange={e => setProposalLines(l => l.map((x, j) => j === i ? { ...x, est_cost_cents: Number(e.target.value) } : x))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Subsidy (¢)</label>
                      <input type="number" value={line.subsidy_cents}
                        onChange={e => setProposalLines(l => l.map((x, j) => j === i ? { ...x, subsidy_cents: Number(e.target.value) } : x))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Member pays (¢)</label>
                      <input type="number" value={line.member_cost_cents}
                        onChange={e => setProposalLines(l => l.map((x, j) => j === i ? { ...x, member_cost_cents: Number(e.target.value) } : x))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={line.route} onChange={e => setProposalLines(l => l.map((x, j) => j === i ? { ...x, route: e.target.value } : x))}
                      className="text-xs border border-gray-300 rounded px-2 py-1">
                      <option value="contractor">Licensed contractor</option>
                      <option value="partner_referral">Partner referral (Rebuilding Together)</option>
                      <option value="volunteer">Volunteer install</option>
                      <option value="member_diy">Member DIY</option>
                    </select>
                    <button onClick={() => setProposalLines(l => l.filter((_, j) => j !== i))}
                      className="text-xs text-red-500 hover:underline ml-auto">Remove</button>
                  </div>
                </div>
              ))}
            </div>

            {msg && <p className="text-sm text-red-600">{msg}</p>}

            <div className="flex gap-2">
              <button onClick={() => setShowProposalBuilder(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
              <button onClick={sendProposal} disabled={saving || proposalLines.length === 0}
                className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Sending…' : 'Create & send proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AddVolunteerInline({ programId, allMembers }: { programId: string; allMembers: Member[] }) {
  const [memberId, setMemberId] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function add() {
    if (!memberId) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/home-safety/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: programId, volunteer_id: memberId }),
      })
      const d = await res.json()
      if (res.ok) { setMsg('Added'); window.location.reload() }
      else setMsg(d.error)
    } catch { setMsg('Error') }
    finally { setSaving(false) }
  }

  return (
    <div className="flex gap-2 items-center">
      <select value={memberId} onChange={e => setMemberId(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 flex-1">
        <option value="">Add volunteer…</option>
        {allMembers.map(m => <option key={m.id} value={m.id}>{m.preferred_name ?? m.full_name}</option>)}
      </select>
      <button onClick={add} disabled={saving || !memberId}
        className="text-sm px-3 py-1.5 bg-teal-600 text-white rounded-lg disabled:opacity-50">
        {saving ? '…' : 'Add'}
      </button>
      {msg && <span className="text-xs text-gray-500">{msg}</span>}
    </div>
  )
}
