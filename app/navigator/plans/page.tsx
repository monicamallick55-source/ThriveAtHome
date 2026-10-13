// app/navigator/plans/page.tsx
// G5.7 — Navigator: assign plans + add-ons to members

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavigatorPlanManager from '@/components/navigator/NavigatorPlanManager'

export default async function NavigatorPlansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) redirect('/dashboard')

  const { data: members } = await supabase
    .from('members')
    .select('id, full_name, preferred_name')
    .eq('status', 'active')
    .order('full_name')

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Plan Management</h1>
        <p className="text-gray-500 mt-1">Assign plans and add-ons to members.</p>
      </div>
      <NavigatorPlanManager members={members ?? []} />
    </div>
  )
}
