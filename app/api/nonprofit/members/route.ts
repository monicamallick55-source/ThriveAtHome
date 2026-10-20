// app/api/nonprofit/members/route.ts
// GET /api/nonprofit/members?org_id=<uuid>
// Returns sponsored memberships for a given nonprofit org

import { NextRequest, NextResponse } from 'next/server'
import { getSponsoredMembershipsForOrg } from '@/lib/nonprofit/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('org_id')

    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
    }

    const members = await getSponsoredMembershipsForOrg(orgId)
    return NextResponse.json({ members })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
