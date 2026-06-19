// Single source of truth for all service categories, sub-types, and status labels.
// All platform code imports from here — never hardcode service type strings elsewhere.

export type ServiceCategoryId =
  | 'transport'
  | 'home_service'
  | 'meals'
  | 'telehealth'
  | 'legal_financial'
  | 'tech_help'
  | 'companionship'
  | 'travel_assistance'
  | 'roadside'

export interface ServiceSubtype {
  value: string
  label: string
  visitType?: string
}

export interface ServiceCategory {
  id: ServiceCategoryId
  emoji: string
  title: string
  description: string
  color: string
  subtypes: ServiceSubtype[]
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'transport',
    emoji: '🚗',
    title: 'Transport',
    description: 'Rides to appointments, errands, and social outings',
    color: '#4361ee',
    subtypes: [
      { value: 'medical_transport', label: 'Medical appointment', visitType: 'medical_transport' },
      { value: 'grocery_transport', label: 'Grocery & errands', visitType: 'grocery_transport' },
      { value: 'social_transport', label: 'Social outing', visitType: 'social_transport' },
      { value: 'religious_transport', label: 'Religious service', visitType: 'social_transport' },
      { value: 'pt_transport', label: 'Physical therapy', visitType: 'medical_transport' },
      { value: 'other_transport', label: 'Other transport', visitType: 'medical_transport' },
    ],
  },
  {
    id: 'home_service',
    emoji: '🏠',
    title: 'Home Services',
    description: 'Cleaning, maintenance, and safety assessments',
    color: '#43aa8b',
    subtypes: [
      { value: 'house_cleaning', label: 'House cleaning', visitType: 'house_cleaning' },
      { value: 'laundry_help', label: 'Laundry help', visitType: 'laundry_help' },
      { value: 'yard_maintenance', label: 'Yard & garden', visitType: 'yard_maintenance' },
      { value: 'home_safety', label: 'Home safety assessment', visitType: 'home_safety' },
      { value: 'light_repairs', label: 'Light home repairs', visitType: 'light_repairs' },
      { value: 'decluttering', label: 'Decluttering & organizing', visitType: 'decluttering' },
      { value: 'other_home', label: 'Other home service' },
    ],
  },
  {
    id: 'meals',
    emoji: '🥗',
    title: 'Meals & Nutrition',
    description: 'Meal delivery, grocery help, and cooking assistance',
    color: '#f8961e',
    subtypes: [
      { value: 'meal_delivery', label: 'Meal delivery', visitType: 'meal_delivery' },
      { value: 'grocery_shopping', label: 'Grocery shopping', visitType: 'grocery_shopping' },
      { value: 'cooking_assistance', label: 'Cooking assistance', visitType: 'cooking_assistance' },
      { value: 'meal_planning', label: 'Meal planning', visitType: 'meal_planning' },
      { value: 'special_diet', label: 'Special dietary needs support' },
      { value: 'other_meals', label: 'Other meal support' },
    ],
  },
  {
    id: 'telehealth',
    emoji: '🏥',
    title: 'Health Services',
    description: 'Telehealth, medication management, and mental health',
    color: '#e63946',
    subtypes: [
      { value: 'telehealth_support', label: 'Telehealth consultation', visitType: 'telehealth_support' },
      { value: 'medication_reminder', label: 'Medication review', visitType: 'medication_reminder' },
      { value: 'mental_health_companion', label: 'Mental health support', visitType: 'mental_health_companion' },
      { value: 'pt_coordination', label: 'Physical therapy coordination' },
      { value: 'home_health_aide', label: 'Home health aide' },
      { value: 'hospice_referral', label: 'Hospice / palliative care referral' },
      { value: 'other_health', label: 'Other health service' },
    ],
  },
  {
    id: 'legal_financial',
    emoji: '⚖️',
    title: 'Legal & Financial',
    description: 'Vetted advisor directory and document support',
    color: '#9d4edd',
    subtypes: [
      { value: 'elder_law', label: 'Elder law attorney' },
      { value: 'estate_planning', label: 'Estate planning' },
      { value: 'financial_advisor', label: 'Financial advisor' },
      { value: 'benefits_counseling', label: 'Benefits counseling', visitType: 'benefits_counseling' },
      { value: 'medicare_help', label: 'Medicare / Medicaid assistance' },
      { value: 'poa_help', label: 'Power of attorney help' },
      { value: 'fraud_scam', label: 'Fraud / scam assistance' },
      { value: 'other_legal', label: 'Other legal or financial' },
    ],
  },
  {
    id: 'tech_help',
    emoji: '💻',
    title: 'Tech Help',
    description: 'Phone and in-home tech support, scam awareness',
    color: '#2b9348',
    subtypes: [
      { value: 'smartphone_help', label: 'Smartphone help', visitType: 'smartphone_help' },
      { value: 'computer_help', label: 'Computer & tablet help', visitType: 'computer_help' },
      { value: 'video_calling_setup', label: 'Video calling setup', visitType: 'video_calling_setup' },
      { value: 'wifi_issues', label: 'Internet & WiFi issues' },
      { value: 'scam_prevention', label: 'Scam & fraud prevention', visitType: 'scam_prevention' },
      { value: 'tv_streaming', label: 'TV & streaming setup' },
      { value: 'other_tech', label: 'Other tech help' },
    ],
  },
  {
    id: 'companionship',
    emoji: '🤝',
    title: 'Companionship & Social',
    description: 'Walking companion, friendly visits, and social connection',
    color: '#d62828',
    subtypes: [
      { value: 'walking_companion', label: 'Walking companion', visitType: 'walking_companion' },
      { value: 'friendly_visit', label: 'Friendly visit', visitType: 'friendly_visit' },
      { value: 'phone_call', label: 'Phone friendship call', visitType: 'phone_call' },
      { value: 'event_escort', label: 'Event escort', visitType: 'event_escort' },
      { value: 'reading_companion', label: 'Reading companion', visitType: 'reading_companion' },
      { value: 'other_companionship', label: 'Other companionship' },
    ],
  },
  {
    id: 'travel_assistance',
    emoji: '✈️',
    title: 'Travel Assistance',
    description: 'Flight help, accessible travel research, and travel companion coordination',
    color: '#0369a1',
    subtypes: [
      { value: 'flight_booking', label: 'Flight booking assistance' },
      { value: 'hotel_research', label: 'Hotel & accommodation research' },
      { value: 'airport_transport', label: 'Airport transport coordination' },
      { value: 'accessible_travel', label: 'Accessible travel research' },
      { value: 'travel_itinerary', label: 'Travel itinerary planning' },
      { value: 'travel_companion', label: 'Travel companion coordination', visitType: 'travel_companion' },
      { value: 'travel_insurance', label: 'Travel insurance guidance' },
      { value: 'other_travel', label: 'Other travel assistance' },
    ],
  },
  {
    id: 'roadside',
    emoji: '🚗🔧',
    title: 'Car Care & Roadside',
    description: 'Roadside emergencies, scheduled maintenance, body shop, and car repair',
    color: '#c2410c',
    subtypes: [
      // Emergency roadside
      { value: 'flat_tire', label: 'Flat tyre / Tyre change' },
      { value: 'battery_jump', label: 'Battery jump start' },
      { value: 'lockout', label: 'Lockout — keys locked in car' },
      { value: 'towing', label: 'Towing service' },
      { value: 'fuel_delivery', label: 'Fuel delivery' },
      { value: 'minor_repair', label: 'Minor roadside repair' },
      { value: 'other_roadside', label: 'Other roadside emergency' },
      // Non-emergency car repair
      { value: 'scheduled_maintenance', label: 'Scheduled maintenance / oil change' },
      { value: 'body_shop', label: 'Body shop / collision repair' },
      { value: 'mechanic_non_urgent', label: 'Mechanic — ongoing issue (not urgent)' },
      { value: 'car_inspection', label: 'Car inspection / smog check' },
      { value: 'mechanic_referral', label: 'Car repair shop referral' },
    ],
  },
]

// Sub-types that are non-emergency car repair (normal priority, navigator coordinates appointment)
export const CAR_REPAIR_SUBTYPES = new Set([
  'scheduled_maintenance',
  'body_shop',
  'mechanic_non_urgent',
  'car_inspection',
  'mechanic_referral',
])

// Human-friendly labels for raw dispatch_type values stored in booking_details
export const DISPATCH_TYPE_LABELS: Record<string, string> = {
  volunteer_driver: 'Assigned volunteer driver',
  lyft: 'Lyft ride booked',
  uber: 'Uber ride booked',
  partner_network: 'Arranged via partner network',
  volunteer_home: 'Volunteer home helper',
  partner_home: 'Partner home service provider',
  volunteer_meals: 'Meal delivery by volunteer',
  meals_on_wheels: 'Meals on Wheels delivery',
  partner_meals: 'Meal delivery partner',
  volunteer_tech: 'Volunteer tech helper',
  volunteer_companion: 'Assigned volunteer companion',
  telehealth: 'Telehealth appointment',
  in_home_health: 'In-home health provider',
  med_review: 'Medication review arranged',
  ship_counselor: 'SHIP counselor (Medicare help)',
  elder_law_attorney: 'Elder law attorney referral',
  financial_advisor: 'Financial advisor referral',
  benefits_review: 'Benefits review arranged',
  fraud_concern: 'Fraud concern flagged for review',
  navigator_arranged: 'Arranged by your navigator',
  manual: 'Manually arranged by navigator',
  vetted_provider: 'Vetted provider assigned',
  scheduled_visit: 'Scheduled visit',
  travel_agent_referral: 'Referred to vetted travel agent',
  volunteer_travel_companion: 'Volunteer travel companion assigned',
  family_arranged_travel: 'Family-assisted travel arrangement',
  aaa_roadside: 'AAA called on behalf of member',
  insurance_roadside: 'Insurance roadside coverage used',
  arranged_tow: 'Tow truck arranged',
  mechanic_referral: 'Referred to vetted mechanic',
  vetted_repair_shop: 'Vetted repair shop assigned',
  scheduled_repair: 'Repair appointment scheduled',
}

// Status badge labels — warm, plain English for members
export const STATUS_INFO: Record<string, { label: string; color: string; description: string }> = {
  requested: {
    label: 'Being arranged',
    color: '#f8961e',
    description: 'Your navigator is arranging this for you and will confirm shortly.',
  },
  confirmed: {
    label: 'Confirmed ✓',
    color: '#4361ee',
    description: 'Confirmed — your navigator will reach out with full details.',
  },
  in_progress: {
    label: 'In progress',
    color: '#2b9348',
    description: 'This service is currently in progress.',
  },
  completed: {
    label: 'Completed ✓',
    color: '#43aa8b',
    description: 'This service has been completed.',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#adb5bd',
    description: 'This service was cancelled.',
  },
}

export function getCategoryById(id: string): ServiceCategory | undefined {
  return SERVICE_CATEGORIES.find((c) => c.id === id)
}

export function getSubtypeLabel(categoryId: string, subtypeValue: string): string {
  const cat = getCategoryById(categoryId)
  if (!cat) return subtypeValue
  const sub = cat.subtypes.find((s) => s.value === subtypeValue)
  return sub?.label ?? subtypeValue
}

export function getDispatchLabel(rawValue: string): string {
  return DISPATCH_TYPE_LABELS[rawValue] ?? rawValue
}

// Volunteer sub-types grouped by category for the apply form
export const VOLUNTEER_SUBTYPE_GROUPS = [
  {
    category: 'Transport',
    emoji: '🚗',
    subtypes: [
      { value: 'medical_transport', label: 'Medical appointments' },
      { value: 'grocery_transport', label: 'Grocery & errands' },
      { value: 'social_transport', label: 'Social outings' },
    ],
  },
  {
    category: 'Home Services',
    emoji: '🏠',
    subtypes: [
      { value: 'house_cleaning', label: 'House cleaning' },
      { value: 'laundry_help', label: 'Laundry help' },
      { value: 'yard_maintenance', label: 'Yard & garden maintenance' },
      { value: 'home_safety', label: 'Home safety assessments' },
      { value: 'light_repairs', label: 'Light home repairs' },
      { value: 'decluttering', label: 'Decluttering & organizing' },
    ],
  },
  {
    category: 'Meals',
    emoji: '🥗',
    subtypes: [
      { value: 'meal_delivery', label: 'Meal delivery' },
      { value: 'grocery_shopping', label: 'Grocery shopping' },
      { value: 'cooking_assistance', label: 'Cooking assistance' },
      { value: 'meal_planning', label: 'Meal planning' },
    ],
  },
  {
    category: 'Health Support',
    emoji: '🏥',
    subtypes: [
      { value: 'telehealth_support', label: 'Telehealth support (help joining calls)' },
      { value: 'medication_reminder', label: 'Medication reminders' },
      { value: 'mental_health_companion', label: 'Mental health companionship' },
    ],
  },
  {
    category: 'Tech Help',
    emoji: '💻',
    subtypes: [
      { value: 'smartphone_help', label: 'Smartphone help' },
      { value: 'computer_help', label: 'Computer & tablet help' },
      { value: 'video_calling_setup', label: 'Video calling setup' },
      { value: 'scam_prevention', label: 'Scam & fraud prevention' },
    ],
  },
  {
    category: 'Legal & Financial',
    emoji: '⚖️',
    subtypes: [
      { value: 'benefits_counseling', label: 'Benefits counseling' },
    ],
  },
  {
    category: 'Companionship',
    emoji: '🤝',
    subtypes: [
      { value: 'friendly_visit', label: 'Friendly in-person visits' },
      { value: 'walking_companion', label: 'Walking companion' },
      { value: 'phone_call', label: 'Phone friendship calls' },
      { value: 'event_escort', label: 'Event escort' },
      { value: 'reading_companion', label: 'Reading companion' },
    ],
  },
  {
    category: 'Travel Assistance',
    emoji: '✈️',
    subtypes: [
      { value: 'travel_companion', label: 'Travel companion (willing to travel with member)' },
      { value: 'travel_coordination', label: 'Travel coordination (research & planning)' },
    ],
  },
]

// All visit_type enum values (original + expanded) — matches the PostgreSQL enum
export const ALL_VISIT_TYPES = [
  'phone_call', 'in_person_visit', 'virtual_event', 'grocery_help',
  'walking_companion', 'reading_aloud', 'tech_help',
  'medical_transport', 'grocery_transport', 'social_transport',
  'house_cleaning', 'laundry_help', 'yard_maintenance', 'home_safety',
  'light_repairs', 'decluttering',
  'meal_delivery', 'grocery_shopping', 'cooking_assistance', 'meal_planning',
  'telehealth_support', 'medication_reminder', 'mental_health_companion',
  'smartphone_help', 'computer_help', 'video_calling_setup', 'scam_prevention',
  'benefits_counseling',
  'friendly_visit', 'event_escort', 'reading_companion',
  'travel_companion', 'travel_coordination',
] as const

export type VisitType = (typeof ALL_VISIT_TYPES)[number]
