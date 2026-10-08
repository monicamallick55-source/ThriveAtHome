'use client'
// components/home-sharing/HomeSharingNavigatorClient.tsx
// Navigator view: list referrals, update status, add notes, assign match

import { useState } from 'react'

interface Member { id: string; full_name: string; preferred_name: string | null; phone?: string | null; city?: string | null; state?: string | null }
interface Referral {
  id: string; role: 'host' | 'seeker'; status: string; created_at: string; updated_at: string
  home_description: string | null; rent_expectation: string | null; preferred_move_in: string | null; house_rules: string | null
  budget_description: string | null; desired_location: string | null; move_in_by: string | null
  notes: string | null; navigator_notes: string | null
  member: Member | null
  matched_member: { id: string; full_name: string; preferred_name: string | null } | null
  navigator: { id: string; full_name: string; preferred_name: string | null } | null
}

interface Props {
  referrals: Referral[]
  allMembers: { id: string; full_name: string; preferred_name: string | null }[]
  navigatorMemberId: string
}

const STATUSES = ['inquiring', 'screening', 'matched', 'trial', 'active', 'paused', 'closed']
const STATUS_COLORS: Record<string, string> = {
  inquiring: 'bg-blue-100 text-blue-700',
  screening: 'bg-purple-100 text-purple-700',
  matched: 'bg-orange-100 text-orange-700',
  trial: 'bg-teal-100 text-teal-700',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-gray-100 text-gray-500',
}

export default function HomeSharingNavigatorClient({ referrals: initial, allMembers, navigatorMemberId }: Props) {
  const [referrals, setReferrals] = useState(initial)
  const [selected, setSelected] = useState<string | null>(initial[0]?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'host' | 'seeker'>('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const referral = referrals.find(r => r.id === selected) ?? null

  const [edits, setEdits] = useState<Record<string, Partial<Referral>>>({})
  function edit(id: string, key: string, value: string) {
    setEdits(e => ({ ...e, [id]: { ...e[id], [key]: value } }))
  }

  const filtered = referrals.filter(r =>
    (filterRole === 'all' || r.role === filterRole) &&
    (filterStatus === 'all' || r.status === filterStatus)
  )

  async function save(id: string) {
    const updates = edits[id]
    if (!updates || Object.keys(updates).length === 0) return
    setSaving(true); setMsg('')
    try {
      const res = await fetch(`/api/home-sharing/referrals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const d = await res.json()
      if (res.ok) {
        setReferrals(rs => rs.map(r => r.id === id ? { ...r, ...d.referral } : r))
        setEdits(e => { const n = { ...e }; delete n[id]; return n })
        setMsg('Saved')
      } else setMsg(d.error)
    } catch { setMsg('Network error') }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Home Sharing Referrals</h1>
      <p className="text-sm text-gray-500 mb-6">{referrals.length} active {referrals.length === 1 ? 'inquiry' : 'inquiries'}</p>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select value={filterRole} onChange={e => setFilterRole(e.target.value as 'all' | 'host' | 'seeker')}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5">
          <option value="all">All roles</option>
          <option value="host">Hosts</option>
          <option value="seeker">Seekers</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5">
          <option value="all">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {referrals.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No active home sharing inquiries</p>
          <p className="text-sm mt-1">Members can submit interest from their dashboard.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* List */}
        <div className="md:col-span-1 space-y-2">
          {filtered.map(r => (
            <button key={r.id} onClick={() => setSelected(r.id)}
              className={`w-full text-left p-3 rounded-xl border transition-colors
                ${selected === r.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {r.member?.preferred_name ?? r.member?.full_name ?? 'Member'}
                </p>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {r.status}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {r.role === 'host' ? '🏠 Host' : '🔍 Seeker'} · {r.member?.city ?? '—'}
              </p>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {referral && (
          <div className="md:col-span-2 space-y-4">
            {/* Member card */}
            <div className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{referral.member?.full_name}</p>
                  {referral.member?.city && <p className="text-sm text-gray-500">{referral.member.city}, {referral.member.state}</p>}
                  {referral.member?.phone && (
                    <a href={`tel:${referral.member.phone}`} className="text-sm text-teal-600 mt-0.5 block">{referral.member.phone}</a>
                  )}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[referral.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {referral.role === 'host' ? '🏠 Host' : '🔍 Seeker'} · {referral.status}
                </span>
              </div>

              {/* Submission details */}
              <div className="mt-3 pt-3 border-t border-gray-100 text-sm space-y-1">
                {referral.role === 'host' ? (
                  <>
                    {referral.home_description && <p><span className="font-medium text-gray-600">Home:</span> {referral.home_description}</p>}
                    {referral.rent_expectation && <p><span className="font-medium text-gray-600">Rent:</span> {referral.rent_expectation}</p>}
                    {referral.preferred_move_in && <p><span className="font-medium text-gray-600">Available:</span> {referral.preferred_move_in}</p>}
                    {referral.house_rules && <p><span className="font-medium text-gray-600">Rules:</span> {referral.house_rules}</p>}
                  </>
                ) : (
                  <>
                    {referral.desired_location && <p><span className="font-medium text-gray-600">Location:</span> {referral.desired_location}</p>}
                    {referral.budget_description && <p><span className="font-medium text-gray-600">Budget:</span> {referral.budget_description}</p>}
                    {referral.move_in_by && <p><span className="font-medium text-gray-600">Needs by:</span> {referral.move_in_by}</p>}
                  </>
                )}
                {referral.notes && <p><span className="font-medium text-gray-600">Notes:</span> {referral.notes}</p>}
              </div>
            </div>

            {/* Navigator actions */}
            <div className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">Navigator Actions</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Update status</label>
                  <select
                    value={(edits[referral.id] as Record<string,string>)?.status ?? referral.status}
                    onChange={e => edit(referral.id, 'status', e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Assign match</label>
                  <select
                    value={(edits[referral.id] as Record<string,string>)?.matched_member_id ?? referral.matched_member?.id ?? ''}
                    onChange={e => edit(referral.id, 'matched_member_id', e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5"
                  >
                    <option value="">No match yet</option>
                    {allMembers
                      .filter(m => m.id !== referral.member?.id)
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          {m.preferred_name ?? m.full_name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Internal notes</label>
                <textarea
                  value={(edits[referral.id] as Record<string,string>)?.navigator_notes ?? referral.navigator_notes ?? ''}
                  onChange={e => edit(referral.id, 'navigator_notes', e.target.value)}
                  placeholder="Background check status, call notes, concerns…"
                  rows={3}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => save(referral.id)}
                  disabled={saving || !edits[referral.id]}
                  className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                {referral.matched_member && (
                  <p className="text-xs text-gray-500">
                    Matched with: <span className="font-medium">{referral.matched_member.preferred_name ?? referral.matched_member.full_name}</span>
                  </p>
                )}
              </div>

              {msg && <p className="text-sm text-blue-700 bg-blue-50 rounded-lg p-2">{msg}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
