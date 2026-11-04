/**
 * lib/geocoding/provider.ts — G4.3 Geocoding Provider
 *
 * Stub implementation using Google Maps Geocoding API.
 * Falls back gracefully when GOOGLE_MAPS_API_KEY is not set.
 *
 * Production: swap the fetch call for a proper Google Maps SDK
 * or a PostGIS-backed service. The interface stays stable.
 */

export type GeocodingResult = {
  lat: number
  lng: number
  formatted_address: string
  confidence: 'high' | 'medium' | 'low'
}

export type GeocodingProvider = {
  geocode(address: string): Promise<GeocodingResult | null>
  reverseGeocode(lat: number, lng: number): Promise<string | null>
  distanceMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number
}

/**
 * Haversine formula — straight-line distance in miles.
 * Good enough for matching within a metro area.
 * Production should use driving distance via Maps API.
 */
export function haversineDistanceMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const aVal =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng * sinDLng
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal))
  return R * c
}

/**
 * Google Maps–backed geocoding provider.
 * When GOOGLE_MAPS_API_KEY is absent, geocode() returns null and
 * the caller should fall back to zip-prefix matching.
 */
export class GoogleGeocodingProvider implements GeocodingProvider {
  private apiKey: string | undefined

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY
  }

  async geocode(address: string): Promise<GeocodingResult | null> {
    if (!this.apiKey) {
      console.warn('[GeocodingProvider] GOOGLE_MAPS_API_KEY not set — geocoding skipped')
      return null
    }

    try {
      const encoded = encodeURIComponent(address)
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${this.apiKey}`
      const res = await fetch(url)
      const json = await res.json()

      if (json.status !== 'OK' || !json.results?.length) return null

      const result = json.results[0]
      const { lat, lng } = result.geometry.location
      const locationType = result.geometry.location_type

      const confidence: GeocodingResult['confidence'] =
        locationType === 'ROOFTOP' ? 'high'
        : locationType === 'RANGE_INTERPOLATED' ? 'medium'
        : 'low'

      return {
        lat,
        lng,
        formatted_address: result.formatted_address,
        confidence,
      }
    } catch (err) {
      console.error('[GeocodingProvider] geocode error:', err)
      return null
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    if (!this.apiKey) return null

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.status !== 'OK' || !json.results?.length) return null
      return json.results[0].formatted_address
    } catch {
      return null
    }
  }

  distanceMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    return haversineDistanceMiles(a, b)
  }
}

// Singleton — reuse across requests (no state; just API key reference)
let _provider: GeocodingProvider | null = null
export function getGeocodingProvider(): GeocodingProvider {
  if (!_provider) _provider = new GoogleGeocodingProvider()
  return _provider
}
