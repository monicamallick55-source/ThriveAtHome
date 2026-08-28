// 988 Suicide & Crisis Lifeline + SAMHSA and related national helplines.
// Client-safe constants — embedded across the platform (Phase 100, M24).
// These are national, free, confidential, 24/7 services. We surface them everywhere
// a member or family might need them; we never replace them with an internal number.

export interface CrisisResource {
  key: string
  name: string
  /** Short line shown in compact bars. */
  short: string
  /** Fuller description for the resources page. */
  description: string
  /** tel: number, digits only where possible. */
  callNumber?: string
  callDisplay?: string
  /** SMS short-code or number. */
  textNumber?: string
  textDisplay?: string
  /** Web chat / info URL. */
  url?: string
}

export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    key: '988_lifeline',
    name: '988 Suicide & Crisis Lifeline',
    short: 'Call or text 988',
    description:
      'Free, confidential support for people in distress, 24 hours a day, 7 days a week. ' +
      'Call or text 988, or chat online. You do not have to be suicidal to reach out — ' +
      'emotional distress, anxiety, and loneliness all count.',
    callNumber: '988',
    callDisplay: '988',
    textNumber: '988',
    textDisplay: '988',
    url: 'https://988lifeline.org',
  },
  {
    key: 'samhsa_helpline',
    name: 'SAMHSA National Helpline',
    short: '1-800-662-4357',
    description:
      'Free, confidential, 24/7 treatment referral and information service for individuals and ' +
      'families facing mental health or substance-use concerns.',
    callNumber: '18006624357',
    callDisplay: '1-800-662-HELP (4357)',
    url: 'https://www.samhsa.gov/find-help/national-helpline',
  },
  {
    key: 'veterans_crisis_line',
    name: 'Veterans Crisis Line',
    short: 'Call 988, then press 1',
    description:
      'Confidential crisis support for veterans, service members, and their families. ' +
      'Call 988 and press 1, text 838255, or chat online.',
    callNumber: '988',
    callDisplay: '988 then press 1',
    textNumber: '838255',
    textDisplay: '838255',
    url: 'https://www.veteranscrisisline.net',
  },
  {
    key: 'eldercare_locator',
    name: 'Eldercare Locator',
    short: '1-800-677-1116',
    description:
      'A public service of the U.S. Administration on Aging connecting older adults and caregivers ' +
      'to local services — meals, transportation, home care, and benefits counseling.',
    callNumber: '18006771116',
    callDisplay: '1-800-677-1116',
    url: 'https://eldercare.acl.gov',
  },
  {
    key: 'friendship_line',
    name: 'Institute on Aging Friendship Line',
    short: '1-800-971-0016',
    description:
      'A 24-hour warmline and crisis line specifically for adults 60+ and adults living with ' +
      'disabilities. A caring person to talk to when you are lonely, isolated, or grieving.',
    callNumber: '18009710016',
    callDisplay: '1-800-971-0016',
    url: 'https://www.ioaging.org/services/friendship-line/',
  },
]

/** The one every surface leads with. */
export const PRIMARY_CRISIS_RESOURCE = CRISIS_RESOURCES[0]

export type CrisisSurface =
  | 'dashboard_footer'
  | 'grief'
  | 'crisis_page'
  | 'member_portal'
  | 'other'

export type CrisisAction = 'view' | 'call_clicked' | 'text_clicked' | 'chat_clicked'
