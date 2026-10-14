// app/navigator/transition-plans/[id]/page.tsx
// G7.15 — Facility-move plan detail + step tracker (staff/navigator)

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import TransitionPlanClient from './TransitionPlanClient'

export const metadata: Metadata = { title: 'Transition Plan — ThriveAtHome' }

export default async function TransitionPlanPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const isStaff = fm && ['staff', 'navigator', 'admin'].includes((fm as any).role)
  if (!isStaff) redirect('/dashboard')

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: plan } = await (admin as any)
    .from('transition_plans')
    .select(`
      *,
      steps:transition_plan_steps(*),
      member:members(id, preferred_name, full_name, phone)
    `)
    .eq('id', params.id)
    .maybeSingle()

  if (!plan) redirect('/navigator')

  // Sort steps by step_number
  plan.steps = (plan.steps ?? []).sort((a: any, b: any) => a.step_number - b.step_number)

  return <TransitionPlanClient plan={plan} navigatorId={fm!.id} />
}
