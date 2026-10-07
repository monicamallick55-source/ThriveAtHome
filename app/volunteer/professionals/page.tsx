// Phase 81 — Retired Professionals Network directory
import type { Metadata } from 'next'
import { getRetiredProfessionalVolunteers } from '@/lib/data/m21Volunteers'
import { RetiredProfessionalsClient } from '@/components/volunteer/RetiredProfessionalsClient'

export const metadata: Metadata = { title: 'Retired Professionals — ThriveAtHome' }

export default async function RetiredProfessionalsPage() {
  const { data: professionals } = await getRetiredProfessionalVolunteers()
  return <RetiredProfessionalsClient professionals={(professionals ?? []) as any} />
}
