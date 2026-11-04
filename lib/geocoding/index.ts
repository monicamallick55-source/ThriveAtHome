export interface GeoPoint { lat: number; lng: number }
const ZIP_CENTROIDS: Record<string,GeoPoint> = {
  '10001':{lat:40.7484,lng:-73.9967},'90001':{lat:33.9731,lng:-118.2479},
  '60601':{lat:41.8858,lng:-87.6181},'77001':{lat:29.7543,lng:-95.3677},
  '85001':{lat:33.4484,lng:-112.074},'19101':{lat:39.9526,lng:-75.1652},
  '78201':{lat:29.4241,lng:-98.4936},'92101':{lat:32.7157,lng:-117.1611},
  '75201':{lat:32.7767,lng:-96.797},'95101':{lat:37.3382,lng:-121.8863},
  '78701':{lat:30.2672,lng:-97.7431},'94101':{lat:37.7749,lng:-122.4194},
  '98101':{lat:47.6062,lng:-122.3321},'80201':{lat:39.7392,lng:-104.9903},
  '30301':{lat:33.749,lng:-84.388},'02101':{lat:42.3601,lng:-71.0589},
}
function zipFromAddress(a: string) { return a.match(/\b(\d{5})\b/)?.[1] ?? null }
async function geocodeViaApi(address: string): Promise<GeoPoint|null> {
  const key = process.env.GEOCODING_API_KEY
  if (!key) return null
  try {
    const r = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${key}&country=US&limit=1`)
    const d = await r.json()
    const [lng,lat] = d?.features?.[0]?.center ?? []
    if (lat && lng) return { lat, lng }
  } catch {}
  return null
}
export async function geocodeAddress(address: string): Promise<GeoPoint|null> {
  const api = await geocodeViaApi(address)
  if (api) return api
  const zip = zipFromAddress(address)
  return zip && ZIP_CENTROIDS[zip] ? ZIP_CENTROIDS[zip] : null
}
export function distanceMiles(a: GeoPoint, b: GeoPoint): number {
  const R = 3958.8
  const dLat = (b.lat-a.lat)*Math.PI/180
  const dLng = (b.lng-a.lng)*Math.PI/180
  const s = Math.sin(dLat/2)
  const q = Math.sin(dLng/2)
  return Math.round(R*2*Math.asin(Math.sqrt(s*s+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*q*q)))
}
