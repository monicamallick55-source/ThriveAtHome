export type CallDirection = 'inbound' | 'outbound'
export type CallType =
  | 'daily_companion'
  | 'care_line'
  | 'celebration'
  | 'reminder'
  | 'crisis_line'
  | 'family_support'
  | 'volunteer_support'
  | 'buddy_support'
  | 'navigator_assist'
  | 'staff_support'
  | 'concierge'
  | 'partner_support'

export type AgentName =
  | 'aria' | 'rosa' | 'joy' | 'grace' | 'hope' | 'claire'
  | 'sam' | 'morgan' | 'nova' | 'alex' | 'quinn' | 'jordan'

export interface AgentConfig {
  envVar: string
  name: string
  callType: CallType
  direction: CallDirection
  requiresOptIn: boolean
}

export const AGENTS: Record<AgentName, AgentConfig> = {
  aria:   { envVar: 'RETELL_AGENT_ID',        name: 'Aria',   callType: 'daily_companion',   direction: 'outbound', requiresOptIn: true },
  rosa:   { envVar: 'RETELL_ROSA_AGENT_ID',    name: 'Rosa',   callType: 'care_line',         direction: 'inbound',  requiresOptIn: false },
  joy:    { envVar: 'RETELL_JOY_AGENT_ID',     name: 'Joy',    callType: 'celebration',       direction: 'outbound', requiresOptIn: false },
  grace:  { envVar: 'RETELL_GRACE_AGENT_ID',   name: 'Grace',  callType: 'reminder',          direction: 'outbound', requiresOptIn: false },
  hope:   { envVar: 'RETELL_HOPE_AGENT_ID',    name: 'Hope',   callType: 'crisis_line',       direction: 'inbound',  requiresOptIn: false },
  claire: { envVar: 'RETELL_CLAIRE_AGENT_ID',  name: 'Claire', callType: 'family_support',    direction: 'inbound',  requiresOptIn: false },
  sam:    { envVar: 'RETELL_SAM_AGENT_ID',     name: 'Sam',    callType: 'volunteer_support', direction: 'inbound',  requiresOptIn: false },
  morgan: { envVar: 'RETELL_MORGAN_AGENT_ID',  name: 'Morgan', callType: 'buddy_support',     direction: 'inbound',  requiresOptIn: false },
  nova:   { envVar: 'RETELL_NOVA_AGENT_ID',    name: 'Nova',   callType: 'navigator_assist',  direction: 'inbound',  requiresOptIn: false },
  alex:   { envVar: 'RETELL_ALEX_AGENT_ID',    name: 'Alex',   callType: 'staff_support',     direction: 'inbound',  requiresOptIn: false },
  quinn:  { envVar: 'RETELL_QUINN_AGENT_ID',   name: 'Quinn',  callType: 'concierge',         direction: 'inbound',  requiresOptIn: false },
  jordan: { envVar: 'RETELL_JORDAN_AGENT_ID',  name: 'Jordan', callType: 'partner_support',   direction: 'inbound',  requiresOptIn: false },
}

export const AGENT_NAMES = Object.keys(AGENTS) as AgentName[]

/** ID → name reverse lookup (reads live env vars) */
export function agentNameFromId(id: string | null | undefined): AgentName | null {
  if (!id) return null
  for (const [name, cfg] of Object.entries(AGENTS) as [AgentName, AgentConfig][]) {
    if (process.env[cfg.envVar] === id) return name
  }
  return null
}

/** name → agent ID from env */
export function agentIdFor(name: AgentName): string | null {
  const cfg = AGENTS[name]
  if (!cfg) return null
  return process.env[cfg.envVar] ?? null
}
