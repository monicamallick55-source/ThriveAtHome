/**
 * app/api/geocode/route.ts — G4.3
 *
 * POST /api/geocode
 *   Geocodes an address and optionally updates a member or volunteer's lat/lng.
 *   Body: { address, entity_type?: 'member' | 'volunteer', entity_id? }
 *
 * GET /api/geocode/distance?lat1=&lng1=&lat2=&lng2=
 *   Returns straight-line distance in miles between two coordinates.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGeocodingProvider } from '@/lib/geocoding/provider'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { address, entity_type, entity_id } = body

  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const provider = getGeocodingProvider()
  const result = await provider.geocode(address)

  if (!result) {
    return NextResponse.json(
      { error: 'Geocoding failed or API key not configured', address },
      { status: 422 }
    )
  }

  // Optionally persist lat/lng on the entity
  if (entity_type && entity_id) {
    const table = entity_type === 'member' ? 'members' : 'volunteers'
    await supabase
      .from(table)
      .update({ lat: result.lat, lng: result.lng, geocoded_at: new Date().toISOString() })
      .eq('id', entity_id)
      .then(({ error: _e }: { error: unknown }) => void _e)
  }

  return NextResponse.json({ result })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat1 = parseFloat(searchParams.get('lat1') ?? '')
  const lng1 = parseFloat(searchParams.get('lng1') ?? '')
  const lat2 = parseFloat(searchParams.get('lat2') ?? '')
  const lng2 = parseFloat(searchParams.get('lng2') ?? '')

  if ([lat1, lng1, lat2, lng2].some(isNaN)) {
    return NextResponse.json({ error: 'lat1, lng1, lat2, lng2 required' }, { status: 400 })
  }

  const provider = getGeocodingProvider()
  const miles = provider.distanceMiles({ lat: lat1, lng: lng1 }, { lat: lat2, lng: lng2 })
  return NextResponse.json({ miles: Math.round(miles * 10) / 10 })
}
