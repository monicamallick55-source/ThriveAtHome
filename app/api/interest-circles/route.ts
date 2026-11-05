/**
 * app/api/interest-circles/route.ts — Interest Circles (alias for communities)
 * TC-MBA007
 */
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Delegate to /api/communities
  const url = new URL(req.url)
  const target = new URL('/api/communities', url.origin)
  url.searchParams.forEach((v, k) => target.searchParams.set(k, v))

  try {
    const res = await fetch(target.toString(), { headers: req.headers })
    const data = await res.json()
    return NextResponse.json({ interest_circles: data.circles ?? data.communities ?? [], ...data })
  } catch {
    return NextResponse.json({ interest_circles: [] })
  }
}
