import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const ADVISORS = [
  { role: 'therapist', icon: '🧠', title: 'Licensed Therapist', desc: 'Talk with a licensed therapist specializing in older adult mental health, grief, and life transitions.', always_shown: true },
  { role: 'elder_law_attorney', icon: '⚖️', title: 'Elder Law Attorney', desc: 'Get guidance on wills, trusts, Medicaid planning, and elder care rights.', always_shown: true },
  { role: 'financial_advisor', icon: '💰', title: 'Certified Financial Planner', desc: 'Retirement income, Social Security optimization, and care cost planning.', always_shown: true },
  { role: 'chaplain', icon: '🙏', title: 'Chaplain / Spiritual Advisor', desc: 'Compassionate spiritual support for any faith tradition or none — available on request.', always_shown: false },
  { role: 'grief_counselor', icon: '💙', title: 'Grief Counselor', desc: 'Specialized support for loss of a spouse, diagnosis adjustment, and life transitions.', always_shown: false },
]

export default async function TrustedAdvisorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: requests } = await supabase
    .from('advisor_requests')
    .select('advisor_role')
    .eq('member_id', user.id)

  const requested = new Set((requests ?? []).map((r: any) => r.advisor_role))

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <Link href="/dashboard" style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none' }}>← Dashboard</Link>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937', margin: '12px 0 4px' }}>Trusted Advisors</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 28px' }}>Your navigator can connect you with trusted professionals. Some advisors are available on request.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {ADVISORS.map(a => (
          <div key={a.role} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ fontSize: '1.6rem', marginTop: 2 }}>{a.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.95rem' }}>{a.title}</div>
              <p style={{ color: '#6b7280', fontSize: '0.82rem', margin: '4px 0 12px', lineHeight: 1.6 }}>{a.desc}</p>
              {a.always_shown ? (
                <Link href={`/dashboard/trusted-advisors/${a.role}`}
                  style={{ display: 'inline-block', padding: '8px 16px', background: '#6366f1', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: '0.82rem', fontWeight: 700 }}>
                  Learn more →
                </Link>
              ) : (
                <div>
                  {!requested.has(a.role) ? (
                    <form action={`/api/advisor-request`} method="POST">
                      <input type="hidden" name="advisor_role" value={a.role} />
                      <button type="submit"
                        style={{ padding: '8px 16px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                        Request an introduction
                      </button>
                    </form>
                  ) : (
                    <span style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: 600 }}>✓ Introduction requested — your navigator will follow up</span>
                  )}
                </div>
              )}
            </div>
            {!a.always_shown && (
              <span style={{ fontSize: '0.68rem', background: '#f3f4f6', color: '#6b7280', padding: '3px 8px', borderRadius: 20, fontWeight: 600, whiteSpace: 'nowrap' }}>On request</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
