import { NextRequest, NextResponse } from 'next/server'

const PATHWAYS = ['retirement','widow','diagnosis','moving','caregiving','divorce','loss','financial','independence']

export async function GET(
  _req: NextRequest,
  { params }: { params: { pathway: string } }
) {
  const { pathway } = params
  if (!PATHWAYS.includes(pathway)) {
    return NextResponse.json({ error: 'Unknown pathway' }, { status: 404 })
  }
  return NextResponse.json({
    pathway,
    title: pathway.charAt(0).toUpperCase() + pathway.slice(1) + ' Transition',
    resources: [],
    aria_arc: pathway,
    support_groups: [],
    status: 'active'
  })
}
