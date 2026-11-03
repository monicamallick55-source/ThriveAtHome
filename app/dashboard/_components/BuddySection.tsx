'use client'
import { useEffect, useState } from 'react'
import type { BuddyAssignment, BuddyCall } from '@/types/buddy'

interface Props { memberId: string; memberName: string; planTier: string; hasActiveBuddy: boolean }

export default function BuddySection({ memberId, memberName, planTier, hasActiveBuddy }: Props) {
  const [assignment, setAssignment] = useState<BuddyAssignment | null>(null)
  const [calls, setCalls] = useState<BuddyCall[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllCalls, setShowAllCalls] = useState(false)

  if (!['connect','complete','premier'].includes(planTier)) return null

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/buddy/assignments?memberId=${memberId}`)
        if (res.ok) {
          const data = await res.json()
          setAssignment(data)
          if (data?.id) {
            const cr = await fetch(`/api/buddy/calls?assignmentId=${data.id}`)
            if (cr.ok) setCalls(await cr.json())
          }
        }
      } catch {} finally { setLoading(false) }
    }
    load()
  }, [memberId])

  if (loading) return <div className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3 mb-3" /><div className="h-3 bg-gray-100 rounded w-2/3" /></div>

  if (!assignment || !hasActiveBuddy) return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-xl">🤝</div>
        <div><div className="font-semibold text-gray-900">{memberName}'s buddy</div><div className="text-sm text-teal-600">Coming soon</div></div>
      </div>
      <p className="text-sm text-gray-600">We're matching {memberName} with a buddy now — typically takes 5–7 days. You'll get an email as soon as they're introduced.</p>
      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-teal-400 rounded-full w-1/3 animate-pulse" /></div>
      <p className="text-xs text-gray-400 mt-1.5">Matching in progress…</p>
    </div>
  )

  const buddy = assignment.volunteer
  const buddyName = buddy?.first_name ?? 'Your buddy'
  const buddyLastInitial = buddy?.last_name ? buddy.last_name[0] + '.' : ''
  const assignedMonth = new Date(assignment.assigned_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const recentMilestone = calls.find(c => c.milestone_flag)
  const displayCalls = showAllCalls ? calls : calls.slice(0, 3)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 bg-[#1B3A6B] text-white rounded-full flex items-center justify-center font-bold text-xl">{buddyName[0]}</div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900 text-lg">{buddyName} {buddyLastInitial}</div>
          <div className="text-sm text-gray-500">{memberName}'s weekly buddy · since {assignedMonth}</div>
          {buddy?.buddy_bio && <div className="text-sm text-gray-600 mt-1 italic">{buddy.buddy_bio}</div>}
        </div>
      </div>
      {assignment.preferred_call_day && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 p-3 bg-teal-50 rounded-xl">
          <span>📅</span><span>Calls every <strong>{assignment.preferred_call_day}</strong>{assignment.preferred_call_time && <> at <strong>{assignment.preferred_call_time}</strong></>}</span>
        </div>
      )}
      {recentMilestone && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
          <div className="text-xs font-semibold text-amber-700 mb-1">✨ A special moment</div>
          <div className="text-sm text-amber-900">{recentMilestone.milestone_description}</div>
          <div className="text-xs text-amber-600 mt-1">{new Date(recentMilestone.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        </div>
      )}
      {calls.length > 0 ? (
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Recent calls</div>
          <div className="space-y-2">
            {displayCalls.map(call => (
              <div key={call.id} className="text-sm text-gray-700 py-2 border-b border-gray-100 last:border-0">
                <div className="flex justify-between"><span className="text-gray-500 text-xs">{new Date(call.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>{call.duration_minutes && <span className="text-xs text-gray-400">{call.duration_minutes} min</span>}</div>
                {call.buddy_notes && <p className="mt-0.5">{call.buddy_notes}</p>}
                {call.family_note && <div className="mt-1.5 p-2 bg-blue-50 rounded-lg"><span className="text-xs text-blue-600 font-medium">Note from {buddyName}: </span><span className="text-xs text-blue-800">{call.family_note}</span></div>}
                {call.milestone_flag && <div className="text-xs text-amber-600 mt-1">✨ {call.milestone_description}</div>}
              </div>
            ))}
          </div>
          {calls.length > 3 && <button onClick={() => setShowAllCalls(!showAllCalls)} className="text-sm text-[#2A9D8F] hover:underline mt-2">{showAllCalls ? 'Show less' : `See all ${calls.length} buddy calls`}</button>}
        </div>
      ) : <p className="text-sm text-gray-400 italic">No calls logged yet — the first one is coming up soon!</p>}
    </div>
  )
}
