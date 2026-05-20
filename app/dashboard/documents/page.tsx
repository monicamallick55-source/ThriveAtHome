// Document Vault page — upload and download documents for a member.
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { getDocumentsForMember } from '@/lib/data/documents'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { DocumentVault } from '@/components/dashboard/DocumentVault'
import { ToastProvider } from '@/components/ui/Toast'

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
      <div className="min-h-screen bg-brand-warm-white">
        {/* Navigation */}
        <nav className="sticky top-0 z-10 bg-brand-navy shadow-md" aria-label="Dashboard navigation">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/family"
                className="text-white text-base hover:text-brand-teal-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal rounded"
                aria-label="Back to family coordination"
              >
                ← Family
              </Link>
            </div>
            <span className="text-white text-xl font-bold tracking-tight">ThriveAtHome</span>
            <div className="w-20" aria-hidden="true" />
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8" id="main-content">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-brand-navy">Document Vault</h1>
            <p className="text-lg text-gray-500 mt-1">
              Securely store important documents for {member.preferred_name}.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardBody>
              <DocumentVault
                memberId={member.id}
                initialDocuments={documents ?? []}
                error={docsError}
              />
            </CardBody>
          </Card>
        </main>
      </div>
    </ToastProvider>
  )
}
