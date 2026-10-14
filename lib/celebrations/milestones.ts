// lib/celebrations/milestones.ts
// G7.6 — Milestone birthday detection and program config

export interface MilestoneProgram {
  age: number
  label: string
  ariaSpeech: string
  navigatorTaskDescription: string
  celebrationTier: 'basic' | 'enhanced' | 'premium'
}

export const MILESTONE_PROGRAMS: MilestoneProgram[] = [
  {
    age: 70,
    label: 'Turning 70 — The Wisdom Decade',
    ariaSpeech: 'This is a huge milestone — 70 years of life, experience, and wisdom! This decade is about thriving with everything you\'ve built. We want to celebrate you in a really special way.',
    navigatorTaskDescription: 'Turning 70 milestone birthday in 30 days — coordinate a special celebration, contact family, consider premium celebration request.',
    celebrationTier: 'enhanced',
  },
  {
    age: 75,
    label: 'Turning 75 — Diamond Anniversary',
    ariaSpeech: '75 is truly remarkable. You have lived through so much history, touched so many lives, and have so much ahead of you. Your community here is so proud of you.',
    navigatorTaskDescription: 'Turning 75 milestone birthday in 30 days — this is a major milestone, reach out to family for premium celebration.',
    celebrationTier: 'enhanced',
  },
  {
    age: 80,
    label: 'Turning 80 — A Life Well Lived',
    ariaSpeech: '80 years! That is an incredible achievement. You are an inspiration to everyone who knows you, and we want to make sure your 80th birthday is absolutely unforgettable.',
    navigatorTaskDescription: 'Turning 80 in 30 days — premium milestone celebration recommended, alert family, flag for care team meeting.',
    celebrationTier: 'premium',
  },
  {
    age: 85,
    label: 'Turning 85 — Living Legend',
    ariaSpeech: 'You are turning 85! Do you know how special that is? You are a living legend and we are so honoured to be part of your life. This is a birthday worth celebrating in a big way.',
    navigatorTaskDescription: 'Turning 85 in 30 days — premium celebration, family coordination call, personal note from care director.',
    celebrationTier: 'premium',
  },
  {
    age: 90,
    label: 'Turning 90 — Centenarian Club Entry',
    ariaSpeech: 'NINETY years old! You are absolutely remarkable. I hope we make this birthday the most special one yet. Your family, your community, and your whole care team are going to make sure of that.',
    navigatorTaskDescription: 'Turning 90 in 30 days — top priority milestone, care director to personally call, premium celebration, local media outreach optional.',
    celebrationTier: 'premium',
  },
  {
    age: 100,
    label: 'Turning 100 — Centenarian!',
    ariaSpeech: 'ONE HUNDRED YEARS OLD! You are a centenarian! This is one of the most extraordinary achievements a human being can reach. The whole team is so deeply honoured to know you. We are going to make sure this birthday is legendary.',
    navigatorTaskDescription: 'CENTENARIAN — turning 100 in 30 days. HIGHEST PRIORITY. Alert CEO, plan premium celebration, coordinate family, consider press release.',
    celebrationTier: 'premium',
  },
]

export function getMilestoneForAge(age: number): MilestoneProgram | null {
  return MILESTONE_PROGRAMS.find((m) => m.age === age) ?? null
}

/**
 * Calculate upcoming milestone birthday ages (within next 365 days)
 * Returns the age they will be turning, or null
 */
export function getUpcomingMilestoneAge(dob: string, daysAhead = 30): number | null {
  const birth = new Date(dob + 'T12:00:00Z')
  const today = new Date()
  today.setUTCHours(12, 0, 0, 0)

  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + daysAhead)

  // Try this year and next year birthday
  for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
    const nextBirthday = new Date(birth)
    nextBirthday.setFullYear(today.getFullYear() + yearOffset)

    if (nextBirthday >= today && nextBirthday <= futureDate) {
      const age = today.getFullYear() + yearOffset - birth.getFullYear()
      if (MILESTONE_PROGRAMS.some((m) => m.age === age)) {
        return age
      }
    }
  }
  return null
}
