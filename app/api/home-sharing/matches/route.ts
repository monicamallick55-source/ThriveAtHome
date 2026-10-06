import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const listingId = searchParams.get('listing_id')
  let query = supabase
    .from('home_sharing_matches')
    .select('*, host_listing:home_sharing_listings!host_listing_id(*), seeker_listing:home_sharing_listings!seeker_listing_id(*)')
    .order('created_at', { ascending: false })
  if (listingId) {
    query = query.or(`host_listing_id.eq.${listingId},seeker_listing_id.eq.${listingId}`)
  }
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()
  const { data, error } = await supabase
    .from('home_sharing_matches')
    .insert(body)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
