// Shared "invite teammates" page for any staff role that can invite others
// (navigator → volunteers, community-org admin → volunteers). Platform admins
// have the fuller console at /admin but can use this too.
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth, getUserRole, isNavigatorOrAdmin } from '@/lib/auth'
import { INVITABLE_BY, roleHome } from '@/lib/roles'
import type { UserRole } from '@/lib/auth'
import TeamInvitations from '@/components/shared/TeamInvitations'

export const metadata: Metadata = { title: 'Invite teammates — ThriveAtHome' }

export default async function TeamPage() {
  const user = await requireAuth()
  let role = await getUserRole(user.id)
  if (!role && (await isNavigatorOrAdmin(user.id))) role = 'navigator'

  const allowed = (role && INVITABLE_BY[role]) ? INVITABLE_BY[role]! : []
  if (allowed.length === 0) redirect(roleHome(role))

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>ThriveAtHome</span>
        <Link href={roleHome(role)} style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(250,250,245,0.8)', textDecoration: 'none' }}>← Back</Link>
      </nav>
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '20px' }}>
          Invite teammates
        </h1>
        <TeamInvitations allowedRoles={allowed as UserRole[]} />
      </main>
    </div>
  )
}
