import { NextRequest, NextResponse } from "next/server"
export const dynamic = "force-dynamic"
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({
    share_url: `https://thrive-at-home-pied.vercel.app/campaigns/${params.id}?ref=share`,
    url: `https://thrive-at-home-pied.vercel.app/campaigns/${params.id}?ref=share`,
  })
}
