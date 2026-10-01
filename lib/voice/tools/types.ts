// Shared types for Retell tool functions. Each tool module exports
// `run(args, ctx)` and is called directly by the webhook and by its HTTP route.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { lookupCallerByPhone, type CallerRole } from '../caller'
import { toE164 } from '../phone'

export type ToolArgs = Record<string, unknown>

export interface ToolContext {
  callId?: string | null
  /** call.metadata.member_id — only set on outbound calls */
  memberId?: string | null
  fromNumber?: string | null
  toNumber?: string | null
  direction?: string | null
}

/** The Retell `call` object on a tool request → ToolContext. */
export function toolContextFromCall(call: {
  call_id?: string; from_number?: string | null; to_number?: string | null; direction?: string | null
  metadata?: { member_id?: string } | null
} | null | undefined): ToolContext {
  return {
    callId: call?.call_id ?? null,
    memberId: call?.metadata?.member_id ?? null,
    fromNumber: call?.from_number ?? null,
    toNumber: call?.to_number ?? null,
    direction: call?.direction ?? null,
  }
}

export interface ToolOutcome {
  status: number
  body: { result?: string; error?: string; [key: string]: unknown }
}

// Untyped service-role client: several tool tables (callback_requests, service_bookings,
// emergency_log) are not in types/database.ts yet.
let _admin: SupabaseClient | null = null
export function toolAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _admin
}

export function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

export interface ToolCaller {
  role: CallerRole
  memberId: string | null
  /** Caller's number in E.164, when known */
  phone: string | null
  /** For family callers: the member they are family of */
  familyOfMemberId: string | null
}

/**
 * Who the tool is acting for. member_id from the tool args or call.metadata (outbound calls);
 * otherwise the caller's phone — from_number on inbound calls (every inbound call comes through
 * Quinn), to_number on outbound — looked up exactly as processCallEnded does.
 */
export async function resolveToolCaller(args: ToolArgs, ctx: ToolContext): Promise<ToolCaller> {
  const phoneRaw = ctx.direction === 'outbound' ? ctx.toNumber : ctx.fromNumber
  const phone = toE164(phoneRaw) ?? null
  const explicit = str(args.member_id) ?? ctx.memberId ?? undefined
  if (explicit) return { role: 'member', memberId: explicit, phone, familyOfMemberId: null }
  const match = await lookupCallerByPhone(phoneRaw)
  return { role: match.role, memberId: match.memberId, phone, familyOfMemberId: match.familyOfMemberId ?? null }
}

const PRIORITIES = new Set(['low', 'medium', 'high', 'critical'])

/**
 * Navigator task raised by a tool, so the request reaches a human. Member callers' tasks are
 * attached to the member; anyone else (family, volunteer, staff, unknown) gets their number,
 * role and message on the task — family callers' tasks are also attached to their member.
 */
export async function createToolTask(caller: ToolCaller, opts: {
  taskType: string; heading: string; message: string; priority?: string; callId?: string | null
}): Promise<{ ok: boolean; id: string | null }> {
  const priority = opts.priority && PRIORITIES.has(opts.priority) ? opts.priority : 'medium'
  const who = caller.memberId ? '' : ` — ${caller.role} caller ${caller.phone ?? '(number unknown)'}`
  const { data, error } = await toolAdmin().from('navigator_tasks').insert({
    member_id: caller.memberId ?? caller.familyOfMemberId,
    task_type: opts.taskType,
    priority,
    caller_phone: caller.phone,
    caller_role: caller.role,
    description: `${opts.heading}${who}: "${opts.message}"` + (opts.callId ? ` [call ${opts.callId}]` : ''),
  }).select('id').maybeSingle()
  if (error) console.error(`[Retell Tool] ${opts.taskType} task insert failed:`, error.message)
  return { ok: !error, id: data?.id ?? null }
}
