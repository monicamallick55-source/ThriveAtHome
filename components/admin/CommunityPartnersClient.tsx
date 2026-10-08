'use client'
// components/admin/CommunityPartnersClient.tsx
// Admin UI for community partners — list, add, edit, deactivate, refer.

import { useState, useMemo } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Partner {
  id: string
  name: string
  category: string
  description: string | null
  website_url: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  contact_name: string | null
  status: 'active' | 'pending_confirmation' | 'inactive'
  notes: string | null
  created_at: string
}

interface Props {
  initialPartners: Partner[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'food',           label: '🍽️  Food & Nutrition' },
  { value: 'transportation', label: '🚗  Transportation' },
  { value: 'legal',          label: '⚖️  Legal & Financial' },
  { value: 'health',         label: '❤️  Health & Wellness' },
  { value: 'social',         label: '🤝  Social & Volunteers' },
  { value: 'home',           label: '🏠  Home & Housing' },
  { value: 'employment',     label: '💼  Employment & Careers' },
]

const STATUS_STYLES: Record<string, string> = {
  active:               'bg-green-100 text-green-700',
  pending_confirmation: 'bg-amber-100 text-amber-700',
  inactive:             'bg-gray-100 text-gray-500',
}
const STATUS_LABELS: Record<string, string> = {
  active:               'Active',
  pending_confirmation: 'Pending',
  inactive:             'Inactive',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PartnerFormModal({
  partner,
  onClose,
  onSaved,
}: {
  partner?: Partner
  onClose: () => void
  onSaved: (p: Partner) => void
}) {
  const isEdit = !!partner

  const [form, setForm] = useState({
    name:         partner?.name         ?? '',
    category:     partner?.category     ?? 'food',
    description:  partner?.description  ?? '',
    website_url:  partner?.website_url  ?? '',
    phone:        partner?.phone        ?? '',
    email:        partner?.email        ?? '',
    address:      partner?.address      ?? '',
    city:         partner?.city         ?? '',
    state:        partner?.state        ?? '',
    zip:          partner?.zip          ?? '',
    contact_name: partner?.contact_name ?? '',
    status:       partner?.status       ?? 'pending_confirmation',
    notes:        partner?.notes        ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError(null)

    const url    = isEdit ? `/api/admin/community-partners/${partner!.id}` : '/api/admin/community-partners'
    const method = isEdit ? 'PATCH' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError((d as { error?: string }).error ?? 'Something went wrong')
        return
      }
      const saved = await res.json()
      onSaved(saved)
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal
      aria-label={isEdit ? 'Edit partner' : 'Add partner'}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-brand-navy">
          {isEdit ? 'Edit partner' : 'Add community partner'}
        </h2>

        {/* Name */}
        <div className="space-y-1">
          <label className="font-semibold text-brand-navy text-[17px]">Organization name *</label>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[17px]
                       focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className="font-semibold text-brand-navy text-[17px]">Category *</label>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[17px]
                       focus:outline-none focus:ring-2 focus:ring-brand-teal"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="font-semibold text-brand-navy text-[17px]">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[17px]
                       focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none"
          />
        </div>

        {/* Contact row */}
        <div className="grid grid-cols-2 gap-3">
          {[
            ['website_url',  'Website URL'],
            ['phone',        'Phone'],
            ['email',        'Email'],
            ['contact_name', 'Contact name'],
          ].map(([k, label]) => (
            <div key={k} className="space-y-1">
              <label className="font-semibold text-brand-navy text-[15px]">{label}</label>
              <input
                value={(form as Record<string, string>)[k]}
                onChange={(e) => set(k, e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[16px]
                           focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>
          ))}
        </div>

        {/* Address */}
        <div className="space-y-1">
          <label className="font-semibold text-brand-navy text-[17px]">Address</label>
          <input
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="Street address"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[17px]
                       focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
          <div className="grid grid-cols-3 gap-2 mt-1">
            {[['city','City'],['state','State (2-letter)'],['zip','ZIP']].map(([k, ph]) => (
              <input
                key={k}
                value={(form as Record<string, string>)[k]}
                onChange={(e) => set(k, e.target.value)}
                placeholder={ph}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-[15px]
                           focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="font-semibold text-brand-navy text-[17px]">Status</label>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[17px]
                       focus:outline-none focus:ring-2 focus:ring-brand-teal"
          >
            <option value="pending_confirmation">Pending confirmation</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Internal notes */}
        <div className="space-y-1">
          <label className="font-semibold text-brand-navy text-[17px]">
            Internal notes
            <span className="font-normal text-gray-400 ml-1">(not visible to members)</span>
          </label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[17px]
                       focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none"
          />
        </div>

        {error && <p className="text-red-600 text-[17px]" role="alert">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3
                       rounded-xl text-[18px] min-h-[52px] hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-brand-teal text-white font-semibold py-3
                       rounded-xl text-[18px] min-h-[52px] disabled:opacity-50
                       hover:bg-brand-teal-light transition-colors"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add partner'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Partner detail / referral panel ──────────────────────────────────────────

function PartnerDetail({
  partner,
  onClose,
  onEdit,
  onDeactivate,
}: {
  partner: Partner
  onClose: () => void
  onEdit: () => void
  onDeactivate: () => void
}) {
  const [memberId,     setMemberId]     = useState('')
  const [referralNote, setReferralNote] = useState('')
  const [referring,    setReferring]    = useState(false)
  const [referralDone, setReferralDone] = useState(false)
  const [refError,     setRefError]     = useState<string | null>(null)

  const handleRefer = async () => {
    if (!memberId.trim()) { setRefError('Member ID is required'); return }
    setReferring(true)
    setRefError(null)
    try {
      const res = await fetch(`/api/admin/community-partners/${partner.id}/referrals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: memberId.trim(), reason: referralNote.trim() || undefined }),
      })
      if (res.ok) {
        setReferralDone(true)
        setMemberId('')
        setReferralNote('')
      } else {
        const d = await res.json().catch(() => ({}))
        setRefError((d as { error?: string }).error ?? 'Something went wrong')
      }
    } catch {
      setRefError('Network error')
    } finally {
      setReferring(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal
      aria-label={partner.name}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-brand-navy">{partner.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-500 text-[16px]">{categoryLabel(partner.category)}</span>
              <span className={`px-2 py-0.5 rounded-full text-[13px] font-medium ${STATUS_STYLES[partner.status]}`}>
                {STATUS_LABELS[partner.status]}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none" aria-label="Close">×</button>
        </div>

        {partner.description && (
          <p className="text-gray-600 text-[17px]">{partner.description}</p>
        )}

        {/* Contact details */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[16px]">
          {partner.phone && (
            <>
              <dt className="text-gray-400 font-medium">Phone</dt>
              <dd className="text-gray-700">{partner.phone}</dd>
            </>
          )}
          {partner.email && (
            <>
              <dt className="text-gray-400 font-medium">Email</dt>
              <dd className="text-gray-700 break-all">{partner.email}</dd>
            </>
          )}
          {partner.website_url && (
            <>
              <dt className="text-gray-400 font-medium">Website</dt>
              <dd>
                <a
                  href={partner.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-teal hover:underline break-all"
                >
                  {partner.website_url}
                </a>
              </dd>
            </>
          )}
          {partner.contact_name && (
            <>
              <dt className="text-gray-400 font-medium">Contact</dt>
              <dd className="text-gray-700">{partner.contact_name}</dd>
            </>
          )}
          {(partner.city || partner.state) && (
            <>
              <dt className="text-gray-400 font-medium">Location</dt>
              <dd className="text-gray-700">
                {[partner.address, partner.city, partner.state, partner.zip].filter(Boolean).join(', ')}
              </dd>
            </>
          )}
        </dl>

        {partner.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[15px] text-amber-800">
            <strong>Internal note:</strong> {partner.notes}
          </div>
        )}

        {/* Refer a member */}
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h3 className="font-semibold text-brand-navy text-[18px]">Refer a member</h3>

          {referralDone && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-[16px]">
              ✓ Referral sent — member has been notified.
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[16px] font-medium text-brand-navy">Member ID</label>
            <input
              value={memberId}
              onChange={(e) => { setMemberId(e.target.value); setReferralDone(false) }}
              placeholder="Paste member UUID…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[16px]
                         focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[16px] font-medium text-brand-navy">
              Reason <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={referralNote}
              onChange={(e) => setReferralNote(e.target.value)}
              placeholder="Why is this partner a good fit for this member?"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[16px]
                         focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none"
            />
          </div>

          {refError && <p className="text-red-600 text-[16px]" role="alert">{refError}</p>}

          <button
            onClick={handleRefer}
            disabled={referring || !memberId.trim()}
            className="w-full bg-brand-teal text-white font-semibold py-3
                       rounded-xl text-[17px] min-h-[48px] disabled:opacity-50
                       hover:bg-brand-teal-light transition-colors"
          >
            {referring ? 'Sending referral…' : 'Send referral'}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-gray-100 pt-4">
          <button
            onClick={onEdit}
            className="flex-1 border border-brand-teal text-brand-teal font-semibold py-3
                       rounded-xl text-[17px] min-h-[48px] hover:bg-brand-teal/5 transition-colors"
          >
            Edit
          </button>
          {partner.status !== 'inactive' && (
            <button
              onClick={onDeactivate}
              className="flex-1 border border-red-200 text-red-500 font-semibold py-3
                         rounded-xl text-[17px] min-h-[48px] hover:bg-red-50 transition-colors"
            >
              Deactivate
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CommunityPartnersClient({ initialPartners }: Props) {
  const [partners,    setPartners]    = useState<Partner[]>(initialPartners)
  const [filterCat,   setFilterCat]   = useState<string>('all')
  const [filterStat,  setFilterStat]  = useState<string>('all')
  const [search,      setSearch]      = useState('')
  const [showAdd,     setShowAdd]     = useState(false)
  const [editTarget,  setEditTarget]  = useState<Partner | null>(null)
  const [viewTarget,  setViewTarget]  = useState<Partner | null>(null)

  const filtered = useMemo(() => {
    return partners.filter((p) => {
      if (filterCat  !== 'all' && p.category !== filterCat)  return false
      if (filterStat !== 'all' && p.status   !== filterStat) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!p.name.toLowerCase().includes(q) &&
            !(p.description ?? '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [partners, filterCat, filterStat, search])

  const upsert = (saved: Partner) => {
    setPartners((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
    setShowAdd(false)
    setEditTarget(null)
    setViewTarget(saved)
  }

  const deactivate = async (partner: Partner) => {
    if (!confirm(`Deactivate "${partner.name}"? Members won't see it.`)) return
    const res = await fetch(`/api/admin/community-partners/${partner.id}`, { method: 'DELETE' })
    if (res.ok) {
      setPartners((prev) => prev.map((p) => p.id === partner.id ? { ...p, status: 'inactive' } : p))
      setViewTarget(null)
    }
  }

  const counts = useMemo(() => ({
    all:                  partners.length,
    active:               partners.filter((p) => p.status === 'active').length,
    pending_confirmation: partners.filter((p) => p.status === 'pending_confirmation').length,
    inactive:             partners.filter((p) => p.status === 'inactive').length,
  }), [partners])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Community Partners</h1>
          <p className="text-gray-500 text-[18px] mt-1">
            Local organisations we refer members to.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-brand-teal text-white font-semibold px-5 py-2.5 rounded-xl
                     text-[18px] min-h-[52px] hover:bg-brand-teal-light transition-colors"
        >
          + Add partner
        </button>
      </div>

      {/* Status summary pills */}
      <div className="flex gap-3 flex-wrap">
        {[
          ['all',                  'All',     counts.all],
          ['active',               'Active',  counts.active],
          ['pending_confirmation', 'Pending', counts.pending_confirmation],
          ['inactive',             'Inactive',counts.inactive],
        ].map(([val, label, count]) => (
          <button
            key={val}
            onClick={() => setFilterStat(String(val))}
            className={`px-4 py-1.5 rounded-full text-[16px] font-medium transition-colors
              ${filterStat === val
                ? 'bg-brand-navy text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search partners…"
          className="flex-1 min-w-[180px] border border-gray-200 rounded-xl px-4 py-2.5
                     text-[17px] focus:outline-none focus:ring-2 focus:ring-brand-teal"
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-[17px]
                     focus:outline-none focus:ring-2 focus:ring-brand-teal"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Partners list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-gray-400 text-[20px]">No partners found.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => setViewTarget(p)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 p-5
                           hover:border-brand-teal/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="font-bold text-brand-navy text-[19px]">{p.name}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-[13px] font-medium ${STATUS_STYLES[p.status]}`}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </div>
                    <p className="text-gray-500 text-[15px] mt-0.5">{categoryLabel(p.category)}</p>
                    {p.description && (
                      <p className="text-gray-600 text-[16px] mt-1 line-clamp-2">{p.description}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1 text-[15px] text-gray-400">
                    {p.phone && <span>{p.phone}</span>}
                    {p.city  && <span>{[p.city, p.state].filter(Boolean).join(', ')}</span>}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Modals */}
      {showAdd && (
        <PartnerFormModal
          onClose={() => setShowAdd(false)}
          onSaved={upsert}
        />
      )}
      {editTarget && (
        <PartnerFormModal
          partner={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={upsert}
        />
      )}
      {viewTarget && !editTarget && (
        <PartnerDetail
          partner={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={() => { setEditTarget(viewTarget); setViewTarget(null) }}
          onDeactivate={() => deactivate(viewTarget)}
        />
      )}
    </div>
  )
}
