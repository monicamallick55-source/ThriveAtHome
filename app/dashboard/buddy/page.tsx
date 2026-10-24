import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Database } from '@/types/database'

export const metadata = { title: 'My Buddy — ThriveAtHome' }

async function getBuddyData(memberId: string, supabase: ReturnType<typeof createServerComponentClient<Database>>) {
  // Get active buddy assignment
  const { data: assignment } = await supabase
    .from('buddy_assignments')
    .select(`
      id, status, call_frequency, preferred_call_day, preferred_call_time,
      assigned_at, match_reasons,
      volunteers (
        id, first_name, last_name, buddy_bio, avatar_url
      )
    `)
    .eq('member_id', memberId)
    .eq('status', 'active')
    .maybeSingle()

  if (!assignment) return { assignment: null, calls: [], milestones: [] }

  // Get recent buddy calls
  const { data: calls } = await supabase
    .from('buddy_calls')
    .select('id, started_at, duration_minutes, buddy_notes, family_note, milestone_flag, milestone_description, call_quality, concern_flag')
    .eq('assignment_id', assignment.id)
    .order('started_at', { ascending: false })
    .limit(10)

  const milestones = (calls ?? []).filter((c: any) => c.milestone_flag)

  return { assignment, calls: calls ?? [], milestones }
}

export default async function BuddyPage() {
  const supabase = createServerComponentClient<Database>({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('family_members')
    .select('id, senior_id, relationship, members(id, preferred_name, first_name, plan_tier, has_active_buddy, buddy_match_topics, buddy_match_era)')
    .eq('auth_id', user.id)
    .maybeSingle()

  // Also check if user is the senior themselves
  const { data: seniorSelf } = await supabase
    .from('members')
    .select('id, preferred_name, first_name, plan_tier, has_active_buddy, buddy_match_topics, buddy_match_era')
    .eq('auth_id', user.id)
    .maybeSingle()

  const senior = (member as any)?.members ?? seniorSelf
  const memberId = senior?.id

  if (!memberId) redirect('/dashboard')

  const planTier = senior?.plan_tier ?? 'basics'
  const isPaidPlan = ['connect', 'complete', 'premier'].includes(planTier)
  const seniorName = senior?.preferred_name ?? senior?.first_name ?? 'your loved one'

  if (!isPaidPlan) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="text-5xl mb-4">🤝</div>
          <h1 className="text-2xl font-bold text-[#1B3A6B] mb-3">Get {seniorName} a real buddy</h1>
          <p className="text-gray-600 mb-6">
            Upgrade to Connect and we'll match {seniorName} with one dedicated volunteer who calls every week,
            gets to know them, and remembers what matters.
          </p>
          <Link href="/dashboard/plan" className="inline-block bg-[#2A9D8F] text-white font-semibold px-6 py-3 rounded-xl">
            Upgrade to Connect →
          </Link>
        </div>
      </div>
    )
  }

  const { assignment, calls, milestones } = await getBuddyData(memberId, supabase)
  const volunteer = (assignment as any)?.volunteers
  const buddyFirstName = volunteer?.first_name ?? ''
  const buddyLastInitial = volunteer?.last_name?.[0] ?? ''
  const buddyDisplayName = buddyFirstName ? `${buddyFirstName} ${buddyLastInitial}.` : 'your buddy'

  const lastCall = calls[0]
  const lastCallDate = lastCall?.started_at
    ? new Date(lastCall.started_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null

  const dayLabel = assignment?.preferred_call_day
    ? assignment.preferred_call_day.charAt(0).toUpperCase() + assignment.preferred_call_day.slice(1) + 's'
    : null

  const assignedSince = assignment?.assigned_at
    ? new Date(assignment.assigned_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-[#1B3A6B]">{seniorName}'s Buddy</h1>

      {!assignment ? (
        /* No buddy yet */
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-200 flex items-center justify-center text-2xl flex-shrink-0">
              🕐
            </div>
            <div>
              <h2 className="font-bold text-[#1B3A6B] mb-1">Finding the right match…</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                We're matching {seniorName} with a buddy now — this typically takes 5–7 days.
                You'll get an email as soon as they're introduced.
              </p>
              {isPaidPlan && (
                <p className="text-teal-700 text-sm mt-3 font-medium">
                  ✓ Included in your {planTier.charAt(0).toUpperCase() + planTier.slice(1)} plan
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Buddy card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-[#1B3A6B] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {buddyFirstName[0] ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-[#1B3A6B]">{buddyDisplayName}</h2>
                {assignedSince && (
                  <p className="text-gray-500 text-sm">
                    Calling {seniorName} since {assignedSince}
                  </p>
                )}
                {volunteer?.buddy_bio && (
                  <p className="text-gray-600 text-sm mt-2 leading-relaxed">{volunteer.buddy_bio}</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
              {dayLabel && (
                <div>
                  <span className="text-gray-400 block text-xs uppercase tracking-wide mb-0.5">Calls on</span>
                  <span className="font-semibold text-gray-800">{dayLabel}</span>
                  {assignment.preferred_call_time && (
                    <span className="text-gray-500 ml-1">at {assignment.preferred_call_time}</span>
                  )}
                </div>
              )}
              {lastCallDate && (
                <div>
                  <span className="text-gray-400 block text-xs uppercase tracking-wide mb-0.5">Last call</span>
                  <span className="font-semibold text-gray-800">{lastCallDate}</span>
                </div>
              )}
              <div>
                <span className="text-gray-400 block text-xs uppercase tracking-wide mb-0.5">Frequency</span>
                <span className="font-semibold text-gray-800 capitalize">{assignment.call_frequency ?? 'Weekly'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs uppercase tracking-wide mb-0.5">Total calls</span>
                <span className="font-semibold text-gray-800">{calls.length}</span>
              </div>
            </div>
          </div>

          {/* Latest family note */}
          {lastCall?.family_note && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">
                A note from {buddyFirstName}
              </p>
              <p className="text-gray-800 leading-relaxed">"{lastCall.family_note}"</p>
              {lastCall.started_at && (
                <p className="text-gray-400 text-xs mt-2">
                  {new Date(lastCall.started_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          )}

          {/* Most recent milestone */}
          {milestones[0] && (
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">✨ A special moment</p>
              <p className="text-gray-800 leading-relaxed">{milestones[0].milestone_description}</p>
              {milestones[0].started_at && (
                <p className="text-gray-400 text-xs mt-2">
                  {new Date(milestones[0].started_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          )}

          {/* Call history */}
          {calls.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-[#1B3A6B] mb-4">Recent calls</h3>
              <div className="space-y-4">
                {calls.slice(0, 5).map((call: any) => (
                  <div key={call.id} className="flex gap-4 items-start">
                    <div className="w-1 self-stretch bg-teal-100 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800 text-sm">
                          {call.started_at
                            ? new Date(call.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : 'Unknown date'}
                        </span>
                        {call.duration_minutes && (
                          <span className="text-gray-400 text-xs">{call.duration_minutes} min</span>
                        )}
                        {call.milestone_flag && <span className="text-purple-500 text-xs">✨ milestone</span>}
                      </div>
                      {call.buddy_notes && (
                        <p className="text-gray-600 text-sm leading-relaxed">{call.buddy_notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
