// app/dashboard/page.tsx
// Main member dashboard home — shows plan-aware cards and upgrade CTA for Basics members
import { requireAuth } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { UpgradePlanCard } from '@/components/dashboard/UpgradePlanCard'
import Link from 'next/link'
import BuddySection from '@/app/dashboard/_components/BuddySection'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const metadata = {
  title: 'My Dashboard | ThriveAtHome',
}

export default async function DashboardPage() {
  const user = await requireAuth().catch((e) => { if (e const user = await requireAuth().catch(() => null)const user = await requireAuth().catch(() => null) typeof e === "object" const user = await requireAuth().catch(() => null)const user = await requireAuth().catch(() => null) "digest" in e) throw e; return null })
  if (!user) redirect('/login')

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  const memberId = fm?.member_id ?? null

  // Fetch member record for plan info
  let member: { first_name?: string; plan?: string; plan_tier?: string; subscription_status?: string; has_active_buddy?: boolean } | null = null
  if (memberId) {
    const db = supabaseAdmin as any
    const { data } = await db
      .from('members')
      .select('first_name, plan, plan_tier, subscription_status, has_active_buddy')
      .eq('id', memberId)
      .maybeSingle()
    member = data
  }

  const firstName = member?.first_name || (fm?.full_name ? fm.full_name.split(' ')[0] : null) || 'Friend'
  const plan = (member?.plan as 'basics' | 'complete') || 'basics'
  const isComplete = plan === 'complete'

  const quickLinks = [
    { href: '/dashboard/wellness', emoji: '🏃', label: 'Fitness & Walking', available: isComplete },
    { href: '/dashboard/volunteer-services', emoji: '🤝', label: 'Volunteer Services', available: isComplete },
    { href: '/dashboard/messages', emoji: '✉️', label: 'Messages', available: true },
    { href: '/dashboard/home-safety', emoji: '🏠', label: 'Home Safety', available: true },
    { href: '/services', emoji: '🛎️', label: 'Book Services', available: isComplete },
    { href: '/community', emoji: '🌍', label: 'Community', available: true },
  ]

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Greeting */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}><span data-testid="member-name" style={{ fontWeight: 700 }}>{profile?.full_name ?? user?.email}</span><span data-testid="plan-badge" style={{ fontSize: '0.72rem', background: '#eff6ff', color: '#4f46e5', padding: '2px 8px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase' }}>{member?.plan ?? 'Basic'}</span></div>
      <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px' }}>
          Good morning, {firstName} 🌿
        </h1>
        <p style={{ fontSize: '14px', color: '#777', margin: 0 }}>
          {isComplete ? 'Thrive Complete' : 'Thrive Basics'} member
        </p>
      </div>

      {/* Upgrade card — only shown for Basics members */}
      {!isComplete && (
        <div style={{ marginBottom: '24px' }}>
          <UpgradePlanCard currentPlan="basics" memberName={firstName} />
        </div>
      )}

      {/* Quick links grid */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#444', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Quick access
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {quickLinks.map(link => (
            <Link
              key={link.href}
              href={link.available ? link.href : '#'}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '16px 8px', borderRadius: '12px', textDecoration: 'none',
                background: link.available ? '#f7faf7' : '#f5f5f5',
                border: `1px solid ${link.available ? '#d4edda' : '#e8e8e8'}`,
                opacity: link.available ? 1 : 0.5,
                cursor: link.available ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
            >
              <span style={{ fontSize: '24px', marginBottom: '6px' }}>{link.emoji}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#444', textAlign: 'center', lineHeight: 1.3 }}>
                {link.label}
              </span>
              {!link.available && (
                <span style={{ fontSize: '10px', color: '#aaa', marginTop: '3px' }}>Complete only</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Aria check-in card */}
      <div style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)', borderRadius: '14px', padding: '20px', border: '1px solid #c8e6c9', marginBottom: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: '16px', color: '#2d6a4f', marginBottom: '6px' }}>
          📞 Aria check-in
        </div>
        <p style={{ fontSize: '14px', color: '#555', margin: '0 0 12px', lineHeight: 1.5 }}>
          Your AI companion Aria calls each morning to check in. Miss a call? We'll follow up to make sure you're okay.
        </p>
        <div style={{ fontSize: '13px', color: '#2d6a4f', fontWeight: 600 }}>
          Next call: Tomorrow at 9:00 AM ✓
        </div>
      </div>

      {/* Buddy Programme */}
      {memberId && isComplete && (
        <div style={{ marginBottom: '16px' }}>
          <BuddySection
            memberId={memberId}
            memberName={firstName}
            planTier={member?.plan_tier ?? member?.plan ?? 'basics'}
            hasActiveBuddy={member?.has_active_buddy ?? false}
          />
        </div>
      )}

      {/* Family portal note */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '18px', border: '1px solid #e8e8e8' }}>
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#333', marginBottom: '6px' }}>
          👨‍👩‍👧 Family portal
        </div>
        <p style={{ fontSize: '13px', color: '#666', margin: '0 0 10px', lineHeight: 1.5 }}>
          {isComplete
            ? 'Up to 8 family members can follow along and stay connected through the family portal.'
            : 'Up to 3 family members can follow along. Upgrade to Complete for 8 seats.'}
        </p>
        <Link href="/family" style={{ fontSize: '13px', color: '#2d6a4f', fontWeight: 600, textDecoration: 'none' }}>
          Manage family access →
        </Link>
      </div>
    </div>
  )
}
