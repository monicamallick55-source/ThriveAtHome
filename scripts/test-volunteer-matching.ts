/**
 * Test script for volunteer matching algorithm.
 * Run: npx tsx scripts/test-volunteer-matching.ts
 */
import { scoreVolunteerForMember, getTopVolunteerMatchesFromList } from '../lib/volunteers/match'
import type { Volunteer } from '../lib/data/volunteers'
import type { Database } from '../types/database'

type Member = Database['public']['Tables']['members']['Row']

function makeVolunteer(overrides: Partial<Volunteer>): Volunteer {
  return {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    supabase_auth_id: null,
    full_name: 'Test Volunteer',
    email: 'vol@test.com',
    phone: null,
    city: null,
    state: null,
    languages: ['English'],
    availability_days: ['Saturday', 'Sunday'],
    hours_per_week: '3–5 hours',
    service_types: [],
    interests: [],
    why_volunteer: 'To help',
    prior_experience: null,
    status: 'active',
    background_check_id: null,
    background_check_status: null,
    total_hours_logged: 0,
    total_seniors_helped: 0,
    rating_average: null,
    notes: null,
    has_drivers_license: false,
    license_state: null,
    insurance_provider: null,
    insurance_expiry: null,
    corporate_program_id: null,
    volunteer_specialty: null,
    professional_background: null,
    faith_affiliation: null,
    is_chaplain: false,
    is_neighbor_volunteer: false,
    is_family_reciprocal: false,
    zip_code: null,
    ...overrides,
  }
}

function makeMember(overrides: Partial<Member>): Member {
  return {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    full_name: 'Margaret Chen',
    preferred_name: 'Margaret',
    date_of_birth: '1945-03-15',
    phone_number: '555-1234',
    preferred_language: 'english',
    preferred_call_time: null,
    timezone: 'America/New_York',
    check_in_frequency: 'weekly',
    topics_enjoy: ['Cooking & recipes', 'Music & singing', 'Travel & history'],
    topics_avoid: null,
    lives_alone: true,
    mobility_devices: [],
    health_conditions: null,
    medications: null,
    plan_tier: 'basics',
    status: 'active',
    address: 'San Francisco',
    emergency_contact_1_name: null,
    emergency_contact_1_phone: null,
    emergency_contact_1_rel: null,
    emergency_contact_2_name: null,
    emergency_contact_2_phone: null,
    emergency_contact_2_rel: null,
    doctor_name: null,
    doctor_phone: null,
    buddy_match_topics: null,
    buddy_match_era: null,
    buddy_call_length_preference: null,
    buddy_intro_note: null,
    grief_welcome_path: false,
    grief_enrolled_at: null,
    grief_loss_type: null,
    zip_code: null,
    faith_preference: null,
    device_integration_consent: false,
    ml_insights_opt_out: false,
    ...overrides,
  }
}

// Test 1: Volunteer with same city + 3 shared interests scores higher than volunteer with no overlap
const highMatch = makeVolunteer({
  city: 'San Francisco',
  interests: ['Cooking & recipes', 'Music & singing', 'Travel & history'],
  hours_per_week: '3–5 hours',
})
const lowMatch = makeVolunteer({
  city: 'Chicago',
  interests: ['Sports & fitness'],
  hours_per_week: '3–5 hours',
})
const member = makeMember({})

const highScore = scoreVolunteerForMember(highMatch, member)
const lowScore = scoreVolunteerForMember(lowMatch, member)

console.log('Test 1: High-match volunteer score:', highScore.score, 'reasons:', highScore.reasons)
console.log('Test 1: Low-match volunteer score:', lowScore.score, 'reasons:', lowScore.reasons)

if (highScore.score > lowScore.score) {
  console.log('✓ PASS: High-match volunteer scores higher than low-match volunteer')
} else {
  console.error('✗ FAIL: Expected high-match to score higher')
  process.exit(1)
}

// Test 2: getTopVolunteerMatchesFromList returns ranked results (top 3)
const volunteers = [
  makeVolunteer({ id: 'vol-1', city: 'San Francisco', interests: ['Cooking & recipes', 'Music & singing', 'Travel & history'], hours_per_week: '3–5 hours' }),
  makeVolunteer({ id: 'vol-2', city: 'Chicago', interests: [], hours_per_week: '1–2 hours' }),
  makeVolunteer({ id: 'vol-3', city: 'San Francisco', interests: ['Cooking & recipes'], hours_per_week: '5–10 hours' }),
  makeVolunteer({ id: 'vol-4', city: 'Boston', interests: ['Sports & fitness'], hours_per_week: '10+ hours' }),
  makeVolunteer({ id: 'vol-5', status: 'inactive' as const, city: 'San Francisco', interests: ['Cooking & recipes', 'Music & singing'], hours_per_week: '3–5 hours' }),
]

const results = getTopVolunteerMatchesFromList(volunteers, member, 3)
console.log('\nTest 2: Top matches:')
results.forEach((r, i) => console.log(`  ${i + 1}. ${r.volunteer.id} — score: ${r.score} — reasons: ${r.reasons.join(', ')}`))

if (results.length <= 3 && results[0].score >= results[results.length - 1].score) {
  console.log('✓ PASS: Results sorted by score descending, max 3 returned')
} else {
  console.error('✗ FAIL: Results not sorted or too many returned')
  process.exit(1)
}

// Inactive volunteer excluded
const inactiveIncluded = results.some(r => r.volunteer.status !== 'active')
if (!inactiveIncluded) {
  console.log('✓ PASS: Inactive volunteers excluded from results')
} else {
  console.error('✗ FAIL: Inactive volunteer included in results')
  process.exit(1)
}

// Test 3: Language match scoring
const spanishMember = makeMember({ preferred_language: 'spanish', topics_enjoy: ['Music & singing'] })
const spanishVol = makeVolunteer({ languages: ['English', 'Spanish'], interests: [], hours_per_week: '3–5 hours' })
const englishOnlyVol = makeVolunteer({ languages: ['English'], interests: [], hours_per_week: '3–5 hours' })
const spanishScore = scoreVolunteerForMember(spanishVol, spanishMember)
const englishOnlyScore = scoreVolunteerForMember(englishOnlyVol, spanishMember)

if (spanishScore.score > englishOnlyScore.score) {
  console.log('✓ PASS: Language-matching volunteer scores higher for non-English member')
} else {
  console.error('✗ FAIL: Language match did not affect score')
  process.exit(1)
}

// Test 4: Veteran-to-veteran scoring
const veteranMember = makeMember({ topics_enjoy: ['veteran', 'Community & civic life'] })
const veteranVol = makeVolunteer({ interests: ['veteran', 'Community & civic life'], hours_per_week: '3–5 hours' })
const nonVeteranVol = makeVolunteer({ interests: ['Community & civic life'], hours_per_week: '3–5 hours' })
const veteranScore = scoreVolunteerForMember(veteranVol, veteranMember)
const nonVeteranScore = scoreVolunteerForMember(nonVeteranVol, veteranMember)

if (veteranScore.score > nonVeteranScore.score) {
  console.log('✓ PASS: Veteran volunteer scores higher for veteran member')
} else {
  console.error('✗ FAIL: Veteran bonus did not apply')
  process.exit(1)
}

console.log('\n=== All matching tests passed ===')
