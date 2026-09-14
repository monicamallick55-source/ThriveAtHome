// /invite/<token> — accept a role invitation and create the account.
import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { ROLE_LABEL } from '@/lib/roles'
import type { UserRole } from '@/lib/auth'
import AcceptInviteForm from '@/components/auth/AcceptInviteForm'

export const metadata: Metadata = { title: 'Accept your invitation — ThriveAtHome' }

async function getInvite(token: string) {
  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin.from as any)('role_invitations')
      .select('email, role, status, expires_at, invited_by_name, org_id')
      .eq('token', token)
      .maybeSingle()
    return data as {
      email: string; role: string; status: string; expires_at: string
      invited_by_name: string | null; org_id: string | null
    } | null
  } catch {
    return null
  }
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const invite = await getInvite(token)

  const invalid =
    !invite ||
    invite.status !== 'pending' ||
    new Date(invite.expires_at) < new Date()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', textDecoration: 'none', fontWeight: 500 }}>
          ThriveAtHome
        </Link>
      </nav>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', maxWidth: '440px', width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          {invalid ? (
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px' }}>
                This invitation isn&apos;t valid
              </h1>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                It may have expired, been used already, or been revoked. Ask whoever invited you to send a new link.
              </p>
              <p style={{ marginTop: '20px' }}>
                <Link href="/login" style={{ color: 'var(--color-navy)', textDecoration: 'underline', fontFamily: 'var(--font-body)' }}>Go to sign in</Link>
              </p>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px', letterSpacing: '-0.01em' }}>
                Join ThriveAtHome
              </h1>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '28px', lineHeight: 1.6 }}>
                {invite!.invited_by_name ? `${invite!.invited_by_name} invited you` : 'You have been invited'} to join as a{' '}
                <strong style={{ color: 'var(--color-navy)' }}>{ROLE_LABEL[invite!.role as UserRole] ?? invite!.role}</strong>.
                Create your account for <strong>{invite!.email}</strong> below.
              </p>
              <AcceptInviteForm token={token} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
