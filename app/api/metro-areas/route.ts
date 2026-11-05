/**
 * app/api/metro-areas/route.ts — Metro Chapters API
 * TC-CH001, TC-CH002
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const STUB_METROS = [
  { id: 'bay-area', name: 'Bay Area', slug: 'bay-area', zip_prefixes: ['94', '95'] },
  { id: 'la', name: 'Los Angeles', slug: 'los-angeles', zip_prefixes: ['90', '91'] },
  { id: 'nyc', name: 'New York City', slug: 'new-york', zip_prefixes: ['10', '11'] },
  { id: 'chicago', name: 'Chicago', slug: 'chicago', zip_prefixes: ['60'] },
  { id: 'seattle', name: 'Seattle', slug: 'seattle', zip_prefixes: ['98'] },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const zip = searchParams.get('zip')

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('metro_areas').select('*').order('name')
    if (!error && data?.length) {
      if (zip) {
        const prefix2 = zip.slice(0, 2)
        const match = data.find((m: { zip_prefixes?: string[] }) => m.zip_prefixes?.some((p: string) => zip.startsWith(p)))
        return NextResponse.json({ metro: match ?? null, metros: data })
      }
      return NextResponse.json({ metros: data })
    }
  } catch { /* fall through to stub */ }

  if (zip) {
    const prefix2 = zip.slice(0, 2)
    const match = STUB_METROS.find(m => m.zip_prefixes.some(p => zip.startsWith(p)))
    return NextResponse.json({ metro: match ?? null, metros: STUB_METROS, source: 'stub' })
  }
  return NextResponse.json({ metros: STUB_METROS, source: 'stub' })
}
