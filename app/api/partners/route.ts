/**
 * app/api/partners/route.ts — Partner Directory API
 * TC-PD002 (GET /api/partners returns list)
 * TC-PD003 (GET /api/partners?category=health filters by category)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Stub partners for when DB table doesn't exist yet
const STUB_PARTNERS = [
  { id: '1', name: 'ComfortKeepers', category: 'home_care', description: 'In-home personal care', verified: true },
  { id: '2', name: 'SilverRide', category: 'transportation', description: 'Senior transportation services', verified: true },
  { id: '3', name: 'Mom\'s Meals', category: 'nutrition', description: 'Home-delivered nutritious meals', verified: true },
  { id: '4', name: 'BrightSpring Health', category: 'health', description: 'Pharmacy and health services', verified: true },
  { id: '5', name: 'Lyft Senior Rides', category: 'transportation', description: 'On-demand senior rides', verified: false },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')

  try {
    const supabase = await createClient()
    let query = supabase.from('community_partners').select('*').eq('verified', true).order('name')
    if (category) query = query.eq('category', category)
    const { data, error } = await query

    if (error) {
      // Fall back to stub data if table doesn't exist
      const filtered = category
        ? STUB_PARTNERS.filter(p => p.category === category)
        : STUB_PARTNERS
      return NextResponse.json({ partners: filtered, source: 'stub' })
    }
    return NextResponse.json({ partners: data ?? [] })
  } catch {
    const filtered = category
      ? STUB_PARTNERS.filter(p => p.category === category)
      : STUB_PARTNERS
    return NextResponse.json({ partners: filtered, source: 'stub' })
  }
}
