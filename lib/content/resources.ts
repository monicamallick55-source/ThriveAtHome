// G7.0 — Blog & Content Engine

export interface ResourceTopic {
  slug: string
  title: string
  description: string
  articleCount: number
  subtopics?: string[]
}

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  author: string
  publishedAt: string
  category: string
  readTimeMinutes: number
  content: string
}

export const RESOURCE_TOPICS: ResourceTopic[] = [
  {
    slug: 'caregiver-support',
    title: 'Caregiver Support',
    description: 'Resources for family members and professional caregivers supporting aging loved ones at home.',
    articleCount: 8,
    subtopics: ['Caregiver burnout', 'Long-distance caregiving', 'Respite care', 'Dementia caregiving', 'Self-care for caregivers'],
  },
  {
    slug: 'daily-living',
    title: 'Daily Living',
    description: 'Practical tips and tools for maintaining independence and quality of life at home.',
    articleCount: 10,
    subtopics: ['Adaptive equipment', 'Home routines', 'Cognitive health', 'Nutrition', 'Sleep'],
  },
  {
    slug: 'home-organization',
    title: 'Home Organization',
    description: 'Decluttering, downsizing, and organizing your home to make daily life safer and easier.',
    articleCount: 6,
    subtopics: ['Decluttering', 'Storage solutions', 'Aging-in-place modifications', 'Downsizing tips'],
  },
  {
    slug: 'in-home-care',
    title: 'In-Home Care',
    description: 'How to find, hire, and manage professional care at home — from homemakers to skilled nurses.',
    articleCount: 9,
    subtopics: ['Home health aides', 'Skilled nursing', 'Companion care', 'Hiring checklist', 'Medicare coverage'],
  },
  {
    slug: 'legal-planning',
    title: 'Legal Planning',
    description: 'Essential legal documents every senior needs — advance directives, power of attorney, wills, and trusts.',
    articleCount: 7,
    subtopics: ['Advance directives', 'Power of attorney', 'Wills & trusts', 'Medicaid planning', 'Elder law'],
  },
  {
    slug: 'public-assistance',
    title: 'Public Assistance',
    description: 'Benefits programs available to seniors — Medicare, Medicaid, SNAP, SSI, and local assistance.',
    articleCount: 8,
    subtopics: ['Medicare', 'Medicaid', 'SNAP', 'SSI', 'Property tax relief', 'LIHEAP'],
  },
  {
    slug: 'purpose-fulfillment',
    title: 'Purpose & Fulfillment',
    description: 'Staying engaged, connected, and purposeful in retirement through work, volunteering, and learning.',
    articleCount: 6,
    subtopics: ['Encore careers', 'Volunteering', 'Lifelong learning', 'Social connection', 'Spirituality'],
  },
  {
    slug: 'retirement-planning',
    title: 'Retirement Planning',
    description: 'Social Security, Medicare enrollment, budgeting, and financial planning for a secure retirement.',
    articleCount: 9,
    subtopics: ['Social Security timing', 'Medicare enrollment', 'Retirement budget', 'Required minimum distributions', 'Estate planning'],
  },
  {
    slug: 'senior-fitness',
    title: 'Senior Fitness',
    description: 'Safe and effective exercise programs for adults 65+ — balance, strength, cardio, and flexibility.',
    articleCount: 8,
    subtopics: ['Balance exercises', 'Strength training', 'Chair yoga', 'Walking programs', 'Fall prevention'],
  },
  {
    slug: 'home-safety',
    title: 'Home Safety',
    description: 'Fall prevention, emergency preparedness, and home modifications to keep you safe at home.',
    articleCount: 7,
    subtopics: ['Fall prevention', 'Bathroom safety', 'Kitchen safety', 'Emergency planning', 'Medication safety'],
  },
  {
    slug: 'smart-home-tech',
    title: 'Smart Home Technology',
    description: 'Devices and technology that help seniors live independently — from medical alerts to voice assistants.',
    articleCount: 6,
    subtopics: ['Medical alert systems', 'Voice assistants', 'Smart doorbells', 'Medication reminders', 'Telehealth'],
  },
  {
    slug: 'moving-downsizing',
    title: 'Moving & Downsizing',
    description: 'Planning a move, downsizing your home, and choosing the right living situation for your next chapter.',
    articleCount: 7,
    subtopics: ['Downsizing timeline', 'Senior move managers', '55+ communities', 'Assisted living vs. home care', 'Storage solutions'],
  },
]

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'fall-prevention-at-home',
    title: '12 Fall Prevention Tips Every Senior Should Know',
    excerpt: 'Falls are the leading cause of injury among adults 65+, but most are preventable. Here are 12 evidence-based tips to reduce your risk at home.',
    author: 'ThriveAtHome Team',
    publishedAt: '2026-09-15',
    category: 'home-safety',
    readTimeMinutes: 6,
    content: `Falls are the leading cause of injury-related death among adults 65 and older — but the good news is that most falls are preventable with simple home modifications and lifestyle changes.

## 1. Remove trip hazards
Clear hallways, living areas, and staircases of loose rugs, electrical cords, and clutter. These are the most common causes of falls at home.

## 2. Improve lighting
Install brighter bulbs in all rooms, especially stairways and bathrooms. Keep a nightlight in the bedroom, hallway, and bathroom for nighttime trips.

## 3. Install grab bars
Place grab bars next to the toilet and inside the shower or tub. These provide critical support where falls most commonly occur.

## 4. Use a non-slip bath mat
Place non-slip mats both inside and outside the tub or shower. Wet surfaces are a major fall risk.

## 5. Rearrange your kitchen
Store frequently used items between waist and shoulder height so you never need to climb or reach awkwardly.

## 6. Review your medications
Ask your doctor or pharmacist to review all your medications. Some cause dizziness or affect balance, especially when combined.

## 7. Exercise regularly
Balance and strength exercises are among the most effective fall prevention strategies. Tai chi, yoga, and walking programs all help.

## 8. Wear proper footwear
Wear shoes with non-slip soles indoors. Avoid walking in socks or slippers without grip.

## 9. Use assistive devices
If your doctor has recommended a cane or walker, use it consistently — even for short trips around the house.

## 10. Check your vision
Have your eyes examined annually. Poor vision significantly increases fall risk.

## 11. Get up slowly
When rising from a chair or bed, pause for a moment before walking to prevent dizziness from a sudden drop in blood pressure.

## 12. Consider a medical alert device
A medical alert system ensures you can get help immediately if you do fall — especially important if you live alone.

If you'd like a free home safety assessment, our Care Navigators can connect you with a local specialist.`,
  },
  {
    slug: 'medicare-enrollment-guide-2026',
    title: "Medicare Enrollment 2026: Deadlines, Costs, and What's New",
    excerpt: "Medicare's 2026 Open Enrollment runs October 15 – December 7. Here's everything you need to know about premiums, deadlines, and changes this year.",
    author: 'ThriveAtHome Team',
    publishedAt: '2026-10-01',
    category: 'retirement-planning',
    readTimeMinutes: 8,
    content: `Medicare Open Enrollment for 2026 runs from October 15 through December 7. During this period, you can switch Medicare Advantage plans, change Part D drug coverage, or move between Original Medicare and Medicare Advantage.

## 2026 Medicare Costs at a Glance

**Part B (Medical Insurance)**
- Standard monthly premium: $185.00
- Annual deductible: $257
- Higher-income beneficiaries pay more through IRMAA surcharges

**Part A (Hospital Insurance)**
- Most people pay $0 premium (if you worked 40+ quarters)
- Inpatient deductible: $1,676 per benefit period
- Coinsurance days 61–90: $419/day

**Part D (Prescription Drug Coverage)**
- Catastrophic coverage threshold: $8,000 out-of-pocket
- Late enrollment penalty: 1% per month you went without coverage

## Key Deadlines

**Initial Enrollment Period (turning 65)**
Your window to enroll is the 3 months before your 65th birthday month, your birthday month, and the 3 months after — a 7-month window total. Missing this window results in permanent late penalties.

**Annual Open Enrollment**
October 15 – December 7 each year. Changes take effect January 1.

**Special Enrollment Periods**
If you delayed Medicare because you had employer coverage, you have 8 months after that coverage ends to enroll penalty-free.

## What's New in 2026

The Inflation Reduction Act's $2,000 out-of-pocket cap on Part D costs is now fully in effect, providing significant savings for people with high drug costs.

If you have questions about which plan is right for you, our Care Navigators can connect you with a free Medicare counselor (SHIP counselor) in your area.`,
  },
  {
    slug: 'having-the-conversation-aging-parents',
    title: "Having \"The Conversation\" With Your Aging Parents",
    excerpt: "Talking to a parent about driving, living arrangements, or legal planning is one of the hardest conversations adult children face. Here's how to approach it with care.",
    author: 'ThriveAtHome Team',
    publishedAt: '2026-08-20',
    category: 'caregiver-support',
    readTimeMinutes: 7,
    content: `One of the most common things adult children tell us is: "I know we need to talk about this, but I don't know how to start."

Whether the topic is giving up the car keys, moving to a smaller home, or signing a power of attorney, these conversations feel loaded — because they are. They touch on independence, mortality, and the shifting of roles within a family.

Here's how to approach these conversations in a way that honors your parent's dignity and builds trust.

## Start early, before a crisis forces your hand

The best time to have these conversations is before there's a crisis. When a fall, a health scare, or a car accident forces the discussion, everyone is already stressed and reactive. Starting the conversation early — when things are calm — gives everyone time to think, ask questions, and make decisions deliberately.

## Listen more than you talk

Your goal in the first conversation isn't to solve anything. It's to understand what your parent wants, fears, and values. Ask open questions:

- "What does staying independent mean to you?"
- "What worries you most about the future?"
- "What would you want to happen if you couldn't make decisions for yourself?"

## Separate the conversations

Don't try to cover driving, housing, finances, and legal documents in one sitting. That's overwhelming for anyone. Pick one topic, have that conversation, and revisit others over time.

## Bring in a neutral third party

Sometimes a Care Navigator, geriatric care manager, or family therapist can facilitate conversations that feel stuck. There's no shame in asking for help — in fact, it often makes these conversations go much better.

## Respect their autonomy

Even if you disagree with your parent's choices, remember that they have the right to make decisions about their own life — even imperfect ones. Your role is to provide information, express concern, and offer support. Not to control.

## Follow up in writing

After any meaningful conversation, send a brief email or text summarizing what was discussed. "Just wanted to recap our conversation from Sunday — you mentioned you'd like to look into getting a medical alert device. Want me to research some options?" This keeps things moving without pressure.

The ThriveAtHome For Families hub has additional guides on specific conversations: driving, memory concerns, living arrangements, and more.`,
  },
]
