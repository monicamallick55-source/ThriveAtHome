'use client'
// components/home-safety/HomeSafetyMemberClient.tsx
// Member-facing Home Safety Program page

import { useState } from 'react'

interface Program {
  id: string
  name: string
  program_year: string
  description: string | null
  capacity_households: number
  enrollment_open: boolean
  starts_on: string | null
  ends_on: string | null
  eligibility: { org_tiers?: string[] }
  sponsors: { name: string; logo_url?: string }[]
  contractor_partner: { id: string; name: string; phone: string | null; website: string | null } | null
}

interface ProposalLine {
  id: string
  item_key: string
  description: string
  route: string
  est_cost_cents: number
  contractor_discount_cents: number
  subsidy_cents: number
  member_cost_cents: number
  accepted: boolean | null
  work_order_status: string
  completed_at: string | null
  verified_by_volunteer_at: string | null
}

interface Proposal {
  id: string
  tier_key: string
  status: string
  sent_at: string | null
  responded_at: string | null
  total_free_cents: number
  total_subsidy_cents: number
  total_member_cents: number
  lines: ProposalLine[]
}

interface Enrollment {
  id: string
  status: string
  home_type: string
  comments: string | null
  income_qualified: boolean | null
  consent_terms_at: string | null
  created_at: string
  volunteer: { id: string; full_name: string; preferred_name: string | null; phone: string | null } | null
  program: { id: string; name: string; program_year: string }
}

interface Props {
  programs: Program[]
  enrollment: Enrollment | null
  proposal: Proposal | null
  checks: { id: string; mode: string; scheduled_at: string | null; completed_at: string | null; status: string }[]
  goBag: { id: string; delivered_at: string | null; contents_checklist: Record<string, boolean>; next_refresh_due: string | null } | null
  magnet: { id: string; generated_pdf_path: string | null; printed: boolean; delivered_at: string | null } | null
  member: { subscription_tier: string | null; full_name: string } | null
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  applied: { label: 'Application Received', color: 'bg-blue-100 text-blue-800' },
  waitlisted: { label: 'Waitlisted', color: 'bg-yellow-100 text-yellow-800' },
  enrolled: { label: 'Enrolled', color: 'bg-green-100 text-green-800' },
  training_scheduled: { label: 'Training Scheduled', color: 'bg-purple-100 text-purple-800' },
  inspected: { label: 'Home Inspection Complete', color: 'bg-indigo-100 text-indigo-800' },
  proposal_sent: { label: 'Proposal Ready', color: 'bg-orange-100 text-orange-800' },
  work_in_progress: { label: 'Work In Progress', color: 'bg-teal-100 text-teal-800' },
  complete: { label: 'Complete ✓', color: 'bg-green-100 text-green-800' },
  declined: { label: 'Declined', color: 'bg-gray-100 text-gray-600' },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-600' },
}

function formatCents(cents: number) {
  if (cents === 0) return 'Free'
  return `$${(cents / 100).toFixed(0)}`
}

function CostBadge({ line }: { line: ProposalLine }) {
  if (line.member_cost_cents === 0 && line.subsidy_cents === 0) {
    return <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Free</span>
  }
  if (line.member_cost_cents === 0 && line.subsidy_cents > 0) {
    return <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Covered by program</span>
  }
  return <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Your cost: {formatCents(line.member_cost_cents)}</span>
}

export default function HomeSafetyMemberClient({ programs, enrollment, proposal, checks, goBag, magnet, member }: Props) {
  const [showSignUp, setShowSignUp] = useState(false)
  const [form, setForm] = useState({ program_id: '', home_type: 'single_family', comments: '', income_qualified: false, consent_terms: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lineDecisions, setLineDecisions] = useState<Record<string, boolean>>({})
  const [submittingProposal, setSubmittingProposal] = useState(false)

  const activeProgram = programs.find(p => p.enrollment_open)

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault()
    if (!form.consent_terms) { setError('Please agree to the program terms to continue.'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/home-safety/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not submit application'); return }
      setSuccess(data.waitlisted
        ? 'You\'ve been added to the waitlist. We\'ll contact you when a space opens up.'
        : 'Your application has been received! We\'ll be in touch soon.')
      setShowSignUp(false)
    } catch { setError('Network error — please try again') }
    finally { setSaving(false) }
  }

  async function handleProposalResponse() {
    if (!proposal) return
    setSubmittingProposal(true); setError('')
    try {
      const res = await fetch(`/api/home-safety/proposals/${proposal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_decisions: lineDecisions }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not save response'); return }
      setSuccess('Your response has been saved. The program team will be in touch about next steps.')
      window.location.reload()
    } catch { setError('Network error — please try again') }
    finally { setSubmittingProposal(false) }
  }

  // If member has an active enrollment, show status view
  if (enrollment && enrollment.status !== 'withdrawn' && enrollment.status !== 'declined') {
    const statusInfo = STATUS_LABELS[enrollment.status] ?? { label: enrollment.status, color: 'bg-gray-100 text-gray-600' }

    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home Safety Program</h1>
          <p className="text-sm text-gray-500 mt-1">{enrollment.program.name} · {enrollment.program.program_year}</p>
        </div>

        {/* Status banner */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-gray-500">Your status</p>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            {enrollment.volunteer && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Your Safety Volunteer</p>
                <p className="font-medium text-gray-800">{enrollment.volunteer.preferred_name ?? enrollment.volunteer.full_name}</p>
                {enrollment.volunteer.phone && (
                  <a href={`tel:${enrollment.volunteer.phone}`} className="text-sm text-teal-600">{enrollment.volunteer.phone}</a>
                )}
              </div>
            )}
          </div>

          {/* Progress steps */}
          <div className="mt-5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {['applied','enrolled','training_scheduled','inspected','proposal_sent','work_in_progress','complete'].map((s, i) => {
                const steps = ['applied','enrolled','training_scheduled','inspected','proposal_sent','work_in_progress','complete']
                const currentIdx = steps.indexOf(enrollment.status)
                const stepIdx = i
                const done = stepIdx < currentIdx
                const active = stepIdx === currentIdx
                return (
                  <div key={s} className="flex items-center gap-1 shrink-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${done ? 'bg-teal-500 text-white' : active ? 'bg-teal-600 text-white ring-2 ring-teal-200' : 'bg-gray-100 text-gray-400'}`}>
                      {done ? '✓' : i + 1}
                    </div>
                    {i < 6 && <div className={`w-8 h-0.5 ${done ? 'bg-teal-400' : 'bg-gray-200'}`} />}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Upcoming check */}
        {checks.length > 0 && checks[0].status !== 'completed' && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-800">
              Home inspection: {checks[0].mode === 'virtual' ? 'Video call' : 'In-person visit'}
              {checks[0].scheduled_at && ` · ${new Date(checks[0].scheduled_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`}
            </p>
          </div>
        )}

        {/* Proposal */}
        {proposal && proposal.status === 'sent' && (
          <div className="rounded-xl border border-orange-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">Your Home Safety Proposal</h2>
              <p className="text-sm text-gray-500 mt-1">
                Review each item below and choose what work you'd like done. You can accept all, some, or none.
              </p>
            </div>

            <div className="space-y-3">
              {proposal.lines.map(line => (
                <div key={line.id} className="flex items-start gap-3 border border-gray-100 rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{line.description}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <CostBadge line={line} />
                      {line.route === 'partner_referral' && (
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">Rebuilding Together referral</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setLineDecisions(d => ({ ...d, [line.id]: true }))}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors
                        ${lineDecisions[line.id] === true ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-300 text-gray-600 hover:border-teal-400'}`}
                    >Yes</button>
                    <button
                      onClick={() => setLineDecisions(d => ({ ...d, [line.id]: false }))}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors
                        ${lineDecisions[line.id] === false ? 'bg-gray-600 text-white border-gray-600' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
                    >No</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                <span className="text-green-700 font-medium">{formatCents(proposal.total_free_cents)} free</span>
                {proposal.total_subsidy_cents > 0 && <span className="ml-2 text-blue-700">· {formatCents(proposal.total_subsidy_cents)} covered</span>}
                {proposal.total_member_cents > 0 && <span className="ml-2 text-amber-700">· {formatCents(proposal.total_member_cents)} your cost</span>}
              </div>
              <button
                onClick={handleProposalResponse}
                disabled={submittingProposal || Object.keys(lineDecisions).length < proposal.lines.length}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {submittingProposal ? 'Saving…' : 'Submit response'}
              </button>
            </div>
          </div>
        )}

        {/* Proposal responded */}
        {proposal && proposal.status !== 'sent' && proposal.status !== 'draft' && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Proposal Response</h2>
            <div className="space-y-2">
              {proposal.lines.map(line => (
                <div key={line.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{line.description}</span>
                  <div className="flex items-center gap-2">
                    <CostBadge line={line} />
                    <span className={`text-xs font-medium ${line.accepted ? 'text-green-700' : line.accepted === false ? 'text-gray-400 line-through' : 'text-gray-500'}`}>
                      {line.accepted ? '✓ Accepted' : line.accepted === false ? 'Declined' : 'Pending'}
                    </span>
                    {line.work_order_status === 'verified' && <span className="text-xs text-teal-700">· Done ✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Go-Bag */}
        {goBag && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-2">Emergency Go-Bag</h2>
            <p className="text-sm text-gray-600">
              {goBag.delivered_at
                ? `Delivered ${new Date(goBag.delivered_at).toLocaleDateString()}`
                : 'Being prepared — your volunteer will deliver it at the next visit.'}
            </p>
            {goBag.next_refresh_due && (
              <p className="text-xs text-gray-500 mt-1">Next refresh due: {new Date(goBag.next_refresh_due).toLocaleDateString()}</p>
            )}
          </div>
        )}

        {/* Magnet */}
        {magnet && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Emergency Fridge Magnet</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {magnet.delivered_at ? `Delivered ${new Date(magnet.delivered_at).toLocaleDateString()}` : 'Being prepared'}
                </p>
              </div>
              {magnet.generated_pdf_path && (
                <a
                  href={magnet.generated_pdf_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-teal-600 hover:underline font-medium"
                >
                  View PDF
                </a>
              )}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
        {success && <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3">{success}</p>}
      </div>
    )
  }

  // Sign-up / program info view
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Home Safety & Earthquake Preparedness</h1>
        <p className="text-gray-600 mt-2">
          A free program that sends a trained volunteer to your home to check for safety hazards — and helps get them fixed.
        </p>
      </div>

      {success && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-green-800">{success}</div>
      )}

      {activeProgram ? (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-gray-900">{activeProgram.name} · {activeProgram.program_year}</h2>
                {activeProgram.description && <p className="text-sm text-gray-600 mt-1">{activeProgram.description}</p>}
              </div>
              <span className="shrink-0 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Enrolling now</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">What's included</p>
                <ul className="text-gray-700 space-y-1 text-xs">
                  <li>✓ Home safety inspection</li>
                  <li>✓ Grab bars &amp; smoke alarms installed free</li>
                  <li>✓ Earthquake preparedness check</li>
                  <li>✓ Emergency go-bag</li>
                  <li>✓ Fridge magnet with your contacts</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">How it works</p>
                <ul className="text-gray-700 space-y-1 text-xs">
                  <li>1. Apply below</li>
                  <li>2. Get matched with a volunteer</li>
                  <li>3. Brief home visit to check for hazards</li>
                  <li>4. Review a written proposal</li>
                  <li>5. Licensed contractor does the work</li>
                </ul>
              </div>
            </div>

            {activeProgram.contractor_partner && (
              <p className="text-xs text-gray-500">
                Work performed by licensed contractor: <strong>{activeProgram.contractor_partner.name}</strong>
                {activeProgram.contractor_partner.phone && ` · ${activeProgram.contractor_partner.phone}`}
              </p>
            )}

            {activeProgram.sponsors?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Program sponsors</p>
                <div className="flex flex-wrap gap-2">
                  {activeProgram.sponsors.map((s, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s.name}</span>
                  ))}
                </div>
              </div>
            )}

            {!showSignUp && !success && (
              <button
                onClick={() => setShowSignUp(true)}
                className="w-full py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
              >
                Apply for this program
              </button>
            )}
          </div>

          {showSignUp && (
            <form onSubmit={handleEnroll} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
              <h2 className="font-semibold text-gray-900">Your Application</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Home type</label>
                <select
                  value={form.home_type}
                  onChange={e => setForm(f => ({ ...f, home_type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="single_family">Single-family home</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="apartment">Apartment</option>
                  <option value="mobile_home">Mobile home</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anything you'd like us to know? (optional)</label>
                <textarea
                  value={form.comments}
                  onChange={e => setForm(f => ({ ...f, comments: e.target.value }))}
                  rows={3}
                  placeholder="Special access instructions, specific concerns, etc."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>

              <div>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.income_qualified}
                    onChange={e => setForm(f => ({ ...f, income_qualified: e.target.checked }))}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-gray-600">
                    My household income is below 80% of Area Median Income. (This may qualify you for additional free repairs through Rebuilding Together Peninsula.)
                  </span>
                </label>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.consent_terms}
                    onChange={e => setForm(f => ({ ...f, consent_terms: e.target.checked }))}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-gray-600">
                    I agree to participate in the home safety program. I understand a volunteer may visit my home, and that I will receive a written proposal before any work begins. I can decline any or all proposed work at no cost.
                  </span>
                </label>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <input type="hidden" value={activeProgram.id} onChange={() => {}} />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowSignUp(false); setError('') }}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  onClick={() => setForm(f => ({ ...f, program_id: activeProgram.id }))}
                  className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Submitting…' : 'Submit application'}
                </button>
              </div>
            </form>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-gray-600">No home safety programs are currently enrolling.</p>
          <p className="text-sm text-gray-500 mt-1">Check back soon or contact your navigator for more information.</p>
        </div>
      )}

      {/* Safety content */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-xs font-medium text-blue-800 mb-1">What happens during the visit</p>
        <p className="text-xs text-blue-700">
          A trained volunteer walks through your home with you using a room-by-room checklist. They note any hazards but take no action without your approval. You receive a written proposal for any recommended work — you choose what gets done.
        </p>
      </div>
    </div>
  )
}
