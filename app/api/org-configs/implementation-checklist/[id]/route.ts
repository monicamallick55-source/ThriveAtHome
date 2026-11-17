import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}))
  return NextResponse.json({ id: params.id, status: body.status ?? 'completed' })
}
