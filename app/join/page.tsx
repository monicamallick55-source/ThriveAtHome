// /join?ref=CODE — agency referral landing page.
// Validates ref code, shows agency branding, redirects to signup with ref preserved.
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = { title: 'Join ThriveAtHome — Referred by Your Agency' }

async function getAgencyForCode(code: string) {
  try {
    const admin = createAdminClient()
    const { data: link } = await (admin as any)
      .from('agency_referral_links')
      .select('agency_id, referral_code, referral_fee_cents, is_active')
      .eq('referral_code', code)
      .eq('is_active', true)
      .maybeSingle() as { data: { agency_id: string; referral_code: string; is_active: boolean } | null }

    if (!link) return null

    const { data: agency } = await admin
      .from('care_agencies' as any)
      .select('id, name')
      .eq('id', link.agency_id)
      .maybeSingle() as { data: { id: string; name: string } | null }

    return agency
  } catch {
    return null
  }
}

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const params = await searchParams
  const refCode = params.ref

  if (!refCode) redirect('/signup')

  const agency = await getAgencyForCode(refCode)
  if (!agency) redirect('/signup')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        {/* Agency co-branding */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            Referred by
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 4px' }}>
            {agency.name}
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Powered by ThriveAtHome
          </p>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '36px 32px', border: '1px solid #E8E4DC', marginBottom: '24px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px', lineHeight: 1.2 }}>
            Your parent deserves daily connection
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '28px' }}>
            Aria calls your loved one every day — listening, checking in, and alerting you when something needs attention. Setup takes 5 minutes.
          </p>
          <Link
            href={`/signup?ref=${refCode}`}
            style={{
              display: 'block', width: '100%', textAlign: 'center',
              backgroundColor: 'var(--color-navy)', color: 'var(--color-cream)',
              fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 600,
              borderRadius: 'var(--radius-md)', padding: '14px 24px',
              textDecoration: 'none', boxSizing: 'border-box',
            }}
          >
            Start free trial →
          </Link>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '12px' }}>
            30 days free · No credit card required
          </p>
        </div>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#9CA3AF' }}>
          Referral code: <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{refCode}</code>
        </p>
      </div>
    </div>
  )
}
