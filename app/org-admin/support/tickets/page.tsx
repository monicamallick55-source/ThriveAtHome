import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  open: '#fef3c7',
  in_progress: '#dbeafe',
  resolved: '#dcfce7',
  closed: '#f3f4f6',
}
const STATUS_TEXT: Record<string, string> = {
  open: '#92400e',
  in_progress: '#1e40af',
  resolved: '#16a34a',
  closed: '#6b7280',
}

export default async function OrgTicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = (user.app_metadata?.role ?? user.user_metadata?.role ?? '') as string
  if (!['org_admin', 'admin', 'super_admin'].includes(role)) redirect('/org-admin')

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, subject, category, status, priority, created_at, resolved_at, portal_type')
    .eq('portal_type', 'org-admin')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <Link href="/org-admin/support" style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none' }}>← Back to Support</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937', margin: 0 }}>Your Support Tickets</h1>
        <Link href="/org-admin/support" style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>+ New Ticket</Link>
      </div>

      {(!tickets || tickets.length === 0) ? (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', margin: 0 }}>No tickets yet. <Link href="/org-admin/support" style={{ color: '#6366f1' }}>Submit one →</Link></p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tickets.map((t: any) => (
            <div key={t.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: '#1f2937', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                  {t.category?.replace(/_/g, ' ')} · {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {t.priority === 'urgent' && <span style={{ marginLeft: 8, color: '#ef4444', fontWeight: 700 }}>⚡ Urgent</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 16 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: STATUS_COLORS[t.status] ?? '#f3f4f6', color: STATUS_TEXT[t.status] ?? '#6b7280', textTransform: 'capitalize' }}>
                  {t.status?.replace(/_/g, ' ')}
                </span>
                {t.status === 'resolved' && t.resolved_at && (
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Resolved {new Date(t.resolved_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
