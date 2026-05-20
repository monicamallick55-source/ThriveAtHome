// Call History page — server component that fetches the first page of calls and total count.
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { getCallsForMember, getCallCountForMember } from '@/lib/data/calls'
import CallHistoryClient from '@/components/dashboard/CallHistoryClient'

export const metadata: Metadata = { title: 'Call History — ThriveAtHome' }

const PAGE_SIZE = 20

export default async function CallsPage() {
  const user = await requireAuth()

  const { data: member, error: memberError } = await getMemberForAuthUser(user.id)

  if (!member) {
    if (memberError === 'Not found' || !memberError) redirect('/onboarding')
    redirect('/onboarding')
  }

  const [callsResult, countResult] = await Promise.all([
    getCallsForMember(member.id, PAGE_SIZE, 0),
    getCallCountForMember(member.id),
  ])

  const totalCount = countResult.data ?? 0

  return (
    <div className="min-h-screen bg-brand-warm-white">
      {/* Navigation bar */}
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8" id="main-content">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-brand-navy">Call History</h1>
          <p className="text-lg text-gray-500 mt-1">
            {member.preferred_name}&apos;s check-in calls — {totalCount} total
          </p>
        </div>

        {/* Error loading calls */}
        {callsResult.error && !callsResult.data && (
          <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-lg text-red-700">
            Unable to load call history. Please refresh the page.
          </div>
        )}

        <CallHistoryClient
          memberId={member.id}
          initialCalls={callsResult.data ?? []}
          totalCount={totalCount}
        />
      </main>
    </div>
  )
}
