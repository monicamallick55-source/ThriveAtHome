// Phase 86 — K-12 School Admin Portal
import { redirect } from 'next/navigation'
import { requireAuth, getUserRole } from '@/lib/auth'
import { getK12Schools } from '@/lib/data/m21Volunteers'
import { K12AdminClient } from '@/components/k12/K12AdminClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'K-12 Partner Schools — Admin' }

export default async function K12AdminPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'admin' && role !== 'navigator') redirect('/dashboard')

  const { data: schools } = await getK12Schools()
  return <K12AdminClient schools={schools} />
}
