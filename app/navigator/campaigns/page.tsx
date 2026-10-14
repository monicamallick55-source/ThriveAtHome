// app/navigator/campaigns/page.tsx
// G6.4 Community Care Fund — Navigator: create campaigns, approve, add payment info, confirm contributions
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Member { id: string; first_name: string; last_name: string }

interface Campaign {
  id: string
  title: string
  story: string
  need_category: string
  goal_amount_cents: number | null
  deadline: string | null
  payment_zelle: string | null
  payment_venmo: string | null
  payment_other: string | null
  status: string
  member_consent: boolean
  total_pledged_cents: number
  total_confirmed_cents: number
  navigator_notes: string | null
  created_at: string
  members: { first_name: string; last_name: string }
}

interface Contribution {
  id: string
  campaign_id: string
  contribution_type: string
  amount_cents: number | null
  in_kind_description: string | null
  volunteer_date: string | null
  message: string | null
  anonymous: boolean
  payment_method: string | null
  status: string
  confirmed_at: string | null
  navigator_notes: string | null
  created_at: string
}

const STATUS_ORDER = ['draft', 'consent_pending', 'active', 'fulfilled', 'closed', 'withdrawn']
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:           { label: 'Draft',              color: 'bg-amber-100 text-amber-800' },
  consent_pending: { label: 'Consent pending',    color: 'bg-blue-100 text-blue-800' },
  active:          { label: 'Active',             color: 'bg-green-100 text-green-800' },
  fulfilled:       { label: 'Fulfilled',          color: 'bg-teal-100 text-teal-800' },
  closed:          { label: 'Closed',             color: 'bg-gray-100 text-gray-600' },
  withdrawn:       { label: 'Withdrawn',          color: 'bg-gray-100 text-gray-500' },
}
const CATEGORIES = [
  { value: 'rent',      label: 'Rent / Housing' },
  { value: 'medical',   label: 'Medical / Prescriptions' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'food',      label: 'Food / Groceries' },
  { value: 'supplies',  label: 'Supplies / Equipment' },
  { value: 'other',     label: 'Other' },
]

export default function NavigatorCampaignsPage() {
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [contributions, setContributions] = useState<Record<string, Contribution[]>>({})
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'active' | 'all' | 'new'>('active')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // New campaign form
  const [form, setForm] = useState({
    member_id: '',
    title: '',
    story: '',
    need_category: 'other',
    goal_amount: '',
    deadline: '',
    payment_zelle: '',
    payment_venmo: '',
    payment_other: '',
    navigator_notes: '',
    member_consent: false,
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: camps }, { data: mems }] = await Promise.all([
      supabase
        .from('member_campaigns')
        .select('*, members(first_name, last_name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('members')
        .select('id, first_name, last_name')
        .order('last_name'),
    ])
    if (camps) {
      setCampaigns(camps as any)
      // Load contributions for each campaign
      const contribMap: Record<string, Contribution[]> = {}
      for (const c of camps) {
        const { data: contribs } = await supabase
          .from('campaign_contributions')
          .select('*')
          .eq('campaign_id', c.id)
          .order('created_at', { ascending: false })
        if (contribs) contribMap[c.id] = contribs as any
      }
      setContributions(contribMap)
    }
    if (mems) setMembers(mems)
    setLoading(false)
  }

  async function updateCampaign(id: string, patch: Record<string, unknown>) {
    setSaving(id)
    setError(null)
    const res = await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Update failed')
    }
    setSaving(null)
    loadData()
  }

  async function confirmContribution(contrib: Contribution) {
    setSaving(contrib.id)
    const res = await fetch(`/api/campaigns/${contrib.campaign_id}/contribute`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contribution_id: contrib.id, status: 'confirmed' }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Confirm failed')
    }
    setSaving(null)
    loadData()
  }

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault()
    setSaving('new')
    setError(null)
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id:         form.member_id,
        title:             form.title,
        story:             form.story,
        need_category:     form.need_category,
        goal_amount_cents: form.goal_amount ? Math.round(parseFloat(form.goal_amount) * 100) : null,
        deadline:          form.deadline || null,
        payment_zelle:     form.payment_zelle || null,
        payment_venmo:     form.payment_venmo || null,
        payment_other:     form.payment_other || null,
        navigator_notes:   form.navigator_notes || null,
        member_consent:    form.member_consent,
        status:            form.member_consent ? 'active' : 'consent_pending',
      }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Create failed')
    } else {
      setTab('active')
      setForm({
        member_id: '', title: '', story: '', need_category: 'other',
        goal_amount: '', deadline: '', payment_zelle: '', payment_venmo: '',
        payment_other: '', navigator_notes: '', member_consent: false,
      })
    }
    setSaving(null)
    loadData()
  }

  const fmt = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`

  const displayCampaigns = campaigns.filter(c =>
    tab === 'active' ? ['draft', 'consent_pending', 'active'].includes(c.status) : true
  )

  const totalActive = campaigns.filter(c => c.status === 'active').length
  const pendingReview = campaigns.filter(c => c.status === 'draft').length
  const pendingContribs = Object.values(contributions).flat().filter(c => c.status === 'pledged').length

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Community Care Fund</h1>
      <p className="text-sm text-gray-500 mb-6">Manage member campaigns and confirm contributions.</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { n: totalActive,      label: 'Active campaigns' },
          { n: pendingReview,    label: 'Pending review' },
          { n: pendingContribs,  label: 'Pledges to confirm' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{s.n}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'active', label: 'Active & pending' },
          { key: 'all',    label: 'All campaigns' },
          { key: 'new',    label: '+ New campaign' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* New campaign form */}
      {tab === 'new' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-5">Create campaign on behalf of member</h2>
          <form onSubmit={createCampaign} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member <span className="text-red-500">*</span></label>
              <select
                value={form.member_id}
                onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select member…</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.last_name}, {m.first_name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.need_category} onChange={e => setForm(f => ({ ...f, need_category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Story (shown to family circle) <span className="text-red-500">*</span></label>
              <textarea required value={form.story} onChange={e => setForm(f => ({ ...f, story: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal amount (optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                  <input type="number" value={form.goal_amount} onChange={e => setForm(f => ({ ...f, goal_amount: e.target.value }))}
                    placeholder="0.00" min="0" step="0.01"
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline (optional)</label>
                <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="text-sm font-medium text-gray-700 mb-3">Payment info (add after consent call)</div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Zelle (phone/email)</label>
                  <input type="text" value={form.payment_zelle} onChange={e => setForm(f => ({ ...f, payment_zelle: e.target.value }))}
                    placeholder="555-555-5555"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Venmo handle</label>
                  <input type="text" value={form.payment_venmo} onChange={e => setForm(f => ({ ...f, payment_venmo: e.target.value }))}
                    placeholder="@username"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Other (check, cash)</label>
                  <input type="text" value={form.payment_other} onChange={e => setForm(f => ({ ...f, payment_other: e.target.value }))}
                    placeholder="e.g. Send check to Navigator"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Navigator notes (internal only)</label>
              <textarea value={form.navigator_notes} onChange={e => setForm(f => ({ ...f, navigator_notes: e.target.value }))}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.member_consent} onChange={e => setForm(f => ({ ...f, member_consent: e.target.checked }))}
                className="rounded" />
              Member has given verbal consent to share this campaign (will go live immediately)
            </label>

            <div className="flex gap-3">
              <button type="submit" disabled={saving === 'new'}
                className="bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition">
                {saving === 'new' ? 'Creating…' : 'Create campaign'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Campaign list */}
      {tab !== 'new' && (
        loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
        ) : displayCampaigns.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No campaigns to show.</div>
        ) : (
          <div className="space-y-4">
            {displayCampaigns.map(c => {
              const s = STATUS_LABELS[c.status] ?? { label: c.status, color: 'bg-gray-100 text-gray-600' }
              const contribs = contributions[c.id] ?? []
              const pendingContribsForCampaign = contribs.filter(x => x.status === 'pledged')
              const isExpanded = expanded === c.id
              const pct = c.goal_amount_cents
                ? Math.min(100, Math.round((c.total_confirmed_cents / c.goal_amount_cents) * 100))
                : null

              return (
                <div key={c.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  {/* Header */}
                  <button
                    className="w-full text-left px-5 py-4 hover:bg-gray-50 transition"
                    onClick={() => setExpanded(isExpanded ? null : c.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{c.title}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                          {pendingContribsForCampaign.length > 0 && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              {pendingContribsForCampaign.length} pledge{pendingContribsForCampaign.length !== 1 ? 's' : ''} to confirm
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {c.members.first_name} {c.members.last_name} · {new Date(c.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="text-gray-400 text-sm mt-0.5">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                    {c.goal_amount_cents && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>{fmt(c.total_confirmed_cents)} confirmed</span>
                          <span>Goal: {fmt(c.goal_amount_cents)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 py-5 space-y-5">
                      <p className="text-sm text-gray-700">{c.story}</p>

                      {/* Status transitions */}
                      <div className="flex flex-wrap gap-2">
                        {c.status === 'draft' && (
                          <>
                            <button
                              onClick={() => updateCampaign(c.id, { status: 'consent_pending' })}
                              disabled={saving === c.id}
                              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition disabled:opacity-50"
                            >
                              Start consent call
                            </button>
                            <button
                              onClick={() => updateCampaign(c.id, { status: 'withdrawn' })}
                              disabled={saving === c.id}
                              className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition disabled:opacity-50"
                            >
                              Withdraw
                            </button>
                          </>
                        )}
                        {c.status === 'consent_pending' && (
                          <button
                            onClick={() => updateCampaign(c.id, { status: 'active', member_consent: true, consent_date: new Date().toISOString() })}
                            disabled={saving === c.id}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition disabled:opacity-50"
                          >
                            Mark consent obtained → Activate
                          </button>
                        )}
                        {c.status === 'active' && (
                          <>
                            <button
                              onClick={() => updateCampaign(c.id, { status: 'fulfilled', fulfilled_at: new Date().toISOString() })}
                              disabled={saving === c.id}
                              className="bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-teal-700 transition disabled:opacity-50"
                            >
                              Mark fulfilled ✓
                            </button>
                            <button
                              onClick={() => updateCampaign(c.id, { status: 'closed', closed_at: new Date().toISOString() })}
                              disabled={saving === c.id}
                              className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition disabled:opacity-50"
                            >
                              Close campaign
                            </button>
                          </>
                        )}
                      </div>

                      {/* Payment info (editable inline) */}
                      <PaymentInfoEditor campaign={c} onSave={patch => updateCampaign(c.id, patch)} saving={saving === c.id} />

                      {/* Contributions */}
                      {contribs.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Contributions</h4>
                          <div className="space-y-2">
                            {contribs.map(contrib => (
                              <div key={contrib.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                                <div className="text-sm">
                                  <span className="font-medium text-gray-800">
                                    {contrib.contribution_type === 'financial' && contrib.amount_cents ? fmt(contrib.amount_cents) : ''}
                                    {contrib.contribution_type === 'in_kind' ? contrib.in_kind_description : ''}
                                    {contrib.contribution_type === 'volunteer' ? 'Volunteer' : ''}
                                  </span>
                                  {contrib.payment_method && (
                                    <span className="text-xs text-gray-400 ml-2">via {contrib.payment_method}</span>
                                  )}
                                  {contrib.message && (
                                    <div className="text-xs text-gray-400 mt-0.5 italic">&ldquo;{contrib.message}&rdquo;</div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {contrib.status === 'pledged' ? (
                                    <button
                                      onClick={() => confirmContribution(contrib)}
                                      disabled={saving === contrib.id}
                                      className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-green-700 transition disabled:opacity-50"
                                    >
                                      {saving === contrib.id ? '…' : 'Confirm received'}
                                    </button>
                                  ) : (
                                    <span className="text-xs text-green-600 font-medium">✓ Confirmed</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Navigator notes */}
                      <NavigatorNotesEditor campaign={c} onSave={notes => updateCampaign(c.id, { navigator_notes: notes })} saving={saving === c.id} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}

function PaymentInfoEditor({
  campaign,
  onSave,
  saving,
}: {
  campaign: Campaign
  onSave: (patch: Record<string, string | null>) => void
  saving: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [zelle, setZelle] = useState(campaign.payment_zelle ?? '')
  const [venmo, setVenmo] = useState(campaign.payment_venmo ?? '')
  const [other, setOther] = useState(campaign.payment_other ?? '')

  if (!editing) {
    const hasPayment = campaign.payment_zelle || campaign.payment_venmo || campaign.payment_other
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment info</span>
          <button onClick={() => setEditing(true)} className="text-xs text-teal-600 hover:text-teal-800">Edit</button>
        </div>
        {hasPayment ? (
          <div className="text-xs text-gray-600 space-y-0.5">
            {campaign.payment_zelle && <div>Zelle: {campaign.payment_zelle}</div>}
            {campaign.payment_venmo && <div>Venmo: @{campaign.payment_venmo.replace(/^@/, '')}</div>}
            {campaign.payment_other && <div>Other: {campaign.payment_other}</div>}
          </div>
        ) : (
          <div className="text-xs text-amber-600">
            ⚠ No payment info — add after consent call to activate campaign
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Payment info</div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          { label: 'Zelle', value: zelle, set: setZelle, placeholder: 'Phone or email' },
          { label: 'Venmo', value: venmo, set: setVenmo, placeholder: '@handle' },
          { label: 'Other', value: other, set: setOther, placeholder: 'e.g. Send check to Navigator' },
        ].map(f => (
          <div key={f.label}>
            <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
            <input type="text" value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => { onSave({ payment_zelle: zelle || null, payment_venmo: venmo || null, payment_other: other || null }); setEditing(false) }}
          disabled={saving}
          className="bg-teal-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-teal-700 disabled:opacity-50 transition"
        >
          Save
        </button>
        <button onClick={() => setEditing(false)} className="border border-gray-300 text-gray-600 px-3 py-1 rounded-lg text-xs hover:bg-white transition">
          Cancel
        </button>
      </div>
    </div>
  )
}

function NavigatorNotesEditor({
  campaign,
  onSave,
  saving,
}: {
  campaign: Campaign
  onSave: (notes: string) => void
  saving: boolean
}) {
  const [notes, setNotes] = useState(campaign.navigator_notes ?? '')
  const [editing, setEditing] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Navigator notes (internal)</span>
        {!editing && <button onClick={() => setEditing(true)} className="text-xs text-teal-600 hover:text-teal-800">Edit</button>}
      </div>
      {editing ? (
        <div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2" />
          <div className="flex gap-2">
            <button
              onClick={() => { onSave(notes); setEditing(false) }}
              disabled={saving}
              className="bg-teal-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-teal-700 disabled:opacity-50 transition"
            >
              Save
            </button>
            <button onClick={() => { setNotes(campaign.navigator_notes ?? ''); setEditing(false) }}
              className="border border-gray-300 text-gray-600 px-3 py-1 rounded-lg text-xs hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-600 italic">
          {notes || <span className="text-gray-300">No notes</span>}
        </div>
      )}
    </div>
  )
}
