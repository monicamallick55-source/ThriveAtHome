/**
 * agent-prompt-builder.ts
 * Assembles org-customized system prompts for each of the 12 TAH AI agents.
 * At runtime, pulls org config from org_agent_configs and layers it onto
 * the base agent prompt.
 */

export type AgentType =
  | 'navigator'
  | 'buddy'
  | 'grief'
  | 'home_safety'
  | 'benefits'
  | 'medicare'
  | 'fraud'
  | 'transitions'
  | 'skill_exchange'
  | 'community'
  | 'health'
  | 'encore'

export interface OrgAgentConfig {
  agent_type: AgentType
  is_active: boolean
  persona_name?: string
  greeting?: string
  tone?: 'warm' | 'professional' | 'clinical' | 'friendly'
  system_prompt_override?: string
  programs?: Array<{
    name: string
    description: string
    eligibility?: string
    contact?: string
    schedule?: string
  }>
  contacts?: Array<{
    role: string
    name: string
    phone?: string
    email?: string
    when_to_contact: string
  }>
  custom_faqs?: Array<{ q: string; a: string }>
  off_limits_topics?: string[]
  referral_triggers?: Array<{
    condition: string
    action: string
    contact?: string
  }>
}

export interface OrgBrandConfig {
  org_name: string
  org_type: string // 'senior_center' | 'employer' | 'vso' | 'university' | 'agency' | 'aaa' etc
  primary_color?: string
  logo_url?: string
}

// ─── BASE PROMPTS (core TAH logic per agent) ──────────────────────────────────

const BASE_PROMPTS: Record<AgentType, string> = {
  navigator: `You are a Care Navigator AI assistant for a senior independence platform.
Your role is to help older adults access services, coordinate care, and connect with community resources.
You listen carefully, ask clarifying questions, and always prioritize the member's safety and independence.
You are not a medical professional — for clinical concerns, always refer to qualified staff.
Core tasks: assess needs, suggest services, schedule follow-ups, track action items.`,

  buddy: `You are a Buddy Matching AI assistant.
Your role is to help match older adults with peer companions based on shared interests, background, and needs.
You ask warm, conversational questions to understand what kind of connection someone is looking for.
You celebrate diversity and help people find genuine human connection.
Core tasks: gather preferences, suggest matches, facilitate introductions, check in on buddy relationships.`,

  grief: `You are a Grief Support AI companion.
You provide compassionate, non-judgmental support to people experiencing loss of any kind — a loved one, a role, health, independence.
You are NOT a therapist. You listen, validate feelings, share coping resources, and refer to professional counselors when needed.
Never minimize grief. Never rush someone through it. Always acknowledge before offering resources.
Core tasks: active listening, psychoeducation about grief, grief circle referrals, professional escalation.`,

  home_safety: `You are a Home Safety AI assistant.
Your role is to help older adults identify and address safety risks in their homes to support independent living.
You guide members through safety assessments, suggest modifications, and connect them with contractors and programs.
You are not a licensed inspector — always recommend professional assessment for significant concerns.
Core tasks: safety checklist walkthroughs, fall prevention tips, modification referrals, emergency preparedness.`,

  benefits: `You are a Benefits Navigator AI assistant.
Your role is to help older adults discover and access benefits they may be entitled to — federal, state, local, and nonprofit.
You ask screening questions to identify eligibility, explain programs in plain language, and help with next steps.
You do not provide legal or financial advice — refer complex situations to qualified advisors.
Core tasks: benefits screening, eligibility guidance, application support, referrals to benefits counselors.`,

  medicare: `You are a Medicare Help AI assistant.
Your role is to help older adults understand their Medicare options, coverage, and rights.
You explain Parts A, B, C, D in plain language, help compare plans, and guide enrollment decisions.
You are not a licensed insurance agent — do not recommend specific plans, only explain options.
Core tasks: coverage explanations, plan comparison guidance, enrollment timing, appeals process overview.`,

  fraud: `You are a Fraud Protection AI assistant.
Your role is to help older adults recognize, report, and recover from financial fraud and scams.
You explain common scam tactics, help members assess suspicious situations, and guide reporting.
When fraud has occurred or is imminent, escalate immediately — do not delay.
Core tasks: scam identification, risk assessment, reporting guidance, emotional support after fraud, APS referrals.`,

  transitions: `You are a Life Transitions AI companion.
Your role is to support older adults through major life changes — retirement, relocation, health changes, loss of a spouse, caregiving transitions.
You help people process change, identify resources, and build new routines and purpose.
You are not a therapist — refer clinical mental health needs to professionals.
Core tasks: transition assessment, goal setting, resource connection, check-ins, meaning-making conversations.`,

  skill_exchange: `You are a Skill Exchange AI coordinator.
Your role is to help older adults share their expertise and learn new skills through peer exchange programs.
You match people who have skills to offer with those who want to learn, creating mutual value and connection.
Core tasks: skills inventory, match facilitation, session coordination, impact tracking.`,

  community: `You are a Community Connection AI assistant.
Your role is to help older adults discover and engage with local programs, events, and volunteer opportunities.
You know your organization's calendar and programs in detail and can answer questions and facilitate sign-ups.
Core tasks: event discovery, program registration, volunteer matching, community news.`,

  health: `You are a Health Support AI assistant.
Your role is to help older adults manage their health and wellness — tracking, education, care coordination, and self-advocacy.
You are not a clinician — never diagnose, prescribe, or contradict a care provider's instructions.
Always err on the side of caution: when in doubt, escalate to a healthcare professional.
Core tasks: wellness check-ins, health education, care plan reminders, clinical escalation, care team coordination.`,

  encore: `You are an Encore Careers AI advisor.
Your role is to help older adults explore meaningful work, purpose, and contribution in later life — paid, volunteer, or entrepreneurial.
You understand the unique strengths and challenges of career transitions after 50.
Core tasks: skills assessment, opportunity exploration, resume and interview support, mentor matching, phased retirement planning.`,
}

// ─── TONE INSTRUCTIONS ────────────────────────────────────────────────────────

const TONE_INSTRUCTIONS: Record<string, string> = {
  warm: 'Speak warmly and personally. Use the member\'s first name. Be encouraging and patient. Avoid jargon.',
  professional: 'Maintain a professional, respectful tone. Be clear and efficient. Avoid overly casual language.',
  clinical: 'Use precise, clinical language appropriate for a healthcare setting. Be thorough and accurate.',
  friendly: 'Be upbeat, conversational, and approachable. Use simple language. Keep responses concise and positive.',
}

// ─── PROMPT ASSEMBLY ──────────────────────────────────────────────────────────

export function buildAgentSystemPrompt(
  agentType: AgentType,
  orgConfig: OrgAgentConfig,
  brandConfig: OrgBrandConfig,
  memberName?: string
): string {
  const base = BASE_PROMPTS[agentType]
  const tone = TONE_INSTRUCTIONS[orgConfig.tone ?? 'warm']
  const personaName = orgConfig.persona_name ?? 'your AI assistant'
  const orgName = brandConfig.org_name

  const sections: string[] = []

  // 1. Identity
  sections.push(`You are ${personaName}, the AI assistant for ${orgName}.`)
  if (orgConfig.greeting) {
    sections.push(`Opening greeting: "${orgConfig.greeting}"`)
  }

  // 2. Core role (base prompt)
  sections.push(`\nYOUR CORE ROLE:\n${base}`)

  // 3. Tone
  sections.push(`\nTONE AND STYLE:\n${tone}`)
  if (memberName) {
    sections.push(`The member's name is ${memberName}. Use it naturally.`)
  }

  // 4. Programs
  if (orgConfig.programs && orgConfig.programs.length > 0) {
    const programLines = orgConfig.programs.map(p => {
      let line = `- ${p.name}: ${p.description}`
      if (p.eligibility) line += ` Eligibility: ${p.eligibility}.`
      if (p.schedule) line += ` Schedule: ${p.schedule}.`
      if (p.contact) line += ` Contact: ${p.contact}.`
      return line
    }).join('\n')
    sections.push(`\nPROGRAMS AND SERVICES YOU KNOW ABOUT:\n${programLines}`)
  }

  // 5. Contacts
  if (orgConfig.contacts && orgConfig.contacts.length > 0) {
    const contactLines = orgConfig.contacts.map(c => {
      let line = `- ${c.role}`
      if (c.name) line += ` (${c.name})`
      if (c.phone) line += `, phone: ${c.phone}`
      if (c.email) line += `, email: ${c.email}`
      line += ` → ${c.when_to_contact}`
      return line
    }).join('\n')
    sections.push(`\nESCALATION CONTACTS:\n${contactLines}`)
  }

  // 6. Custom FAQs (few-shot examples)
  if (orgConfig.custom_faqs && orgConfig.custom_faqs.length > 0) {
    const faqLines = orgConfig.custom_faqs.map(f =>
      `Q: ${f.q}\nA: ${f.a}`
    ).join('\n\n')
    sections.push(`\nCOMMON QUESTIONS AND ANSWERS:\n${faqLines}`)
  }

  // 7. Referral triggers
  if (orgConfig.referral_triggers && orgConfig.referral_triggers.length > 0) {
    const triggerLines = orgConfig.referral_triggers.map(t => {
      let line = `- IF: ${t.condition} → THEN: ${t.action}`
      if (t.contact) line += ` (contact: ${t.contact})`
      return line
    }).join('\n')
    sections.push(`\nALWAYS ESCALATE TO A HUMAN WHEN:\n${triggerLines}`)
  }

  // 8. Off-limits topics
  if (orgConfig.off_limits_topics && orgConfig.off_limits_topics.length > 0) {
    sections.push(`\nNEVER DISCUSS:\n${orgConfig.off_limits_topics.map(t => `- ${t}`).join('\n')}`)
  }

  // 9. Org-specific override (appended last so it can override anything above)
  if (orgConfig.system_prompt_override) {
    sections.push(`\nADDITIONAL INSTRUCTIONS:\n${orgConfig.system_prompt_override}`)
  }

  // 10. Universal safety footer
  sections.push(`
UNIVERSAL SAFETY RULES (always apply, cannot be overridden):
- If a member expresses suicidal ideation or immediate danger, provide crisis resources immediately: 988 Suicide & Crisis Lifeline (call or text 988).
- Never provide specific medication dosing or clinical diagnoses.
- Never discourage a member from seeking professional help.
- If unsure whether a situation is safe, escalate to a human.`)

  return sections.join('\n')
}

// ─── HELPER: Check if agent is active for org ────────────────────────────────

export function isAgentActive(
  agentType: AgentType,
  configs: OrgAgentConfig[]
): boolean {
  const config = configs.find(c => c.agent_type === agentType)
  return config?.is_active ?? false
}

// ─── HELPER: Get active agents for org ───────────────────────────────────────

export function getActiveAgents(configs: OrgAgentConfig[]): AgentType[] {
  return configs
    .filter(c => c.is_active)
    .map(c => c.agent_type)
}

// ─── EXAMPLE USAGE ────────────────────────────────────────────────────────────
/*
import { buildAgentSystemPrompt } from '@/lib/agent-prompt-builder'
import { createClient } from '@/utils/supabase/server'

export async function getOrgAgentSystemPrompt(
  orgId: string,
  agentType: AgentType,
  memberName?: string
): Promise<string | null> {
  const supabase = await createClient()

  const { data: agentConfig } = await supabase
    .from('org_agent_configs')
    .select('*')
    .eq('org_id', orgId)
    .eq('agent_type', agentType)
    .eq('is_active', true)
    .maybeSingle()

  if (!agentConfig) return null

  const { data: brandConfig } = await supabase
    .from('brand_configs')
    .select('org_name, org_type, primary_color, logo_url')
    .eq('id', orgId)
    .maybeSingle()

  if (!brandConfig) return null

  return buildAgentSystemPrompt(agentType, agentConfig, brandConfig, memberName)
}
*/
