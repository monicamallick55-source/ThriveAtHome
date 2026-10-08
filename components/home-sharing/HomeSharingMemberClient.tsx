'use client'
// components/home-sharing/HomeSharingMemberClient.tsx
// Member view: submit home sharing interest or view current status

import { useState } from 'react'

interface Referral {
  id: string
  role: 'host' | 'seeker'
  status: string
  home_description: string | null
  rent_expectation: string | null
  preferred_move_in: string | null
  house_rules: string | null
  budget_description: string | null
  desired_location: string | null
  move_in_by: string | null
  notes: string | null
  created_at: string
}

interface Props {
  referral: Referral | null
}

const STATUS_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  inquiring:  { label: 'Inquiry Received',    color: 'bg-blue-100 text-blue-700',    desc: "We've received your interest. A navigator will be in touch soon." },
  screening:  { label: 'Under Review',        color: 'bg-purple-100 text-purple-700', desc: "We're reviewing your information and may schedule a call." },
  matched:    { label: 'Match Found',         color: 'bg-orange-100 text-orange-700', desc: "We've identified a potential match. A navigator will connect you." },
  trial:      { label: 'Trial Period',        color: 'bg-teal-100 text-teal-700',    desc: 'A trial home share arrangement is in place.' },
  active:     { label: 'Active Arrangement',  color: 'bg-green-100 text-green-700',  desc: 'Your home share is confirmed and active.' },
  paused:     { label: 'On Hold',             color: 'bg-yellow-100 text-yellow-700', desc: 'Your inquiry is temporarily paused.' },
  closed:     { label: 'Closed',              color: 'bg-gray-100 text-gray-500',    desc: 'This inquiry has been closed.' },
}

const STEPS = ['inquiring', 'screening', 'matched', 'trial', 'active']

export default function HomeSharingMemberClient({ referral: initialReferral }: Props) {
  const [referral, setReferral] = useState(initialReferral)
  const [role, setRole] = useState<'host' | 'seeker'>('host')
  const [form, setForm] = useState({
    home_description: '',
    rent_expectation: '',
    preferred_move_in: '',
    house_rules: '',
    budget_description: '',
    desired_location: '',
    move_in_by: '',
    notes: '',
    consent_shared: false,
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)

  function field(key: string, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMsg('')
    try {
      const res = await fetch('/api/home-sharing/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, ...form }),
      })
      const d = await res.json()
      if (res.ok) { setReferral(d.referral); setMsg('') }
      else setMsg(d.error ?? 'Something went wrong')
    } catch { setMsg('Network error') }
    finally { setSaving(false) }
  }

  async function withdraw() {
    if (!referral) return
    setWithdrawing(true)
    try {
      const res = await fetch(`/api/home-sharing/referrals/${referral.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      })
      if (res.ok) setReferral(null)
    } catch { /* ignore */ }
    finally { setWithdrawing(false) }
  }

  // ── Status view ──────────────────────────────────────────────────────────
  if (referral) {
    const info = STATUS_LABELS[referral.status] ?? STATUS_LABELS.inquiring
    const stepIdx = STEPS.indexOf(referral.status)

    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Home Sharing</h1>
        <p className="text-sm text-gray-500 mb-6">
          {referral.role === 'host' ? 'You are listed as a potential host.' : 'You are looking for a home to share.'}
        </p>

        {/* Progress bar */}
        {referral.status !== 'paused' && referral.status !== 'closed' && (
          <div className="mb-6">
            <div className="flex justify-between mb-1">
              {STEPS.map((s, i) => (
                <div key={s} className="flex-1 flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1
                    ${i <= stepIdx ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {i < stepIdx ? '✓' : i + 1}
                  </div>
                  <span className="text-[10px] text-gray-500 text-center leading-tight hidden sm:block">
                    {STATUS_LABELS[s]?.label.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-1 bg-gray-200 rounded-full relative mt-1">
              <div
                className="h-1 bg-teal-600 rounded-full transition-all"
                style={{ width: `${Math.max(0, (stepIdx / (STEPS.length - 1)) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className={`rounded-xl px-4 py-3 mb-5 ${info.color}`}>
          <p className="font-semibold">{info.label}</p>
          <p className="text-sm mt-0.5">{info.desc}</p>
        </div>

        {/* Summary card */}
        <div className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm space-y-2 text-sm">
          <p className="font-medium text-gray-700">Your submission</p>
          {referral.role === 'host' ? (
            <>
              {referral.home_description && <p className="text-gray-600"><span className="font-medium">Home:</span> {referral.home_description}</p>}
              {referral.rent_expectation && <p className="text-gray-600"><span className="font-medium">Rent:</span> {referral.rent_expectation}</p>}
              {referral.preferred_move_in && <p className="text-gray-600"><span className="font-medium">Available from:</span> {referral.preferred_move_in}</p>}
              {referral.house_rules && <p className="text-gray-600"><span className="font-medium">House rules:</span> {referral.house_rules}</p>}
            </>
          ) : (
            <>
              {referral.desired_location && <p className="text-gray-600"><span className="font-medium">Looking in:</span> {referral.desired_location}</p>}
              {referral.budget_description && <p className="text-gray-600"><span className="font-medium">Budget:</span> {referral.budget_description}</p>}
              {referral.move_in_by && <p className="text-gray-600"><span className="font-medium">Need by:</span> {referral.move_in_by}</p>}
            </>
          )}
          {referral.notes && <p className="text-gray-600"><span className="font-medium">Notes:</span> {referral.notes}</p>}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <p className="text-xs text-gray-400">Submitted {new Date(referral.created_at).toLocaleDateString()}</p>
          {referral.status !== 'closed' && referral.status !== 'active' && (
            <button
              onClick={withdraw}
              disabled={withdrawing}
              className="ml-auto text-xs text-red-500 hover:text-red-700 underline"
            >
              {withdrawing ? 'Withdrawing…' : 'Withdraw inquiry'}
            </button>
          )}
        </div>

        <div className="mt-6 border border-teal-100 bg-teal-50 rounded-xl p-4 text-sm text-teal-800">
          <p className="font-medium mb-1">Questions?</p>
          <p>Contact your navigator or call the ThriveAtHome care line. We'll help match you with the right home sharing partner.</p>
        </div>
      </div>
    )
  }

  // ── Sign-up form ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Home Sharing Program</h1>
      <p className="text-gray-500 text-sm mb-6">
        Connect with someone to share your home — or find a welcoming home to join.
        A navigator will personally guide you through the matching process.
      </p>

      {/* Role picker */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {(['host', 'seeker'] as const).map(r => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`rounded-xl border-2 p-4 text-left transition-colors
              ${role === r ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <p className="font-semibold text-gray-900 capitalize">{r === 'host' ? '🏠 I have a home to share' : '🔍 I'm looking for a home'}</p>
            <p className="text-xs text-gray-500 mt-1">
              {r === 'host'
                ? 'You have a spare room or space and would like to share it with a compatible housemate.'
                : "You're looking for an affordable, supportive living arrangement with a welcoming host."}
            </p>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {role === 'host' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Describe your home *</label>
              <textarea
                value={form.home_description}
                onChange={e => field('home_description', e.target.value)}
                placeholder="e.g. 2BR/1BA cottage, private room with own bathroom, quiet neighborhood…"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rent or arrangement</label>
              <input
                value={form.rent_expectation}
                onChange={e => field('rent_expectation', e.target.value)}
                placeholder="e.g. $700/mo, or services in lieu of rent"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available from</label>
              <input
                type="date"
                value={form.preferred_move_in}
                onChange={e => field('preferred_move_in', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">House rules / preferences</label>
              <textarea
                value={form.house_rules}
                onChange={e => field('house_rules', e.target.value)}
                placeholder="e.g. no smoking, pet-friendly, quiet after 9pm…"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred location *</label>
              <input
                value={form.desired_location}
                onChange={e => field('desired_location', e.target.value)}
                placeholder="e.g. Foster City, San Mateo County, or flexible"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
              <input
                value={form.budget_description}
                onChange={e => field('budget_description', e.target.value)}
                placeholder="e.g. up to $800/mo, open to service exchange"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Need housing by</label>
              <input
                type="date"
                value={form.move_in_by}
                onChange={e => field('move_in_by', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Anything else we should know</label>
          <textarea
            value={form.notes}
            onChange={e => field('notes', e.target.value)}
            placeholder="Lifestyle, health needs, hobbies, deal-breakers…"
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.consent_shared}
            onChange={e => field('consent_shared', e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600"
            required
          />
          <span className="text-xs text-gray-600">
            I consent to ThriveAtHome sharing my contact information and this form with potential home sharing partners and our community navigator, for the purpose of facilitating a home sharing match.
          </span>
        </label>

        {msg && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{msg}</p>}

        <button
          type="submit"
          disabled={saving || !form.consent_shared}
          className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
        >
          {saving ? 'Submitting…' : 'Submit Home Sharing Interest'}
        </button>
      </form>
    </div>
  )
}
