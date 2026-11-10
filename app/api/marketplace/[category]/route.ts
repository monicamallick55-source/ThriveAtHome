import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CATEGORIES: Record<string, { label: string; providers: number }> = {
  transport:        { label: 'Transportation', providers: 12 },
  'home-services':  { label: 'Home Services', providers: 18 },
  meals:            { label: 'Meals & Nutrition', providers: 9 },
  health:           { label: 'Health & Wellness', providers: 15 },
  'legal-financial':{ label: 'Legal & Financial', providers: 7 },
  'tech-help':      { label: 'Tech Help', providers: 11 },
  companionship:    { label: 'Companionship', providers: 6 },
}

export async function GET(req: NextRequest, { params }: { params: { category: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const info = CATEGORIES[params.category]
  if (!info) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

  return NextResponse.json({
    category: params.category,
    label: info.label,
    provider_count: info.providers,
    providers: [],
    locked: false,
    status: 'active',
  })
}
