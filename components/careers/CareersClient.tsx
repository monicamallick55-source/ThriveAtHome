'use client'
// components/careers/CareersClient.tsx
// Member view: career profile editor + job board with interest/apply

import { useState } from 'react'

const WORK_TYPES = ['full_time', 'part_time', 'contract', 'volunteer', 'consulting', 'flexible'] as const
type WorkType = typeof WORK_TYPES[number]

const WORK_TYPE_LABELS: Record<WorkType, string> = {
  full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract',
  volunteer: 'Volunteer', consulting: 'Consulting', flexible: 'Flexible',
}

const WORK_TYPE_COLORS: Record<WorkType, string> = {
  full_time: 'bg-blue-100 text-blue-700',
  part_time: 'bg-teal-100 text-teal-700',
  contract: 'bg-purple-100 text-purple-700',
  volunteer: 'bg-green-100 text-green-700',
  consulting: 'bg-orange-100 text-orange-700',
  flexible: 'bg-gray-100 text-gray-600',
}

interface Profile {
  id: string; headline: string | null; summary: string | null
  skills: string[]; industries: string[]; years_experience: number | null
  work_types: WorkType[]; hours_per_week_max: number | null
  remote_ok: boolean; in_person_ok: boolean
  desired_pay: string | null; available_from: string | null
  digest_opted_in: boolean; active: boolean
}

interface Opportunity {
  id: string; title: string; organization: string; description: string
  work_type: WorkType; location: string | null; remote_ok: boolean
  hours_per_week: string | null; pay: string | null
  skills_desired: string[]; closes_on: string | null; created_at: string
}

interface Interest { id: string; opportunity_id: string; status: string }

interface Props {
  profile: Profile | null
  opportunities: Opportunity[]
  interests: Interest[]
}

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('')
  function add() {
    const t = input.trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setInput('')
  }
  return (
    <div className="flex flex-wrap gap-1.5 border border-gray-300 rounded-lg px-2 py-1.5 min-h-[40px]">
      {value.map(tag => (
        <span key={tag} className="flex items-center gap-1 bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full">
          {tag}
          <button onClick={() => onChange(value.filter(v => v !== tag))} className="text-teal-500 hover:text-teal-700">×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
        onBlur={add}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
      />
    </div>
  )
}

export default function CareersClient({ profile: initialProfile, opportunities, interests: initialInterests }: Props) {
  const [tab, setTab] = useState<'board' | 'profile'>(initialProfile ? 'board' : 'profile')
  const [profile, setProfile] = useState(initialProfile)
  const [interests, setInterests] = useState(initialInterests)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [applyingTo, setApplyingTo] = useState<string | null>(null)
  const [applyNote, setApplyNote] = useState('')
  const [filterType, setFilterType] = useState<WorkType | 'all'>('all')

  const interestedIds = new Set(interests.map(i => i.opportunity_id))

  const [form, setForm] = useState({
    headline: initialProfile?.headline ?? '',
    summary: initialProfile?.summary ?? '',
    skills: initialProfile?.skills ?? [],
    industries: initialProfile?.industries ?? [],
    years_experience: initialProfile?.years_experience?.toString() ?? '',
    work_types: initialProfile?.work_types ?? [] as WorkType[],
    hours_per_week_max: initialProfile?.hours_per_week_max?.toString() ?? '',
    remote_ok: initialProfile?.remote_ok ?? true,
    in_person_ok: initialProfile?.in_person_ok ?? true,
    desired_pay: initialProfile?.desired_pay ?? '',
    available_from: initialProfile?.available_from ?? '',
    digest_opted_in: initialProfile?.digest_opted_in ?? true,
  })

  function toggleWorkType(wt: WorkType) {
    setForm(f => ({
      ...f,
      work_types: f.work_types.includes(wt)
        ? f.work_types.filter(t => t !== wt)
        : [...f.work_types, wt],
    }))
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMsg('')
    try {
      const res = await fetch('/api/careers/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          years_experience: form.years_experience ? parseInt(form.years_experience) : null,
          hours_per_week_max: form.hours_per_week_max ? parseInt(form.hours_per_week_max) : null,
        }),
      })
      const d = await res.json()
      if (res.ok) { setProfile(d.profile); setMsg('Profile saved!'); setTab('board') }
      else setMsg(d.error)
    } catch { setMsg('Network error') }
    finally { setSaving(false) }
  }

  async function expressInterest(oppId: string) {
    setSaving(true)
    try {
      const res = await fetch('/api/careers/interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity_id: oppId, note: applyNote || null }),
      })
      const d = await res.json()
      if (res.ok) {
        setInterests(prev => [...prev, { id: d.interest.id, opportunity_id: oppId, status: 'interested' }])
        setApplyingTo(null); setApplyNote('')
        if (d.apply_url) window.open(d.apply_url, '_blank')
        else if (d.apply_email) window.location.href = `mailto:${d.apply_email}`
      } else setMsg(d.error)
    } catch { setMsg('Network error') }
    finally { setSaving(false) }
  }

  const filteredOpps = opportunities.filter(o => filterType === 'all' || o.work_type === filterType)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Encore Careers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Meaningful work, flexible opportunities, purpose-driven roles</p>
        </div>
        {profile && (
          <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-medium">Profile active</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        {(['board', 'profile'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors
              ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'board' ? `Job Board (${opportunities.length})` : profile ? 'My Profile' : 'Create Profile'}
          </button>
        ))}
      </div>

      {/* ── Job Board ── */}
      {tab === 'board' && (
        <div className="space-y-4">
          {!profile && (
            <div className="border border-teal-200 bg-teal-50 rounded-xl p-4 text-sm text-teal-800">
              <p className="font-medium mb-1">Create your career profile first</p>
              <p>Set up your profile so we can match you with the best opportunities and send you a weekly digest.</p>
              <button onClick={() => setTab('profile')} className="mt-2 text-xs font-semibold text-teal-700 underline">
                Set up profile →
              </button>
            </div>
          )}

          {/* Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setFilterType('all')}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors
                ${filterType === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600'}`}>
              All
            </button>
            {WORK_TYPES.map(wt => (
              <button key={wt} onClick={() => setFilterType(wt)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors
                  ${filterType === wt ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600'}`}>
                {WORK_TYPE_LABELS[wt]}
              </button>
            ))}
          </div>

          {filteredOpps.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>No opportunities posted yet.</p>
              <p className="text-sm mt-1">Check back soon — new roles are added regularly.</p>
            </div>
          )}

          {filteredOpps.map(opp => {
            const already = interestedIds.has(opp.id)
            return (
              <div key={opp.id} className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{opp.title}</p>
                    <p className="text-sm text-gray-600">{opp.organization}</p>
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${WORK_TYPE_COLORS[opp.work_type]}`}>
                    {WORK_TYPE_LABELS[opp.work_type]}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{opp.description}</p>

                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                  {opp.location && <span>📍 {opp.location}{opp.remote_ok ? ' / Remote' : ''}</span>}
                  {opp.hours_per_week && <span>⏱ {opp.hours_per_week}</span>}
                  {opp.pay && <span>💰 {opp.pay}</span>}
                  {opp.closes_on && <span>📅 Closes {new Date(opp.closes_on).toLocaleDateString()}</span>}
                </div>

                {opp.skills_desired.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {opp.skills_desired.map(s => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                )}

                {applyingTo === opp.id ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={applyNote}
                      onChange={e => setApplyNote(e.target.value)}
                      placeholder="Optional: add a note about your interest or background..."
                      rows={2}
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => expressInterest(opp.id)} disabled={saving}
                        className="flex-1 py-2 bg-teal-600 text-white text-sm rounded-lg font-medium disabled:opacity-50">
                        {saving ? 'Sending…' : 'Confirm interest'}
                      </button>
                      <button onClick={() => { setApplyingTo(null); setApplyNote('') }}
                        className="px-4 py-2 border border-gray-300 text-sm rounded-lg text-gray-600">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : already ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                    ✓ You expressed interest
                  </span>
                ) : (
                  <button onClick={() => setApplyingTo(opp.id)}
                    className="text-sm font-medium text-teal-600 hover:text-teal-700">
                    Express interest →
                  </button>
                )}
              </div>
            )
          })}

          {msg && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{msg}</p>}
        </div>
      )}

      {/* ── Career Profile ── */}
      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
            <input value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
              placeholder="e.g. Retired teacher seeking tutoring or mentoring work"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">About you</label>
            <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              placeholder="Brief summary of your background and what you are looking for..."
              rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills <span className="text-gray-400 font-normal">(press Enter to add)</span></label>
            <TagInput value={form.skills} onChange={v => setForm(f => ({ ...f, skills: v }))} placeholder="e.g. Teaching, Excel, Bookkeeping…" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industries <span className="text-gray-400 font-normal">(press Enter to add)</span></label>
            <TagInput value={form.industries} onChange={v => setForm(f => ({ ...f, industries: v }))} placeholder="e.g. Education, Healthcare, Nonprofit…" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Years of experience</label>
              <input type="number" min="0" max="60" value={form.years_experience}
                onChange={e => setForm(f => ({ ...f, years_experience: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max hours/week</label>
              <input type="number" min="1" max="40" value={form.hours_per_week_max}
                onChange={e => setForm(f => ({ ...f, hours_per_week_max: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Open to work types</label>
            <div className="flex flex-wrap gap-2">
              {WORK_TYPES.map(wt => (
                <button key={wt} type="button" onClick={() => toggleWorkType(wt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                    ${form.work_types.includes(wt) ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-300 text-gray-600'}`}>
                  {WORK_TYPE_LABELS[wt]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.remote_ok}
                onChange={e => setForm(f => ({ ...f, remote_ok: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-teal-600" />
              <span className="text-sm text-gray-700">Open to remote</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.in_person_ok}
                onChange={e => setForm(f => ({ ...f, in_person_ok: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-teal-600" />
              <span className="text-sm text-gray-700">Open to in-person</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pay expectation</label>
              <input value={form.desired_pay} onChange={e => setForm(f => ({ ...f, desired_pay: e.target.value }))}
                placeholder="e.g. $20-25/hr, volunteer OK"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available from</label>
              <input type="date" value={form.available_from}
                onChange={e => setForm(f => ({ ...f, available_from: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.digest_opted_in}
              onChange={e => setForm(f => ({ ...f, digest_opted_in: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-teal-600" />
            <span className="text-sm text-gray-700">Send me a weekly digest of matching opportunities</span>
          </label>

          {msg && <p className={`text-sm rounded-lg p-3 ${msg.includes('saved') ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'}`}>{msg}</p>}

          <button type="submit" disabled={saving}
            className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50">
            {saving ? 'Saving…' : profile ? 'Update profile' : 'Create profile'}
          </button>
        </form>
      )}
    </div>
  )
}
