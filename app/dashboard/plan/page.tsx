// app/dashboard/plan/page.tsx
// G5.7 — Member plan + add-ons view

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MemberPlanCard from '@/components/plans/MemberPlanCard'

export default async function MemberPlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm || !fm.member_id) redirect('/dashboard')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Your Plan</h1>
        <p className="text-gray-500 mt-1">
          View your current Thrive@Home plan and available services.
        </p>
      </div>
      <MemberPlanCard />
    </div>
  )
}
