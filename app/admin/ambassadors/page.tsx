// Phase 85 — Member Ambassador Programme — admin page
import { redirect } from 'next/navigation'
import { requireAuth, getUserRole } from '@/lib/auth'
import { getActiveAmbassadors } from '@/lib/data/m21Volunteers'
import { AmbassadorsAdminClient } from '@/components/admin/AmbassadorsAdminClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Member Ambassadors — Admin' }

export default async function AmbassadorsAdminPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'admin' && role !== 'navigator') redirect('/dashboard')

  const { data: ambassadors } = await getActiveAmbassadors()
  return <AmbassadorsAdminClient ambassadors={ambassadors} />
}
