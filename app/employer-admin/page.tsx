import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function EmployerAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  const allowed = ['employer_admin', 'admin', 'super_admin']
  if (!allowed.includes(profile?.role ?? '')) redirect('/dashboard')

  const { data: orgProfile } = await supabase
    .from('employer_orgs')
    .select('id, org_name, member_count, volunteer_hours_total, active_volunteers')
    .eq('admin_user_id', user.id)
    .maybeSingle()

  const { data: volunteers } = await supabase
    .from('volunteer_hours')
    .select('volunteer_id, hours, week_of, profiles(full_name)')
    .order('week_of', { ascending: false })
    .limit(10)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937', margin: '0 0 4px' }}>Employer Admin</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 28px' }}>{orgProfile?.org_name ?? 'Your Organization'}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 6 }}>Member count</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937' }} data-testid="member-count">{orgProfile?.member_count ?? 0}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 6 }}>Active volunteers</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937' }}>{orgProfile?.active_volunteers ?? 0}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 6 }}>Volunteer hours</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937' }}>{orgProfile?.volunteer_hours_total ?? 0}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 6 }}>Volunteer tier</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#6366f1' }}>Corporate</div>
        </div>
      </div>

      <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', margin: '0 0 14px' }}>Volunteer Hours Log</h2>
        {(!volunteers || volunteers.length === 0) ? (
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>No volunteer hours logged yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', color: '#6b7280', fontWeight: 600 }}>Volunteer</th>
                <th style={{ textAlign: 'left', padding: '8px 0', color: '#6b7280', fontWeight: 600 }}>Week of</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: '#6b7280', fontWeight: 600 }}>Hours</th>
              </tr>
            </thead>
            <tbody>
              {(volunteers ?? []).map((v: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '10px 0', color: '#1f2937' }}>{(v.profiles as any)?.full_name ?? 'Volunteer'}</td>
                  <td style={{ padding: '10px 0', color: '#6b7280' }}>{v.week_of}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{v.hours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Link href="/employer-admin/invite" style={{ display: 'inline-block', padding: '10px 20px', background: '#6366f1', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem' }}>
        Invite employees
      </Link>
    </div>
  )
}
