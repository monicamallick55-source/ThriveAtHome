import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const zip = searchParams.get('zip')
  return NextResponse.json([
    { id: 'ben-1', name: 'Senior Transportation Assistance', category: 'transportation', zip_codes: ['94102'], description: 'Free rides for seniors 65+' },
    { id: 'ben-2', name: 'Meals on Wheels', category: 'nutrition', zip_codes: ['94102'], description: 'Home-delivered meals' },
  ].filter(b => !category || b.category === category))
}
