/**
 * /api/org-admin/agent-preview
 * GET  — returns the assembled system prompt for a given agent_type
 * POST — test chat with the configured agent
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { buildAgentSystemPrompt, AgentType } from '@/lib/agent-prompt-builder'

async function getOrgAndConfig(userId: string, agentType: string) {
  const adminDb = createAdminClient() as any

  const { data: fm } = await adminDb
    .from('family_members')
    .select('org_id, role')
    .eq('supabase_auth_id', userId)
    .maybeSingle()
  if (!fm?.org_id) return null
  if (!['org_admin', 'admin', 'navigator'].includes(fm.role)) return null

  const { data: brandConfig } = await adminDb
    .from('brand_configs')
    .select('id, org_name, org_type, primary_color, logo_url')
    .eq('id', fm.org_id)
    .maybeSingle()
  if (!brandConfig) return null

  const { data: agentConfig } = await adminDb
    .from('org_agent_configs')
    .select('*')
    .eq('org_id', fm.org_id)
    .eq('agent_type', agentType)
    .maybeSingle()

  return { brandConfig, agentConfig, orgId: fm.org_id }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const agentType = req.nextUrl.searchParams.get('agent_type')
  if (!agentType) return NextResponse.json({ error: 'agent_type param required' }, { status: 400 })

  const result = await getOrgAndConfig(user.id, agentType)
  if (!result) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { brandConfig, agentConfig } = result

  // Use existing config or defaults for preview
  const config = agentConfig ?? {
    agent_type: agentType as AgentType,
    is_active: false,
    tone: 'warm' as const,
    programs: [],
    contacts: [],
    custom_faqs: [],
    off_limits_topics: [],
    referral_triggers: [],
  }

  const systemPrompt = buildAgentSystemPrompt(
    agentType as AgentType,
    config,
    brandConfig,
  )

  return NextResponse.json({
    agent_type: agentType,
    org_name: brandConfig.org_name,
    is_configured: !!agentConfig,
    is_active: agentConfig?.is_active ?? false,
    system_prompt: systemPrompt,
    char_count: systemPrompt.length,
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json()
  const { agent_type, message, member_name } = body
  if (!agent_type || !message) {
    return NextResponse.json({ error: 'agent_type and message required' }, { status: 400 })
  }

  const result = await getOrgAndConfig(user.id, agent_type)
  if (!result) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { brandConfig, agentConfig } = result
  const config = agentConfig ?? {
    agent_type: agent_type as AgentType,
    is_active: false,
    tone: 'warm' as const,
    programs: [], contacts: [], custom_faqs: [],
    off_limits_topics: [], referral_triggers: [],
  }

  const systemPrompt = buildAgentSystemPrompt(
    agent_type as AgentType, config, brandConfig, member_name
  )

  // Call OpenAI/Anthropic — use existing AI client pattern from the codebase
  // For now return the assembled prompt so the UI can preview it
  // TODO: wire to actual LLM call once AI client pattern confirmed
  return NextResponse.json({
    agent_type,
    system_prompt_preview: systemPrompt.slice(0, 500) + '...',
    message_received: message,
    response: `[Preview mode] System prompt assembled (${systemPrompt.length} chars). Wire to LLM to get real response.`,
  })
}
