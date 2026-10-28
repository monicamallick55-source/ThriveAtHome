// app/api/webhooks/retell/quinn-onboarding.ts
// Handles Retell tool calls from Quinn during voice onboarding
// Mount at: /api/webhooks/retell/route.ts  (add a case for call_type = 'onboarding')
// OR register as a standalone webhook in Retell dashboard for the onboarding agent

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role — bypasses RLS
)

// ─── Tool call types ────────────────────────────────────────────────────────

type CaptureFieldArgs = {
  session_id: string
  field: string
  value: string | boolean
  name_spelling_confirmed?: boolean
}

type ConfirmSummaryArgs = {
  session_id: string
}

type SubmitFormArgs = {
  session_id: string
}

type FlagErrorArgs = {
  session_id: string
  error_type: 'save_failed' | 'timeout' | 'unclear_input' | 'submit_failed'
  message?: string
}

// ─── Allowed field names that Quinn can write ───────────────────────────────

const ALLOWED_FIELDS = new Set([
  'first_name',
  'last_name',
  'preferred_name',
  'phone',
  'email',
  'dob',
  'address',
  'emergency_contact_name',
  'emergency_contact_phone',
  'medications',
  'conditions',
  'name_spelling_confirmed',
  'retell_call_id',
])

// ─── Tool handlers ──────────────────────────────────────────────────────────

async function handleCaptureField(args: CaptureFieldArgs) {
  const { session_id, field, value, name_spelling_confirmed } = args

  if (!session_id) {
    return { success: false, error: 'Missing session_id' }
  }

  if (!ALLOWED_FIELDS.has(field)) {
    return { success: false, error: `Field '${field}' is not a recognized onboarding field` }
  }

  const update: Record<string, unknown> = { [field]: value }

  // If Quinn is confirming the name spelling, set the flag at the same time
  if (name_spelling_confirmed !== undefined) {
    update.name_spelling_confirmed = name_spelling_confirmed
  }

  const { error } = await supabase
    .from('onboarding_sessions')
    .update(update)
    .eq('session_id', session_id)

  if (error) {
    console.error('[quinn-onboarding] capture_field error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, field, value }
}

async function handleConfirmSummary(args: ConfirmSummaryArgs) {
  const { session_id } = args

  // Fetch current fields to return to Quinn so she can read them back
  const { data, error } = await supabase
    .from('onboarding_sessions')
    .select(
      'first_name, last_name, preferred_name, phone, email, dob, address, emergency_contact_name, emergency_contact_phone'
    )
    .eq('session_id', session_id)
    .single()

  if (error || !data) {
    return { success: false, error: 'Session not found' }
  }

  await supabase
    .from('onboarding_sessions')
    .update({ status: 'pending_confirmation' })
    .eq('session_id', session_id)

  return { success: true, summary: data }
}

async function handleSubmitForm(args: SubmitFormArgs) {
  const { session_id } = args

  // Signal browser to auto-submit — the actual member row creation
  // happens in /api/onboarding/submit (POST) which the browser calls
  const { error } = await supabase
    .from('onboarding_sessions')
    .update({ status: 'ready_to_submit' })
    .eq('session_id', session_id)

  if (error) {
    console.error('[quinn-onboarding] submit_form error:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

async function handleFlagError(args: FlagErrorArgs) {
  const { session_id, error_type, message } = args

  const { error } = await supabase
    .from('onboarding_sessions')
    .update({ status: 'error', error_type })
    .eq('session_id', session_id)

  if (error) {
    console.error('[quinn-onboarding] flag_error update error:', error)
  }

  // Log for support triage
  console.warn(`[quinn-onboarding] Error flagged — session: ${session_id}, type: ${error_type}, msg: ${message ?? 'none'}`)

  return {
    success: true,
    recovery_options: [
      'fill_manually',    // Quinn tells member to type on their screen
      'try_again',        // Quinn offers to start again
      'call_in',          // Quinn gives the signup line number
    ],
  }
}

// ─── Main webhook handler ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Verify Retell webhook signature
  const retellApiKey = process.env.RETELL_API_KEY
  const signature = req.headers.get('x-retell-signature')

  if (retellApiKey && !signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }
  // TODO: verify HMAC signature from Retell if they add it to the SDK

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { tool_call_id, name, arguments: rawArgs } = body as {
    tool_call_id: string
    name: string
    arguments: Record<string, unknown>
  }

  let result: Record<string, unknown>

  switch (name) {
    case 'capture_field':
      result = await handleCaptureField(rawArgs as CaptureFieldArgs)
      break
    case 'confirm_summary':
      result = await handleConfirmSummary(rawArgs as ConfirmSummaryArgs)
      break
    case 'submit_form':
      result = await handleSubmitForm(rawArgs as SubmitFormArgs)
      break
    case 'flag_error':
      result = await handleFlagError(rawArgs as FlagErrorArgs)
      break
    default:
      result = { success: false, error: `Unknown tool: ${name}` }
  }

  // Retell expects: { tool_call_id, content: string }
  return NextResponse.json({
    tool_call_id,
    content: JSON.stringify(result),
  })
}
