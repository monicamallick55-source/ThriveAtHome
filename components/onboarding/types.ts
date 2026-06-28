// Shared types for the 3-step onboarding form.
export interface OnboardingFormData {
  // Step 1 — required
  full_name: string
  preferred_name: string
  date_of_birth: string
  phone_number: string
  // Step 2 — optional
  emergency_contact_1_name: string
  emergency_contact_1_phone: string
  emergency_contact_1_rel: string
  address: string
  lives_alone: '' | 'yes' | 'no'
  health_conditions: string
  medications: string
  // Step 3 — optional
  preferred_language: string
  preferred_call_time: string
  check_in_frequency: 'daily' | 'every_other_day' | 'weekly'
  topics_enjoy: string
  topics_avoid: string
  doctor_name: string
  doctor_phone: string
  // Buddy matching (optional, shown during Step 2)
  buddy_match_topics: string
  buddy_match_era: string
  buddy_call_length_preference: string
  buddy_intro_note: string
  // Grief welcome path (Phase 75)
  grief_welcome_path: string // 'true' | '' (string to match onChange pattern)
}

export const EMPTY_FORM: OnboardingFormData = {
  full_name: '',
  preferred_name: '',
  date_of_birth: '',
  phone_number: '',
  emergency_contact_1_name: '',
  emergency_contact_1_phone: '',
  emergency_contact_1_rel: '',
  address: '',
  lives_alone: '',
  health_conditions: '',
  medications: '',
  preferred_language: 'english',
  preferred_call_time: '',
  check_in_frequency: 'daily',
  topics_enjoy: '',
  topics_avoid: '',
  doctor_name: '',
  doctor_phone: '',
  buddy_match_topics: '',
  buddy_match_era: '',
  buddy_call_length_preference: '',
  buddy_intro_note: '',
  grief_welcome_path: '',
}

export const STORAGE_KEY = 'onboarding-form'
