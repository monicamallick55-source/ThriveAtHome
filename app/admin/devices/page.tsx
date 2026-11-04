'use client'

/**
 * app/admin/devices/page.tsx — G4.5 Device Management (staff/navigator)
 *
 * Staff can:
 * - View all provisioned devices for their org
 * - Provision new devices (generates a UUID token)
 * - Activate / suspend / retire devices
 * - See last heartbeat time and device status
 */

import { useState, useEffect } from 'react'

type Device = {
  id: string
  token: string
  label?: string
  device_type: string
  os?: string
  status: 'pending' | 'active' | 'suspended' | 'retired'
  member_id?: string
  org_id?: string
  mdm_device_id?: string
  last_seen_at?: string
  activated_at?: string
  created_at: string
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#f59e0b',
  active: '#10b981',
  suspended: '#ef4444',
  retired: '#9ca3af',
}

const BLANK_FORM = {
  label: '',
  device_type: 'tablet',
  os: '',
  member_id: '',
  org_id: '',
}

function timeAgo(iso?: string) {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...BLANK_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  useEffect(() => { loadDevices() }, [])

  async function loadDevices() {
    setLoading(true)
    const res = await fetch('/api/devices')
    const data = await res.json()
    setDevices(data.devices ?? [])
    setLoading(false)
  }

  async function provision() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: form.label || null,
          device_type: form.device_type,
          os: form.os || null,
          member_id: form.member_id || null,
          org_id: form.org_id || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDevices((prev) => [data.device, ...prev])
      setShowForm(false)
      setForm({ ...BLANK_FORM })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function updateDevice(id: string, action: string) {
    const res = await fetch(`/api/devices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    if (res.ok) {
      setDevices((prev) => prev.map((d) => d.id === id ? data.device : d))
    }
  }

  function copyToken(token: string) {
    navigator.clipboard.writeText(token).catch(() => {})
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const kioskUrl = (token: string) =>
    `${typeof window !== 'undefined' ? window.location.origin : 'https://thriveatHome.app'}/device?token=${token}`

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Thrive Devices</h1>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: '0.875rem' }}>
            Tablets and kiosks assigned to members
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
          + Provision device
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 12, marginBottom: 16, color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {/* Provision form */}
      {showForm && (
        <div style={{ border: '2px solid #6366f1', borderRadius: 14, padding: 20, marginBottom: 24 }}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 16 }}>New device</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Label</label>
              <input value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Margaret's tablet"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Device type</label>
              <select value={form.device_type} onChange={(e) => setForm((p) => ({ ...p, device_type: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}>
                <option value="tablet">Tablet</option>
                <option value="phone">Phone</option>
                <option value="tv">Smart TV</option>
                <option value="kiosk">Kiosk</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>OS</label>
              <input value={form.os} onChange={(e) => setForm((p) => ({ ...p, os: e.target.value }))}
                placeholder="e.g. iOS 17, Android 14"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Member UUID (optional)</label>
              <input value={form.member_id} onChange={(e) => setForm((p) => ({ ...p, member_id: e.target.value }))}
                placeholder="Assign to member"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setShowForm(false); setForm({ ...BLANK_FORM }) }}
              style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={provision} disabled={saving}
              style={{ flex: 2, padding: '10px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              {saving ? 'Provisioning…' : 'Generate token & provision'}
            </button>
          </div>
        </div>
      )}

      {/* Device list */}
      {loading ? (
        <p style={{ color: '#9ca3af' }}>Loading…</p>
      ) : devices.length === 0 ? (
        <p style={{ color: '#9ca3af', textAlign: 'center', paddingTop: 32 }}>No devices provisioned yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {devices.map((device) => (
            <div key={device.id} style={{
              border: '1px solid #e5e7eb', borderRadius: 12, padding: 16,
              borderLeft: `4px solid ${STATUS_COLOR[device.status] ?? '#e5e7eb'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.95rem' }}>
                      {device.label ?? `${device.device_type} device`}
                    </strong>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
                      background: (STATUS_COLOR[device.status] ?? '#9ca3af') + '20',
                      color: STATUS_COLOR[device.status] ?? '#9ca3af',
                    }}>
                      {device.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 4 }}>
                    {device.device_type}{device.os ? ` · ${device.os}` : ''}
                    {device.member_id ? ` · member: ${device.member_id.slice(0, 8)}…` : ''}
                    {' · '} Last seen: {timeAgo(device.last_seen_at)}
                  </div>

                  {/* Token + kiosk URL */}
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => copyToken(device.token)}
                      style={{ fontSize: '0.75rem', padding: '3px 10px', border: '1px solid #d1d5db', borderRadius: 6, background: '#f9fafb', cursor: 'pointer' }}>
                      {copiedToken === device.token ? '✓ Copied' : '📋 Copy token'}
                    </button>
                    <button
                      onClick={() => copyToken(kioskUrl(device.token))}
                      style={{ fontSize: '0.75rem', padding: '3px 10px', border: '1px solid #d1d5db', borderRadius: 6, background: '#f9fafb', cursor: 'pointer' }}>
                      {copiedToken === kioskUrl(device.token) ? '✓ Copied' : '🔗 Copy kiosk URL'}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {device.status === 'pending' && (
                    <button onClick={() => updateDevice(device.id, 'activate')}
                      style={{ padding: '5px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      Activate
                    </button>
                  )}
                  {device.status === 'active' && (
                    <button onClick={() => updateDevice(device.id, 'suspend')}
                      style={{ padding: '5px 12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      Suspend
                    </button>
                  )}
                  {device.status === 'suspended' && (
                    <button onClick={() => updateDevice(device.id, 'activate')}
                      style={{ padding: '5px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      Reactivate
                    </button>
                  )}
                  {device.status !== 'retired' && (
                    <button onClick={() => { if (confirm('Retire this device?')) updateDevice(device.id, 'retire') }}
                      style={{ padding: '5px 12px', background: '#fff', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem' }}>
                      Retire
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
