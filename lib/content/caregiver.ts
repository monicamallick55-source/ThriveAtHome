// G7.6 - Caregiver Education Hub / Burnout Assessment

export interface BurnoutQuestion {
  id: number
  text: string
}

// Caregiver Strain Index (standardized 10-question tool)
export const BURNOUT_QUESTIONS: BurnoutQuestion[] = [
  { id: 1, text: 'Sleep is disturbed (e.g., because the person is in and out of bed or wanders at night)' },
  { id: 2, text: 'It is inconvenient (e.g., because helping takes so much time or it is a long drive over)' },
  { id: 3, text: 'It is a physical strain (e.g., because of lifting in and out of a chair, bathing)' },
  { id: 4, text: 'It is confining (e.g., helping restricts free time or cannot go visiting)' },
  { id: 5, text: 'There have been family adjustments (e.g., because helping has disrupted routine)' },
  { id: 6, text: 'There have been changes in personal plans (e.g., had to turn down a job or could not go on vacation)' },
  { id: 7, text: 'There have been other demands on your time (e.g., from other family members)' },
  { id: 8, text: 'There have been emotional adjustments (e.g., due to severe arguments)' },
  { id: 9, text: 'Some behavior is upsetting (e.g., incontinence, parent has trouble remembering things)' },
  { id: 10, text: 'It is upsetting to find your parent has changed so much from his/her former self' },
]

export type BurnoutLevel = 'low' | 'moderate' | 'high'

export interface BurnoutResult {
  score: number
  level: BurnoutLevel
  message: string
  resources: string[]
}

export function scoreBurnout(answers: boolean[]): BurnoutResult {
  const score = answers.filter(Boolean).length
  let level: BurnoutLevel
  let message: string
  let resources: string[]

  if (score <= 3) {
    level = 'low'
    message = 'Your strain level appears manageable right now. Keep using the support tools available to you.'
    resources = [
      'Join a Caregiver Support Circle',
      'Read our guide: How to Talk to Your Parent About Getting Help',
      'Explore respite care options in your area',
    ]
  } else if (score <= 6) {
    level = 'moderate'
    message = 'You are experiencing moderate caregiver strain. This is very common — and support is available.'
    resources = [
      'Connect with a ThriveAtHome navigator for a free consultation',
      'Join our Caregiver Support Circle for peer connection',
      'Explore in-home care options to share the load',
      'Download our Long-Distance Caregiving Guide',
    ]
  } else {
    level = 'high'
    message = 'Your score indicates high caregiver strain. Please reach out for support — you do not have to do this alone.'
    resources = [
      'Talk to a ThriveAtHome navigator today',
      'ARCH National Respite Network: archrespite.org',
      'Caregiver Action Network helpline: 1-855-227-3640',
      'Consider a care coordination assessment for your loved one',
    ]
  }

  return { score, level, message, resources }
}

export const CAREGIVER_GUIDES = [
  {
    slug: 'how-to-talk-to-parent',
    title: 'How to Talk to Your Parent About Getting Help at Home',
    summary: 'Scripts, approaches, and what to do when they say no.',
  },
  {
    slug: 'long-distance-caregiving',
    title: 'Long-Distance Caregiving Guide',
    summary: 'How to coordinate care, monitor safety, and stay connected from far away.',
  },
  {
    slug: 'understanding-dementia',
    title: 'Understanding Dementia: A Family Guide',
    summary: 'Stages, behaviors, communication tips, and planning for the road ahead.',
  },
  {
    slug: 'navigating-home-care',
    title: 'How to Find and Hire In-Home Care',
    summary: 'Agency vs. private hire, questions to ask, red flags, and costs.',
  },
  {
    slug: 'caregiver-self-care',
    title: 'Caregiver Self-Care: Why It Matters and How to Start',
    summary: 'Practical strategies for maintaining your own health while caring for someone else.',
  },
]
