// Admin — Trusted Advisor Directory management (Phase 98, M24).
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth, getUserRole } from '@/lib/auth'
import { getAllAdvisors, getAdvisorApplications, getDirectoryRevenueSummary } from '@/lib/data/advisors'
import AdvisorAdminClient from '@/components/admin/AdvisorAdminClient'

export const metadata: Metadata = { title: 'Trusted Advisors — Admin' }

export default async function AdminAdvisorsPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'admin') redirect('/dashboard')

  const [{ data: advisors }, { data: applications }, { data: revenue }] = await Promise.all([
    getAllAdvisors(),
    getAdvisorApplications(),
    getDirectoryRevenueSummary(),
  ])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <nav style={{ backgroundColor: 'var(--color-navy)', height: '64px', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', width: '100%', display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/admin" style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(250,250,245,0.75)', textDecoration: 'none' }}>← Admin</a>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>Trusted Advisor Directory</span>
        </div>
      </nav>
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px', width: '100%' }}>
        <AdvisorAdminClient
          initialAdvisors={advisors ?? []}
          initialApplications={applications ?? []}
          revenue={revenue ?? null}
        />
      </main>
    </div>
  )
}
