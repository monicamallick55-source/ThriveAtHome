// Utility: geocode a US zip code to lat/lng using zippopotam.us (free, no key).
// Returns null if the zip is invalid or the request fails.

export async function geocodeZip(
  zip: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const clean = zip.trim().replace(/\D/g, '').slice(0, 5)
    if (clean.length !== 5) return null

    const res = await fetch(`https://api.zippopotam.us/us/${clean}`, {
      next: { revalidate: 86400 }, // cache 24 h — zip coords don't change
    })
    if (!res.ok) return null

    const json = await res.json() as {
      places: Array<{ latitude: string; longitude: string }>
    }
    const place = json.places?.[0]
    if (!place) return null

    return {
      latitude: parseFloat(place.latitude),
      longitude: parseFloat(place.longitude),
    }
  } catch {
    return null
  }
}
