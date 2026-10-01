// Retell custom-function endpoint for 'create_service_request'. Logic lives in lib/voice/tools;
// the webhook calls the same function directly. Requires a valid x-retell-signature.
import { NextRequest } from 'next/server'
import { TOOLS } from '@/lib/voice/tools'
import { handleToolRequest } from '@/lib/voice/tools/http'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  return handleToolRequest(req, TOOLS.create_service_request, 'service-request')
}
