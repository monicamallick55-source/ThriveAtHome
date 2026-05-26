import type { Volunteer } from '../data/volunteers'
import type { Database } from '../../types/database'

type Member = Database['public']['Tables']['members']['Row']

export interface MatchResult {
  volunteer: Volunteer
  score: number
  reasons: string[]
}

export function scoreVolunteerForMember(volunteer: Volunteer, member: Member): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // Location match
  const volunteerCity = volunteer.city?.trim().toLowerCase()
  const memberAddress = member.address?.trim().toLowerCase()
  if (volunteerCity && memberAddress && memberAddress.includes(volunteerCity)) {
    score += 25
    reasons.push('Same city')
  }

  // Shared interests (max 45 points)
  const memberTopics = member.topics_enjoy ?? []
  const sharedInterests = volunteer.interests.filter(i => {
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
    const volLangs = volunteer.languages.map(l => l.toLowerCase())
    if (volLangs.some(l => l.includes(memberLang) || memberLang.includes(l))) {
      score += 20
      reasons.push(`Speaks ${member.preferred_language}`)
    }
  }

  // Veteran match — veteran volunteers score higher for veteran members
  if (volunteer.interests.includes('veteran') && memberTopics.some(t => t.toLowerCase().includes('veteran'))) {
    score += 20
    reasons.push('Veteran-to-veteran connection')
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
    .map(v => {
      const { score, reasons } = scoreVolunteerForMember(v, member)
      return { volunteer: v, score, reasons }
    })
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, topN)
}
