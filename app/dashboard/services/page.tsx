import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getServiceBookingsForMember, type ServiceBooking } from '@/lib/data/services'
import ServicesClient from '@/components/services/ServicesClient'

export const metadata: Metadata = { title: 'Services — ThriveAtHome' }

export default async function ServicesPage() {
  const user = await requireAuth()
  const { data: fm } = await getFamilyMemberByAuthId(user.id)

  let initialBookings: ServiceBooking[] = []
  if (fm?.member_id) {
    const { data } = await getServiceBookingsForMember(fm.member_id)
    initialBookings = data ?? []
  }

  return <ServicesClient initialBookings={initialBookings} />
}
