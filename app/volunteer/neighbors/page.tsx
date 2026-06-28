// Phase 83 — Neighbor Volunteers
import type { Metadata } from 'next'
import { NeighborVolunteersClient } from '@/components/volunteer/NeighborVolunteersClient'

export const metadata: Metadata = { title: 'Neighbor Volunteers — ThriveAtHome' }

export default function NeighborVolunteersPage() {
  return <NeighborVolunteersClient />
}
