// Trusted Advisor Directory — list active advisors (Phase 98, M24).
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getActiveAdvisors } from '@/lib/data/advisors'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const advisorType = searchParams.get('type') ?? undefined
  const state = searchParams.get('state') ?? undefined
  const acceptingOnly = searchParams.get('accepting') === '1'

  const { data, error } = await getActiveAdvisors({ advisorType, state, acceptingOnly })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ advisors: data ?? [] })
}
