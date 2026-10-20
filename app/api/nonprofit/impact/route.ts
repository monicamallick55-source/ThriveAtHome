// app/api/nonprofit/impact/route.ts
// GET /api/nonprofit/impact?org_id=<uuid>&from=<YYYY-MM-DD>&to=<YYYY-MM-DD>
// Returns an impact report for the given nonprofit org and date range

import { NextRequest, NextResponse } from 'next/server'
import { getNonprofitImpactReport } from '@/lib/nonprofit/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('org_id')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
    }

    // Default to current month if not specified
    const now = new Date()
    const periodStart = from ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const periodEnd = to ?? now.toISOString()

    const report = await getNonprofitImpactReport(orgId, periodStart, periodEnd)
    if (!report) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
