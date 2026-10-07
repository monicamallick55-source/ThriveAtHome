// Retell Agent Transfer detection. Every inbound call is answered by Quinn, who hands it to
// another agent with an Agent Transfer (agent swap) tool. The call keeps its call_id and only
// Quinn's webhook fires, so call.agent_id is Quinn — the other agents are only visible in
// transcript_with_tool_calls.
//
// A transfer is recognised from, in order:
//   1. any string in the tool call's arguments (or its result) that is one of our agent_ids
//   2. a tool name or flow node name that says transfer/swap/handoff and names an agent,
//      e.g. `transfer_to_rosa`, `swap_to_hope`, node "Transfer to Claire"
//   3. a transcript event whose role is itself a transfer/swap event (role contains
//      "swap" or "agent_transfer"), read the same way as a tool call
// Tool calls whose result came back `successful: false` are ignored.
import { AGENT_NAMES, agentNameFromId, type AgentName } from './agents'

export interface RetellTranscriptEvent {
  role: string
  content?: string
  name?: string
  arguments?: string
  tool_call_id?: string
  successful?: boolean
  new_node_name?: string
  [key: string]: unknown
}

const TRANSFER_WORD = /transfer|swap|handoff|hand_off|hand off|connect|route/i
const AGENT_SET = new Set<string>(AGENT_NAMES)

/** Agent named by an agent_id anywhere in a value (string, JSON string, object or array). */
function agentFromIds(value: unknown, depth = 0): AgentName | null {
  if (depth > 3 || value == null) return null
  if (typeof value === 'string') {
    const direct = agentNameFromId(value.trim())
    if (direct) return direct
    if (depth === 0 && /^[[{]/.test(value.trim())) {
      try { return agentFromIds(JSON.parse(value), depth + 1) } catch { return null }
    }
    return null
  }
  if (Array.isArray(value)) {
    for (const v of value) { const a = agentFromIds(v, depth + 1); if (a) return a }
    return null
  }
  if (typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) { const a = agentFromIds(v, depth + 1); if (a) return a }
  }
  return null
}

/** `transfer_to_rosa`, `swapToHope`, "Transfer to Claire" → that agent. Requires a transfer word. */
function agentFromLabel(label: string | undefined): AgentName | null {
  if (!label || !TRANSFER_WORD.test(label)) return null
  const tokens = label.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z]+/)
  const hits = tokens.filter(t => AGENT_SET.has(t)) as AgentName[]
  return hits.length > 0 ? hits[hits.length - 1] : null
}

function targetOf(ev: RetellTranscriptEvent): AgentName | null {
  if (ev.role === 'tool_call_invocation') {
    return agentFromIds(ev.arguments) ?? agentFromLabel(ev.name)
  }
  if (ev.role === 'node_transition') {
    return agentFromLabel(ev.new_node_name)
  }
  if (/swap|agent_transfer/i.test(ev.role)) {
    return agentFromIds(ev) ?? agentFromLabel(ev.name) ?? agentFromLabel(ev.content)
  }
  return null
}

/**
 * Every agent on the call, in order, starting with the agent whose webhook fired.
 * Consecutive repeats are collapsed (Quinn → Rosa → Rosa = [quinn, rosa]).
 */
export function detectAgentsInvolved(first: AgentName, events: RetellTranscriptEvent[] | null | undefined): AgentName[] {
  const agents: AgentName[] = [first]
  if (!Array.isArray(events)) return agents

  const failed = new Set(
    events.filter(e => e.role === 'tool_call_result' && e.successful === false && e.tool_call_id).map((e: any) => e.tool_call_id),
  )
  // Results can carry the destination agent_id when the invocation doesn't
  const resultTargets = new Map<string, AgentName>()
  for (const e of events) {
    if (e.role === 'tool_call_result' && e.tool_call_id && e.successful !== false) {
      const a = agentFromIds(e.content)
      if (a) resultTargets.set(e.tool_call_id, a)
    }
  }

  for (const ev of events) {
    if (!ev || typeof ev.role !== 'string') continue
    if (ev.role === 'tool_call_invocation' && ev.tool_call_id && failed.has(ev.tool_call_id)) continue
    const target = targetOf(ev) ?? (ev.role === 'tool_call_invocation' && ev.tool_call_id ? resultTargets.get(ev.tool_call_id) ?? null : null)
    if (target && target !== agents[agents.length - 1]) agents.push(target)
  }
  return agents
}
