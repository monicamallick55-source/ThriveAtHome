import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const listingType = searchParams.get('type')
  const zip = searchParams.get('zip')
  let query = supabase
    .from('home_sharing_listings')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  if (listingType) query = query.eq('listing_type', listingType)
  if (zip) query = query.eq('zip', zip)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()
  const { data, error } = await supabase
    .from('home_sharing_listings')
    .insert(body)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
