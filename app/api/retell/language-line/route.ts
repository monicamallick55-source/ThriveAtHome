/**
 * app/api/retell/language-line/route.ts — G4.8
 *
 * POST /api/retell/language-line
 *   Called by Retell webhook when Grace triggers `transfer_to_interpreter` tool.
 *   Also called at call start to inject dynamic variables for the member's language.
 *
 * Request body (tool call):
 *   { action: 'transfer', language_code: string, member_id?: string, call_id?: string }
 *
 * Request body (dynamic vars injection):
 *   { action: 'dynamic_vars', member_id: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  transferToInterpreter,
  buildLanguageLineDynamicVars,
} from '@/lib/retell/language-line'

export async function POST(req: NextRequest) {
  // Verify Retell secret
  const authHeader = req.headers.get('x-retell-secret')
  const retellSecret = process.env.RETELL_API_KEY
  if (retellSecret && authHeader !== retellSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { action } = body

  if (action === 'dynamic_vars') {
    // Called at call start to get language vars for this member
    const { member_id } = body
    if (!member_id) return NextResponse.json({ error: 'member_id required' }, { status: 400 })

    const supabase = await createClient()
    const { data: member } = await supabase
      .from('members')
      .select('preferred_language')
      .eq('id', member_id)
      .single()

    const vars = buildLanguageLineDynamicVars(member?.preferred_language ?? null)
    return NextResponse.json({ dynamic_variables: vars })
  }

  if (action === 'transfer') {
    const { language_code, member_id, call_id } = body
    if (!language_code) return NextResponse.json({ error: 'language_code required' }, { status: 400 })

    const result = await transferToInterpreter({ language_code, member_id, call_id })
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
