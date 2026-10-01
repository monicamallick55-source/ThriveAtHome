// Shared types for Retell tool functions. Each tool module exports
// `run(args, ctx)` and is called directly by the webhook and by its HTTP route.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type ToolArgs = Record<string, unknown>

export interface ToolContext {
  callId?: string | null
  memberId?: string | null
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

/** member_id from the tool args, else from the call's metadata. */
export function memberIdFrom(args: ToolArgs, ctx: ToolContext): string | undefined {
  return str(args.member_id) ?? ctx.memberId ?? undefined
}
