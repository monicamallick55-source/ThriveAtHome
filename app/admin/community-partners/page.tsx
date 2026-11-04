'use client'

/**
 * app/admin/community-partners/page.tsx — G6.0 Community Partners Admin
 *
 * Staff-only page to view, confirm, pause and add community partners.
 * RLS enforces staff-only write access; this UI provides the visual interface.
 */

import { useState, useEffect } from 'react'

type Partner = {
  id: string
  name: string
  category: string
  phone?: string
  website?: string
  referral_method: string
  status: 'pending_confirmation' | 'active' | 'paused'
  mou_signed: boolean
  service_counties: string[]
  eligibility_notes?: string
  confirmed_at?: string
}

const CATEGORY_LABELS: Record<string, string> = {
  home_sharing: 'Home Sharing',
  meals: 'Meals',
  transportation: 'Transportation',
  benefits_enrollment: 'Benefits Enrollment',
  mental_health: 'Mental Health',
  legal_aid: 'Legal Aid',
  caregiver_support: 'Caregiver Support',
  other: 'Other',
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending_confirmation: { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
  active: { bg: '#dcfce7', color: '#166534', label: 'Active' },
  paused: { bg: '#f3f4f6', color: '#6b7280', label: 'Paused' },
}

export default function CommunityPartnersAdminPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Add form state
  const [form, setForm] = useState({
    name: '',
    category: 'home_sharing',
    phone: '',
    website: '',
    referral_method: 'phone',
    service_counties: 'San Mateo',
    eligibility_notes: '',
  })

  useEffect(() => {
    loadPartners()
  }, [filterCategory, filterStatus])

  async function loadPartners() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterCategory) params.set('category', filterCategory)
    if (filterStatus) params.set('status', filterStatus)
    const res = await fetch(`/api/community-partners?${params}`)
    const data = await res.json()
    setPartners(data.partners ?? [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    setSaving(true)
    const res = await fetch(`/api/community-partners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setPartners((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: status as Partner['status'] } : p))
      )
    }
    setSaving(false)
  }

  async function updateMou(id: string, mou_signed: boolean) {
    await fetch(`/api/community-partners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mou_signed }),
    })
    setPartners((prev) =>
      prev.map((p) => (p.id === id ? { ...p, mou_signed } : p))
    )
  }

  async function saveNotes(id: string, notes: string) {
    setSaving(true)
    await fetch(`/api/community-partners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eligibility_notes: notes }),
    })
    setSaving(false)
    setEditingId(null)
  }

  async function addPartner() {
    setSaving(true)
    setError('')
    const counties = form.service_counties.split(',').map((c) => c.trim()).filter(Boolean)
    const res = await fetch('/api/community-partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, service_counties: counties }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
    } else {
      setShowAddModal(false)
      setForm({ name: '', category: 'home_sharing', phone: '', website: '', referral_method: 'phone', service_counties: 'San Mateo', eligibility_notes: '' })
      loadPartners()
    }
    setSaving(false)
  }

  const filtered = partners.filter((p) => {
    if (filterCategory && p.category !== filterCategory) return false
    if (filterStatus && p.status !== filterStatus) return false
    return true
  })

  const pendingCount = partners.filter((p) => p.status === 'pending_confirmation').length

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Community Partners</h1>
          <p style={{ color: '#6b7280', marginTop: 4 }}>
            Manage partner organisations that members can be referred to
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ padding: '10px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          + Add Partner
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: partners.length, color: '#6366f1' },
          { label: 'Active', value: partners.filter((p) => p.status === 'active').length, color: '#10b981' },
          { label: 'Pending', value: pendingCount, color: '#f59e0b' },
          { label: 'Paused', value: partners.filter((p) => p.status === 'paused').length, color: '#6b7280' },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
            padding: '12px 20px', flex: '1 1 100px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {pendingCount > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          ⚠️ <strong>{pendingCount} partner{pendingCount !== 1 ? 's' : ''}</strong> waiting for confirmation.
          Review below and confirm when MOU is signed.
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.875rem' }}>
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.875rem' }}>
          <option value="">All statuses</option>
          <option value="pending_confirmation">Pending</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>
        <button onClick={loadPartners}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: '0.875rem' }}>
          ↻ Refresh
        </button>
      </div>

      {/* Partner table */}
      {loading ? (
        <p style={{ color: '#9ca3af', textAlign: 'center', paddingTop: 40 }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: '#9ca3af', textAlign: 'center', paddingTop: 40 }}>No partners found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((partner) => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              editing={editingId === partner.id}
              onEdit={() => setEditingId(partner.id)}
              onCancelEdit={() => setEditingId(null)}
              onSaveNotes={(notes) => saveNotes(partner.id, notes)}
              onStatusChange={(status) => updateStatus(partner.id, status)}
              onMouChange={(signed) => updateMou(partner.id, signed)}
              saving={saving}
            />
          ))}
        </div>
      )}

      {/* Add partner modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16
        }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 500 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 20 }}>Add Community Partner</h2>
            {error && <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>}

            {[
              { label: 'Partner Name *', key: 'name', placeholder: 'e.g. HIP Housing' },
              { label: 'Phone', key: 'phone', placeholder: '(650) 555-0100' },
              { label: 'Website', key: 'website', placeholder: 'https://…' },
              { label: 'Service Counties (comma-separated)', key: 'service_counties', placeholder: 'San Mateo, Santa Clara' },
              { label: 'Eligibility Notes', key: 'eligibility_notes', placeholder: 'Must be 60+, low-income…' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem', fontWeight: 500 }}>{label}</label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem', fontWeight: 500 }}>Category</label>
              <select value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem', fontWeight: 500 }}>Referral Method</label>
              <select value={form.referral_method} onChange={(e) => setForm((prev) => ({ ...prev, referral_method: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="online_form">Online Form</option>
                <option value="navigator_warm_handoff">Navigator Warm Handoff</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowAddModal(false)}
                style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={addPartner} disabled={!form.name || saving}
                style={{
                  flex: 2, padding: '10px', background: form.name ? '#6366f1' : '#e5e7eb',
                  color: form.name ? '#fff' : '#9ca3af', border: 'none', borderRadius: 8,
                  cursor: form.name ? 'pointer' : 'default', fontWeight: 600
                }}>
                {saving ? 'Saving…' : 'Add Partner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PartnerCard({
  partner, editing, onEdit, onCancelEdit, onSaveNotes,
  onStatusChange, onMouChange, saving
}: {
  partner: Partner
  editing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onSaveNotes: (notes: string) => void
  onStatusChange: (status: string) => void
  onMouChange: (signed: boolean) => void
  saving: boolean
}) {
  const [notes, setNotes] = useState(partner.eligibility_notes ?? '')
  const statusStyle = STATUS_COLORS[partner.status]

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: '1rem' }}>{partner.name}</strong>
            <span style={{
              background: statusStyle.bg, color: statusStyle.color,
              padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600
            }}>
              {statusStyle.label}
            </span>
            <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem' }}>
              {CATEGORY_LABELS[partner.category] ?? partner.category}
            </span>
          </div>
          <div style={{ marginTop: 6, fontSize: '0.85rem', color: '#6b7280' }}>
            {partner.phone && <span>📞 {partner.phone} &nbsp;</span>}
            {partner.website && (
              <a href={partner.website} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>
                🌐 Website ↗ &nbsp;
              </a>
            )}
            <span>Counties: {partner.service_counties.join(', ')}</span>
          </div>
          <div style={{ marginTop: 4, fontSize: '0.8rem', color: '#9ca3af' }}>
            Referral: {partner.referral_method.replace(/_/g, ' ')}
            {partner.confirmed_at && ` · Confirmed ${new Date(partner.confirmed_at).toLocaleDateString()}`}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {partner.status === 'pending_confirmation' && (
            <button onClick={() => onStatusChange('active')} disabled={saving}
              style={{ padding: '6px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              ✓ Confirm
            </button>
          )}
          {partner.status === 'active' && (
            <button onClick={() => onStatusChange('paused')} disabled={saving}
              style={{ padding: '6px 14px', background: '#fff', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: 7, cursor: 'pointer', fontSize: '0.85rem' }}>
              Pause
            </button>
          )}
          {partner.status === 'paused' && (
            <button onClick={() => onStatusChange('active')} disabled={saving}
              style={{ padding: '6px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.85rem' }}>
              Reactivate
            </button>
          )}
          {!editing && (
            <button onClick={onEdit}
              style={{ padding: '6px 14px', background: '#fff', color: '#6366f1', border: '1px solid #c7d2fe', borderRadius: 7, cursor: 'pointer', fontSize: '0.85rem' }}>
              Notes
            </button>
          )}
        </div>
      </div>

      {/* MOU checkbox */}
      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: '#374151' }}>
          <input
            type="checkbox"
            checked={partner.mou_signed}
            onChange={(e) => onMouChange(e.target.checked)}
          />
          MOU signed
        </label>
      </div>

      {/* Eligibility notes (editable) */}
      {editing && (
        <div style={{ marginTop: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', fontWeight: 500 }}>
            Eligibility notes (visible to navigators)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '0.875rem' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={onCancelEdit}
              style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
              Cancel
            </button>
            <button onClick={() => onSaveNotes(notes)} disabled={saving}
              style={{ padding: '6px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              {saving ? 'Saving…' : 'Save Notes'}
            </button>
          </div>
        </div>
      )}

      {/* Show notes preview if not editing */}
      {!editing && partner.eligibility_notes && (
        <div style={{ marginTop: 10, padding: '8px 12px', background: '#f9fafb', borderRadius: 8, fontSize: '0.85rem', color: '#6b7280' }}>
          📋 {partner.eligibility_notes}
        </div>
      )}
    </div>
  )
}
