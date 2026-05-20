// Family Coordination page — task board and messaging for all family members of a senior.
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getTasksForMember } from '@/lib/data/tasks'
import { getMessagesForMember } from '@/lib/data/messages'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { FamilyTaskBoard } from '@/components/dashboard/FamilyTaskBoard'
import { FamilyChat } from '@/components/dashboard/FamilyChat'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = { title: 'Family Coordination — ThriveAtHome' }

export default async function FamilyPage() {
  const user = await requireAuth()

  // Resolve member and family member rows in parallel
  const [memberResult, familyMemberResult] = await Promise.all([
    getMemberForAuthUser(user.id),
    getFamilyMemberByAuthId(user.id),
  ])

  if (!memberResult.data) {
    redirect('/onboarding')
  }

  const member = memberResult.data
  const familyMember = familyMemberResult.data

  if (!familyMember) {
    redirect('/onboarding')
  }

  // Fetch tasks and messages in parallel
  const [tasksResult, messagesResult] = await Promise.all([
    getTasksForMember(member.id),
    getMessagesForMember(member.id, 50),
  ])

  return (
    <ToastProvider>
      <div className="min-h-screen bg-brand-warm-white">
        {/* Navigation */}
        <nav className="sticky top-0 z-10 bg-brand-navy shadow-md" aria-label="Dashboard navigation">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-white text-base hover:text-brand-teal-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal rounded"
                aria-label="Back to dashboard"
              >
                ← Dashboard
              </Link>
            </div>
            <span className="text-white text-xl font-bold tracking-tight">ThriveAtHome</span>
            <div className="w-20" aria-hidden="true" />
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8" id="main-content">
          {/* Page header */}
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-brand-navy">Family Coordination</h1>
            <p className="text-lg text-gray-500 mt-1">
              Coordinate care tasks and stay in touch for {member.preferred_name}.
            </p>
          </div>

          {/* Task board */}
          <Card>
            <CardHeader>
              <CardTitle>Family Tasks</CardTitle>
            </CardHeader>
            <CardBody>
              <FamilyTaskBoard
                memberId={member.id}
                familyMemberId={familyMember.id}
                initialTasks={tasksResult.data ?? []}
                error={tasksResult.error}
              />
            </CardBody>
          </Card>

          {/* Family messaging */}
          <Card>
            <CardHeader>
              <CardTitle>Family Messages</CardTitle>
            </CardHeader>
            <CardBody>
              <FamilyChat
                memberId={member.id}
                familyMemberId={familyMember.id}
                initialMessages={messagesResult.data ?? []}
                error={messagesResult.error}
              />
            </CardBody>
          </Card>

          {/* Link to document vault */}
          <div className="text-center">
            <Link
              href="/dashboard/documents"
              className="text-brand-teal text-lg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal rounded"
            >
              View Document Vault →
            </Link>
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}
