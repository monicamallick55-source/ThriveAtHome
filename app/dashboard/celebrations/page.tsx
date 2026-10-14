// app/dashboard/celebrations/page.tsx
// G7.2 — Celebrations hub: family events calendar + gift orders + celebration requests

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import CelebrationsClient from './CelebrationsClient'

export default async function CelebrationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Resolve context (member or family)
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role, full_name')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const { data: member } = await supabase
    .from('members')
    .select('id, full_name')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const memberId = fm?.member_id ?? member?.id
  if (!memberId) redirect('/login')

  const admin = createAdminClient()

  // Upcoming events (next 90 days)
  const ninetyDays = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: events } = await (admin as any)
    .from('family_events')
    .select('*')
    .eq('member_id', memberId)
    .is('cancelled_at', null)
    .gte('event_date', new Date().toISOString().slice(0, 10))
    .lte('event_date', ninetyDays)
    .order('event_date', { ascending: true })
    .limit(20)

  // Active celebration requests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: celebrations } = await (admin as any)
    .from('celebration_requests')
    .select('*')
    .eq('member_id', memberId)
    .not('status', 'in', '(cancelled,completed)')
    .order('celebration_date', { ascending: true })
    .limit(10)

  // Recent gift orders
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: gifts } = await (admin as any)
    .from('gift_orders')
    .select('*')
    .eq('member_id', memberId)
    .not('status', 'eq', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(10)

  const isFamily = !!fm

  return (
    <CelebrationsClient
      memberId={memberId}
      memberName={fm ? `${fm.full_name}'s loved one` : (member?.full_name ?? 'Your')}
      isFamily={isFamily}
      familyMemberId={fm?.id ?? null}
      events={events ?? []}
      celebrations={celebrations ?? []}
      gifts={gifts ?? []}
    />
  )
}
