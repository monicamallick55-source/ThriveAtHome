import { distanceMiles, type GeoPoint } from '@/lib/geocoding'
export interface VolunteerCandidate {
  id: string; interests?: string[]|null; availability?: string[]|null
  city?: string|null; zip_code?: string|null; lat?: number|null; lng?: number|null
  rating?: number|null; completed_hours?: number|null
}
export interface MatchRequest {
  interests?: string[]; city?: string|null; zip_code?: string|null
  lat?: number|null; lng?: number|null; preferred_day?: string|null
}
export function scoreVolunteer(c: VolunteerCandidate, r: MatchRequest): number {
  let s = 0
  if (r.interests?.length && c.interests?.length)
    s += r.interests.filter(i => c.interests!.includes(i)).length * 20
  if (r.preferred_day && c.availability?.includes(r.preferred_day)) s += 15
  if (r.lat && r.lng && c.lat && c.lng) {
    const d = distanceMiles({lat:r.lat,lng:r.lng},{lat:c.lat,lng:c.lng})
    s += d<=5?30:d<=10?20:d<=20?10:0
  } else if (r.city && c.city && c.city.toLowerCase()===r.city.toLowerCase()) s += 15
  if (c.rating) s += Math.round(c.rating*2)
  if ((c.completed_hours??0)>=100) s+=10; else if ((c.completed_hours??0)>=50) s+=5
  return s
}
export function rankVolunteers(candidates: VolunteerCandidate[], request: MatchRequest) {
  return [...candidates].sort((a,b)=>scoreVolunteer(b,request)-scoreVolunteer(a,request))
}

// Compatibility aliases for existing imports
export const scoreVolunteerForMember = scoreVolunteer

export interface MatchResult {
  volunteer: VolunteerCandidate
  score: number
}

export function getTopVolunteerMatchesFromList(
  candidates: VolunteerCandidate[],
  request: MatchRequest,
  limit = 10
): MatchResult[] {
  return rankVolunteers(candidates, request)
    .slice(0, limit)
    .map(candidate => ({ volunteer: candidate, score: scoreVolunteer(candidate, request) }))
}
