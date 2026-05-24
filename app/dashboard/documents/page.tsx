// Document Vault page — upload and download documents for a member.
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { getDocumentsForMember } from '@/lib/data/documents'
import { DocumentVault } from '@/components/dashboard/DocumentVault'
import { ToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export const metadata: Metadata = { title: 'Document Vault — ThriveAtHome' }

export default async function DocumentsPage() {
  const user = await requireAuth()

  const { data: member, error: memberError } = await getMemberForAuthUser(user.id)

  if (!member) {
    if (memberError === 'Not found' || !memberError) redirect('/onboarding')
    redirect('/onboarding')
  }

  const { data: documents, error: docsError } = await getDocumentsForMember(member.id)

  return (
    <ToastProvider>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
        {/* Navigation */}
        <nav
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            backgroundColor: 'white',
            borderBottom: '1px solid var(--color-warm-grey)',
            boxShadow: 'var(--shadow-sm)',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Dashboard navigation"
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link
              href="/dashboard"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '18px',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              ← Dashboard
            </Link>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', fontWeight: 500 }}>
              ThriveAtHome
            </span>
            <div style={{ width: '120px' }} aria-hidden="true" />
          </div>
        </nav>

        {/* Navy header */}
        <div style={{ backgroundColor: 'var(--color-navy)', padding: '32px 24px 48px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '34px',
                fontWeight: 500,
                color: 'var(--color-cream)',
                marginBottom: '6px',
                letterSpacing: '-0.01em',
              }}
            >
              Document Vault
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'rgba(250,250,245,0.7)', margin: 0 }}>
              Securely store important documents for {member.preferred_name}.
            </p>
          </div>
        </div>

        <main
          id="main-content"
          style={{
            maxWidth: '900px',
            margin: '-24px auto 0',
            padding: '0 24px 48px',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-warm-grey)',
              boxShadow: 'var(--shadow-card)',
              padding: '28px',
            }}
          >
            <ErrorBoundary section="document vault">
              <DocumentVault
                memberId={member.id}
                initialDocuments={documents ?? []}
                error={docsError}
              />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}
