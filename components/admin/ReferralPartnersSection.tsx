'use client'
import { useState, useEffect } from 'react'

type ReferralPartner = {
  id: string
  org_name: string
  contact: string | null
  partner_type: string
  notes: string | null
  is_active: boolean
  created_at: string
}

const PARTNER_TYPES = [
  { value: 'hospice', label: 'Hospice' },
  { value: 'hospital_social_worker', label: 'Hospital Social Worker' },
  { value: 'bereavement_counselor', label: 'Bereavement Counselor' },
  { value: 'other', label: 'Other' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #D4CFC8',
  borderRadius: '8px', fontFamily: 'inherit', fontSize: '15px', boxSizing: 'border-box',
}

export function ReferralPartnersSection() {
  const [partners, setPartners] = useState<ReferralPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ org_name: '', contact: '', partner_type: 'hospice', notes: '' })
  const [formErr, setFormErr] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/referral-partners')
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setErr(json.error ?? 'Failed to load'); return }
    setPartners(json.partners ?? [])
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.org_name.trim()) { setFormErr('Organization name is required.'); return }
    setSaving(true); setFormErr(null)
    const res = await fetch('/api/admin/referral-partners', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setFormErr(json.error ?? 'Failed to save.'); return }
    setPartners(prev => [json.partner, ...prev])
    setForm({ org_name: '', contact: '', partner_type: 'hospice', notes: '' })
    setShowForm(false)
  }

  async function toggleActive(partner: ReferralPartner) {
    await fetch('/api/admin/referral-partners', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: partner.id, is_active: !partner.is_active }),
    })
    setPartners(prev => prev.map((p: any) => p.id === partner.id ? { ...p, is_active: !p.is_active } : p))
  }

  const typeLabel = (v: string) => PARTNER_TYPES.find(t => t.value === v)?.label ?? v

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '28px 32px', border: '1px solid #E8E4DC' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
            🕊️ Referral Partners
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
            Hospices, hospital social workers, and bereavement counselors who refer members
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(f => !f)}
          style={{ padding: '8px 18px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : '+ Add partner'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={{ backgroundColor: '#F9F7F4', borderRadius: '10px', padding: '20px 24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 700, color: 'var(--color-navy)', margin: 0 }}>New referral partner</h3>
          {formErr && <div style={{ padding: '10px 14px', backgroundColor: '#FEE2E2', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#DC2626' }}>{formErr}</div>}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>Organization name *</label>
            <input value={form.org_name} onChange={e => setForm(f => ({ ...f, org_name: e.target.value }))} required
              placeholder="e.g. Horizon Hospice Care" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>Contact name or email</label>
            <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
              placeholder="e.g. Sarah Chen, s.chen@hospice.org" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>Partner type</label>
            <select value={form.partner_type} onChange={e => setForm(f => ({ ...f, partner_type: e.target.value }))}
              style={{ ...inputStyle, backgroundColor: 'white' }}>
              {PARTNER_TYPES.map((t: any) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>Notes (optional)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} placeholder="Referral terms, geography, additional context"
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <button type="submit" disabled={saving}
            style={{ alignSelf: 'flex-start', padding: '10px 24px', backgroundColor: saving ? '#9CA3AF' : 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving…' : 'Save partner'}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '32px 0' }}>Loading…</p>
      ) : err ? (
        <div style={{ padding: '16px', backgroundColor: '#FEE2E2', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#DC2626' }}>{err}</div>
      ) : partners.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>
          No referral partners yet. Add one above to start tracking attribution.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {partners.map((p: any) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '14px 18px', backgroundColor: p.is_active ? 'white' : '#F9F7F4', border: `1px solid ${p.is_active ? '#E8E4DC' : '#D4CFC8'}`, borderRadius: '10px', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, color: p.is_active ? 'var(--color-navy)' : '#9CA3AF' }}>{p.org_name}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#7C3AED', backgroundColor: '#F5F3FF', padding: '2px 8px', borderRadius: '12px', fontFamily: 'var(--font-body)' }}>{typeLabel(p.partner_type)}</span>
                  {!p.is_active && <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', backgroundColor: '#F3F4F6', padding: '2px 8px', borderRadius: '12px', fontFamily: 'var(--font-body)' }}>INACTIVE</span>}
                </div>
                {p.contact && <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#6B7280' }}>{p.contact}</div>}
                {p.notes && <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#6B7280', marginTop: '2px', fontStyle: 'italic' }}>{p.notes}</div>}
              </div>
              <button
                type="button"
                onClick={() => toggleActive(p)}
                style={{ fontSize: '13px', fontWeight: 500, color: p.is_active ? '#DC2626' : 'var(--color-teal)', background: 'transparent', border: `1.5px solid ${p.is_active ? '#FCA5A5' : 'var(--color-teal)'}`, borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}
              >
                {p.is_active ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
