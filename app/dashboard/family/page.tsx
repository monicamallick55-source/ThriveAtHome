import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MoodTimeline from '@/components/MoodTimeline'

export default async function FamilyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const { data: member } = await supabase
    .from('members')
    .select('id, full_name, plan, wellness_score, last_call_at, last_call_summary')
    .eq('id', user.id)
    .maybeSingle()

  const { data: familyLinks } = await supabase
    .from('family_members')
    .select('member_id, relationship, members(full_name, wellness_score, last_call_at)')
    .eq('family_user_id', user.id)
    .limit(5)

  const { data: events } = await supabase
    .from('family_events')
    .select('id, title, event_date, notes')
    .or(`created_by.eq.${user.id},member_id.eq.${user.id}`)
    .order('event_date', { ascending: true })
    .limit(5)

  const linked = familyLinks && familyLinks.length > 0 ? familyLinks[0] : null
  const linkedMember = (linked as any)?.members ?? null

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937', margin: '0 0 4px' }}>Family Portal</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 28px' }}>Stay connected with your loved one's wellbeing</p>

      {/* Wellness Summary */}
      <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', margin: '0 0 14px' }}>Wellness Summary</h2>
        {linkedMember ? (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 4 }}>Member</div>
              <div style={{ fontWeight: 700, color: '#1f2937' }}>{linkedMember.full_name ?? 'Your loved one'}</div>
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 4 }}>Wellness</div>
              <div style={{ fontWeight: 700, color: (linkedMember.wellness_score ?? 0) >= 7 ? '#16a34a' : '#d97706', fontSize: '1.2rem' }}>
                {linkedMember.wellness_score ?? '—'}/10
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 4 }}>Last Aria Call</div>
              <div style={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                {linkedMember.last_call_at
                  ? new Date(linkedMember.last_call_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                  : 'No calls yet'}
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
            No linked member yet. <Link href="/dashboard/family/invite" style={{ color: '#6366f1' }}>Invite a family member →</Link>
          </p>
        )}
      </section>

      {/* Fraud Protection */}
      <section style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#9a3412', margin: '0 0 8px' }}>🛡️ Fraud Protection</h2>
        <p style={{ color: '#c2410c', fontSize: '0.875rem', margin: '0 0 12px', lineHeight: 1.6 }}>
          ThriveAtHome monitors for unusual activity and scam patterns. Your loved one is protected with real-time alerts.
        </p>
        <Link href="/dashboard/fraud-protection" style={{ fontSize: '0.82rem', color: '#ea580c', fontWeight: 600, textDecoration: 'none' }}>
          View fraud alerts →
        </Link>
      </section>

      {/* Mood Timeline */}
      <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
        <MoodTimeline />
      </section>

      {/* Family Events Calendar */}
      <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', margin: 0 }}>📅 Family Events Calendar</h2>
          <Link href="/dashboard/family/events/new"
            style={{ padding: '7px 14px', background: '#6366f1', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
            + Add event
          </Link>
        </div>
        {(!events || events.length === 0) ? (
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>No upcoming events. Add one to keep everyone coordinated.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.map((e: any) => (
              <div key={e.id} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ minWidth: 60, textAlign: 'center', background: '#eff6ff', borderRadius: 8, padding: '6px 8px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {e.event_date ? new Date(e.event_date).toLocaleDateString('en-US', { month: 'short' }) : '—'}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1d4ed8' }}>
                    {e.event_date ? new Date(e.event_date).getDate() : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.875rem' }}>{e.title}</div>
                  {e.notes && <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{e.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Links */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/dashboard/celebrations/plan" style={{ padding: '10px 20px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, textDecoration: 'none', color: '#374151', fontSize: '0.875rem', fontWeight: 600 }}>🎉 Plan a Celebration</Link>
        <Link href="/dashboard/gift-send" style={{ padding: '10px 20px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, textDecoration: 'none', color: '#374151', fontSize: '0.875rem', fontWeight: 600 }}>🎁 Send a Gift</Link>
        <Link href="/dashboard/navigator" style={{ padding: '10px 20px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, textDecoration: 'none', color: '#374151', fontSize: '0.875rem', fontWeight: 600 }}>💬 Contact Navigator</Link>
      </div>
    </div>
  )
}
