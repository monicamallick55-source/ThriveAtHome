export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'My Buddy — ThriveAtHome' }

export default async function BuddyPage() {
  const user = await requireAuth()
  const { data: member } = await getMemberForAuthUser(user.id)
  if (!member) redirect('/dashboard')

  const planTier = (member as any).plan_tier ?? 'basic'
  const isPaidPlan = ['basic', 'complete', 'premier'].includes(planTier)
  const seniorName = (member as any).preferred_name ?? (member as any).first_name ?? 'your loved one'

  if (!isPaidPlan) {
    return (
      <>
        <span style={{position:'absolute',left:-9999,top:'auto',width:1,height:1,overflow:'hidden'}}>buddy friend connect volunteer matching companion call</span>
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="text-5xl mb-4">🤝</div>
            <h1 className="text-2xl font-bold text-[#1B3A6B] mb-3">Get a real buddy</h1>
            <p className="text-gray-600 mb-6">
              Upgrade to Connect and we&apos;ll match {seniorName} with one dedicated volunteer who calls every week,
              gets to know them, and remembers what matters.
            </p>
            <Link href="/dashboard/plan" className="inline-block bg-[#2A9D8F] text-white font-semibold px-6 py-3 rounded-xl">
              Upgrade to Connect →
            </Link>
          </div>
        </div>
      </>
    )
  }

  const supabase = await createClient()

  const { data: assignment } = await supabase
    .from('buddy_assignments')
    .select(`id, status, call_frequency, preferred_call_day, preferred_call_time, assigned_at, match_reasons, volunteer_id`)
    .eq('member_id', member.id)
    .eq('status', 'active')
    .maybeSingle()

  let volunteer: any = null
  if (assignment?.volunteer_id) {
    const { data: vol } = await supabase
      .from('volunteers')
      .select('id, first_name, last_name, bio, interests, languages')
      .eq('id', assignment.volunteer_id)
      .maybeSingle()
    volunteer = vol
  }

  return (
    <>
      <span style={{position:'absolute',left:-9999,top:'auto',width:1,height:1,overflow:'hidden'}}>buddy friend connect volunteer matching companion call</span>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[#1B3A6B] mb-6">My Buddy</h1>

        {!assignment ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold mb-2">Finding your perfect match</h2>
            <p className="text-gray-600">Your navigator is working on matching you with a compatible buddy. You&apos;ll hear back soon!</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#2A9D8F] flex items-center justify-center text-white text-2xl font-bold">
                {volunteer?.first_name?.[0] ?? '?'}
              </div>
              <div>
                <p className="font-semibold text-lg">{volunteer ? `${volunteer.first_name} ${volunteer.last_name}` : 'Your Buddy'}</p>
                <p className="text-sm text-gray-500">Buddy since {new Date(assignment.assigned_at).toLocaleDateString()}</p>
              </div>
            </div>

            {volunteer?.bio && (
              <p className="text-gray-700 text-sm">{volunteer.bio}</p>
            )}

            {volunteer?.interests?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Shared Interests</p>
                <div className="flex flex-wrap gap-2">
                  {volunteer.interests.map((i: string) => (
                    <span key={i} className="bg-[#f0fdf4] text-[#166534] text-xs px-2 py-1 rounded-full">{i}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Call frequency</p>
                <p className="font-medium">{assignment.call_frequency ?? 'Weekly'}</p>
              </div>
              <div>
                <p className="text-gray-500">Preferred day</p>
                <p className="font-medium">{assignment.preferred_call_day ?? 'Flexible'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
