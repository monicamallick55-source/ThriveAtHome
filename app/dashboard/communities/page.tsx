import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function CommunitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: communities } = await supabase
    .from('communities')
    .select('id, name, description, member_count, category')
    .order('member_count', { ascending: false })
    .limit(20)

  const { data: memberships } = await supabase
    .from('community_members')
    .select('community_id')
    .eq('member_id', user.id)

  const joinedIds = new Set((memberships ?? []).map((m: any) => m.community_id))

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1f2937', margin: '0 0 4px' }}>Communities</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 28px' }}>Connect with others who share your interests</p>

      {(!communities || communities.length === 0) ? (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: 0 }}>Communities are coming soon. Check back shortly!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {communities.map((c: any) => (
            <div key={c.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>{c.name}</h2>
                {joinedIds.has(c.id) && (
                  <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Joined</span>
                )}
              </div>
              {c.description && <p style={{ color: '#6b7280', fontSize: '0.82rem', margin: '0 0 12px', lineHeight: 1.5 }}>{c.description}</p>}
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{c.member_count ?? 0} members</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <Link href="/dashboard" style={{ color: '#6366f1', fontSize: '0.875rem' }}>← Back to Dashboard</Link>
      </div>
    </div>
  )
}
