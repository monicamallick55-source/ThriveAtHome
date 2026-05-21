// Family Coordination page — task board and messaging for all family members of a senior.
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getTasksForMember } from '@/lib/data/tasks'
import { getMessagesForMember } from '@/lib/data/messages'
import { FamilyTaskBoard } from '@/components/dashboard/FamilyTaskBoard'
import { FamilyChat } from '@/components/dashboard/FamilyChat'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = { title: 'Family Coordination — ThriveAtHome' }

export default async function FamilyPage() {
  const user = await requireAuth()

  const [memberResult, familyMemberResult] = await Promise.all([
    getMemberForAuthUser(user.id),
    getFamilyMemberByAuthId(user.id),
  ])

  if (!memberResult.data) redirect('/onboarding')

  const member = memberResult.data
  const familyMember = familyMemberResult.data

  if (!familyMember) redirect('/onboarding')

  const [tasksResult, messagesResult] = await Promise.all([
    getTasksForMember(member.id),
    getMessagesForMember(member.id, 50),
  ])

  return (
    <ToastProvider>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
        {/* Navigation */}
        <nav
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            backgroundColor: 'white',
            borderBottom: '1px solid var(--color-warm-grey)',
            boxShadow: 'var(--shadow-sm)',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Dashboard navigation"
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link
              href="/dashboard"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '18px',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              ← Dashboard
            </Link>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', fontWeight: 500 }}>
              ThriveAtHome
            </span>
            <div style={{ width: '120px' }} aria-hidden="true" />
          </div>
        </nav>

        {/* Navy header */}
        <div style={{ backgroundColor: 'var(--color-navy)', padding: '32px 24px 48px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '34px',
                fontWeight: 500,
                color: 'var(--color-cream)',
                marginBottom: '6px',
                letterSpacing: '-0.01em',
              }}
            >
              Family Coordination
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'rgba(250,250,245,0.7)', margin: 0 }}>
              Coordinate care tasks and stay in touch for {member.preferred_name}.
            </p>
          </div>
        </div>

        <main
          id="main-content"
          style={{
            maxWidth: '1200px',
            margin: '-24px auto 0',
            padding: '0 24px 48px',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Task board */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-warm-grey)',
                boxShadow: 'var(--shadow-card)',
                padding: '28px',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '24px',
                  fontWeight: 500,
                  color: 'var(--color-navy)',
                  marginBottom: '20px',
                }}
              >
                Family Tasks
              </h2>
              <FamilyTaskBoard
                memberId={member.id}
                familyMemberId={familyMember.id}
                initialTasks={tasksResult.data ?? []}
                error={tasksResult.error}
              />
            </div>

            {/* Family messaging */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-warm-grey)',
                boxShadow: 'var(--shadow-card)',
                padding: '28px',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '24px',
                  fontWeight: 500,
                  color: 'var(--color-navy)',
                  marginBottom: '20px',
                }}
              >
                Family Messages
              </h2>
              <FamilyChat
                memberId={member.id}
                familyMemberId={familyMember.id}
                initialMessages={messagesResult.data ?? []}
                error={messagesResult.error}
              />
            </div>

            {/* Link to documents */}
            <div style={{ textAlign: 'center', paddingTop: '8px' }}>
              <Link
                href="/dashboard/documents"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '18px',
                  fontWeight: 500,
                  color: 'var(--color-teal)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                View Document Vault →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}
