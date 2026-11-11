'use client'

/**
 * app/device/page.tsx — G4.5 Thrive Device Kiosk
 *
 * Runs on the tablet/kiosk assigned to a member.
 * URL: /device?token=<device_token>
 *
 * Features:
 * - Self-identifies using ?token= query param
 * - Sends heartbeat every 5 minutes
 * - Shows large-print member dashboard shortcut buttons
 * - Calls Aria (Grace) directly (opens Retell call widget)
 * - Device must be in 'active' status to show dashboard
 */

import { useState, useEffect, useCallback } from 'react'

type DeviceInfo = {
  id: string
  status: string
  member_id?: string
  label?: string
  device_type: string
}

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export default function DevicePage() {
  const [token, setToken] = useState<string | null>(null)
  const [device, setDevice] = useState<DeviceInfo | null>(null)
  const [status, setStatus] = useState<'loading' | 'active' | 'pending' | 'suspended' | 'error'>('loading')
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    setToken(t)
  }, [])

  useEffect(() => {
    if (!token) return
    fetch(`/api/devices/${token}?by=token`)
      .then((r) => r.json())
      .then(({ device: d }) => {
        if (!d) { setStatus('error'); return }
        setDevice(d)
        setStatus(d.status === 'active' ? 'active' : d.status === 'pending' ? 'pending' : 'suspended')
      })
      .catch(() => setStatus('error'))
  }, [token])

  const sendHeartbeat = useCallback(() => {
    if (!token || !device) return
    fetch(`/api/devices/${device.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'heartbeat', token }),
    }).catch(() => {/* silent */})
  }, [token, device])

  useEffect(() => {
    if (status !== 'active') return
    sendHeartbeat()
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [status, sendHeartbeat])

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f9ff' }}>
        <p style={{ fontSize: '1.5rem', color: '#6b7280' }}>Starting up…</p>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0f9ff', padding: 32 }}>
        <div style={{ fontSize: '4rem', marginBottom: 24 }}>⏳</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>Device not yet activated</h1>
        <p style={{ fontSize: '1.1rem', color: '#6b7280', textAlign: 'center', maxWidth: 400 }}>
          Your ThriveAtHome device is set up and waiting to be activated by your navigator.
          Please contact your navigator or call <strong>ThriveAtHome support</strong>.
        </p>
        <div style={{ marginTop: 24, fontSize: '0.85rem', color: '#9ca3af' }}>Device token: {token}</div>
      </div>
    )
  }

  if (status === 'suspended' || status === 'error') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff1f2', padding: 32 }}>
        <div style={{ fontSize: '4rem', marginBottom: 24 }}>🔒</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 12 }}>Device unavailable</h1>
        <p style={{ fontSize: '1.1rem', color: '#6b7280', textAlign: 'center', maxWidth: 400 }}>
          Please contact your navigator or call ThriveAtHome for help.
        </p>
      </div>
    )
  }

  // Active kiosk UI
  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 24px', fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: 4 }}>{dateStr}</div>
        <div style={{ fontSize: '4rem', fontWeight: 700, color: '#1e3a5f', lineHeight: 1 }}>{timeStr}</div>
        {device?.label && (
          <div style={{ fontSize: '0.9rem', color: '#9ca3af', marginTop: 8 }}>{device.label}</div>
        )}
      </div>

      {/* Aria call button — prominent at top */}
      <button
        aria-label="Call Aria — your AI companion"
        onClick={() => window.location.assign('/dashboard/call')}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          width: '100%', maxWidth: 560, padding: '28px 16px', borderRadius: 20, marginBottom: 20,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
        }}>
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>📞</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>Call Aria</div>
        <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)' }}>Your AI companion — always here</div>
      </button>

      {/* Main action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, width: '100%', maxWidth: 560, marginBottom: 32 }}>
        {[
          { emoji: '🗓', label: 'My Schedule', sublabel: 'Today\'s activities', color: '#10b981', href: '/dashboard/calendar' },
          { emoji: '💊', label: 'Medications', sublabel: 'Reminders & tracking', color: '#f59e0b', href: '/dashboard/health' },
          { emoji: '👥', label: 'My Buddy', sublabel: 'Connect with your buddy', color: '#3b82f6', href: '/dashboard/buddy' },
          { emoji: '🆘', label: 'Need Help', sublabel: 'Contact navigator', color: '#ef4444', href: '/dashboard/help' },
        ].map((btn) => (
          <a
            key={btn.label}
            href={btn.href}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '32px 16px', borderRadius: 20,
              background: '#fff', border: `3px solid ${btn.color}20`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              textDecoration: 'none', cursor: 'pointer',
            }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>{btn.emoji}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>{btn.label}</div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>{btn.sublabel}</div>
          </a>
        ))}
      </div>

      <div style={{ fontSize: '0.85rem', color: '#9ca3af', textAlign: 'center' }}>
        🌿 ThriveAtHome · Keeping you independent at home
      </div>
    </div>
  )
}
