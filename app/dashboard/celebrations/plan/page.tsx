import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CelebrationPlannerClient from '@/components/celebrations/CelebrationPlannerClient'

export default async function PlanCelebrationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: fm } = await (supabase as any)
    .from('family_members')
    .select('id, member_id, first_name, members(first_name)')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm) redirect('/dashboard')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <a href="/dashboard/celebrations" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        ← Back to Celebrations
      </a>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
        Plan a Celebration
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Coordinate something special for {(fm.members as any)?.first_name}
      </p>
      <CelebrationPlannerClient
        familyMemberId={fm.id}
        memberId={fm.member_id}
        memberName={(fm.members as any)?.first_name ?? 'your loved one'}
      />
    </div>
  )
}