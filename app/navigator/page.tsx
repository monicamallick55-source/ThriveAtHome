import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function NavigatorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = (user.user_metadata?.role ?? user.app_metadata?.role ?? '') as string
const fullName = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? '') as string
if (!['navigator', 'admin', 'super_admin'].includes(role)) redirect('/dashboard')

  const { data: tasks } = await supabase
    .from('navigator_tasks')
    .select('id, type, status, member_id, created_at, notes, members(full_name)')
    .eq('navigator_id', user.id)
    .in('status', ['open', 'in_progress'])
    .order('created_at', { ascending: true })
    .limit(50)

  const { data: allMembers } = await supabase
    .from('navigator_assignments')
    .select('member_id, members(full_name, wellness_score, last_call_at)')
    .eq('navigator_id', user.id)
    .limit(30)

  const { data: hours } = await supabase
    .from('navigator_hours')
    .select('hours_logged, week_of')
    .eq('navigator_id', user.id)
    .order('week_of', { ascending: false })
    .limit(4)

  const totalHours = (hours ?? []).reduce((s: number, r: any) => s + (r.hours_logged ?? 0), 0)

  const TASK_TYPE_LABELS: Record<string, string> = {
    welcome_call: 'Welcome call',
    check_in: 'Check-in',
    care_plan: 'Care plan',
    crisis: 'Crisis',
    navigator_task: 'Task',
    facility_move: 'Facility move',
    grief_support: 'Grief support',
    benefits_review: 'Benefits review',
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937', margin: 0 }}>Navigator Portal</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '4px 0 0' }}>Welcome back, {fullName || 'Navigator'}</p>
        </div>
        <Link href="/navigator/start-transition-plan"
          style={{ padding: '9px 18px', background: '#6366f1', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem' }}>
          Start transition plan
        </Link>
      </div>

      {/* Hours tracking */}
      <div data-testid="navigator-hours" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 32, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hours this month</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d' }}>{totalHours.toFixed(1)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Open tasks</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d' }}>{(tasks ?? []).length}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Caseload</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d' }}>{(allMembers ?? []).length}</div>
        </div>
        <Link href="/navigator/hours" style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>Log hours →</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Task queue */}
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>Task queue</h2>
          {(!tasks || tasks.length === 0) ? (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
              <p style={{ margin: 0 }}>No open tasks 🎉</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(tasks ?? []).map((t: any) => (
                <div key={t.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                        {TASK_TYPE_LABELS[t.type] ?? t.type}
                      </span>
                      <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.875rem', marginTop: 6 }}>
                        {(t.members as any)?.full_name ?? 'Member'}
                      </div>
                      {t.notes && <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{t.notes}</div>}
                    </div>
                    <form action={`/api/navigator/tasks/${t.id}/complete`} method="POST">
                      <button type="submit"
                        style={{ padding: '6px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Mark complete
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Home from Hospital */}
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>Home from Hospital</h2>
          <div style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: 12, padding: '20px 24px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '0.875rem', color: '#92400e' }}>
              🏥 Mark a member as recently discharged from hospital to trigger care coordination tasks.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href="/navigator/home-from-hospital" style={{ padding: '8px 16px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                Start hospital discharge workflow
              </a>
            </div>
          </div>
        </div>

        {/* Caseload */}
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>Caseload</h2>
          {(!allMembers || allMembers.length === 0) ? (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
              <p style={{ margin: 0 }}>No assigned members yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(allMembers ?? []).map((a: any) => {
                const m = a.members as any
                return (
                  <div key={a.member_id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.875rem' }}>{m?.full_name ?? 'Member'}</div>
                      <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 2 }}>
                        Last call: {m?.last_call_at ? new Date(m.last_call_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: (m?.wellness_score ?? 0) >= 7 ? '#16a34a' : '#d97706' }}>
                        {m?.wellness_score ?? '—'}/10
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
