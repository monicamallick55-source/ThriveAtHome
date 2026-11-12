'use client'
import { useState, useEffect } from 'react'

type Member = { id: string; first_name: string; last_name: string; status: string; last_active?: string; wellbeing_score?: number }
type Task = { id: string; member_name: string; type: string; due_date: string; status: string }

export default function NavigatorPage() {
  const [tab, setTab] = useState<'caseload'|'tasks'|'hours'>('caseload')
  const [members, setMembers] = useState<Member[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [hours, setHours] = useState(0)

  useEffect(() => {
    fetch('/api/navigator/members').then(r => r.ok ? r.json() : null).then(d => { if (d?.members) setMembers(d.members) }).catch(() => {})
    fetch('/api/navigator/tasks').then(r => r.ok ? r.json() : null).then(d => { if (d?.tasks) setTasks(d.tasks) }).catch(() => {})
    fetch('/api/navigator/hours').then(r => r.ok ? r.json() : null).then(d => { if (d?.total_hours != null) setHours(d.total_hours) }).catch(() => {})
  }, [])

  const TABS = [
    { id: 'caseload', label: '👥 Caseload' },
    { id: 'tasks',    label: '✅ Task Queue' },
    { id: 'hours',    label: '⏱ Hours Tracking' },
  ]

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 4 }}>Navigator Portal</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Manage your caseload, tasks, and care coordination.</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e5e7eb', marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            style={{ padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: tab === t.id ? 700 : 400, borderBottom: tab === t.id ? '2px solid #6366f1' : '2px solid transparent', color: tab === t.id ? '#6366f1' : '#6b7280', marginBottom: -2 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Caseload */}
      {tab === 'caseload' && (
        <section data-testid="caseload-section">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>My Caseload ({members.length} members)</h2>
          {members.length === 0 ? (
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#9ca3af' }}>
              No members assigned yet.
            </div>
          ) : members.map(m => (
            <div key={m.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 500 }}>{m.first_name} {m.last_name}</span>
              <span style={{ fontSize: 13, color: '#6b7280' }}>{m.status}</span>
            </div>
          ))}
        </section>
      )}

      {/* Task Queue */}
      {tab === 'tasks' && (
        <section data-testid="task-queue-section">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>Task Queue ({tasks.length} pending)</h2>
          {tasks.length === 0 ? (
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#9ca3af' }}>
              No pending tasks.
            </div>
          ) : tasks.map(t => (
            <div key={t.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', marginBottom: 10 }}>
              <div style={{ fontWeight: 500 }}>{t.type}</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{t.member_name} · Due {t.due_date}</div>
            </div>
          ))}
        </section>
      )}

      {/* Hours Tracking */}
      {tab === 'hours' && (
        <section data-testid="hours-section">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>Hours Tracking</h2>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#16a34a' }}>{hours}</div>
            <div style={{ color: '#15803d', marginTop: 4 }}>Total hours logged this month</div>
          </div>
          <button style={{ marginTop: 16, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}
            onClick={() => fetch('/api/navigator/hours', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ hours: 1, note: 'Manual entry' }) }).then(() => setHours(h => h + 1))}>
            + Log Hours
          </button>
        </section>
      )}
    </div>
  )
}
