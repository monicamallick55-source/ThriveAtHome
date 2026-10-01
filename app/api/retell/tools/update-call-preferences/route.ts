// Retell custom-function endpoint for 'update_call_preferences'. Logic lives in lib/voice/tools;
// the webhook calls the same function directly. Requires a valid x-retell-signature.
import { NextRequest } from 'next/server'
import { TOOLS } from '@/lib/voice/tools'
import { handleToolRequest } from '@/lib/voice/tools/http'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  return handleToolRequest(req, TOOLS.update_call_preferences, 'update-call-preferences')
}
