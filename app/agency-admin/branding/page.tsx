// Agency branding configuration page — lets agency admins customize their co-branded appearance.
// ThriveAtHome branding is always visible ("Powered by ThriveAtHome" cannot be removed).
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth, getUserRole } from '@/lib/auth'
import { getAgencyForAdmin } from '@/lib/data/agencies'
import { getBrandConfigForAdmin } from '@/lib/data/brandConfigs'
import BrandingClient from '@/components/agency/BrandingClient'

export const metadata: Metadata = { title: 'Branding — Agency Admin — ThriveAtHome' }

export default async function AgencyBrandingPage() {
  const user = await requireAuth()

  const role = await getUserRole(user.id)
  if (role !== 'agency_admin' && role !== 'admin') {
    redirect('/dashboard')
  }

  const [agencyRes, brandRes] = await Promise.all([
    getAgencyForAdmin(user.id),
    getBrandConfigForAdmin(user.id),
  ])

  if (!agencyRes.data) {
    redirect('/agency-admin')
  }

  return (
    <BrandingClient
      agency={agencyRes.data}
      brandConfig={brandRes.data}
    />
  )
}
