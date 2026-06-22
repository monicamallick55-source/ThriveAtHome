import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth, getUserRole } from '@/lib/auth'
import { getUniversityForAdmin, getStudentsByUniversity } from '@/lib/data/university'
import UniversityAdminPortal from '@/components/university/UniversityAdminPortal'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = { title: 'University Partner Portal — ThriveAtHome' }

export default async function UniversityAdminPage() {
  const user = await requireAuth()

  const role = await getUserRole(user.id)
  if (role !== 'university_admin' && role !== 'admin') {
    redirect('/dashboard')
  }

  // Get admin's full name and university_name from family_members
  const admin = createAdminClient()
  const { data: adminRecord } = await admin
    .from('family_members')
    .select('full_name, university_name')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const universityName = adminRecord?.university_name ?? null
  const adminName = adminRecord?.full_name ?? user.email ?? 'Administrator'

  // If no university configured yet, show setup state
  if (!universityName) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
        <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>
            ThriveAtHome
          </span>
        </nav>
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 32px' }}>
          <div style={{ textAlign: 'center', maxWidth: '520px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎓</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>
              University Partner Portal
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: '24px' }}>
              Your account is not yet linked to a university. Contact ThriveAtHome support to set up your institution.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>
              In Supabase, set <strong>university_name</strong> on your <strong>family_members</strong> row to your institution name to activate this portal.
            </p>
          </div>
        </main>
      </div>
    )
  }

  const students = await getStudentsByUniversity(universityName)

  return (
    <UniversityAdminPortal
      universityName={universityName}
      adminName={adminName}
      students={students}
    />
  )
}
