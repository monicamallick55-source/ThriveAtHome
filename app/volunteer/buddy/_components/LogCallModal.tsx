'use client'
import { useState } from 'react'

interface Props { assignmentId: string; memberId: string; volunteerId: string; memberName: string; onClose: () => void; onSubmitted: () => void }

export default function LogCallModal({ assignmentId, memberId, volunteerId, memberName, onClose, onSubmitted }: Props) {
  const [duration, setDuration] = useState('')
  const [quality, setQuality] = useState(0)
  const [notes, setNotes] = useState('')
  const [familyNote, setFamilyNote] = useState('')
  const [concernFlag, setConcernFlag] = useState(false)
  const [concernDesc, setConcernDesc] = useState('')
  const [milestone, setMilestone] = useState(false)
  const [milestoneDesc, setMilestoneDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/buddy/calls', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: assignmentId, member_id: memberId, volunteer_id: volunteerId, duration_minutes: parseInt(duration) || null, call_quality: quality || null, buddy_notes: notes || null, family_note: familyNote || null, concern_flag: concernFlag, concern_description: concernFlag ? concernDesc : null, milestone_flag: milestone, milestone_description: milestone ? milestoneDesc : null, aria_brief_shown: false }),
      })
      if (!res.ok) throw new Error('Failed')
      onSubmitted()
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-900">Log Call with {memberName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">How long did you talk?</label>
            <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Select…</option>
              <option value="15">Around 15 minutes</option>
              <option value="25">20–30 minutes</option>
              <option value="40">35–45 minutes</option>
              <option value="60">An hour or more</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">How did the call go?</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setQuality(n)} className={`text-2xl transition ${quality >= n ? 'opacity-100' : 'opacity-30'}`}>⭐</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your notes</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="What did you talk about? How did they seem?" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">A message for the family? <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea rows={2} value={familyNote} onChange={e => setFamilyNote(e.target.value)} placeholder="This goes to the family dashboard — keep it warm and brief" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl">
            <input type="checkbox" id="milestone" checked={milestone} onChange={e => setMilestone(e.target.checked)} className="mt-0.5" />
            <div className="flex-1">
              <label htmlFor="milestone" className="text-sm font-medium text-gray-800 cursor-pointer">✨ Mark as a special moment</label>
              {milestone && <input type="text" value={milestoneDesc} onChange={e => setMilestoneDesc(e.target.value)} placeholder="e.g. She talked about her late husband for the first time today" className="mt-2 w-full border border-amber-300 rounded-lg px-3 py-1.5 text-sm" />}
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
            <input type="checkbox" id="concern" checked={concernFlag} onChange={e => setConcernFlag(e.target.checked)} className="mt-0.5" />
            <div className="flex-1">
              <label htmlFor="concern" className="text-sm font-medium text-gray-800 cursor-pointer">🚩 Flag something for the navigator</label>
              <p className="text-xs text-gray-500 mt-0.5">Use this if you heard anything worrying — the navigator will follow up. You don't have to handle it yourself.</p>
              {concernFlag && <textarea rows={2} value={concernDesc} onChange={e => setConcernDesc(e.target.value)} placeholder="Describe the concern in plain language" className="mt-2 w-full border border-red-300 rounded-lg px-3 py-1.5 text-sm" />}
            </div>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#1B3A6B] text-white rounded-xl text-sm font-semibold hover:bg-[#162f58] disabled:opacity-50">{loading ? 'Saving…' : 'Save Call Log'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
