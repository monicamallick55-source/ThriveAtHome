import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth, getUserRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import EmployerDashboardClient from '@/components/employer/EmployerDashboardClient'

export const metadata: Metadata = { title: 'Employer Admin — ThriveAtHome' }

export default async function EmployerAdminPage() {
  const user = await requireAuth()

  const role = await getUserRole(user.id)
  if (role !== 'employer_admin' && role !== 'admin') {
    redirect('/login')
  }

  const admin = createAdminClient()

  const { data: adminRow } = await admin
    .from('family_members')
    .select('full_name, employer_account_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const adminName = adminRow?.full_name ?? user.email ?? 'Admin'
  const employerId = adminRow?.employer_account_id ?? null

  // TC-RAC004: no employerId → redirect to login rather than rendering the portal
  if (!employerId) {
    redirect('/login')
  }

  type EmployerAccountRow = {
    company_name: string
    contact_name: string
    contact_email: string
    plan_tier: string
    status: string
    billing_start_date: string | null
    seats_purchased: number
    seats_used: number
  }

  const { data: employer } = await admin
    .from('employer_accounts')
    .select('company_name, contact_name, contact_email, plan_tier, status, billing_start_date, seats_purchased, seats_used')
    .eq('id', employerId)
    .maybeSingle<EmployerAccountRow>()

  if (!employer) {
    redirect('/login')
  }

  return (
    <EmployerDashboardClient
      adminName={adminName}
      employerId={employerId}
      employer={employer}
    />
  )
}
