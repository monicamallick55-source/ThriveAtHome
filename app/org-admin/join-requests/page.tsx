import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth, getUserRole } from '@/lib/auth'
import OrgJoinRequestsClient from '@/components/org/OrgJoinRequestsClient'

export const metadata: Metadata = { title: 'Join Requests — Community Org Admin' }

export default async function OrgJoinRequestsPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'org_admin' && role !== 'admin') redirect('/dashboard')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>ThriveAtHome</span>
        <a href="/org-admin" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(250,250,245,0.8)', textDecoration: 'none' }}>← Back to org admin</a>
      </nav>
      <main style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>Membership Join Requests</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '28px' }}>
          Seniors who found your organization and asked to join. Approving adds them to your member roster for this year.
        </p>
        <OrgJoinRequestsClient />
      </main>
    </div>
  )
}
