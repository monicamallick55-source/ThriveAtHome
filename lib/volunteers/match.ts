import type { Volunteer } from '../data/volunteers'
import type { Database } from '../../types/database'
import { getCategoryById } from '../services/serviceTypes'

type Member = Database['public']['Tables']['members']['Row']

export interface MatchResult {
  volunteer: Volunteer
  score: number
  reasons: string[]
}

// Returns true if volunteer's service_types includes this specific sub-type or a parent category visit_type
export function volunteerCanHandleSubtype(volunteer: Volunteer, serviceType: string, subtype?: string): boolean {
  const types = volunteer.service_types as string[]
  if (!types || types.length === 0) return false
  if (subtype && types.includes(subtype)) return true
  const cat = getCategoryById(serviceType)
  if (!cat) return types.includes(serviceType)
  const catVisitTypes = cat.subtypes.map((s: any) => s.visitType).filter(Boolean)
  return types.some((t: any) => catVisitTypes.includes(t) || t === serviceType)
}

export function scoreVolunteerForMember(volunteer: Volunteer, member: Member, serviceType?: string, subtype?: string): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // Sub-type match — highest priority for service requests
  if (serviceType && subtype) {
    if (volunteerCanHandleSubtype(volunteer, serviceType, subtype)) {
      score += 40
      reasons.push('Matches service sub-type')
    }
  } else if (serviceType) {
    if (volunteerCanHandleSubtype(volunteer, serviceType)) {
      score += 30
      reasons.push('Matches service category')
    }
  }

  // Location match
  const volunteerCity = volunteer.city?.trim().toLowerCase()
  const memberAddress = member.address?.trim().toLowerCase()
  if (volunteerCity && memberAddress && memberAddress.includes(volunteerCity)) {
    score += 25
    reasons.push('Same city')
  }

  // Shared interests (max 45 points)
  const memberTopics = member.topics_enjoy ?? []
  const sharedInterests = (volunteer.interests ?? []).filter(i => {
    const normalized = i.toLowerCase().replace(/[^a-z]/g, '')
    return memberTopics.some(t => t.toLowerCase().replace(/[^a-z]/g, '').includes(normalized) || normalized.includes(t.toLowerCase().replace(/[^a-z]/g, '')))
  })
  if (sharedInterests.length > 0) {
    const interestPoints = Math.min(sharedInterests.length * 15, 45)
    score += interestPoints
    reasons.push(`${sharedInterests.length} shared interest${sharedInterests.length > 1 ? 's' : ''}`)
  }

  // Language match (if member non-English primary)
  const memberLang = member.preferred_language?.toLowerCase()
  if (memberLang && memberLang !== 'english') {
    const volLangs = (volunteer.languages ?? []).map((l: any) => l.toLowerCase())
    if (volLangs.some(l => l.includes(memberLang) || memberLang.includes(l))) {
      score += 20
      reasons.push(`Speaks ${member.preferred_language}`)
    }
  }

  // Veteran match — veteran volunteers score higher for veteran members
  if ((volunteer.interests ?? []).includes('veteran') && memberTopics.some(t => t.toLowerCase().includes('veteran'))) {
    score += 20
    reasons.push('Veteran-to-veteran connection')
  }

  // M21: Zip code match for neighbor volunteers (+30 pts — stronger than city alone)
  const volZip = (volunteer as Volunteer & { zip_code?: string | null }).zip_code
  const memberZip = (member as Member & { zip_code?: string | null }).zip_code
  if (volZip && memberZip && volZip === memberZip) {
    score += 30
    reasons.push('Same zip code — neighbor volunteer')
  }

  // M21: Faith match for chaplain volunteers
  const volFaith = (volunteer as Volunteer & { faith_affiliation?: string | null }).faith_affiliation
  const memberFaith = (member as Member & { faith_preference?: string | null }).faith_preference
  if (volFaith && memberFaith && volFaith === memberFaith) {
    score += 25
    reasons.push(`Shared faith tradition (${volFaith})`)
  }

  // Availability (has hours)
  if (volunteer.hours_per_week && volunteer.hours_per_week !== '0') {
    score += 10
    reasons.push('Available hours')
  }

  return { score, reasons }
}

export function getTopVolunteerMatchesFromList(
  volunteers: Volunteer[],
  member: Member,
  topN = 3
): MatchResult[] {
  const scored = volunteers
    .filter(v => v.status === 'active')
    .map((v: any) => {
      const { score, reasons } = scoreVolunteerForMember(v, member)
      return { volunteer: v, score, reasons }
    })
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, topN)
}
