// lib/achievements.ts
// G5.4 — Achievement definitions and award engine

export interface AchievementDef {
  key: string
  title: string
  description: string
  icon: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: 'welcome',
    title: 'Welcome to Thrive',
    description: 'You joined the Thrive@Home community.',
    icon: '🌟',
  },
  {
    key: 'first_checkin',
    title: 'First Check-In',
    description: 'Completed your first wellness check-in.',
    icon: '✅',
  },
  {
    key: 'profile_complete',
    title: 'Profile Complete',
    description: 'Added your photo and life story.',
    icon: '📝',
  },
  {
    key: 'circle_joined',
    title: 'Community Member',
    description: 'Joined your first community circle.',
    icon: '🤝',
  },
  {
    key: 'event_rsvp',
    title: 'Event Goer',
    description: 'RSVPed to your first event.',
    icon: '🎟️',
  },
  {
    key: 'volunteer_first',
    title: 'Volunteer Spirit',
    description: 'Completed your first volunteer session.',
    icon: '💛',
  },
  {
    key: 'buddy_connected',
    title: 'Buddy Connected',
    description: 'Connected with a phone buddy.',
    icon: '📞',
  },
  {
    key: 'safety_plan',
    title: 'Safety Ready',
    description: 'Completed your home safety assessment.',
    icon: '🛡️',
  },
  {
    key: 'month_3',
    title: '3 Months Strong',
    description: '3 months as a Thrive@Home member.',
    icon: '🥉',
  },
  {
    key: 'month_6',
    title: '6 Months Thriving',
    description: '6 months as a Thrive@Home member.',
    icon: '🥈',
  },
  {
    key: 'month_12',
    title: 'One Year!',
    description: 'One full year with Thrive@Home.',
    icon: '🥇',
  },
  {
    key: 'checkins_10',
    title: '10 Check-Ins',
    description: 'Completed 10 wellness check-ins.',
    icon: '🔟',
  },
  {
    key: 'life_transitions',
    title: 'Resilient',
    description: 'Used Life Transitions support.',
    icon: '🌱',
  },
]

export const ACHIEVEMENT_MAP = Object.fromEntries(
  ACHIEVEMENTS.map(a => [a.key, a])
)
