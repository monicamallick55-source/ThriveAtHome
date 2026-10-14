// app/dashboard/campaigns/page.tsx
// G6.4 Community Care Fund — Member view: see own campaigns, request help
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  created_at: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:           { label: 'Submitted — under review', color: 'bg-amber-100 text-amber-800' },
  consent_pending: { label: 'Navigator reviewing',       color: 'bg-blue-100 text-blue-800' },
  active:          { label: 'Active',                    color: 'bg-green-100 text-green-800' },
  fulfilled:       { label: 'Fulfilled ✓',               color: 'bg-teal-100 text-teal-800' },
  closed:          { label: 'Closed',                    color: 'bg-gray-100 text-gray-600' },
  withdrawn:       { label: 'Withdrawn',                 color: 'bg-gray-100 text-gray-500' },
}

const CATEGORIES = [
  { value: 'rent',      label: 'Rent / Housing' },
  { value: 'medical',   label: 'Medical / Prescriptions' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'food',      label: 'Food / Groceries' },
  { value: 'supplies',  label: 'Supplies / Equipment' },
  { value: 'other',     label: 'Other' },
]

export default function MemberCampaignsPage() {
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    story: '',
    need_category: 'other',
    goal_amount: '',
    deadline: '',
  })

  useEffect(() => { loadCampaigns() }, [])

  async function loadCampaigns() {
    setLoading(true)
    const { data, error } = await supabase
      .from('member_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error if (!error && data) setCampaigns(data)if (!error && data) setCampaigns(data) data) setCampaigns(data as any)
    setLoading(false)
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:            form.title,
          story:            form.story,
          need_category:    form.need_category,
          goal_amount_cents: form.goal_amount ? Math.round(parseFloat(form.goal_amount) * 100) : null,
          deadline:         form.deadline || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit')
      setSuccess('Your request has been submitted. Your Navigator will reach out within 1 business day.')
      setShowForm(false)
      setForm({ title: '', story: '', need_category: 'other', goal_amount: '', deadline: '' })
      loadCampaigns()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const fmt = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Community Care Fund</h1>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setSuccess(null) }}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition"
          >
            Request Help
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-8">
        Need a hand from your Thrive@Home community? Share your situation and we'll help coordinate support — with complete dignity and privacy.
      </p>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-green-800">
          {success}
        </div>
      )}

      {/* Request form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Tell us what you need</h2>
          <p className="text-xs text-gray-500 mb-5">
            Only your Navigator and family circle will see this — not the general community.
          </p>
          <form onSubmit={submitRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brief title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Help with November rent"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form.need_category}
                onChange={e => setForm(f => ({ ...f, need_category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your story <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.story}
                onChange={e => setForm(f => ({ ...f, story: e.target.value }))}
                placeholder="Describe your situation and what kind of help would make a difference. Your Navigator will review this and help share it with your family circle."
                required
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal amount (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    value={form.goal_amount}
                    onChange={e => setForm(f => ({ ...f, goal_amount: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline (optional)
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition"
              >
                {saving ? 'Submitting…' : 'Submit request'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Campaign list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🤝</div>
          <div className="text-sm">You haven't made any help requests yet.</div>
          <div className="text-xs mt-1">Click <span className="font-medium">Request Help</span> above to get started.</div>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map(c => {
            const s = STATUS_LABELS[c.status] ?? { label: c.status, color: 'bg-gray-100 text-gray-600' }
            const pct = c.goal_amount_cents
              ? Math.min(100, Math.round((c.total_confirmed_cents / c.goal_amount_cents) * 100))
              : null
            return (
              <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{c.title}</h3>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${s.color}`}>
                    {s.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{c.story}</p>

                {c.goal_amount_cents && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{fmt(c.total_confirmed_cents)} confirmed</span>
                      <span>Goal: {fmt(c.goal_amount_cents)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-teal-500 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {c.total_pledged_cents > c.total_confirmed_cents && (
                      <div className="text-xs text-gray-400 mt-1">
                        + {fmt(c.total_pledged_cents - c.total_confirmed_cents)} pledged
                      </div>
                    )}
                  </div>
                )}

                {c.status === 'active' && (c.payment_zelle || c.payment_venmo || c.payment_other) && (
                  <div className="bg-teal-50 rounded-xl p-3 text-xs text-teal-800 space-y-1">
                    <div className="font-medium mb-1">Payment info (for supporters):</div>
                    {c.payment_zelle && <div>📱 Zelle: <span className="font-mono">{c.payment_zelle}</span></div>}
                    {c.payment_venmo && <div>💸 Venmo: <span className="font-mono">@{c.payment_venmo.replace(/^@/, '')}</span></div>}
                    {c.payment_other && <div>📬 Other: {c.payment_other}</div>}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                  <span>Submitted {new Date(c.created_at).toLocaleDateString()}</span>
                  {c.deadline && <span>· Deadline {new Date(c.deadline).toLocaleDateString()}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
