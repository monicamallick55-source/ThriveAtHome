'use client'

/**
 * app/dashboard/training/page.tsx — G4.7 Volunteer Training (volunteer view)
 *
 * Shows all required + optional training modules with completion status.
 * Volunteers mark modules complete here (completion triggers cert when all required done).
 */

import { useState, useEffect } from 'react'

type TrainingModule = {
  id: string
  slug: string
  title: string
  duration_min: number
  required: boolean
  sort_order: number
  completed: boolean
  completed_at?: string
}

type Summary = {
  total: number
  completed: number
  required_total: number
  required_completed: number
  all_required_done: boolean
}

export default function TrainingPage() {
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [volunteerId, setVolunteerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState<string | null>(null)

  // Fetch volunteer id from profile, then load modules
  useEffect(() => {
    async function init() {
      // Get current user's volunteer record
      const profileRes = await fetch('/api/volunteers/me')
      if (profileRes.ok) {
        const { volunteer } = await profileRes.json()
        if (volunteer?.id) {
          setVolunteerId(volunteer.id)
          loadModules(volunteer.id)
          return
        }
      }
      // Fallback: load modules without completions
      loadModules(null)
    }
    init()
  }, [])

  async function loadModules(vid: string | null) {
    setLoading(true)
    const url = vid ? `/api/volunteer-training?volunteer_id=${vid}` : '/api/volunteer-training'
    const res = await fetch(url)
    const data = await res.json()
    setModules(data.modules ?? [])
    setSummary(data.summary ?? null)
    setLoading(false)
  }

  async function markComplete(moduleId: string) {
    if (!volunteerId) return
    setMarking(moduleId)
    try {
      const res = await fetch('/api/volunteer-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteer_id: volunteerId, module_id: moduleId }),
      })
      if (res.ok) {
        setModules((prev) =>
          prev.map((m) =>
            m.id === moduleId
              ? { ...m, completed: true, completed_at: new Date().toISOString() }
              : m
          )
        )
        setSummary((prev) => prev ? {
          ...prev,
          completed: prev.completed + 1,
          required_completed: modules.find((m) => m.id === moduleId)?.required
            ? prev.required_completed + 1
            : prev.required_completed,
          all_required_done: prev.required_completed + 1 >= prev.required_total,
        } : prev)
      }
    } finally {
      setMarking(null)
    }
  }

  const required = modules.filter((m) => m.required)
  const optional = modules.filter((m) => !m.required)

  if (loading) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
        <p style={{ color: '#9ca3af', textAlign: 'center', paddingTop: 40 }}>Loading training…</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>Volunteer Training</h1>
      <p style={{ color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
        Complete all required modules to become a certified ThriveAtHome volunteer companion.
      </p>

      {/* Progress bar */}
      {summary && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
              Required modules: {summary.required_completed} / {summary.required_total}
            </span>
            {summary.all_required_done && (
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>🎉 Certified!</span>
            )}
          </div>
          <div style={{ background: '#e5e7eb', borderRadius: 99, height: 10, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${summary.required_total > 0 ? (summary.required_completed / summary.required_total) * 100 : 0}%`,
              background: summary.all_required_done ? '#10b981' : '#6366f1',
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 6 }}>
            {summary.completed} of {summary.total} total modules completed
          </div>
        </div>
      )}

      {/* Required modules */}
      <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: '#374151' }}>
        Required modules
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {required.map((mod) => (
          <ModuleRow
            key={mod.id}
            mod={mod}
            onComplete={markComplete}
            marking={marking}
            hasVolunteer={!!volunteerId}
          />
        ))}
      </div>

      {optional.length > 0 && (
        <>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: '#374151' }}>
            Optional modules
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {optional.map((mod) => (
              <ModuleRow
                key={mod.id}
                mod={mod}
                onComplete={markComplete}
                marking={marking}
                hasVolunteer={!!volunteerId}
              />
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 32, padding: '14px 18px', background: '#f0fdf4', borderRadius: 10, fontSize: '0.82rem', color: '#16a34a', lineHeight: 1.6 }}>
        <strong>Need your training materials?</strong><br />
        Your navigator will share module guides, videos, and resources via email and your Thrive portal.
        Mark each module complete after finishing it.
      </div>
    </div>
  )
}

function ModuleRow({
  mod, onComplete, marking, hasVolunteer,
}: {
  mod: TrainingModule
  onComplete: (id: string) => void
  marking: string | null
  hasVolunteer: boolean
}) {
  return (
    <div style={{
      border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 14,
      background: mod.completed ? '#f0fdf4' : '#fff',
      borderLeft: `4px solid ${mod.completed ? '#10b981' : mod.required ? '#6366f1' : '#e5e7eb'}`,
    }}>
      <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>
        {mod.completed ? '✅' : mod.required ? '📘' : '📄'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.925rem', color: '#1f2937' }}>{mod.title}</div>
        <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>
          {mod.duration_min} min
          {mod.completed && mod.completed_at
            ? ` · Completed ${new Date(mod.completed_at).toLocaleDateString()}`
            : ''}
        </div>
      </div>
      {!mod.completed && hasVolunteer && (
        <button
          onClick={() => onComplete(mod.id)}
          disabled={marking === mod.id}
          style={{
            padding: '5px 14px', border: '1px solid #6366f1', color: '#6366f1',
            background: '#fff', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
            flexShrink: 0,
          }}>
          {marking === mod.id ? '…' : 'Mark done'}
        </button>
      )}
    </div>
  )
}
