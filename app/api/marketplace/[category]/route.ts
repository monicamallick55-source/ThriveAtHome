import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
const CATEGORIES = ['transport','home-services','meals','health','legal-financial','tech-help','companionship']
export async function GET(_req: NextRequest, { params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  if (!CATEGORIES.includes(category)) return NextResponse.json({ error: 'Unknown category' }, { status: 404 })
  return NextResponse.json({ category, providers: [], total: 0 })
}
