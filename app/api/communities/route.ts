/**
 * app/api/communities/route.ts — Interest Circles / Communities API
 * TC-COM002, TC-MBA006
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STUB_CIRCLES = [
  { id: '1', name: 'Book & Reading Club', category: 'culture', member_count: 24, tags: ['reading', 'books'] },
  { id: '2', name: 'Gardening Enthusiasts', category: 'hobbies', member_count: 31, tags: ['gardening'] },
  { id: '3', name: 'Veterans Community', category: 'identity', member_count: 18, tags: ['veterans'] },
  { id: '4', name: 'Music & Arts', category: 'arts', member_count: 27, tags: ['music', 'art'] },
  { id: '5', name: 'Faith & Spirituality', category: 'spiritual', member_count: 22, tags: ['faith'] },
  { id: '6', name: 'LGBTQ+ Seniors', category: 'identity', member_count: 15, tags: ['lgbtq+'] },
  { id: '7', name: 'Cooking & Recipes', category: 'hobbies', member_count: 35, tags: ['cooking'] },
  { id: '8', name: 'Technology Help', category: 'learning', member_count: 20, tags: ['technology'] },
  { id: '9', name: 'Health & Wellness', category: 'health', member_count: 29, tags: ['wellness'] },
  { id: '10', name: 'Professional Identity Circle', category: 'professional', member_count: 16, tags: ['career'] },
  { id: '11', name: 'Travel & Adventure', category: 'hobbies', member_count: 23, tags: ['travel'] },
  { id: '12', name: 'Grandparents Circle', category: 'family', member_count: 38, tags: ['grandparents'] },
  { id: '13', name: 'History Buffs', category: 'learning', member_count: 19, tags: ['history'] },
  { id: '14', name: 'Nature & Birdwatching', category: 'hobbies', member_count: 14, tags: ['nature'] },
  { id: '15', name: 'Life Stories', category: 'culture', member_count: 25, tags: ['stories'] },
  { id: '16', name: 'Mindfulness & Meditation', category: 'health', member_count: 21, tags: ['mindfulness'] },
  { id: '17', name: 'Crafts & DIY', category: 'arts', member_count: 17, tags: ['crafts'] },
  { id: '18', name: 'Movies & TV', category: 'culture', member_count: 32, tags: ['movies'] },
  { id: '19', name: 'Pet Lovers', category: 'hobbies', member_count: 28, tags: ['pets'] },
  { id: '20', name: 'Civic Engagement', category: 'civic', member_count: 12, tags: ['civic'] },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')

  try {
    const supabase = await createClient()
    let query = supabase.from('communities').select('*').order('name')
    if (category) query = query.eq('category', category)
    const { data, error } = await query

    if (error || !data?.length) {
      const filtered = category ? STUB_CIRCLES.filter(c => c.category === category) : STUB_CIRCLES
      return NextResponse.json({ circles: filtered, communities: filtered, source: 'stub' })
    }
    return NextResponse.json({ circles: data, communities: data })
  } catch {
    return NextResponse.json({ circles: STUB_CIRCLES, communities: STUB_CIRCLES, source: 'stub' })
  }
}
