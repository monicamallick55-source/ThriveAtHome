'use client'
import { useState } from 'react'
import type { BuddyAssignment } from '@/types/buddy'
import AriaBriefCard from './AriaBriefCard'
import LogCallModal from './LogCallModal'

interface Props { assignment: BuddyAssignment; volunteerId: string }

export default function BuddyAssignmentCard({ assignment, volunteerId }: Props) {
  const [showBrief, setShowBrief] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)
  const [callLogged, setCallLogged] = useState(false)
  const member = assignment.member
  const memberName = member?.preferred_name || member?.first_name || 'Your buddy'
  const lastCall = assignment.buddy_calls?.[0]
  const lastCallDate = lastCall ? new Date(lastCall.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : null

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1B3A6B] text-white rounded-full flex items-center justify-center font-bold text-lg">{memberName[0]}</div>
          <div>
            <div className="font-semibold text-gray-900 text-lg">{memberName}</div>
            <div className="text-sm text-gray-500">{assignment.call_frequency === 'weekly' ? 'Weekly calls' : 'Bi-weekly calls'}{assignment.preferred_call_day && ` · ${assignment.preferred_call_day}s`}{assignment.preferred_call_time && ` at ${assignment.preferred_call_time}`}</div>
          </div>
        </div>
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${assignment.status === 'active' ? 'bg-green-100 text-green-700' : assignment.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{assignment.status}</span>
      </div>
      <div className="text-sm text-gray-500 mb-4">{lastCallDate ? `Last call: ${lastCallDate}` : 'No calls logged yet — say hello soon!'}{lastCall?.call_quality && <span className="ml-2">{'⭐'.repeat(lastCall.call_quality)}</span>}</div>
      {showBrief ? <div className="mb-4"><AriaBriefCard memberId={assignment.member_id} memberName={memberName} /></div> : <button onClick={() => setShowBrief(true)} className="mb-4 text-sm text-[#2A9D8F] hover:underline block">🌟 Get Aria brief before your call</button>}
      <button onClick={() => setShowLogModal(true)} className="w-full py-2 bg-[#1B3A6B] text-white rounded-xl text-sm font-semibold hover:bg-[#162f58] transition">{callLogged ? '✓ Call Logged' : '📞 Log a Call'}</button>
      {showLogModal && <LogCallModal assignmentId={assignment.id} memberId={assignment.member_id} volunteerId={volunteerId} memberName={memberName} onClose={() => setShowLogModal(false)} onSubmitted={() => { setShowLogModal(false); setCallLogged(true) }} />}
    </div>
  )
}
