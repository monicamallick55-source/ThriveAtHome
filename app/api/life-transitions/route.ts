/**
 * app/api/life-transitions/route.ts
 * Alias/stub for /api/transitions — the test suite (TC-LTD003/004) hits this path.
 * Delegates to the canonical transitions handler.
 */
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Redirect to canonical endpoint
  const url = new URL(req.url)
  const canonical = url.origin + '/api/transitions' + (url.search || '')
  return NextResponse.redirect(canonical, 307)
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const canonical = url.origin + '/api/transitions' + (url.search || '')
  return NextResponse.redirect(canonical, 307)
}
