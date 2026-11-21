/**
 * /api/org-admin/agent-configs
 * GET  — list all agent configs for the orgadmin's org
 * POST — create or update an agent config
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getOrgId(supabase: any, userId: string): Promise<string | null> {
  const adminDb = createAdminClient() as any
  const { data: fm } = await adminDb
    .from('family_members')
    .select('org_id, role')
    .eq('supabase_auth_id', userId)
    .maybeSingle()
  if (!fm?.org_id) return null
  if (!['org_admin', 'admin', 'navigator'].includes(fm.role)) return null
  return fm.org_id
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const orgId = await getOrgId(supabase, user.id)
  if (!orgId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const adminDb = createAdminClient() as any
  const { data, error } = await adminDb
    .from('org_agent_configs')
    .select('*')
    .eq('org_id', orgId)
    .order('agent_type')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const orgId = await getOrgId(supabase, user.id)
  if (!orgId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const {
    agent_type, is_active, persona_name, greeting, tone,
    system_prompt_override, programs, contacts, custom_faqs,
    off_limits_topics, referral_triggers,
  } = body

  if (!agent_type) return NextResponse.json({ error: 'agent_type required' }, { status: 400 })

  const validTypes = [
    'navigator','buddy','grief','home_safety','benefits','medicare',
    'fraud','transitions','skill_exchange','community','health','encore'
  ]
  if (!validTypes.includes(agent_type)) {
    return NextResponse.json({ error: `Invalid agent_type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 })
  }

  const adminDb = createAdminClient() as any
  const { data, error } = await adminDb
    .from('org_agent_configs')
    .upsert({
      org_id: orgId,
      agent_type,
      is_active: is_active ?? false,
      persona_name: persona_name ?? null,
      greeting: greeting ?? null,
      tone: tone ?? 'warm',
      system_prompt_override: system_prompt_override ?? null,
      programs: programs ?? [],
      contacts: contacts ?? [],
      custom_faqs: custom_faqs ?? [],
      off_limits_topics: off_limits_topics ?? [],
      referral_triggers: referral_triggers ?? [],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'org_id,agent_type' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
