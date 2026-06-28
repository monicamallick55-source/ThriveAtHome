// Phase 86 — Youth K-12 Curriculum landing + school registration
import type { Metadata } from 'next'
import { K12LandingClient } from '@/components/k12/K12LandingClient'

export const metadata: Metadata = {
  title: 'K-12 Youth Programs — ThriveAtHome',
  description: 'Pen-pals, Life Stories, and intergenerational mentorship programs for K-12 schools.',
}

export default function K12Page() {
  return <K12LandingClient />
}
