import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth, getUserRole } from '@/lib/auth'
import {
  getSeniorCenterForAdmin,
  getTodaysDropins,
  getUpcomingActivities,
  getTodaysRoomBookings,
  getRecentMeals,
  getSeniorCenterStats,
} from '@/lib/data/seniorCenters'
import SeniorCenterPortal from '@/components/senior-center/SeniorCenterPortal'

export const metadata: Metadata = { title: 'Senior Center Admin — ThriveAtHome' }

export default async function SeniorCenterAdminPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)

  if (role !== 'senior_center_admin' && role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: center, error: centerError } = await getSeniorCenterForAdmin(user.id)

  if (centerError || !center) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
        <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>ThriveAtHome</span>
        </nav>
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 32px' }}>
          <div style={{ textAlign: 'center', maxWidth: '520px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏛️</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>
              Senior Center Admin Portal
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
              Your account is not yet linked to a senior center. Contact ThriveAtHome to set up your senior center account.
            </p>
            <p style={{ marginTop: '16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              In Supabase, set <strong>senior_center_id</strong> on your <strong>family_members</strong> row to the UUID of your senior center to activate this portal.
            </p>
          </div>
        </main>
      </div>
    )
  }

  const [dropinsRes, activitiesRes, roomsRes, mealsRes, statsRes] = await Promise.all([
    getTodaysDropins(center.id),
    getUpcomingActivities(center.id, 50),
    getTodaysRoomBookings(center.id),
    getRecentMeals(center.id, 30),
    getSeniorCenterStats(center.id),
  ])

  return (
    <SeniorCenterPortal
      center={center}
      initialDropins={dropinsRes.data ?? []}
      initialActivities={activitiesRes.data ?? []}
      initialRooms={roomsRes.data ?? []}
      initialMeals={mealsRes.data ?? []}
      stats={statsRes.data}
    />
  )
}
