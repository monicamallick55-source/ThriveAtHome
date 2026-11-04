// Pure scoring function — no Supabase, safe to import in client components

export function scoreBuddyVolunteer(
  member: {
    city?: string | null
    languages_spoken?: string[] | null
    buddy_match_topics?: string[] | null
    topics_enjoy?: string[] | null
  },
  volunteer: {
    city?: string | null
    languages_spoken?: string[] | null
    interests?: string[] | null
    buddy_active_count?: number
    buddy_capacity?: number
  }
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  if (member.city && volunteer.city && member.city.toLowerCase() === volunteer.city.toLowerCase()) {
    score += 20
    reasons.push('Same city')
  }

  const memberTopics = [...(member.buddy_match_topics ?? []), ...(member.topics_enjoy ?? [])]
  const volunteerInterests = volunteer.interests ?? []
  const shared = memberTopics.filter(t =>
    volunteerInterests.some(i => i.toLowerCase().includes(t.toLowerCase().split(' ')[0]))
  )
  score += Math.min(shared.length * 15, 45)
  if (shared.length > 0) reasons.push(`Shared interests: ${shared.slice(0, 2).join(', ')}`)

  const memberLangs = member.languages_spoken ?? ['English']
  const volunteerLangs = volunteer.languages_spoken ?? ['English']
  if (memberLangs.some(l => volunteerLangs.includes(l) && l !== 'English')) {
    score += 20
    reasons.push('Language match')
  }

  const activeCount = volunteer.buddy_active_count ?? 0
  const capacity = volunteer.buddy_capacity ?? 3
  if (activeCount < capacity / 2) { score += 10; reasons.push('Good availability') }

  return { score, reasons }
}
