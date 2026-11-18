'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type CallRow = { created_at: string; mood_score: number|null; energy_score: number|null; ai_summary: string|null }

export default function MoodTimelineWidget({ memberId }: { memberId: string }) {
  const supabase = createClientComponentClient()
  const [calls, setCalls] = useState<CallRow[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!memberId) return
    supabase.from('check_in_calls').select('created_at,mood_score,energy_score,ai_summary')
      .eq('member_id', memberId).not('mood_score','is',null)
      .order('created_at',{ascending:false}).limit(14)
      .then(({data}) => { setCalls((data??[]).reverse()); setLoading(false) })
  }, [memberId])
  if (loading) return <div className="p-4 text-sm text-gray-500">Loading mood data...</div>
  if (!calls.length) return <div className="p-4 text-sm text-gray-500" data-testid="mood-timeline-empty">No call data yet. Mood trends will appear after check-in calls.</div>
  return (
    <div data-testid="mood-timeline-widget" className="p-4">
      <h3 className="text-sm font-semibold mb-3">Mood Timeline — Last 14 days</h3>
      <div className="flex items-end gap-1 h-24">
        {calls.map((c,i) => (
          <div key={i} className="flex-1 flex flex-col justify-end" title={`Mood: ${c.mood_score}/10\n${c.ai_summary??''}`} data-testid={`mood-bar-${i}`}>
            <div style={{height:`${((c.mood_score??0)/10)*80}px`,background:'#3b82f6',borderRadius:'2px 2px 0 0'}} />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>{new Date(calls[0].created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
        <span>Mood score (blue) · 0–10</span>
        <span>{new Date(calls[calls.length-1].created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
      </div>
    </div>
  )
}
