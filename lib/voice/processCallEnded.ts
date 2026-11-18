import { createClient } from '@supabase/supabase-js'
import { agentNameFromId, AGENTS, AgentName } from './agents'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
interface RetellCall {
  call_id: string; agent_id: string; direction?: string
  from_number?: string; to_number?: string
  start_timestamp?: number; end_timestamp?: number; duration_ms?: number
  disconnection_reason?: string; transcript?: string
  transcript_object?: Array<{ role: string; content: string }>
  metadata?: Record<string, string>
}
export async function processCallEnded(call: RetellCall): Promise<void> {
  const rid = call.call_id
  const { data: existing } = await supabase.from('check_in_calls').select('id,processed_at').eq('retell_call_id', rid).maybeSingle()
  if (existing?.processed_at) { console.log('[Retell] already processed', rid); return }
  const agentName: AgentName = agentNameFromId(call.agent_id) ?? 'aria'
  const agentDef = AGENTS[agentName]
  const direction = call.direction ?? agentDef.direction
  let memberId: string | null = call.metadata?.member_id ?? null
  let callerRole = 'unknown'
  let familyMemberId: string | null = null
  if (!memberId && direction === 'inbound' && call.from_number) {
    const e164 = normalisePhone(call.from_number)
    const { data: mem } = await supabase.from('members').select('id').eq('phone_number', e164).maybeSingle()
    if (mem) { memberId = mem.id; callerRole = 'member' }
    else {
      const { data: fam } = await supabase.from('family_members').select('id').eq('phone', e164).maybeSingle()
      if (fam) { familyMemberId = fam.id; callerRole = 'family' }
    }
  } else if (memberId) callerRole = 'member'
  const isMissed = ['dial_no_answer','dial_busy','voicemail_reached'].includes(call.disconnection_reason ?? '')
  const callStatus = isMissed ? 'missed' : 'completed'
  const callType = call.metadata?.call_type ?? agentDef.defaultCallType
  const durSecs = call.duration_ms ? Math.round(call.duration_ms / 1000) : null
  if (memberId) {
    await supabase.from('check_in_calls').upsert({
      member_id: memberId, retell_call_id: rid, agent_id: call.agent_id,
      agent_name: agentName, direction, from_number: call.from_number ?? null,
      to_number: call.to_number ?? null, call_type: callType, status: callStatus,
      duration_seconds: durSecs, transcript: call.transcript ?? null,
      started_at: call.start_timestamp ? new Date(call.start_timestamp).toISOString() : null,
      ended_at: call.end_timestamp ? new Date(call.end_timestamp).toISOString() : null,
      caller_role: callerRole,
    }, { onConflict: 'retell_call_id' }).catch(console.error)
  } else {
    await supabase.from('inbound_call_log').upsert({
      retell_call_id: rid, agent_name: agentName, from_number: call.from_number ?? null,
      caller_role: callerRole, family_member_id: familyMemberId,
      duration_seconds: durSecs, transcript: call.transcript ?? null,
      needs_followup: agentName === 'hope',
    }, { onConflict: 'retell_call_id' }).catch(console.error)
    if (agentName === 'hope') {
      await supabase.from('navigator_tasks').insert({ task_type:'crisis_followup', priority:'critical', status:'pending',
        description:'Hope crisis-line call from unknown caller — human follow-up required', member_id: null }).catch(console.error)
    }
    await markProcessed(rid, null); return
  }
  const { data: callRow } = await supabase.from('check_in_calls').select('id').eq('retell_call_id', rid).maybeSingle()
  const callId = callRow?.id ?? null
  if (agentDef.crisisScan && memberId) {
    try { await runCrisisScan({ memberId, callId, agentName, transcript: call.transcript ?? '' }) }
    catch { await supabase.from('navigator_tasks').insert({ task_type:'crisis_review', priority:'critical', status:'pending',
      description:`Crisis detection failed for call ${rid} — manual review required`, member_id: memberId }).catch(console.error) }
  }
  const summary = await generateSummary(call.transcript ?? '')
  const scores = extractScores(call.transcript_object ?? [])
  if (callId) {
    await supabase.from('check_in_calls').update({
      ai_summary: summary, mood_score: scores.mood,
      energy_score: scores.energy, pain_score: scores.pain, medication_taken: scores.medication,
    }).eq('id', callId).catch(console.error)
  }
  if (memberId && ['aria','joy','grace'].includes(agentName)) {
    await supabase.from('members').update({ last_aria_call_at: new Date().toISOString() }).eq('id', memberId).catch(console.error)
  }
  if (memberId && agentName === 'aria' && durSecs && durSecs > 60) {
    await supabase.from('members').update({ onboarding_call_completed: true }).eq('id', memberId).catch(console.error)
  }
  if (memberId && summary) {
    const { data: mem } = await supabase.from('members').select('family_can_see_call_summaries').eq('id', memberId).maybeSingle()
    if (mem?.family_can_see_call_summaries) {
      await supabase.from('notifications').insert({ member_id: memberId, type:'call_summary',
        title:'New call summary available', body: summary.substring(0, 200) }).catch(console.error)
    }
  }
  await markProcessed(rid, callId)
}
function normalisePhone(p: string): string {
  const d = p.replace(/\D/g,'')
  if (d.length === 10) return `+1${d}`
  if (d.length === 11 && d.startsWith('1')) return `+${d}`
  return `+${d}`
}
async function markProcessed(rid: string, callId: string | null) {
  if (callId) await supabase.from('check_in_calls').update({ processed_at: new Date().toISOString() }).eq('id', callId).catch(console.error)
}
async function runCrisisScan({ memberId, callId, agentName, transcript }: { memberId:string; callId:string|null; agentName:AgentName; transcript:string }) {
  if (agentName === 'hope') {
    await supabase.from('navigator_tasks').insert({ task_type:'crisis_followup', priority:'critical', status:'pending',
      description:'Hope crisis-line call — human follow-up required', member_id: memberId }).catch(console.error)
  }
  const phrases = ["don't want to be here","want to die","end my life","kill myself","no reason to live","can't go on","want it to be over"]
  if (phrases.some(p => transcript.toLowerCase().includes(p))) {
    await supabase.from('emergency_log').insert({ member_id: memberId, call_id: callId,
      trigger:'crisis_phrase', description:'Crisis phrase detected in transcript', severity:'critical' }).catch(console.error)
    await supabase.from('navigator_tasks').insert({ task_type:'crisis_alert', priority:'critical', status:'pending',
      description:'Crisis phrase detected in call — immediate follow-up required', member_id: memberId }).catch(console.error)
  }
}
async function generateSummary(transcript: string): Promise<string> {
  if (!transcript) return ''
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return '[Summary unavailable — ANTHROPIC_API_KEY not set]'
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers: { 'x-api-key':key, 'anthropic-version':'2023-06-01', 'content-type':'application/json' },
      body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:300, messages:[{
        role:'user', content:`Summarise this care call in 2-3 sentences for a family member. Focus on how the person seemed and any needs. Do NOT include the transcript.\n\n${transcript.substring(0,3000)}`
      }]})
    })
    const d = await res.json()
    return d?.content?.[0]?.text ?? ''
  } catch { return '[Summary generation failed]' }
}
function extractScores(to: Array<{ role:string; content:string }>) {
  const t = to.filter(x => x.role==='user').map(x => x.content).join(' ').toLowerCase()
  const mood = score(t,['great','wonderful','happy','good'],['sad','upset','terrible','awful'])
  const energy = score(t,['energetic','active'],['tired','exhausted','weak'])
  const pain = scorePain(t)
  const medication = /took.*med|medication.*taken|yes.*pill/.test(t)
  return { mood, energy, pain, medication }
}
function score(t:string,pos:string[],neg:string[]): number|null {
  const p=pos.filter(w=>t.includes(w)).length, n=neg.filter(w=>t.includes(w)).length
  return p+n===0 ? null : Math.min(10,Math.max(0,5+p*2-n*2))
}
function scorePain(t:string): number|null {
  if (/no pain|pain free/.test(t)) return 0
  const m=t.match(/pain.*(\d+)|(\d+).*pain/); if(m) return Math.min(10,parseInt(m[1]??m[2]))
  if (/lot of pain|severe/.test(t)) return 8
  if (/some pain|little pain/.test(t)) return 3
  return null
}
