export type AgentName = 'aria'|'rosa'|'joy'|'grace'|'hope'|'claire'|'sam'|'morgan'|'nova'|'alex'|'quinn'|'jordan'
export type CallType = 'check_in'|'onboarding'|'celebration'|'reminder'|'crisis'|'care_line'|'concierge'|'navigator'|'callback'
export interface AgentDef {
  name: AgentName; label: string; envVar: string
  direction: 'inbound'|'outbound'; defaultCallType: CallType
  expectedCaller: 'member'|'family'|'volunteer'|'buddy'|'staff'|'partner'|'any'
  crisisScan: boolean
}
export const AGENTS: Record<AgentName, AgentDef> = {
  aria:   { name:'aria',   label:'Aria',   envVar:'RETELL_AGENT_ID',          direction:'outbound', defaultCallType:'check_in',   expectedCaller:'member',    crisisScan:true  },
  rosa:   { name:'rosa',   label:'Rosa',   envVar:'RETELL_ROSA_AGENT_ID',     direction:'inbound',  defaultCallType:'care_line',  expectedCaller:'member',    crisisScan:true  },
  joy:    { name:'joy',    label:'Joy',    envVar:'RETELL_JOY_AGENT_ID',      direction:'outbound', defaultCallType:'celebration',expectedCaller:'member',    crisisScan:true  },
  grace:  { name:'grace',  label:'Grace',  envVar:'RETELL_GRACE_AGENT_ID',    direction:'outbound', defaultCallType:'reminder',   expectedCaller:'member',    crisisScan:true  },
  hope:   { name:'hope',   label:'Hope',   envVar:'RETELL_HOPE_AGENT_ID',     direction:'inbound',  defaultCallType:'crisis',     expectedCaller:'any',       crisisScan:true  },
  claire: { name:'claire', label:'Claire', envVar:'RETELL_CLAIRE_AGENT_ID',   direction:'inbound',  defaultCallType:'concierge',  expectedCaller:'family',    crisisScan:false },
  sam:    { name:'sam',    label:'Sam',    envVar:'RETELL_SAM_AGENT_ID',      direction:'inbound',  defaultCallType:'concierge',  expectedCaller:'volunteer', crisisScan:false },
  morgan: { name:'morgan', label:'Morgan', envVar:'RETELL_MORGAN_AGENT_ID',   direction:'inbound',  defaultCallType:'concierge',  expectedCaller:'buddy',     crisisScan:false },
  nova:   { name:'nova',   label:'Nova',   envVar:'RETELL_NOVA_AGENT_ID',     direction:'inbound',  defaultCallType:'navigator',  expectedCaller:'staff',     crisisScan:false },
  alex:   { name:'alex',   label:'Alex',   envVar:'RETELL_ALEX_AGENT_ID',     direction:'inbound',  defaultCallType:'navigator',  expectedCaller:'staff',     crisisScan:false },
  quinn:  { name:'quinn',  label:'Quinn',  envVar:'RETELL_QUINN_AGENT_ID',    direction:'inbound',  defaultCallType:'concierge',  expectedCaller:'any',       crisisScan:true  },
  jordan: { name:'jordan', label:'Jordan', envVar:'RETELL_JORDAN_AGENT_ID',   direction:'inbound',  defaultCallType:'concierge',  expectedCaller:'partner',   crisisScan:false },
}
export function agentIdFor(name: AgentName): string | null {
  const def = AGENTS[name]; if (!def) return null
  return process.env[def.envVar] ?? null
}
export function agentNameFromId(agentId: string | null | undefined): AgentName | null {
  if (!agentId) return null
  for (const [name, def] of Object.entries(AGENTS)) {
    const v = process.env[def.envVar]; if (v && v === agentId) return name as AgentName
  }
  return null
}
export function requireAgentId(name: AgentName): string {
  const id = agentIdFor(name)
  if (!id) throw new Error(`${AGENTS[name].envVar} is not set`)
  return id
}
