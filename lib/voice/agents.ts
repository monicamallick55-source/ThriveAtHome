// Single source of truth for the 12 Retell voice agents.
// Phone setup: one inbound number, answered by Quinn, who uses Retell Agent Transfer to hand
// calls to Rosa, Hope, Claire, Sam, Morgan, Alex or Jordan (same call_id; only Quinn's webhook
// fires — see transfers.ts). One outbound number, shared by Aria, Joy and Grace.
// Nova is not reachable from the public number.
// Each agent's Retell agent_id comes from its own env var; nothing else in the app
// should read RETELL_*_AGENT_ID directly.
import { envKey } from '../env'

export type AgentName =
  | 'aria' | 'rosa' | 'joy' | 'grace' | 'hope' | 'claire'
  | 'sam' | 'morgan' | 'nova' | 'alex' | 'quinn' | 'jordan'

export type AgentCallType =
  | 'check_in' | 'onboarding' | 'celebration' | 'reminder' | 'crisis' | 'care_line' | 'concierge' | 'navigator'

export type AgentCaller = 'member' | 'family' | 'volunteer' | 'buddy' | 'staff' | 'partner' | 'any'

export interface AgentDef {
  name: AgentName
  label: string
  envVar: string
  direction: 'inbound' | 'outbound'
  defaultCallType: AgentCallType
  expectedCaller: AgentCaller
}

export const AGENTS: Record<AgentName, AgentDef> = {
  aria:   { name: 'aria',   label: 'Aria',   envVar: 'RETELL_AGENT_ID',        direction: 'outbound', defaultCallType: 'check_in',    expectedCaller: 'member' },
  rosa:   { name: 'rosa',   label: 'Rosa',   envVar: 'RETELL_ROSA_AGENT_ID',   direction: 'inbound',  defaultCallType: 'care_line',   expectedCaller: 'member' },
  joy:    { name: 'joy',    label: 'Joy',    envVar: 'RETELL_JOY_AGENT_ID',    direction: 'outbound', defaultCallType: 'celebration', expectedCaller: 'member' },
  grace:  { name: 'grace',  label: 'Grace',  envVar: 'RETELL_GRACE_AGENT_ID',  direction: 'outbound', defaultCallType: 'reminder',    expectedCaller: 'member' },
  // Hope always escalates to a human, even with no crisis phrase, including when Quinn
  // transferred the call to her (see processCallEnded)
  hope:   { name: 'hope',   label: 'Hope',   envVar: 'RETELL_HOPE_AGENT_ID',   direction: 'inbound',  defaultCallType: 'crisis',      expectedCaller: 'any' },
  claire: { name: 'claire', label: 'Claire', envVar: 'RETELL_CLAIRE_AGENT_ID', direction: 'inbound',  defaultCallType: 'concierge',   expectedCaller: 'family' },
  sam:    { name: 'sam',    label: 'Sam',    envVar: 'RETELL_SAM_AGENT_ID',    direction: 'inbound',  defaultCallType: 'concierge',   expectedCaller: 'volunteer' },
  morgan: { name: 'morgan', label: 'Morgan', envVar: 'RETELL_MORGAN_AGENT_ID', direction: 'inbound',  defaultCallType: 'concierge',   expectedCaller: 'buddy' },
  nova:   { name: 'nova',   label: 'Nova',   envVar: 'RETELL_NOVA_AGENT_ID',   direction: 'inbound',  defaultCallType: 'navigator',   expectedCaller: 'staff' },
  alex:   { name: 'alex',   label: 'Alex',   envVar: 'RETELL_ALEX_AGENT_ID',   direction: 'inbound',  defaultCallType: 'navigator',   expectedCaller: 'staff' },
  quinn:  { name: 'quinn',  label: 'Quinn',  envVar: 'RETELL_QUINN_AGENT_ID',  direction: 'inbound',  defaultCallType: 'concierge',   expectedCaller: 'any' },
  jordan: { name: 'jordan', label: 'Jordan', envVar: 'RETELL_JORDAN_AGENT_ID', direction: 'inbound',  defaultCallType: 'concierge',   expectedCaller: 'partner' },
}

export const AGENT_NAMES = Object.keys(AGENTS) as AgentName[]

/** The Retell agent_id for an agent, or null when its env var is unset. */
export function agentIdFor(name: AgentName): string | null {
  return envKey(AGENTS[name].envVar)
}

/** Reverse lookup: which of our agents a Retell agent_id belongs to. */
export function agentNameFromId(agentId: string | null | undefined): AgentName | null {
  if (!agentId) return null
  for (const name of AGENT_NAMES) {
    if (agentIdFor(name) === agentId) return name
  }
  return null
}
