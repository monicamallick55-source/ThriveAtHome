// Multi-role switcher. Shown when a signed-in user holds more than one role
// (e.g. a navigator who is also a volunteer). Single-role users are redirected
// straight to their home.
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth, getAllRolesForAuth } from '@/lib/auth'
import { ROLE_HOME, ROLE_LABEL } from '@/lib/roles'

export const metadata: Metadata = { title: 'Choose your view — ThriveAtHome' }

export default async function SelectRolePage() {
  const user = await requireAuth()
  const roles = await getAllRolesForAuth(user.id)

  if (roles.length <= 1) redirect(ROLE_HOME[roles[0] ?? 'family'] ?? '/dashboard')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: '520px', width: '100%' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>
          Welcome back
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '28px' }}>
          Your account has more than one role. Which would you like to open?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {roles.map((r) => (
            <Link
              key={r}
              href={ROLE_HOME[r] ?? '/dashboard'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: 'white', border: '1.5px solid #E8E4DC', borderRadius: '14px',
                padding: '18px 22px', textDecoration: 'none',
                fontFamily: 'var(--font-body)', fontSize: '17px', fontWeight: 600, color: 'var(--color-navy)',
              }}
            >
              {ROLE_LABEL[r] ?? r}
              <span aria-hidden="true" style={{ color: 'var(--color-teal)' }}>→</span>
            </Link>
          ))}
        </div>
        <p style={{ marginTop: '24px' }}>
          <a href="/api/auth/signout" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Sign out</a>
        </p>
      </div>
    </div>
  )
}
