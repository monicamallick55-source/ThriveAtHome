'use client'
import { useState } from 'react'
import type { Volunteer } from '@/lib/data/volunteers'

const SERVICE_LABELS: Record<string, string> = {
  phone_call: 'Phone call',
  in_person_visit: 'In-person visit',
  virtual_event: 'Virtual events',
  grocery_help: 'Grocery help',
  walking_companion: 'Walking companion',
  reading_aloud: 'Reading aloud',
  tech_help: 'Tech help',
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

type QueueMode = 'pending' | 'background_check'

export function AdminVolunteerQueue({ applications: initial, mode = 'pending' }: { applications: Volunteer[]; mode?: QueueMode }) {
  const [applications, setApplications] = useState<Volunteer[]>(initial)
  const [processing, setProcessing] = useState<Set<string>>(new Set())
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  async function updateStatus(id: string, status: 'background_check' | 'inactive' | 'active') {
    setProcessing(prev => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/admin/volunteers/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setApplications(prev => prev.filter(a => a.id !== id))
        const msg = status === 'background_check'
          ? 'Application approved — moving to background check.'
          : status === 'active'
          ? 'Volunteer activated — they can now be matched with members.'
          : 'Application rejected.'
        setToastMsg(msg)
        setTimeout(() => setToastMsg(null), 4000)
      } else {
        const json = await res.json()
        setToastMsg(`Error: ${json.error ?? 'Unknown error'}`)
        setTimeout(() => setToastMsg(null), 5000)
      }
    } catch {
      setToastMsg('Network error. Please try again.')
      setTimeout(() => setToastMsg(null), 5000)
    } finally {
      setProcessing(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  const rowStyle: React.CSSProperties = {
    backgroundColor: 'white',
    border: '1px solid var(--color-warm-grey)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    marginBottom: '16px',
  }

  if (applications.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 32px', backgroundColor: 'white', border: '1px dashed var(--color-warm-grey)', borderRadius: 'var(--radius-lg)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', marginBottom: '8px' }}>
          {mode === 'background_check' ? 'No volunteers awaiting activation' : 'No pending applications'}
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)' }}>
          {mode === 'background_check'
            ? 'Approved volunteers will appear here once background checks are submitted.'
            : 'New applications will appear here automatically.'}
        </p>
      </div>
    )
  }

  return (
    <div>
      {toastMsg && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 100, padding: '14px 20px', backgroundColor: 'var(--color-navy)', color: 'white', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '15px', boxShadow: 'var(--shadow-lg)', maxWidth: '360px' }}>
          {toastMsg}
        </div>
      )}

      <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
        {applications.length} {mode === 'background_check' ? `volunteer${applications.length !== 1 ? 's' : ''} awaiting activation` : `pending application${applications.length !== 1 ? 's' : ''}`}
      </p>

      {applications.map(app => (
        <div key={app.id} style={rowStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', fontWeight: 500, margin: 0 }}>{app.full_name}</h3>
                {app.interests?.includes('veteran') && (
                  <span style={{ padding: '2px 10px', backgroundColor: '#EBF0FF', color: '#2A5298', borderRadius: '999px', fontSize: '12px', fontFamily: 'var(--font-body)', fontWeight: 500 }}>Veteran</span>
                )}
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>
                {app.email} {app.city ? `· ${app.city}${app.state ? `, ${app.state}` : ''}` : ''}
              </p>
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
              Applied {formatDate(app.created_at)}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {(app.service_types ?? []).map(st => (
              <span key={st} style={{ padding: '4px 12px', backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-warm-grey)', borderRadius: '999px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text)' }}>
                {SERVICE_LABELS[st] ?? st}
              </span>
            ))}
            {app.hours_per_week && (
              <span style={{ padding: '4px 12px', backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-warm-grey)', borderRadius: '999px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                {app.hours_per_week}/week
              </span>
            )}
          </div>

          {app.why_volunteer && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text)', lineHeight: 1.6, backgroundColor: 'var(--color-cream)', padding: '14px 16px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontStyle: 'italic' }}>
              &ldquo;{app.why_volunteer.length > 240 ? app.why_volunteer.substring(0, 240) + '…' : app.why_volunteer}&rdquo;
            </p>
          )}

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {mode === 'background_check' ? (
              <>
                <button
                  onClick={() => updateStatus(app.id, 'active')}
                  disabled={processing.has(app.id)}
                  style={{ height: '44px', padding: '0 24px', backgroundColor: processing.has(app.id) ? 'var(--color-warm-grey)' : 'var(--color-teal)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500, cursor: processing.has(app.id) ? 'not-allowed' : 'pointer' }}>
                  Activate Volunteer
                </button>
                <button
                  onClick={() => updateStatus(app.id, 'inactive')}
                  disabled={processing.has(app.id)}
                  style={{ height: '44px', padding: '0 24px', backgroundColor: 'white', color: 'var(--color-urgent-text)', border: '1.5px solid var(--color-urgent-border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500, cursor: processing.has(app.id) ? 'not-allowed' : 'pointer' }}>
                  Reject
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => updateStatus(app.id, 'background_check')}
                  disabled={processing.has(app.id)}
                  style={{ height: '44px', padding: '0 24px', backgroundColor: processing.has(app.id) ? 'var(--color-warm-grey)' : 'var(--color-teal)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500, cursor: processing.has(app.id) ? 'not-allowed' : 'pointer' }}>
                  Approve
                </button>
                <button
                  onClick={() => updateStatus(app.id, 'inactive')}
                  disabled={processing.has(app.id)}
                  style={{ height: '44px', padding: '0 24px', backgroundColor: 'white', color: 'var(--color-urgent-text)', border: '1.5px solid var(--color-urgent-border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500, cursor: processing.has(app.id) ? 'not-allowed' : 'pointer' }}>
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
