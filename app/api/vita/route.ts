// VITA / TCE — list free tax-prep sites (Phase 99, M24).
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getVitaSites } from '@/lib/data/vita'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const state = req.nextUrl.searchParams.get('state') ?? undefined
  const { data, error } = await getVitaSites(state)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ sites: data ?? [] })
}
