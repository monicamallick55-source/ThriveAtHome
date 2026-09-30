// Single source of truth for the 12 Retell voice agents.
// Each agent's Retell agent_id comes from its own env var; nothing else in the app
// should read RETELL_*_AGENT_ID directly.

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
  crisisScan: boolean
}

export const AGENTS: Record<AgentName, AgentDef> = {
  aria:   { name: 'aria',   label: 'Aria',   envVar: 'RETELL_AGENT_ID',        direction: 'outbound', defaultCallType: 'check_in',    expectedCaller: 'member',    crisisScan: true  },
  rosa:   { name: 'rosa',   label: 'Rosa',   envVar: 'RETELL_ROSA_AGENT_ID',   direction: 'inbound',  defaultCallType: 'care_line',   expectedCaller: 'member',    crisisScan: true  },
  joy:    { name: 'joy',    label: 'Joy',    envVar: 'RETELL_JOY_AGENT_ID',    direction: 'outbound', defaultCallType: 'celebration', expectedCaller: 'member',    crisisScan: true  },
  grace:  { name: 'grace',  label: 'Grace',  envVar: 'RETELL_GRACE_AGENT_ID',  direction: 'outbound', defaultCallType: 'reminder',    expectedCaller: 'member',    crisisScan: true  },
  // Hope always escalates to a human, even with no crisis phrase (see processCallEnded)
  hope:   { name: 'hope',   label: 'Hope',   envVar: 'RETELL_HOPE_AGENT_ID',   direction: 'inbound',  defaultCallType: 'crisis',      expectedCaller: 'any',       crisisScan: true  },
  claire: { name: 'claire', label: 'Claire', envVar: 'RETELL_CLAIRE_AGENT_ID', direction: 'inbound',  defaultCallType: 'concierge',   expectedCaller: 'family',    crisisScan: false },
  sam:    { name: 'sam',    label: 'Sam',    envVar: 'RETELL_SAM_AGENT_ID',    direction: 'inbound',  defaultCallType: 'concierge',   expectedCaller: 'volunteer', crisisScan: false },
  morgan: { name: 'morgan', label: 'Morgan', envVar: 'RETELL_MORGAN_AGENT_ID', direction: 'inbound',  defaultCallType: 'concierge',   expectedCaller: 'buddy',     crisisScan: false },
  nova:   { name: 'nova',   label: 'Nova',   envVar: 'RETELL_NOVA_AGENT_ID',   direction: 'inbound',  defaultCallType: 'navigator',   expectedCaller: 'staff',     crisisScan: false },
  alex:   { name: 'alex',   label: 'Alex',   envVar: 'RETELL_ALEX_AGENT_ID',   direction: 'inbound',  defaultCallType: 'navigator',   expectedCaller: 'staff',     crisisScan: false },
  quinn:  { name: 'quinn',  label: 'Quinn',  envVar: 'RETELL_QUINN_AGENT_ID',  direction: 'inbound',  defaultCallType: 'concierge',   expectedCaller: 'any',       crisisScan: true  },
  jordan: { name: 'jordan', label: 'Jordan', envVar: 'RETELL_JORDAN_AGENT_ID', direction: 'inbound',  defaultCallType: 'concierge',   expectedCaller: 'partner',   crisisScan: false },
}

export const AGENT_NAMES = Object.keys(AGENTS) as AgentName[]

/** The Retell agent_id for an agent, or null when its env var is unset. */
export function agentIdFor(name: AgentName): string | null {
  return process.env[AGENTS[name].envVar] || null
}

/** Reverse lookup: which of our agents a Retell agent_id belongs to. */
export function agentNameFromId(agentId: string | null | undefined): AgentName | null {
  if (!agentId) return null
  for (const name of AGENT_NAMES) {
    if (agentIdFor(name) === agentId) return name
  }
  return null
}
