import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const LABELS: Record<string,string> = {
  transport: 'Transportation', 'home-services': 'Home Services', meals: 'Meals & Nutrition',
  health: 'Health & Wellness', 'legal-financial': 'Legal & Financial', 'tech-help': 'Tech Help',
  companionship: 'Companionship', fitness: 'Fitness', beauty: 'Beauty & Personal Care'
}
export async function GET(req: NextRequest, { params }: { params: { category: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const cat = params.category
  if (!LABELS[cat]) return NextResponse.json({ error: 'Unknown category' }, { status: 404 })
  return NextResponse.json({ category: cat, label: LABELS[cat], providers: [] })
}
