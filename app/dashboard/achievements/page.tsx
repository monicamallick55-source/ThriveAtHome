// app/dashboard/achievements/page.tsx
// G5.4 — Member achievement trophy shelf

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MemberAchievements from '@/components/achievements/MemberAchievements'

export default async function AchievementsPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">Your Achievements</h1>
        <p className="text-gray-500 mt-1">
          Milestones and moments that mark your journey with Thrive@Home.
        </p>
      </div>
      <MemberAchievements />
    </div>
  )
}
