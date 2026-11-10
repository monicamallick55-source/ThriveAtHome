import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  open: '#fef3c7', in_progress: '#dbeafe', resolved: '#dcfce7', closed: '#f3f4f6',
}
const STATUS_TEXT: Record<string, string> = {
  open: '#92400e', in_progress: '#1e40af', resolved: '#16a34a', closed: '#6b7280',
}
const PRIORITY_COLOR: Record<string, string> = {
  urgent: '#ef4444', normal: '#6b7280', low: '#9ca3af',
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: { status?: string; portal?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = (user.app_metadata?.role ?? user.user_metadata?.role ?? '') as string
  if (!['admin', 'super_admin', 'csm'].includes(role)) redirect('/dashboard')

  let query = supabase
    .from('support_tickets')
    .select('id, subject, category, status, priority, portal_type, created_at, resolved_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (searchParams.portal) query = query.eq('portal_type', searchParams.portal)

  const { data: tickets } = await query

  const counts = { open: 0, in_progress: 0, resolved: 0, total: tickets?.length ?? 0 }
  for (const t of tickets ?? []) {
    if (t.status === 'open') counts.open++
    else if (t.status === 'in_progress') counts.in_progress++
    else if (t.status === 'resolved') counts.resolved++
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937', margin: 0 }}>Support Tickets</h1>
        <Link href="/admin" style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none' }}>← Admin</Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total', value: counts.total, color: '#1f2937' },
          { label: 'Open', value: counts.open, color: '#d97706' },
          { label: 'In Progress', value: counts.in_progress, color: '#2563eb' },
          { label: 'Resolved', value: counts.resolved, color: '#16a34a' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
          <a key={s} href={s ? `?status=${s}` : '/admin/support'}
            style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #e5e7eb', fontSize: '0.8rem', fontWeight: searchParams.status === s || (!s && !searchParams.status) ? 700 : 400, background: searchParams.status === s || (!s && !searchParams.status) ? '#6366f1' : '#fff', color: searchParams.status === s || (!s && !searchParams.status) ? '#fff' : '#374151', textDecoration: 'none' }}>
            {s ? s.replace(/_/g, ' ') : 'All'}
          </a>
        ))}
      </div>

      {/* Ticket table */}
      {(!tickets || tickets.length === 0) ? (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', margin: 0 }}>No tickets match this filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tickets.map((t: any) => (
            <Link key={t.id} href={`/admin/support/${t.id}`}
              style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{t.subject}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  {t.portal_type} · {t.category?.replace(/_/g, ' ')} · {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 16 }}>
                {t.priority !== 'low' && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: PRIORITY_COLOR[t.priority] }}>
                    {t.priority === 'urgent' ? '⚡ URGENT' : ''}
                  </span>
                )}
                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: STATUS_COLORS[t.status] ?? '#f3f4f6', color: STATUS_TEXT[t.status] ?? '#6b7280', textTransform: 'capitalize' }}>
                  {t.status?.replace(/_/g, ' ')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
