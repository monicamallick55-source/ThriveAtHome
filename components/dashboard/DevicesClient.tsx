'use client'

// M22 — device management UI: companion tablet, voice assistants + smart home,
// wearables, fall protection status, and EHR / FHIR health-record export.
import { useState } from 'react'
import type {
  MemberDeviceRow,
  WearableConnectionRow,
  WearableReadingRow,
  FallEventRow,
  EhrConnectionRow,
  FhirExportLogRow,
} from '@/types/database'

type Tab = 'tablet' | 'voice' | 'wearables' | 'fall' | 'ehr'

const TABS: { key: Tab; label: string }[] = [
  { key: 'tablet', label: 'Companion Device' },
  { key: 'voice', label: 'Voice & Smart Home' },
  { key: 'wearables', label: 'Wearables' },
  { key: 'fall', label: 'Fall Protection' },
  { key: 'ehr', label: 'Health Records' },
]

const VOICE_OPTIONS: { type: string; provider: string; label: string; smartHome: boolean }[] = [
  { type: 'alexa', provider: 'amazon', label: 'Amazon Alexa', smartHome: false },
  { type: 'google_assistant', provider: 'google', label: 'Google Assistant', smartHome: false },
  { type: 'echo_show', provider: 'amazon', label: 'Amazon Echo Show', smartHome: false },
  { type: 'nest_hub', provider: 'google', label: 'Google Nest Hub', smartHome: true },
  { type: 'ring_doorbell', provider: 'ring', label: 'Ring Doorbell', smartHome: true },
  { type: 'adt_hub', provider: 'adt', label: 'ADT Security Hub', smartHome: true },
  { type: 'philips_hue', provider: 'signify', label: 'Philips Hue Lights', smartHome: true },
  { type: 'grandpad', provider: 'grandpad', label: 'GrandPad', smartHome: false },
  { type: 'motion_sensor', provider: 'thriveathome', label: 'Room Motion Sensor', smartHome: true },
]

const WEARABLE_OPTIONS: { platform: string; label: string }[] = [
  { platform: 'apple_healthkit', label: 'Apple Health' },
  { platform: 'google_fit', label: 'Google Fit' },
  { platform: 'fitbit', label: 'Fitbit' },
  { platform: 'garmin', label: 'Garmin' },
]

const EHR_OPTIONS: { system: string; label: string }[] = [
  { system: 'epic', label: 'Epic (MyChart)' },
  { system: 'cerner', label: 'Oracle Health (Cerner)' },
  { system: 'athenahealth', label: 'athenahealth' },
  { system: 'generic_fhir', label: 'Other FHIR endpoint' },
]

const card: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid rgba(0,0,0,0.06)',
  padding: '20px',
  boxShadow: 'var(--shadow-card)',
}
const h2: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '22px',
  fontWeight: 500,
  color: 'var(--color-navy)',
  margin: '0 0 12px',
}
const btn: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  fontWeight: 600,
  minHeight: '48px',
  padding: '0 20px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  backgroundColor: 'var(--color-teal)',
  color: 'white',
  cursor: 'pointer',
}
const btnGhost: React.CSSProperties = {
  ...btn,
  backgroundColor: 'transparent',
  color: 'var(--color-teal)',
  border: '1.5px solid var(--color-teal)',
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default function DevicesClient({
  preferredName,
  initialDevices,
  initialWearables,
  initialReadings,
  initialFallEvents,
  initialEhrConnections,
  initialFhirLog,
}: {
  preferredName: string
  initialDevices: MemberDeviceRow[]
  initialWearables: WearableConnectionRow[]
  initialReadings: WearableReadingRow[]
  initialFallEvents: FallEventRow[]
  initialEhrConnections: EhrConnectionRow[]
  initialFhirLog: FhirExportLogRow[]
}) {
  const [tab, setTab] = useState<Tab>('tablet')
  const [devices, setDevices] = useState(initialDevices)
  const [wearables, setWearables] = useState(initialWearables)
  const [readings] = useState(initialReadings)
  const [fallEvents, setFallEvents] = useState(initialFallEvents)
  const [ehr, setEhr] = useState(initialEhrConnections)
  const [fhirLog] = useState(initialFhirLog)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  async function api(path: string, init?: RequestInit) {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.error || 'Something went wrong. Please try again.')
    return json
  }

  async function refreshDevices() {
    try {
      const { devices: d } = await api('/api/devices')
      setDevices(d)
    } catch {
      /* keep existing */
    }
  }

  async function registerTablet(billing: string) {
    setBusy('tablet')
    setMsg(null)
    try {
      const { device } = await api('/api/devices', {
        method: 'POST',
        body: JSON.stringify({
          device_category: 'companion_tablet',
          device_type: 'thrive_tablet',
          device_name: 'Thrive Companion Tablet',
          provider: 'thriveathome',
          billing_option: billing,
        }),
      })
      setDevices((prev) => [device, ...prev])
      setMsg({ kind: 'ok', text: 'Tablet requested — we will ship it pre-configured within 5 business days.' })
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Please try again.' })
    } finally {
      setBusy(null)
    }
  }

  async function linkVoice(deviceType: string, provider: string) {
    setBusy(deviceType)
    setMsg(null)
    try {
      await api('/api/devices/link-voice', {
        method: 'POST',
        body: JSON.stringify({ device_type: deviceType, provider }),
      })
      await refreshDevices()
      setMsg({ kind: 'ok', text: 'Device linked. It may take a few minutes to appear as active.' })
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Please try again.' })
    } finally {
      setBusy(null)
    }
  }

  async function disconnectDevice(id: string) {
    setBusy(id)
    try {
      await api(`/api/devices/${id}`, { method: 'DELETE' })
      setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'disconnected' } : d)))
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Please try again.' })
    } finally {
      setBusy(null)
    }
  }

  async function connectWearable(platform: string) {
    setBusy(platform)
    setMsg(null)
    try {
      const { connection } = await api('/api/wearables', {
        method: 'POST',
        body: JSON.stringify({ platform }),
      })
      setWearables((prev) => [connection, ...prev.filter((w) => w.platform !== platform)])
      setMsg({ kind: 'ok', text: 'Wearable connected. Fall detection is now active for this device.' })
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Please try again.' })
    } finally {
      setBusy(null)
    }
  }

  async function revokeWearable(id: string) {
    setBusy(id)
    try {
      await api(`/api/wearables/${id}`, { method: 'DELETE' })
      setWearables((prev) => prev.map((w) => (w.id === id ? { ...w, status: 'revoked' } : w)))
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Please try again.' })
    } finally {
      setBusy(null)
    }
  }

  async function syncWearables() {
    setBusy('sync')
    setMsg(null)
    try {
      const r = await api('/api/wearables/sync', { method: 'POST', body: JSON.stringify({}) })
      setMsg({ kind: 'ok', text: `Synced ${r.saved} day(s) of readings.` })
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Please try again.' })
    } finally {
      setBusy(null)
    }
  }

  async function testFallAlert() {
    if (!confirm('This raises a real emergency alert and notifies the care team. Continue with the test?')) return
    setBusy('fall-test')
    setMsg(null)
    try {
      const r = await api('/api/devices/fall-event', { method: 'POST', body: JSON.stringify({ test: true }) })
      if (r.fallEventId || r.alertId) {
        setMsg({ kind: 'ok', text: 'Fall alert raised — check the dashboard alerts panel and the care team.' })
      } else {
        setMsg({ kind: 'ok', text: 'A recent fall alert already exists, so this one was merged.' })
      }
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Please try again.' })
    } finally {
      setBusy(null)
    }
  }

  async function connectEhr(system: string) {
    setBusy(system)
    setMsg(null)
    let fhirBaseUrl: string | null = null
    if (system === 'generic_fhir') {
      fhirBaseUrl = prompt('Enter the FHIR R4 base URL (for example https://fhir.example.org/r4):') || null
      if (!fhirBaseUrl) {
        setBusy(null)
        return
      }
    }
    try {
      const { connection } = await api('/api/ehr', {
        method: 'POST',
        body: JSON.stringify({ ehr_system: system, fhir_base_url: fhirBaseUrl }),
      })
      setEhr((prev) => [connection, ...prev.filter((c) => c.ehr_system !== system)])
      setMsg({ kind: 'ok', text: 'Health record connected. You can now export wellness data as FHIR.' })
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Please try again.' })
    } finally {
      setBusy(null)
    }
  }

  async function revokeEhr(id: string) {
    setBusy(id)
    try {
      await api(`/api/ehr/${id}`, { method: 'DELETE' })
      setEhr((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'revoked' } : c)))
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Please try again.' })
    } finally {
      setBusy(null)
    }
  }

  async function exportFhir() {
    setBusy('fhir-export')
    setMsg(null)
    try {
      const r = await api('/api/ehr/sync', { method: 'POST', body: JSON.stringify({}) })
      const total = (r.exported ?? []).reduce(
        (n: number, x: { observations: number; conditions: number }) => n + x.observations + x.conditions,
        0
      )
      setMsg({ kind: 'ok', text: `Exported ${total} FHIR resource(s) to ${r.exported?.length ?? 0} system(s).` })
      try {
        const { connections } = await api('/api/ehr')
        setEhr(connections)
      } catch {
        /* ignore */
      }
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Please try again.' })
    } finally {
      setBusy(null)
    }
  }

  const activeWearables = wearables.filter((w) => w.status === 'active')
  const activeDevices = devices.filter((d) => d.status === 'active')

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 600,
              minHeight: '44px',
              padding: '0 16px',
              borderRadius: '999px',
              border: tab === t.key ? '1.5px solid var(--color-teal)' : '1.5px solid rgba(0,0,0,0.12)',
              backgroundColor: tab === t.key ? 'var(--color-teal)' : 'white',
              color: tab === t.key ? 'white' : 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && (
        <div
          role="status"
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            backgroundColor: msg.kind === 'ok' ? '#f0fdf4' : '#fef2f2',
            color: msg.kind === 'ok' ? '#166534' : '#b91c1c',
            border: `1px solid ${msg.kind === 'ok' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {msg.text}
        </div>
      )}

      {/* ─── Companion Device ─── */}
      {tab === 'tablet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={card}>
            <h2 style={h2}>Thrive Companion Tablet</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>
              A pre-configured Android tablet that arrives ready to use — no setup for {preferredName}.
              One large button for Aria&apos;s call, one for family video, and one for help.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button style={btn} disabled={busy === 'tablet'} onClick={() => registerTablet('one_time_99')}>
                Buy for $99 one-time
              </button>
              <button style={btnGhost} disabled={busy === 'tablet'} onClick={() => registerTablet('monthly_15')}>
                Rent for $15 / month
              </button>
              <button style={btnGhost} disabled={busy === 'tablet'} onClick={() => registerTablet('free_with_commitment')}>
                Free with a 2-year plan
              </button>
            </div>
          </div>

          <div style={card}>
            <h2 style={h2}>Your devices</h2>
            {devices.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
                No devices yet.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {devices.map((d) => (
                  <li
                    key={d.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-cream)',
                    }}
                  >
                    <div>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, margin: '0 0 2px', color: 'var(--color-text-primary)' }}>
                        {d.device_name || d.device_type.replace(/_/g, ' ')}
                      </p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                        {d.device_category.replace(/_/g, ' ')} · {d.status}
                        {d.billing_option !== 'none' ? ` · ${d.billing_option.replace(/_/g, ' ')}` : ''}
                      </p>
                    </div>
                    {d.status !== 'disconnected' && (
                      <button
                        style={{ ...btnGhost, minHeight: '40px', fontSize: '13px' }}
                        disabled={busy === d.id}
                        onClick={() => disconnectDevice(d.id)}
                      >
                        Disconnect
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ─── Voice & Smart Home ─── */}
      {tab === 'voice' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={card}>
            <h2 style={h2}>Voice assistants &amp; smart home</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>
              Link Alexa or Google Assistant to hear the daily briefing by voice. Link
              smart-home sensors (Ring, ADT, Nest, motion sensors) so ThriveAtHome can
              notice if something seems off at home.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
              {VOICE_OPTIONS.map((o) => {
                const linked = devices.find((d) => d.device_type === o.type && d.status !== 'disconnected')
                return (
                  <div key={o.type} style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-cream)' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, margin: '0 0 6px' }}>
                      {o.label}
                      {o.smartHome ? '  🏠' : '  🔊'}
                    </p>
                    {linked ? (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#166534' }}>
                        ✓ {linked.status}
                      </span>
                    ) : (
                      <button
                        style={{ ...btn, minHeight: '40px', fontSize: '13px' }}
                        disabled={busy === o.type}
                        onClick={() => linkVoice(o.type, o.provider)}
                      >
                        {busy === o.type ? 'Linking…' : 'Link'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Wearables ─── */}
      {tab === 'wearables' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={card}>
            <h2 style={h2}>Wearables &amp; health data</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>
              Connect a smartwatch or fitness tracker to share steps, resting heart
              rate, and sleep — and to enable automatic fall detection.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {WEARABLE_OPTIONS.map((o) => {
                const conn = wearables.find((w) => w.platform === o.platform && w.status === 'active')
                return (
                  <div key={o.platform} style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-cream)' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, margin: '0 0 6px' }}>{o.label}</p>
                    {conn ? (
                      <button
                        style={{ ...btnGhost, minHeight: '40px', fontSize: '13px' }}
                        disabled={busy === conn.id}
                        onClick={() => revokeWearable(conn.id)}
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        style={{ ...btn, minHeight: '40px', fontSize: '13px' }}
                        disabled={busy === o.platform}
                        onClick={() => connectWearable(o.platform)}
                      >
                        {busy === o.platform ? 'Connecting…' : 'Connect'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {activeWearables.length > 0 && (
              <button style={{ ...btnGhost, marginTop: '14px' }} disabled={busy === 'sync'} onClick={syncWearables}>
                {busy === 'sync' ? 'Syncing…' : 'Sync readings now'}
              </button>
            )}
          </div>

          <div style={card}>
            <h2 style={h2}>Recent readings</h2>
            {readings.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
                No readings yet. Connect a wearable and sync to see data here.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--color-text-secondary)' }}>
                      <th style={{ padding: '6px 8px' }}>Date</th>
                      <th style={{ padding: '6px 8px' }}>Steps</th>
                      <th style={{ padding: '6px 8px' }}>Resting HR</th>
                      <th style={{ padding: '6px 8px' }}>Sleep (h)</th>
                      <th style={{ padding: '6px 8px' }}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map((r) => (
                      <tr key={r.id} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                        <td style={{ padding: '6px 8px' }}>{r.reading_date}</td>
                        <td style={{ padding: '6px 8px' }}>{r.steps ?? '—'}</td>
                        <td style={{ padding: '6px 8px' }}>{r.resting_heart_rate ?? '—'}</td>
                        <td style={{ padding: '6px 8px' }}>{r.sleep_hours ?? '—'}</td>
                        <td style={{ padding: '6px 8px' }}>{r.source_platform ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Fall Protection ─── */}
      {tab === 'fall' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={card}>
            <h2 style={h2}>Fall protection status</h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                margin: '0 0 12px',
                color: activeWearables.length > 0 || activeDevices.length > 0 ? '#166534' : '#b45309',
                fontWeight: 600,
              }}
            >
              {activeWearables.length > 0
                ? '● Active — fall detection is monitoring a connected wearable.'
                : activeDevices.length > 0
                  ? '● Partial — smart-home no-motion checks are running. Add a wearable for automatic fall detection.'
                  : '● Not active — connect a wearable or smart-home sensor to enable fall protection.'}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>
              When a fall is detected, ThriveAtHome raises an emergency alert, texts
              emergency contacts, and opens a critical task for the on-call navigator —
              within 60 seconds. A long stretch with no movement at home does the same.
            </p>
            <button style={{ ...btnGhost, borderColor: '#dc2626', color: '#dc2626' }} disabled={busy === 'fall-test'} onClick={testFallAlert}>
              {busy === 'fall-test' ? 'Sending…' : 'Send a test fall alert'}
            </button>
          </div>

          <div style={card}>
            <h2 style={h2}>Fall event history</h2>
            {fallEvents.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
                No fall events recorded. That&apos;s good news.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {fallEvents.map((f) => (
                  <li key={f.id} style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: f.resolved ? 'var(--color-cream)' : '#fef2f2' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, margin: '0 0 2px' }}>
                      {f.resolved ? '✓ Resolved' : '⚠ Open'} · {f.source.replace(/_/g, ' ')}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                      {fmtDate(f.detected_at)}
                      {f.resolution_note ? ` — ${f.resolution_note}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ─── Health Records (EHR / FHIR) ─── */}
      {tab === 'ehr' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={card}>
            <h2 style={h2}>Connect a health record</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>
              With your consent, ThriveAtHome can send wellness observations (mood,
              energy, activity) and flagged concerns to {preferredName}&apos;s doctor as
              standard HL7 FHIR records.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
              {EHR_OPTIONS.map((o) => {
                const conn = ehr.find((c) => c.ehr_system === o.system && c.status === 'active')
                return (
                  <div key={o.system} style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-cream)' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, margin: '0 0 6px' }}>{o.label}</p>
                    {conn ? (
                      <button
                        style={{ ...btnGhost, minHeight: '40px', fontSize: '13px' }}
                        disabled={busy === conn.id}
                        onClick={() => revokeEhr(conn.id)}
                      >
                        Revoke
                      </button>
                    ) : (
                      <button
                        style={{ ...btn, minHeight: '40px', fontSize: '13px' }}
                        disabled={busy === o.system}
                        onClick={() => connectEhr(o.system)}
                      >
                        {busy === o.system ? 'Connecting…' : 'Connect'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {ehr.some((c) => c.status === 'active') && (
              <button style={{ ...btnGhost, marginTop: '14px' }} disabled={busy === 'fhir-export'} onClick={exportFhir}>
                {busy === 'fhir-export' ? 'Exporting…' : 'Export last 30 days as FHIR'}
              </button>
            )}
          </div>

          <div style={card}>
            <h2 style={h2}>Export history</h2>
            {fhirLog.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
                No exports yet.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {fhirLog.map((l) => (
                  <li key={l.id} style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {fmtDate(l.created_at)} · {l.resource_type} × {l.resource_count} · {l.export_status}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
