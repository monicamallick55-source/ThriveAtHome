// Admin Console — landing hub for platform admins. Gated to role='admin'.
// Includes team invitations (navigator / partner-admin / volunteer onboarding).
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAuth, getUserRole } from '@/lib/auth'
import { INVITABLE_BY } from '@/lib/roles'
import type { UserRole } from '@/lib/auth'
import TeamInvitations from '@/components/shared/TeamInvitations'

export const metadata: Metadata = { title: 'Admin Console — ThriveAtHome' }

const LINKS: { href: string; label: string; desc: string }[] = [
  { href: '/admin/volunteers', label: 'Volunteer applications', desc: 'Review and approve volunteer applicants' },
  { href: '/admin/volunteer-matching', label: 'Volunteer matching', desc: 'Match volunteers to members' },
  { href: '/admin/buddy-matching', label: 'Buddy matching', desc: 'Assign Human Buddies to members' },
  { href: '/admin/communities', label: 'Communities', desc: 'Manage cultural circles and interest groups' },
  { href: '/admin/cultural-circles', label: 'Cultural circles', desc: 'Create circle events and announcements' },
  { href: '/admin/events/create', label: 'Create an event', desc: 'Add a virtual or in-person event' },
  { href: '/admin/advisors', label: 'Advisor directory', desc: 'Curate the trusted advisor list' },
  { href: '/admin/ambassadors', label: 'Ambassadors', desc: 'Manage circle ambassadors' },
  { href: '/admin/outcomes', label: 'Outcomes', desc: 'Platform outcomes and reporting' },
  { href: '/admin/settings', label: 'Settings', desc: 'Platform configuration' },
]

export default async function AdminPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'admin') redirect('/dashboard')

  const allowed = (INVITABLE_BY.admin ?? []) as UserRole[]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>ThriveAtHome — Admin</span>
        <a href="/api/auth/signout" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(250,250,245,0.8)', textDecoration: 'none' }}>Sign out</a>
      </nav>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '34px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '24px' }}>
          Admin Console
        </h1>

        <div style={{ marginBottom: '36px' }}>
          <TeamInvitations allowedRoles={allowed} />
        </div>

        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color: 'var(--color-navy)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
          Management
        </h2>
        <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {LINKS.map((l: any) => (
            <Link key={l.href} href={l.href}
              style={{ display: 'block', backgroundColor: 'white', border: '1px solid #E8E4DC', borderRadius: '12px', padding: '18px 20px', textDecoration: 'none' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-navy)' }}>{l.label}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{l.desc}</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
