// Phase 82 — Faith Community Chaplaincy
import type { Metadata } from 'next'
import { getChaplainVolunteers } from '@/lib/data/m21Volunteers'
import { ChaplaincyClient } from '@/components/volunteer/ChaplaincyClient'

export const metadata: Metadata = { title: 'Faith Community Chaplaincy — ThriveAtHome' }

export default async function ChaplaincyPage() {
  const { data: chaplains } = await getChaplainVolunteers()
  return <ChaplaincyClient chaplains={chaplains} />
}
