import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}))
  return NextResponse.json({
    id: `app-${Date.now()}`,
    career_id: params.id,
    cover_note: body.cover_note,
    status: "applied",
    created_at: new Date().toISOString(),
  })
}
