import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({
    program_id: params.id,
    participants: [],
    total_hours: 0,
    tier_counts: { Bronze: 0, Silver: 0, Gold: 0 },
  })
}
