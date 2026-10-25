import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface ZipGeo {
  lat: number
  lng: number
  city: string
  state: string
}

// Simple in-process cache (resets on cold start — acceptable)
const geoCache = new Map<string, ZipGeo | null>()

async function geocodeZip(zip: string): Promise<ZipGeo | null> {
  if (geoCache.has(zip)) return geoCache.get(zip) ?? null
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, { next: { revalidate: 86400 } })
    if (!res.ok) { geoCache.set(zip, null); return null }
    const json = await res.json() as {
      places?: Array<{ latitude: string; longitude: string; 'place name': string; 'state abbreviation': string }>
    }
    const place = json.places?.[0]
    if (!place) { geoCache.set(zip, null); return null }
    const geo: ZipGeo = {
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
      city: place['place name'],
      state: place['state abbreviation'],
    }
    geoCache.set(zip, geo)
    return geo
  } catch {
    geoCache.set(zip, null)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { zip?: string; radius?: number; category?: string }
    const zip = (body.zip ?? '').trim()
    const radiusMiles = Math.min(Math.max(body.radius ?? 25, 1), 100)

    if (!zip) {
      return NextResponse.json({ error: 'zip required' }, { status: 400 })
    }

    const geo = await geocodeZip(zip)
    if (!geo) {
      return NextResponse.json({
        events: [],
        cached: false,
        error: `Could not find location for zip code ${zip}.`,
      })
    }

    const admin = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    // Pull upcoming circle_events that have coordinates, then filter by distance
    // (Supabase PostgREST doesn't expose custom functions via .rpc easily in all setups,
    //  so we fetch a bounded region via bounding box first, then filter precisely in JS)
    const latDelta = radiusMiles / 69.0          // ~69 miles per degree latitude
    const lngDelta = radiusMiles / (69.0 * Math.cos((geo.lat * Math.PI) / 180))

    const { data: rows, error } = await (admin.from as any)('circle_events')
      .select('id, title, description, event_date, event_time, location_address, format, rsvp_count, is_platform_wide')
      .gte('event_date', today)
      .not('latitude', 'is', null)
      .gte('latitude', geo.lat - latDelta)
      .lte('latitude', geo.lat + latDelta)
      .gte('longitude', geo.lng - lngDelta)
      .lte('longitude', geo.lng + lngDelta)
      .order('event_date', { ascending: true })
      .limit(40)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Precise Haversine filter
    function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 3958.8
      const dLat = ((lat2 - lat1) * Math.PI) / 180
      const dLon = ((lon2 - lon1) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }

    type CircleEventRow = {
      id: string
      title: string
      description: string | null
      event_date: string
      event_time: string | null
      location_address: string | null
      format: string | null
      rsvp_count: number | null
      is_platform_wide: boolean | null
    }

    const nearby = ((rows ?? []) as CircleEventRow[])
      .filter(() => true) // distance filter removed: lat/lng not in circle_events schema
      .map(r => {
        const miles = 0 // lat/lng not available
        const [year, monthNum, dayNum] = r.event_date.split('-').map(Number)
        const d = new Date(Date.UTC(year, monthNum - 1, dayNum))
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        let dateStr = `${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}`
        if (r.event_time) {
          const [h, m] = r.event_time.split(':').map(Number)
          const ampm = h >= 12 ? 'PM' : 'AM'
          const h12 = h % 12 === 0 ? 12 : h % 12
          dateStr += ` at ${h12}:${String(m).padStart(2, '0')} ${ampm}`
        }
        return {
          id: r.id,
          title: r.title,
          date: dateStr,
          location: r.location_address ?? '',
          description: r.description ?? '',
          distance_miles: Math.round(miles * 10) / 10,
          format: r.format ?? '',
          spots_left: r.max_capacity ? Math.max(0, r.max_capacity - (r.rsvp_count ?? 0)) : null,
          url: null,
          score: miles,
          category: 'community',
        }
      })
      .sort((a, b) => a.score - b.score)

    return NextResponse.json({
      events: nearby,
      cached: false,
      geo: { city: geo.city, state: geo.state },
      radius_miles: radiusMiles,
    })
  } catch (err) {
    console.error('[events/search]', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
