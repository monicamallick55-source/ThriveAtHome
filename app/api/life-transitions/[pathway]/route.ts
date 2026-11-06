import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

const VALID_PATHWAYS = ['retirement', 'widow', 'diagnosis', 'moving', 'caregiving', 'divorce', 'loss', 'financial', 'independence']

export async function GET(req: NextRequest, { params }: { params: { pathway: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pathway } = params
  if (!VALID_PATHWAYS.includes(pathway)) {
    return NextResponse.json({ error: 'Unknown pathway' }, { status: 404 })
  }

  return NextResponse.json({
    pathway,
    resources: [],
    tasks: [],
    navigatorActions: [],
  })
}
